import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, password, secret } = await req.json()

  if (secret !== process.env.ADMIN_REGISTER_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hash(password, 12)
  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' },
  })

  return NextResponse.json({ ok: true })
}
