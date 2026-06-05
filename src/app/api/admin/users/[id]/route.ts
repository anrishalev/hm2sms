import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseNumber } from '@/lib/twilio'
import { hash } from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (id === session.user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role === 'ADMIN') return NextResponse.json({ error: 'Cannot delete admin' }, { status: 400 })

  // Release all Twilio numbers first
  const numbers = await prisma.phoneNumber.findMany({ where: { userId: id }, select: { twilioSid: true, phoneNumber: true } })
  await Promise.allSettled(numbers.map(n => releaseNumber(n.twilioSid)))
  await Promise.allSettled(numbers.map(n => prisma.releasedNumber.upsert({
    where: { phoneNumber: n.phoneNumber },
    update: { releasedAt: new Date() },
    create: { phoneNumber: n.phoneNumber },
  })))

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true, releasedNumbers: numbers.length })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const numbers = await prisma.phoneNumber.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, phoneNumber: true, countryType: true, country: true, status: true, renewalDate: true, twilioSid: true },
  })
  return NextResponse.json({ numbers })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { password } = await req.json()
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const passwordHash = await hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })
  return NextResponse.json({ ok: true })
}
