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
    prisma.phoneNumber.findMany({ select: { twilioSid: true } }),
  ])

  const dbSids = new Set(dbNumbers.map(n => n.twilioSid))
  const missing = twilioNumbers.filter(n => !dbSids.has(n.sid))

  if (missing.length === 0) return NextResponse.json({ added: 0 })

  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ''
  const webhookUrl = appUrl.startsWith('http://localhost') ? undefined : `${appUrl}/api/webhook/sms`

  await Promise.all(
    missing.map(async n => {
      // Update webhook on Twilio if missing
      if (webhookUrl && !n.smsUrl) {
        await client.incomingPhoneNumbers(n.sid).update({ smsUrl: webhookUrl, smsMethod: 'POST' }).catch(() => {})
      }

      const phone = n.phoneNumber
      const isUK = phone.startsWith('+44')
      const countryType = isUK ? 'UK' : 'EU'
      const country = isUK ? 'GB' : (n.phoneNumber.startsWith('+353') ? 'IE' : n.phoneNumber.startsWith('+49') ? 'DE' : n.phoneNumber.startsWith('+33') ? 'FR' : null)

      await prisma.phoneNumber.create({
        data: {
          userId,
          twilioSid: n.sid,
          phoneNumber: phone,
          countryType,
          country,
          renewalDate,
        },
      })
    })
  )

  return NextResponse.json({ added: missing.length, numbers: missing.map(n => n.phoneNumber) })
}
