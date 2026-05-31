import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function BillingPage() {
  const session = await auth()
  const hasUK = session
    ? await prisma.phoneNumber.count({ where: { userId: session.user.id, countryType: 'UK' } })
    : 0
  const hasEU = session
    ? await prisma.phoneNumber.count({ where: { userId: session.user.id, countryType: 'EU' } })
    : 0

  return (
    <div>
      <h1 className="text-[#5BA4CF] font-bold text-lg mb-6">BILLING</h1>
      <div className="flex gap-6">
        <PlanCard title="Basic UK Sims" price="$6.50" subscribed={hasUK > 0} />
        <PlanCard title="Mixed EU Sims" price="$8.50" subscribed={hasEU > 0} />
      </div>
    </div>
  )
}

function PlanCard({ title, price, subscribed }: { title: string; price: string; subscribed: boolean }) {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm w-64 flex flex-col items-center gap-4">
      <h2 className="font-bold text-xl text-center">{title}</h2>
      <p className="text-3xl font-bold">{price}</p>
      <p className="text-sm text-gray-500">Per Line Per Month</p>
      <button
        className={`w-full py-2 rounded text-sm font-medium text-white bg-[#5BA4CF] ${subscribed ? 'cursor-default opacity-80' : 'hover:bg-[#4a8fb8]'}`}
        disabled={subscribed}
      >
        {subscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    </div>
  )
}
