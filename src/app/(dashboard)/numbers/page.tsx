'use client'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PhoneNumber {
  id: string
  phoneNumber: string
  renewalDate: string
  status: string
  countryType: string
}

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [buying, setBuying] = useState(false)
  const [buyType, setBuyType] = useState<'UK' | 'EU'>('UK')
  const [buyError, setBuyError] = useState('')

  const fetchNumbers = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/numbers?${params}`)
    const data = await res.json()
    setNumbers(data.numbers ?? [])
  }, [search])

  useEffect(() => { fetchNumbers() }, [fetchNumbers])

  async function handleBuy() {
    setBuying(true)
    setBuyError('')
    const res = await fetch('/api/numbers/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: buyType }),
    })
    setBuying(false)
    if (!res.ok) {
      const d = await res.json()
      setBuyError(d.error ?? 'Failed to buy number')
      return
    }
    setShowModal(false)
    fetchNumbers()
  }

  async function handleRelease(id: string) {
    if (!confirm('Release this number? Cannot be undone.')) return
    await fetch(`/api/numbers/${id}`, { method: 'DELETE' })
    fetchNumbers()
  }

  return (
    <div>
      <h1 className="text-[#5BA4CF] font-bold text-lg mb-6">NUMBERS</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Input
            placeholder="Search numbers..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setSearch(searchInput)}>Search</Button>
          <Button variant="danger" onClick={() => { setSearchInput(''); setSearch('') }}>Clear</Button>
          <div className="ml-auto">
            <Button onClick={() => { setShowModal(true); setBuyError('') }}>BUY MORE NUMBERS</Button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-3 font-semibold">Phone Number</th>
              <th className="pb-3 font-semibold">Renewal Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {numbers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No numbers yet</td>
              </tr>
            )}
            {numbers.map((n) => (
              <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3">{n.phoneNumber}</td>
                <td className="py-3">{n.renewalDate.slice(0, 10)}</td>
                <td className="py-3 text-green-500 font-medium">{n.status === 'ACTIVE' ? 'Active' : 'Inactive'}</td>
                <td className="py-3">
                  <button onClick={() => handleRelease(n.id)} className="text-xs text-red-400 hover:underline">
                    Release
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-80 space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">Buy a Number</h2>
            <div className="flex gap-3">
              {(['UK', 'EU'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBuyType(t)}
                  className={`flex-1 py-2 rounded border text-sm font-medium ${buyType === t ? 'bg-[#5BA4CF] text-white border-[#5BA4CF]' : 'border-gray-300'}`}
                >
                  {t} Number
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {buyType === 'UK' ? 'UK number (~$1.15/mo)' : 'EU number — DE/FR/NL/ES/BE (~$1–2/mo)'}
            </p>
            {buyError && <p className="text-red-500 text-xs">{buyError}</p>}
            <div className="flex gap-3">
              <Button onClick={handleBuy} disabled={buying} className="flex-1">
                {buying ? 'Buying...' : 'Confirm'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
