import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const numbers = await prisma.phoneNumber.findMany({
    where: {
      userId: session.user.id,
      ...(search ? { phoneNumber: { contains: search } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ numbers })
}
