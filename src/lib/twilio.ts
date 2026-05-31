import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/sms`
const EU_COUNTRIES = ['DE', 'FR', 'NL', 'ES', 'BE']

export async function buyUKNumber() {
  const available = await client.availablePhoneNumbers('GB').local.list({ limit: 1, smsEnabled: true })
  if (!available.length) throw new Error('No UK numbers available')

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    smsUrl: WEBHOOK_URL,
    smsMethod: 'POST',
  })
  return { sid: purchased.sid, phoneNumber: purchased.phoneNumber }
}

export async function buyEUNumber() {
  for (const country of EU_COUNTRIES) {
    try {
      const available = await client.availablePhoneNumbers(country).local.list({ limit: 1, smsEnabled: true })
      if (!available.length) continue
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available[0].phoneNumber,
        smsUrl: WEBHOOK_URL,
        smsMethod: 'POST',
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
