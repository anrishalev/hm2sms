'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(false)
  const [refreshTimeoutMins, setRefreshTimeoutMins] = useState(1)
  const [secretKey, setSecretKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      setDiscordWebhook(data.discordWebhook ?? '')
      setEmailNotifEnabled(data.emailNotifEnabled ?? false)
      setRefreshTimeoutMins(data.refreshTimeoutMins ?? 1)
      setSecretKey(data.secretKey ?? '')
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordWebhook, emailNotifEnabled, refreshTimeoutMins }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-8">
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold text-sm">Enable SMS Email</p>
        <div className="flex rounded overflow-hidden border border-gray-200">
          <button
            onClick={() => setEmailNotifEnabled(true)}
            className={`px-5 py-2 text-sm font-medium ${emailNotifEnabled ? 'bg-gray-200 text-black' : 'bg-white text-gray-500'}`}
          >
            ON
          </button>
          <button
            onClick={() => setEmailNotifEnabled(false)}
            className={`px-5 py-2 text-sm font-medium ${!emailNotifEnabled ? 'bg-[#5BA4CF] text-white' : 'bg-white text-gray-500'}`}
          >
            OFF
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm text-center">Discord Webhook</label>
        <Input
          value={discordWebhook}
          onChange={(e) => setDiscordWebhook(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm text-center">Refresh Timeout (Mins)</label>
        <Input
          type="number"
          value={refreshTimeoutMins}
          onChange={(e) => setRefreshTimeoutMins(Number(e.target.value))}
          min={1}
        />
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSave} disabled={saving}>
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <hr />

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm text-center">Your Secret Key</label>
        <Input value={secretKey} readOnly className="font-mono text-xs" />
      </div>

      <div className="flex justify-center">
        <Button variant="outline" disabled>View API Docs</Button>
      </div>
    </div>
  )
}
