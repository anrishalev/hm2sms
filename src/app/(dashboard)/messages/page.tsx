'use client'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  fromNumber: string
  body: string
  receivedAt: string
  phoneNumber: { phoneNumber: string }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [refreshMins, setRefreshMins] = useState(1)
  const pageSize = 20

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    const res = await fetch(`/api/messages?${params}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setTotal(data.total ?? 0)
  }, [page, search])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setRefreshMins(d.refreshTimeoutMins ?? 1))
  }, [])

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, refreshMins * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchMessages, refreshMins])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function handleClear() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <div>
      <h1 className="text-[#5BA4CF] font-bold text-lg mb-6">INCOMING SMS MESSAGES</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Input
            placeholder="Search numbers..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => { setSearch(searchInput); setPage(1) }}>Search</Button>
          <Button variant="danger" onClick={handleClear}>Clear</Button>
          <div className="ml-auto">
            <Button variant="danger" onClick={handleClear}>Clear</Button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-3 font-semibold">Phone Number</th>
              <th className="pb-3 font-semibold">Time Received ↑</th>
              <th className="pb-3 font-semibold">Message ↑</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                  No messages yet
                </td>
              </tr>
            )}
            {messages.map((msg) => (
              <tr key={msg.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3">{msg.phoneNumber.phoneNumber}</td>
                <td className="py-3">{new Date(msg.receivedAt).toLocaleString()}</td>
                <td className="py-3">{msg.body}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-600">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="disabled:opacity-40"
          >
            ←
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
