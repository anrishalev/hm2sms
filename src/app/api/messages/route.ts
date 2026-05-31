import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const search = searchParams.get('search') ?? ''

  const userNumbers = await prisma.phoneNumber.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const numberIds = userNumbers.map((n: { id: string }) => n.id)

  const where = {
    phoneNumberId: { in: numberIds },
    ...(search ? { phoneNumber: { phoneNumber: { contains: search } } } : {}),
  }

  const [total, messages] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      include: { phoneNumber: { select: { phoneNumber: true } } },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({ messages, total, page, pageSize: PAGE_SIZE })
}
