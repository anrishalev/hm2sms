import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
