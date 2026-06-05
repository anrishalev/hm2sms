import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDiscordNotification, sendEmailNotification } from '@/lib/notifications'

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const to = formData.get('To') as string
  const from = formData.get('From') as string
  const body = formData.get('Body') as string

  // Process in background — don't block Twilio response
  ;(async () => {
    const phoneNumber = await prisma.phoneNumber.findUnique({ where: { phoneNumber: to } })
    if (!phoneNumber) return

    await prisma.message.create({
      data: { phoneNumberId: phoneNumber.id, fromNumber: from, body },
    }).catch(() => {})

    const user = await prisma.user.findUnique({
      where: { id: phoneNumber.userId },
      select: { discordWebhook: true, emailNotifEnabled: true, email: true },
    })

    if (user?.discordWebhook) {
      sendDiscordNotification(user.discordWebhook, to, from, body).catch(console.error)
    }
    if (user?.emailNotifEnabled && user?.email) {
      sendEmailNotification(user.email, to, from, body).catch(console.error)
    }
  })().catch(console.error)

  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
