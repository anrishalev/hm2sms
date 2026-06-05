import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { numbers } = await req.json()
  if (!Array.isArray(numbers) || numbers.length === 0) return NextResponse.json({ error: 'numbers array required' }, { status: 400 })

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  const dbNumbers = await prisma.phoneNumber.findMany({ select: { phoneNumber: true } })
  const dbSet = new Set(dbNumbers.map(n => n.phoneNumber))

  const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 1000 })
  const twilioSet = new Set(twilioNumbers.map(n => n.phoneNumber))

  const results = numbers.map((num: string) => {
    const normalized = num.trim().replace(/\s/g, '')
    const inDb = dbSet.has(normalized)
    const onTwilio = twilioSet.has(normalized)
    return {
      number: normalized,
      inDb,
      onTwilio,
      status: inDb ? 'already_owned' : onTwilio ? 'on_twilio_not_db' : 'not_owned',
    }
  })

  return NextResponse.json({ results })
}
