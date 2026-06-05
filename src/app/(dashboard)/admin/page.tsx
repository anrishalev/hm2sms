'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PhoneNumber {
  id: string
  phoneNumber: string
  countryType: string
  country: string | null
  status: string
  renewalDate: string
}

const UK_PRICE = 1.89
const EU_PRICE = 1.21

interface User {
  id: string
  email: string
  role: string
  createdAt: string
  ukCount: number
  euCount: number
  _count: { phoneNumbers: number }
}

function countryFlag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignType, setAssignType] = useState<'UK' | 'EU'>('UK')
  const [assignQty, setAssignQty] = useState(1)
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userNumbers, setUserNumbers] = useState<Record<string, PhoneNumber[]>>({})
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [syncUserId, setSyncUserId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
  }

  useEffect(() => { fetchUsers() }, [])

  async function fetchUserNumbers(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}`)
    const data = await res.json()
    setUserNumbers(prev => ({ ...prev, [userId]: data.numbers ?? [] }))
  }

  async function toggleExpand(userId: string) {
    if (expandedUser === userId) {
      setExpandedUser(null)
    } else {
      setExpandedUser(userId)
      await fetchUserNumbers(userId)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setCreateError(data.error ?? 'Failed')
    } else {
      setNewEmail('')
      setNewPassword('')
      fetchUsers()
    }
  }

  async function handleDelete(id: string, email: string, numberCount: number) {
    const msg = numberCount > 0
      ? `Delete ${email}? This will also release their ${numberCount} Twilio number(s) — they will stop working immediately.`
      : `Delete ${email}?`
    if (!confirm(msg)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.releasedNumbers > 0) alert(`User deleted. ${data.releasedNumbers} number(s) released from Twilio.`)
    fetchUsers()
  }

  async function handleReleaseNumber(numberId: string, phoneNumber: string, userId: string) {
    if (!confirm(`Release ${phoneNumber}? It will be removed from Twilio immediately.`)) return
    await fetch(`/api/admin/numbers/${numberId}`, { method: 'DELETE' })
    fetchUserNumbers(userId)
    fetchUsers()
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setAssigning(true)
    setAssignMsg('')
    const res = await fetch('/api/admin/numbers/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: assignUserId, type: assignType, quantity: assignQty }),
    })
    const data = await res.json()
    setAssigning(false)
    if (data.succeeded > 0) {
      setAssignMsg(`✓ Assigned ${data.succeeded} number${data.succeeded > 1 ? 's' : ''}${data.failed > 0 ? `, ${data.failed} failed` : ''}`)
      fetchUsers()
      if (expandedUser === assignUserId) fetchUserNumbers(assignUserId)
    } else {
      setAssignMsg(data.results?.[0]?.error ?? data.error ?? 'Failed')
    }
  }

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: syncUserId }),
    })
    const data = await res.json()
    setSyncing(false)
    if (res.ok) {
      setSyncMsg(data.added > 0 ? `✓ Synced ${data.added} number(s): ${data.numbers.join(', ')}` : '✓ All numbers already in sync')
      fetchUsers()
    } else {
      setSyncMsg(data.error ?? 'Sync failed')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUserId) return
    const res = await fetch(`/api/admin/users/${resetUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    })
    const data = await res.json()
    setResetMsg(res.ok ? '✓ Password updated' : (data.error ?? 'Failed'))
    if (res.ok) { setResetPassword(''); setTimeout(() => { setResetUserId(null); setResetMsg('') }, 1500) }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-[#5BA4CF] font-bold text-lg">ADMIN PANEL</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create User */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-bold mb-4">Create User</h2>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            {createError && <p className="text-red-500 text-sm">{createError}</p>}
            <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create User'}</Button>
          </form>
        </section>

        {/* Assign Numbers */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-bold mb-4">Assign Numbers to User</h2>
          <form onSubmit={handleAssign} className="space-y-3">
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 rounded text-sm" required>
              <option value="">Select user...</option>
              {users.filter((u) => u.role === 'USER').map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u._count.phoneNumbers} numbers)</option>
              ))}
            </select>
            <div className="flex gap-3">
              {(['UK', 'EU'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setAssignType(t)}
                  className={`flex-1 py-2 rounded border text-sm font-medium ${assignType === t ? 'bg-[#5BA4CF] text-white border-[#5BA4CF]' : 'border-gray-300'}`}>
                  {t} Number
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Quantity (1–100)</label>
              <input type="number" min={1} max={100} value={assignQty}
                onChange={e => setAssignQty(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-2 bg-gray-100 rounded text-sm" />
            </div>
            {assignMsg && <p className={`text-sm ${assignMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{assignMsg}</p>}
            <Button type="submit" disabled={assigning}>
              {assigning ? `Assigning ${assignQty}...` : `Assign ${assignQty} Number${assignQty > 1 ? 's' : ''}`}
            </Button>
          </form>
        </section>
      </div>

      {/* Sync from Twilio */}
      <section className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-1">Sync Numbers from Twilio</h2>
        <p className="text-xs text-gray-400 mb-4">Import numbers bought directly on Twilio console into the dashboard</p>
        <form onSubmit={handleSync} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs text-gray-500 block mb-1">Assign to user</label>
            <select value={syncUserId} onChange={(e) => setSyncUserId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 rounded text-sm" required>
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync from Twilio'}
          </Button>
          {syncMsg && <p className={`text-sm w-full ${syncMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{syncMsg}</p>}
        </form>
      </section>

      {/* Usage & Billing Overview */}
      {users.filter(u => u.role === 'USER').length > 0 && (() => {
        const clients = users.filter(u => u.role === 'USER')
        const totalUK = clients.reduce((s, u) => s + u.ukCount, 0)
        const totalEU = clients.reduce((s, u) => s + u.euCount, 0)
        const totalCost = totalUK * UK_PRICE + totalEU * EU_PRICE
        return (
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-bold mb-4">Usage & Billing Overview</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total UK Numbers</p>
                <p className="text-2xl font-bold text-gray-800">{totalUK}</p>
                <p className="text-xs text-gray-400">£{(totalUK * UK_PRICE).toFixed(2)}/mo</p>
              </div>
              <div className="bg-gray-50 rounded p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total EU Numbers</p>
                <p className="text-2xl font-bold text-gray-800">{totalEU}</p>
                <p className="text-xs text-gray-400">£{(totalEU * EU_PRICE).toFixed(2)}/mo</p>
              </div>
              <div className="bg-[#5BA4CF]/10 rounded p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Monthly Cost</p>
                <p className="text-2xl font-bold text-[#5BA4CF]">£{totalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{totalUK + totalEU} active numbers</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3">Client</th>
                  <th className="pb-3">🇬🇧 UK</th>
                  <th className="pb-3">🌍 EU</th>
                  <th className="pb-3">Total Numbers</th>
                  <th className="pb-3 text-right">Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(u => {
                  const cost = u.ukCount * UK_PRICE + u.euCount * EU_PRICE
                  return (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">{u.ukCount}</td>
                      <td className="py-3">{u.euCount}</td>
                      <td className="py-3">{u._count.phoneNumbers}</td>
                      <td className="py-3 text-right font-medium">
                        {cost > 0 ? `£${cost.toFixed(2)}` : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  )
                })}
                <tr className="font-bold border-t-2 border-gray-300">
                  <td className="pt-3">Total</td>
                  <td className="pt-3">{totalUK}</td>
                  <td className="pt-3">{totalEU}</td>
                  <td className="pt-3">{totalUK + totalEU}</td>
                  <td className="pt-3 text-right text-[#5BA4CF]">£{totalCost.toFixed(2)}/mo</td>
                </tr>
              </tbody>
            </table>
          </section>
        )
      })()}

      {/* Users Table */}
      <section className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">All Users ({users.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Numbers</th>
              <th className="pb-3">Created</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <React.Fragment key={u.id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => toggleExpand(u.id)} className="text-[#5BA4CF] hover:underline font-medium">
                      {u._count.phoneNumbers} {expandedUser === u.id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td className="py-3">{u.createdAt.slice(0, 10)}</td>
                  <td className="py-3">
                    <div className="flex gap-3 flex-wrap">
                      <a href={`/admin/users/${u.id}`}
                        className="text-xs text-[#5BA4CF] hover:underline">View</a>
                      {u.role !== 'ADMIN' && (
                        <>
                          <button onClick={() => { setResetUserId(u.id); setResetMsg('') }}
                            className="text-xs text-blue-400 hover:underline">Reset Password</button>
                          <button onClick={() => handleDelete(u.id, u.email, u._count.phoneNumbers)}
                            className="text-xs text-red-400 hover:underline">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded numbers */}
                {expandedUser === u.id && (
                  <tr>
                    <td colSpan={5} className="pb-3 px-4">
                      <div className="bg-gray-50 rounded p-3 text-xs">
                        {(userNumbers[u.id] ?? []).length === 0 ? (
                          <p className="text-gray-400">No numbers assigned</p>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="pb-2">Number</th>
                                <th className="pb-2">Country</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Renewal</th>
                                <th className="pb-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(userNumbers[u.id] ?? []).map(n => (
                                <tr key={n.id} className="border-b border-gray-100">
                                  <td className="py-1.5 font-mono">{n.phoneNumber}</td>
                                  <td className="py-1.5">{n.country ? countryFlag(n.country) : ''} {n.country ?? n.countryType}</td>
                                  <td className="py-1.5 text-green-600">{n.status}</td>
                                  <td className="py-1.5">{n.renewalDate.slice(0, 10)}</td>
                                  <td className="py-1.5">
                                    <button onClick={() => handleReleaseNumber(n.id, n.phoneNumber, u.id)}
                                      className="text-red-400 hover:underline">Release</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 space-y-4 shadow-xl">
            <h2 className="font-bold">Reset Password</h2>
            <p className="text-sm text-gray-500">{users.find(u => u.id === resetUserId)?.email}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <Input type="password" placeholder="New password (min 6 chars)" value={resetPassword}
                onChange={e => setResetPassword(e.target.value)} required minLength={6} />
              {resetMsg && <p className={`text-sm ${resetMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{resetMsg}</p>}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Update</Button>
                <Button type="button" variant="outline" onClick={() => { setResetUserId(null); setResetMsg('') }} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
