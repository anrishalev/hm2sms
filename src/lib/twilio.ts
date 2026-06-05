import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ''
const WEBHOOK_URL = !appUrl || appUrl.startsWith('http://localhost') ? undefined : `${appUrl}/api/webhook/sms`

// Fetch approved bundle countries from Twilio automatically
async function getApprovedEUCountries(): Promise<string[]> {
  try {
    const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({
      status: 'twilio-approved',
    })
    const countries = bundles
      .map((b) => (b as any).isoCountry)
      .filter((c): c is string => !!c && c !== 'GB')
    return countries.length ? countries : ['IE', 'DE', 'FR', 'NL', 'ES', 'BE']
  } catch {
    return ['IE', 'DE', 'FR', 'NL', 'ES', 'BE']
  }
}

export async function buyUKNumber() {
  const available = await client.availablePhoneNumbers('GB').mobile.list({ limit: 1 })
  if (!available.length) throw new Error('No UK numbers available')

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    bundleSid: process.env.TWILIO_BUNDLE_SID,
    ...(WEBHOOK_URL ? { smsUrl: WEBHOOK_URL, smsMethod: 'POST' } : {}),
  })
  return { sid: purchased.sid, phoneNumber: purchased.phoneNumber, country: 'GB' }
}

export async function buyEUNumber() {
  const countries = await getApprovedEUCountries()
  for (const country of countries) {
    try {
      const available = await client.availablePhoneNumbers(country).local.list({ limit: 1 })
      if (!available.length) continue
      const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({
        status: 'twilio-approved',
        isoCountry: country,
      })
      const bundleSid = bundles[0]?.sid
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available[0].phoneNumber,
        ...(bundleSid ? { bundleSid } : {}),
        ...(WEBHOOK_URL ? { smsUrl: WEBHOOK_URL, smsMethod: 'POST' } : {}),
      })
      return { sid: purchased.sid, phoneNumber: purchased.phoneNumber, country }
    } catch {
      continue
    }
  }
  throw new Error('No EU numbers available in any country')
}

export async function releaseNumber(twilioSid: string) {
  await client.incomingPhoneNumbers(twilioSid).remove()
}
