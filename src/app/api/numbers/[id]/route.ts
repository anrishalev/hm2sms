import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseNumber } from '@/lib/twilio'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const number = await prisma.phoneNumber.findUnique({ where: { id } })
  if (!number || number.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await releaseNumber(number.twilioSid)
  await prisma.phoneNumber.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
