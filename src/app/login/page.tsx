'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setLoading(false)
      setError('Invalid email or password')
      return
    }
    // Password ok — send OTP and go to step 2
    await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setStep('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otp }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Invalid or expired code. Check your email.')
      return
    }
    router.push('/messages')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Logo />
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="space-y-3">
            <Input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
              {loading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              A verification code was sent to <strong>{email}</strong>
            </p>
            <Input type="text" placeholder="6-digit code" value={otp}
              onChange={(e) => setOtp(e.target.value)} required maxLength={6}
              className="text-center text-lg tracking-widest" />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>
            <button type="button" onClick={() => setStep('credentials')}
              className="w-full text-sm text-gray-400 hover:underline">
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
