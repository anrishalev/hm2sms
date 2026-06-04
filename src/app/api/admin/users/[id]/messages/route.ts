import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const messages = await prisma.message.findMany({
    where: { phoneNumber: { userId: id } },
    orderBy: { receivedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      body: true,
      fromNumber: true,
      receivedAt: true,
      phoneNumber: { select: { phoneNumber: true } },
    },
  })

  return NextResponse.json({ messages })
}
