import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  const [twilioNumbers, dbNumbers] = await Promise.all([
    client.incomingPhoneNumbers.list({ limit: 1000 }),
    prisma.phoneNumber.findMany({ select: { twilioSid: true, id: true, phoneNumber: true } }),
  ])

  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ''
  const webhookUrl = appUrl.startsWith('http://localhost') ? undefined : `${appUrl}/api/webhook/sms`

  // Update webhook on ALL Twilio numbers missing it
  if (webhookUrl) {
    await Promise.allSettled(
      twilioNumbers
        .filter(n => !n.smsUrl || n.smsUrl !== webhookUrl)
        .map(n => client.incomingPhoneNumbers(n.sid).update({ smsUrl: webhookUrl, smsMethod: 'POST' }))
    )
  }

  // Sync missing numbers
  const dbSids = new Set(dbNumbers.map(n => n.twilioSid))
  const missingNumbers = twilioNumbers.filter(n => !dbSids.has(n.sid))

  for (const n of missingNumbers) {
    const phone = n.phoneNumber
    const isUK = phone.startsWith('+44')
    const countryType = isUK ? 'UK' : 'EU'
    const country = isUK ? 'GB' : (phone.startsWith('+353') ? 'IE' : phone.startsWith('+49') ? 'DE' : phone.startsWith('+33') ? 'FR' : null)
    await prisma.phoneNumber.create({
      data: { userId, twilioSid: n.sid, phoneNumber: phone, countryType, country, renewalDate },
    })
  }

  // Sync messages for all numbers now in DB
  const allDbNumbers = await prisma.phoneNumber.findMany({
    select: { id: true, phoneNumber: true },
  })
  const existingMsgIds = new Set(
    (await prisma.message.findMany({ select: { id: true } })).map(m => m.id)
  )

  let messagesAdded = 0
  for (const dbNum of allDbNumbers) {
    try {
      const twilioMsgs = await client.messages.list({
        to: dbNum.phoneNumber,
        limit: 1000,
      })
      for (const msg of twilioMsgs) {
        if (existingMsgIds.has(msg.sid)) continue
        if (!msg.body || !msg.from) continue
        await prisma.message.create({
          data: {
            id: msg.sid,
            phoneNumberId: dbNum.id,
            fromNumber: msg.from,
            body: msg.body,
            receivedAt: new Date(msg.dateSent ?? msg.dateCreated),
          },
        }).catch(() => {})
        messagesAdded++
      }
    } catch {
      continue
    }
  }

  return NextResponse.json({
    numbersAdded: missingNumbers.length,
    messagesAdded,
    numbers: missingNumbers.map(n => n.phoneNumber),
  })
}
