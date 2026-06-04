'use client'
import { useEffect, useState } from 'react'

interface NumberRecord {
  id: string
  phoneNumber: string
  countryType: string
  country: string | null
  renewalDate: string
}

interface PriceEntry {
  country: string
  price: number | null
  currency: string
}

interface BillingInfo {
  balance: number | null
  currency: string
  isTrial: boolean
}

export default function BillingPage() {
  const [numbers, setNumbers] = useState<NumberRecord[]>([])
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [pricing, setPricing] = useState<PriceEntry[]>([])

  useEffect(() => {
    fetch('/api/numbers').then(r => r.json()).then(d => setNumbers(d.numbers ?? []))
    fetch('/api/billing').then(r => r.json()).then(setBilling)
    fetch('/api/pricing').then(r => r.json()).then(d => setPricing(d.pricing ?? []))
  }, [])

  function getPrice(country: string | null, countryType: string): { price: number; currency: string } {
    const entry = pricing.find(p => p.country === (country ?? (countryType === 'UK' ? 'GB' : '')))
    if (entry?.price) return { price: entry.price, currency: entry.currency }
    return { price: countryType === 'UK' ? 1.89 : 1.21, currency: 'GBP' }
  }

  const currency = pricing[0]?.currency ?? billing?.currency ?? 'GBP'
  const symbol = currency === 'GBP' ? '£' : '$'

  const totalCost = numbers.reduce((sum, n) => sum + getPrice(n.country, n.countryType).price, 0)
  const ukNumbers = numbers.filter(n => n.countryType === 'UK')
  const euNumbers = numbers.filter(n => n.countryType === 'EU')
  const nextRenewal = numbers[0]?.renewalDate ?? null

  const lowBalance = billing?.balance !== null && billing?.balance !== undefined && billing.balance < totalCost * 2

  return (
    <div className="space-y-8">
      <h1 className="text-[#5BA4CF] font-bold text-lg">BILLING</h1>

      {/* Alerts */}
      <div className="space-y-3">
        {billing?.isTrial && (
          <Alert type="warning" title="Trial Account">
            You are on a Twilio trial. Numbers cannot receive SMS from unknown senders.{' '}
            <a href="https://console.twilio.com/us1/billing/manage-billing/upgrade" target="_blank" rel="noreferrer" className="underline font-medium">
              Upgrade now →
            </a>
          </Alert>
        )}
        {lowBalance && (
          <Alert type="danger" title="Low Balance">
            Your Twilio balance ({symbol}{billing?.balance?.toFixed(2)}) may not cover next month&apos;s renewals ({symbol}{totalCost.toFixed(2)}).{' '}
            <a href="https://console.twilio.com/us1/billing" target="_blank" rel="noreferrer" className="underline font-medium">
              Top up →
            </a>
          </Alert>
        )}
        {!billing?.isTrial && !lowBalance && billing?.balance !== null && billing?.balance !== undefined && (
          <Alert type="success" title="Account Healthy">
            Twilio balance: {symbol}{billing.balance.toFixed(2)} — sufficient for upcoming renewals.
          </Alert>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Numbers" value={String(numbers.length)} />
        <SummaryCard label="UK Numbers" value={String(ukNumbers.length)} />
        <SummaryCard label="EU Numbers" value={String(euNumbers.length)} />
        <SummaryCard label="Est. Monthly Cost" value={`${symbol}${totalCost.toFixed(2)}`} highlight />
      </div>

      {/* Balance + next renewal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Twilio Balance</p>
          <p className="text-2xl font-bold text-gray-800">
            {billing?.balance !== null && billing?.balance !== undefined
              ? `${symbol}${billing.balance.toFixed(2)} ${currency}`
              : '—'}
          </p>
          {billing?.isTrial && <p className="text-xs text-orange-500 mt-1">Trial account</p>}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Renewal</p>
          <p className="text-2xl font-bold text-gray-800">
            {nextRenewal ? new Date(nextRenewal).toLocaleDateString('en-GB') : '—'}
          </p>
        </div>
      </div>

      {/* Per-number breakdown */}
      {numbers.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-bold mb-4">Active Numbers</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-semibold">Number</th>
                <th className="pb-3 font-semibold">Country</th>
                <th className="pb-3 font-semibold">Price/mo</th>
                <th className="pb-3 font-semibold">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map(n => {
                const { price, currency: cur } = getPrice(n.country, n.countryType)
                const sym = cur === 'GBP' ? '£' : '$'
                return (
                  <tr key={n.id} className="border-b border-gray-100">
                    <td className="py-3 font-mono">{n.phoneNumber}</td>
                    <td className="py-3">{n.country ?? n.countryType}</td>
                    <td className="py-3">{sym}{price.toFixed(2)}</td>
                    <td className="py-3">{new Date(n.renewalDate).toLocaleDateString('en-GB')}</td>
                  </tr>
                )
              })}
              <tr className="font-bold">
                <td className="pt-3" colSpan={2}>Total</td>
                <td className="pt-3 text-[#5BA4CF]">{symbol}{totalCost.toFixed(2)}/mo</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {numbers.length === 0 && (
        <div className="bg-white rounded-lg p-8 shadow-sm text-center text-gray-400 text-sm">
          No active numbers. Go to Numbers to buy your first number.
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-[#5BA4CF]' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

function Alert({ type, title, children }: { type: 'warning' | 'danger' | 'success'; title: string; children: React.ReactNode }) {
  const styles = {
    warning: 'bg-orange-50 border-orange-300 text-orange-800',
    danger: 'bg-red-50 border-red-300 text-red-800',
    success: 'bg-green-50 border-green-300 text-green-800',
  }
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <span className="font-semibold">{title}: </span>{children}
    </div>
  )
}
