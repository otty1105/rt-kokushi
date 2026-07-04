'use client'

import { useState, useEffect } from 'react'

export default function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('beta_banner_dismissed')
    if (dismissed !== '1') setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('beta_banner_dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-xs font-semibold text-amber-700 bg-amber-200 rounded px-1.5 py-0.5 shrink-0">
          BETA
        </span>
        <p className="text-xs text-amber-800 flex-1">
          ベータ版公開中！ 気になったところ・こんな機能があったら・不具合など、なんでも
          <a
            href="/contact"
            className="underline font-medium hover:text-amber-900 mx-0.5"
          >
            お気軽にどうぞ
          </a>
          。みなさんの声でサービスを育てています。
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="バナーを閉じる"
          className="text-amber-500 hover:text-amber-700 text-lg leading-none shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  )
}
