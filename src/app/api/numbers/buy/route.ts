import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buyUKNumber, buyEUNumber } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json()
  if (type !== 'UK' && type !== 'EU') {
    return NextResponse.json({ error: 'type must be UK or EU' }, { status: 400 })
  }

  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)

  const { sid, phoneNumber } = type === 'UK' ? await buyUKNumber() : await buyEUNumber()

  const record = await prisma.phoneNumber.create({
    data: {
      userId: session.user.id,
      twilioSid: sid,
      phoneNumber,
      countryType: type,
      renewalDate,
    },
  })

  return NextResponse.json({ number: record }, { status: 201 })
}
