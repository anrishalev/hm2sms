import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buyUKNumber, buyEUNumber } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, type, quantity = 1 } = await req.json()
  if (!userId || (type !== 'UK' && type !== 'EU')) {
    return NextResponse.json({ error: 'userId and type (UK|EU) required' }, { status: 400 })
  }

  const qty = Math.min(Math.max(1, parseInt(quantity)), 100)
  const results: { phoneNumber: string; success: boolean; error?: string }[] = []

  for (let i = 0; i < qty; i++) {
    try {
      const renewalDate = new Date()
      renewalDate.setMonth(renewalDate.getMonth() + 1)

      const { sid, phoneNumber, country } = type === 'UK' ? await buyUKNumber() : await buyEUNumber()

      await prisma.phoneNumber.create({
        data: { userId, twilioSid: sid, phoneNumber, countryType: type, country: country ?? null, renewalDate },
      })
      results.push({ phoneNumber, success: true })
    } catch (e: any) {
      results.push({ phoneNumber: '', success: false, error: e.message ?? 'Failed' })
    }
  }

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return NextResponse.json({ results, succeeded, failed }, { status: succeeded > 0 ? 201 : 500 })
}
