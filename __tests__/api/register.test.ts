import { POST } from '@/app/api/admin/register/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/prisma')

beforeEach(() => {
  process.env.ADMIN_REGISTER_SECRET = 'test-secret'
  jest.clearAllMocks()
})

test('returns 403 with wrong secret', async () => {
  const req = new NextRequest('http://localhost/api/admin/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'a@b.com', password: 'pw', secret: 'wrong' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(403)
})

test('creates admin user with correct secret', async () => {
  prisma.user.findUnique.mockResolvedValue(null)
  prisma.user.create.mockResolvedValue({ id: '1' })
  const req = new NextRequest('http://localhost/api/admin/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.com', password: 'secure123', secret: 'test-secret' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
  expect(prisma.user.create).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ email: 'admin@test.com', role: 'ADMIN' }) })
  )
})

test('returns 409 if email already exists', async () => {
  prisma.user.findUnique.mockResolvedValue({ id: '1' })
  const req = new NextRequest('http://localhost/api/admin/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.com', password: 'pw', secret: 'test-secret' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(409)
})
