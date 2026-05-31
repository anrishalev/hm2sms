import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buyUKNumber, buyEUNumber } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, type } = await req.json()
  if (!userId || (type !== 'UK' && type !== 'EU')) {
    return NextResponse.json({ error: 'userId and type (UK|EU) required' }, { status: 400 })
  }

  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)

  const { sid, phoneNumber } = type === 'UK' ? await buyUKNumber() : await buyEUNumber()

  const record = await prisma.phoneNumber.create({
    data: { userId, twilioSid: sid, phoneNumber, countryType: type, renewalDate },
  })

  return NextResponse.json({ number: record }, { status: 201 })
}
