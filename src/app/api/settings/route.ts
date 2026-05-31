import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordWebhook: true, emailNotifEnabled: true, refreshTimeoutMins: true, secretKey: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { discordWebhook, emailNotifEnabled, refreshTimeoutMins } = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { discordWebhook, emailNotifEnabled, refreshTimeoutMins },
  })

  return NextResponse.json({ ok: true })
}
