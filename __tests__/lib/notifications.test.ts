jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}))

global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch

import { sendDiscordNotification, sendEmailNotification } from '@/lib/notifications'
import nodemailer from 'nodemailer'

beforeEach(() => jest.clearAllMocks())

test('sendDiscordNotification POSTs embed to webhook URL', async () => {
  await sendDiscordNotification('https://discord.com/api/webhooks/test', '+447411295551', '+441234567890', 'OTP: 123456')
  expect(fetch).toHaveBeenCalledWith(
    'https://discord.com/api/webhooks/test',
    expect.objectContaining({ method: 'POST' })
  )
  const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)
  expect(body.embeds[0].title).toContain('+447411295551')
})

test('sendEmailNotification sends email via nodemailer', async () => {
  process.env.SMTP_HOST = 'smtp.test.com'
  process.env.SMTP_FROM = 'test@test.com'
  await sendEmailNotification('user@test.com', '+447411295551', '+441234567890', 'OTP: 123456')
  expect(nodemailer.createTransport).toHaveBeenCalled()
})
