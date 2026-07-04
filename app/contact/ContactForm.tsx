'use client'

import { useState } from 'react'

const CATEGORIES = ['不具合報告', '改善要望', '解説について', 'その他']

type Status = 'idle' | 'sending' | 'done' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, category, message }),
    })

    setStatus(res.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--bg-accent)', border: '1px solid var(--border)' }}
      >
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          送信しました
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          お問い合わせありがとうございます。内容を確認のうえご連絡します。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          お名前・ニックネーム（任意）
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：山田 太郎、ゆうき、など"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface-1)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface-1)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          カテゴリ <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          style={{ borderColor: 'var(--border)', color: category ? 'var(--text-primary)' : 'var(--text-secondary)', background: 'var(--surface-1)' }}
        >
          <option value="" disabled>選択してください</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="お問い合わせ内容をご記入ください"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface-1)' }}
        />
        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-secondary)' }}>
          {message.length} / 2000
        </p>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">
          送信に失敗しました。しばらく経ってから再度お試しください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
        style={{ background: 'var(--text-accent)' }}
      >
        {status === 'sending' ? '送信中...' : '送信する'}
      </button>
    </form>
  )
}
