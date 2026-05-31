import { POST } from '@/app/api/webhook/sms/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    phoneNumber: { findUnique: jest.fn() },
    message: { create: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}))
jest.mock('@/lib/notifications', () => ({
  sendDiscordNotification: jest.fn().mockResolvedValue(undefined),
  sendEmailNotification: jest.fn().mockResolvedValue(undefined),
}))

const { prisma } = require('@/lib/prisma')
const { sendDiscordNotification, sendEmailNotification } = require('@/lib/notifications')

function makeRequest(body: Record<string, string>) {
  const form = new URLSearchParams(body).toString()
  return new NextRequest('http://localhost/api/webhook/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
}

beforeEach(() => jest.clearAllMocks())

test('saves message and returns TwiML', async () => {
  prisma.phoneNumber.findUnique.mockResolvedValue({ id: 'pn1', userId: 'u1' })
  prisma.message.create.mockResolvedValue({})
  prisma.user.findUnique.mockResolvedValue({ discordWebhook: null, emailNotifEnabled: false, email: 'a@b.com' })

  const res = await POST(makeRequest({ To: '+447411295551', From: '+441234567890', Body: 'OTP: 123456' }))
  expect(res.status).toBe(200)
  const text = await res.text()
  expect(text).toContain('<Response')
  expect(prisma.message.create).toHaveBeenCalled()
})

test('fires Discord notification if webhook set', async () => {
  prisma.phoneNumber.findUnique.mockResolvedValue({ id: 'pn1', userId: 'u1' })
  prisma.message.create.mockResolvedValue({})
  prisma.user.findUnique.mockResolvedValue({
    discordWebhook: 'https://discord.com/api/webhooks/test',
    emailNotifEnabled: false,
    email: 'a@b.com',
  })

  await POST(makeRequest({ To: '+447411295551', From: '+441234567890', Body: 'OTP: 123456' }))
  await new Promise((r) => setTimeout(r, 10))
  expect(sendDiscordNotification).toHaveBeenCalledWith(
    'https://discord.com/api/webhooks/test', '+447411295551', '+441234567890', 'OTP: 123456'
  )
})

test('fires email notification if emailNotifEnabled', async () => {
  prisma.phoneNumber.findUnique.mockResolvedValue({ id: 'pn1', userId: 'u1' })
  prisma.message.create.mockResolvedValue({})
  prisma.user.findUnique.mockResolvedValue({
    discordWebhook: null,
    emailNotifEnabled: true,
    email: 'user@test.com',
  })

  await POST(makeRequest({ To: '+447411295551', From: '+441234567890', Body: 'OTP: 123456' }))
  await new Promise((r) => setTimeout(r, 10))
  expect(sendEmailNotification).toHaveBeenCalledWith(
    'user@test.com', '+447411295551', '+441234567890', 'OTP: 123456'
  )
})

test('returns 200 TwiML even if number not found', async () => {
  prisma.phoneNumber.findUnique.mockResolvedValue(null)
  const res = await POST(makeRequest({ To: '+447000000000', From: '+441234567890', Body: 'test' }))
  expect(res.status).toBe(200)
})
