import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

export async function GET(req: NextRequest) {
  // Vercel cron authentication
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  const allDbNumbers = await prisma.phoneNumber.findMany({
    select: { id: true, phoneNumber: true },
  })

  const existingIds = new Set(
    (await prisma.message.findMany({ select: { id: true } })).map(m => m.id)
  )

  let added = 0
  for (const dbNum of allDbNumbers) {
    try {
      const msgs = await client.messages.list({ to: dbNum.phoneNumber, limit: 100 })
      for (const msg of msgs) {
        if (existingIds.has(msg.sid)) continue
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
        added++
      }
    } catch { continue }
  }

  return NextResponse.json({ ok: true, added })
}
