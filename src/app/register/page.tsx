'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const secret = params.get('secret') ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, secret }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
    } else {
      router.push('/login')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
        {loading ? 'Creating...' : 'Create Admin Account'}
      </Button>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Logo />
          <p className="text-sm text-gray-500 mt-2">Admin Registration</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
