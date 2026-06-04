'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface PhoneNumber {
  id: string
  phoneNumber: string
  countryType: string
  country: string | null
  status: string
  renewalDate: string
}

interface Message {
  id: string
  body: string
  fromNumber: string
  receivedAt: string
  phoneNumber: { phoneNumber: string }
}

function countryFlag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

export default function AdminUserPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, numbersRes, msgsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch(`/api/admin/users/${id}`),
        fetch(`/api/admin/users/${id}/messages`),
      ])
      const usersData = await usersRes.json()
      const user = (usersData.users ?? []).find((u: any) => u.id === id)
      if (user) setEmail(user.email)

      const numbersData = await numbersRes.json()
      setNumbers(numbersData.numbers ?? [])

      const msgsData = await msgsRes.json()
      setMessages(msgsData.messages ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin')} className="text-sm text-[#5BA4CF] hover:underline">← Back to Admin</button>
        <h1 className="text-[#5BA4CF] font-bold text-lg">{email}</h1>
      </div>

      {/* Numbers */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">Numbers ({numbers.length})</h2>
        {numbers.length === 0 ? (
          <p className="text-gray-400 text-sm">No numbers assigned</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3">Number</th>
                <th className="pb-3">Country</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map(n => (
                <tr key={n.id} className="border-b border-gray-100">
                  <td className="py-3 font-mono">{n.phoneNumber}</td>
                  <td className="py-3">{n.country ? countryFlag(n.country) : ''} {n.country ?? n.countryType}</td>
                  <td className="py-3 text-green-500">{n.status}</td>
                  <td className="py-3">{n.renewalDate.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">Recent Messages ({messages.length})</h2>
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm">No messages yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3">To</th>
                <th className="pb-3">From</th>
                <th className="pb-3">Message</th>
                <th className="pb-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="py-3 font-mono text-xs">{m.phoneNumber.phoneNumber}</td>
                  <td className="py-3 font-mono text-xs">{m.fromNumber}</td>
                  <td className="py-3 max-w-xs truncate">{m.body}</td>
                  <td className="py-3 text-xs text-gray-500">{new Date(m.receivedAt).toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
