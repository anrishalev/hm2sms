import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buyUKNumber, buyEUNumber } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { type, quantity = 1 } = await req.json()
  if (type !== 'UK' && type !== 'EU') {
    return NextResponse.json({ error: 'type must be UK or EU' }, { status: 400 })
  }
  const qty = Math.min(Math.max(1, parseInt(quantity)), 100)

  const results: { phoneNumber: string; success: boolean; error?: string }[] = []

  for (let i = 0; i < qty; i++) {
    try {
      const renewalDate = new Date()
      renewalDate.setMonth(renewalDate.getMonth() + 1)

      const { sid, phoneNumber, country } = type === 'UK' ? await buyUKNumber() : await buyEUNumber()

      await prisma.phoneNumber.create({
        data: {
          userId: session.user.id,
          twilioSid: sid,
          phoneNumber,
          countryType: type,
          country: country ?? null,
          renewalDate,
        },
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
