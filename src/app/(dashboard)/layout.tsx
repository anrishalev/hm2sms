import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const activeCount = await prisma.phoneNumber.count({
    where: { userId: session.user.id, status: 'ACTIVE' },
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar activeNumberCount={activeCount} role={session.user.role} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
