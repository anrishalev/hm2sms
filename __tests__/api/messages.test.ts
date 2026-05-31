import { GET } from '@/app/api/messages/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    message: { findMany: jest.fn(), count: jest.fn() },
    phoneNumber: { findMany: jest.fn() },
  },
}))

const { auth } = require('@/lib/auth')
const { prisma } = require('@/lib/prisma')

beforeEach(() => jest.clearAllMocks())

test('returns 401 if unauthenticated', async () => {
  auth.mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/messages')
  const res = await GET(req)
  expect(res.status).toBe(401)
})

test('returns paginated messages for user', async () => {
  auth.mockResolvedValue({ user: { id: 'user-1' } })
  prisma.phoneNumber.findMany.mockResolvedValue([{ id: 'pn-1' }])
  prisma.message.count.mockResolvedValue(1)
  prisma.message.findMany.mockResolvedValue([
    {
      id: 'msg-1',
      fromNumber: '+441234567890',
      body: 'Your OTP is 123456',
      receivedAt: new Date('2026-05-31T10:00:00Z'),
      phoneNumber: { phoneNumber: '+447411295551' },
    },
  ])
  const req = new NextRequest('http://localhost/api/messages?page=1')
  const res = await GET(req)
  const data = await res.json()
  expect(res.status).toBe(200)
  expect(data.messages).toHaveLength(1)
  expect(data.total).toBe(1)
})
