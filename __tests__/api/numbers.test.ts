import { GET } from '@/app/api/numbers/route'
import { POST } from '@/app/api/numbers/buy/route'
import { DELETE } from '@/app/api/numbers/[id]/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    phoneNumber: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))
jest.mock('@/lib/twilio', () => ({
  buyUKNumber: jest.fn(),
  buyEUNumber: jest.fn(),
  releaseNumber: jest.fn(),
}))

const { auth } = require('@/lib/auth')
const { prisma } = require('@/lib/prisma')
const { buyUKNumber, releaseNumber } = require('@/lib/twilio')

beforeEach(() => jest.clearAllMocks())

test('GET /api/numbers returns user numbers', async () => {
  auth.mockResolvedValue({ user: { id: 'u1' } })
  prisma.phoneNumber.findMany.mockResolvedValue([
    { id: 'pn1', phoneNumber: '+447411295551', countryType: 'UK', status: 'ACTIVE', renewalDate: new Date() },
  ])
  const res = await GET(new NextRequest('http://localhost/api/numbers'))
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.numbers).toHaveLength(1)
})

test('POST /api/numbers/buy provisions UK number', async () => {
  auth.mockResolvedValue({ user: { id: 'u1' } })
  buyUKNumber.mockResolvedValue({ sid: 'PN1', phoneNumber: '+447411295551' })
  prisma.phoneNumber.create.mockResolvedValue({ id: 'pn1' })
  const req = new NextRequest('http://localhost/api/numbers/buy', {
    method: 'POST',
    body: JSON.stringify({ type: 'UK' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
  expect(prisma.phoneNumber.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ twilioSid: 'PN1', phoneNumber: '+447411295551', countryType: 'UK' }),
    })
  )
})

test('DELETE /api/numbers/[id] releases number', async () => {
  auth.mockResolvedValue({ user: { id: 'u1' } })
  prisma.phoneNumber.findUnique.mockResolvedValue({ id: 'pn1', userId: 'u1', twilioSid: 'PN1' })
  releaseNumber.mockResolvedValue(true)
  prisma.phoneNumber.delete.mockResolvedValue({})
  const req = new NextRequest('http://localhost/api/numbers/pn1', { method: 'DELETE' })
  const res = await DELETE(req, { params: Promise.resolve({ id: 'pn1' }) })
  expect(res.status).toBe(200)
  expect(releaseNumber).toHaveBeenCalledWith('PN1')
})
