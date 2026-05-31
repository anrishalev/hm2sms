import { PUT } from '@/app/api/settings/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: { user: { update: jest.fn(), findUnique: jest.fn() } },
}))

const { auth } = require('@/lib/auth')
const { prisma } = require('@/lib/prisma')

beforeEach(() => jest.clearAllMocks())

test('PUT /api/settings saves user settings', async () => {
  auth.mockResolvedValue({ user: { id: 'u1' } })
  prisma.user.update.mockResolvedValue({})
  const req = new NextRequest('http://localhost/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      discordWebhook: 'https://discord.com/api/webhooks/123',
      emailNotifEnabled: true,
      refreshTimeoutMins: 5,
    }),
  })
  const res = await PUT(req)
  expect(res.status).toBe(200)
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'u1' },
    data: {
      discordWebhook: 'https://discord.com/api/webhooks/123',
      emailNotifEnabled: true,
      refreshTimeoutMins: 5,
    },
  })
})

test('PUT /api/settings returns 401 if unauthenticated', async () => {
  auth.mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/settings', { method: 'PUT', body: '{}' })
  const res = await PUT(req)
  expect(res.status).toBe(401)
})
