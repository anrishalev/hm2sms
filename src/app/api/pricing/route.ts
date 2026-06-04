import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import twilio from 'twilio'

const COUNTRIES = ['GB', 'IE', 'DE', 'FR', 'NL', 'ES', 'BE']

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

    const results = await Promise.all(
      COUNTRIES.map(async (country) => {
        try {
          const data = await client.pricing.v1.phoneNumbers.countries(country).fetch()
          const mobile = data.phoneNumberPrices.find((p: any) => p.numberType === 'mobile')
          const local = data.phoneNumberPrices.find((p: any) => p.numberType === 'local')
          const price = mobile ?? local
          return {
            country,
            price: price ? parseFloat(price.currentPrice) : null,
            currency: data.priceUnit,
          }
        } catch {
          return { country, price: null, currency: 'GBP' }
        }
      })
    )

    return NextResponse.json({ pricing: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
