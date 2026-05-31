'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface User {
  id: string
  email: string
  role: string
  createdAt: string
  _count: { phoneNumbers: number }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignType, setAssignType] = useState<'UK' | 'EU'>('UK')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
  }

  useEffect(() => { fetchUsers() }, [])

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

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete ${email}? All their DB records removed (numbers NOT released from Twilio).`)) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setAssigning(true)
    setAssignMsg('')
    const res = await fetch('/api/admin/numbers/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: assignUserId, type: assignType }),
    })
    const data = await res.json()
    setAssigning(false)
    setAssignMsg(res.ok ? `Assigned ${data.number?.phoneNumber}` : (data.error ?? 'Failed'))
    if (res.ok) fetchUsers()
  }

  return (
    <div className="space-y-10">
      <h1 className="text-[#5BA4CF] font-bold text-lg">ADMIN PANEL</h1>

      <section className="bg-white rounded-lg p-6 shadow-sm max-w-md">
        <h2 className="font-bold mb-4">Create User</h2>
        <form onSubmit={handleCreateUser} className="space-y-3">
          <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create User'}</Button>
        </form>
      </section>

      <section className="bg-white rounded-lg p-6 shadow-sm max-w-md">
        <h2 className="font-bold mb-4">Assign Number to User</h2>
        <form onSubmit={handleAssign} className="space-y-3">
          <select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 rounded text-sm"
            required
          >
            <option value="">Select user...</option>
            {users.filter((u) => u.role === 'USER').map((u) => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
          <div className="flex gap-3">
            {(['UK', 'EU'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAssignType(t)}
                className={`flex-1 py-2 rounded border text-sm font-medium ${assignType === t ? 'bg-[#5BA4CF] text-white border-[#5BA4CF]' : 'border-gray-300'}`}
              >
                {t} Number
              </button>
            ))}
          </div>
          {assignMsg && <p className={`text-sm ${assignMsg.startsWith('Assigned') ? 'text-green-600' : 'text-red-500'}`}>{assignMsg}</p>}
          <Button type="submit" disabled={assigning}>{assigning ? 'Assigning...' : 'Assign Number'}</Button>
        </form>
      </section>

      <section className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">All Users ({users.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Numbers</th>
              <th className="pb-3">Created</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3">{u.email}</td>
                <td className="py-3">{u.role}</td>
                <td className="py-3">{u._count.phoneNumbers}</td>
                <td className="py-3">{u.createdAt.slice(0, 10)}</td>
                <td className="py-3">
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => handleDelete(u.id, u.email)} className="text-xs text-red-400 hover:underline">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
