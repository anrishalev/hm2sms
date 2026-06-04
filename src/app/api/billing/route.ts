import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import twilio from 'twilio'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()
    const balance = await client.balance.fetch()
    return NextResponse.json({
      balance: parseFloat(balance.balance),
      currency: balance.currency,
      isTrial: account.type === 'Trial',
    })
  } catch {
    return NextResponse.json({ balance: null, currency: 'USD', isTrial: false })
  }
}
