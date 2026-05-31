import { GET, POST } from '@/app/api/admin/users/route'
import { DELETE } from '@/app/api/admin/users/[id]/route'
import { POST as assignPost } from '@/app/api/admin/numbers/assign/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    phoneNumber: { create: jest.fn() },
  },
}))
jest.mock('@/lib/twilio', () => ({
  buyUKNumber: jest.fn(),
  buyEUNumber: jest.fn(),
}))
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashedpw') }))

const { auth } = require('@/lib/auth')
const { prisma } = require('@/lib/prisma')
const { buyUKNumber } = require('@/lib/twilio')

beforeEach(() => jest.clearAllMocks())

function adminSession() {
  auth.mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } })
}

test('GET /api/admin/users returns all users', async () => {
  adminSession()
  prisma.user.findMany.mockResolvedValue([
    { id: 'u1', email: 'a@b.com', role: 'USER', createdAt: new Date(), _count: { phoneNumbers: 2 } },
  ])
  const res = await GET(new NextRequest('http://localhost/api/admin/users'))
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.users).toHaveLength(1)
})

test('GET /api/admin/users returns 401 if not admin', async () => {
  auth.mockResolvedValue({ user: { id: 'u1', role: 'USER' } })
  const res = await GET(new NextRequest('http://localhost/api/admin/users'))
  expect(res.status).toBe(403)
})

test('POST /api/admin/users creates user', async () => {
  adminSession()
  prisma.user.findUnique.mockResolvedValue(null)
  prisma.user.create.mockResolvedValue({ id: 'u2', email: 'new@test.com' })
  const req = new NextRequest('http://localhost/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'new@test.com', password: 'secret123' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
  expect(prisma.user.create).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ email: 'new@test.com', passwordHash: 'hashedpw' }) })
  )
})

test('POST /api/admin/users returns 409 if email exists', async () => {
  adminSession()
  prisma.user.findUnique.mockResolvedValue({ id: 'existing' })
  const req = new NextRequest('http://localhost/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'existing@test.com', password: 'secret123' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(409)
})

test('DELETE /api/admin/users/[id] deletes user', async () => {
  adminSession()
  prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'USER' })
  prisma.user.delete.mockResolvedValue({})
  const req = new NextRequest('http://localhost/api/admin/users/u1', { method: 'DELETE' })
  const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) })
  expect(res.status).toBe(200)
  expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } })
})

test('DELETE /api/admin/users/[id] prevents deleting admin', async () => {
  adminSession()
  prisma.user.findUnique.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
  const req = new NextRequest('http://localhost/api/admin/users/admin1', { method: 'DELETE' })
  const res = await DELETE(req, { params: Promise.resolve({ id: 'admin1' }) })
  expect(res.status).toBe(400)
})

test('POST /api/admin/numbers/assign assigns UK number to user', async () => {
  adminSession()
  buyUKNumber.mockResolvedValue({ sid: 'PN1', phoneNumber: '+447411295551' })
  prisma.phoneNumber.create.mockResolvedValue({ id: 'pn1', phoneNumber: '+447411295551' })
  const req = new NextRequest('http://localhost/api/admin/numbers/assign', {
    method: 'POST',
    body: JSON.stringify({ userId: 'u1', type: 'UK' }),
  })
  const res = await assignPost(req)
  expect(res.status).toBe(201)
  expect(prisma.phoneNumber.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ userId: 'u1', twilioSid: 'PN1', phoneNumber: '+447411295551', countryType: 'UK' }),
    })
  )
})
