import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 })

  const otp = await prisma.otpCode.findFirst({
    where: { email, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } })

  return NextResponse.json({ ok: true })
}
