'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface Props {
  questionId: string
  fallbackUrl?: string | null
}

export default function QuestionImage({ questionId, fallbackUrl }: Props) {
  const [urls, setUrls] = useState<string[]>(fallbackUrl ? [fallbackUrl] : [])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [errorSet, setErrorSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    setExpandedIndex(null)
    setErrorSet(new Set())

    getSupabaseBrowser()
      .from('question_images')
      .select('image_url, display_order')
      .eq('question_id', questionId)
      .order('display_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setUrls(data.map((r) => r.image_url))
        } else if (fallbackUrl) {
          setUrls([fallbackUrl])
        } else {
          setUrls([])
        }
      })
  }, [questionId, fallbackUrl])

  if (urls.length === 0) return null

  const markError = (i: number) =>
    setErrorSet((prev) => { const next = new Set(prev); next.add(i); return next })

  // 全画像がエラーなら「準備中」メッセージ
  if (urls.every((_, i) => errorSet.has(i))) {
    return (
      <div className="mt-3 mb-3 flex items-center justify-center bg-gray-100 rounded-lg py-4 text-sm text-gray-500">
        画像を準備中
      </div>
    )
  }

  const total = urls.length
  const pageLabel = (i: number) => (total > 1 ? ` ${i + 1}/${total}` : '')

  // ── 拡大表示 ──────────────────────────────────────────────
  if (expandedIndex !== null) {
    const idx = expandedIndex
    return (
      <div className="mt-3 mb-4 border border-blue-200 rounded-lg bg-gray-50 p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">
            別冊図{pageLabel(idx)}
          </span>
          <div className="flex items-center gap-2">
            {total > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpandedIndex((i) => Math.max(0, (i ?? 0) - 1))}
                  disabled={idx === 0}
                  className="text-xs px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  onClick={() => setExpandedIndex((i) => Math.min(total - 1, (i ?? 0) + 1))}
                  disabled={idx === total - 1}
                  className="text-xs px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}
            <button
              onClick={() => setExpandedIndex(null)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              縮小 ↑
            </button>
          </div>
        </div>

        {errorSet.has(idx) ? (
          <div className="flex items-center justify-center bg-gray-100 rounded py-8 text-sm text-gray-500">
            画像を準備中
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={urls[idx]}
            alt={`問題の図（拡大）${pageLabel(idx)}`}
            className="w-full rounded object-contain cursor-zoom-out"
            onClick={() => setExpandedIndex(null)}
            onError={() => markError(idx)}
          />
        )}
      </div>
    )
  }

  // ── サムネイル表示 ─────────────────────────────────────────
  return (
    <div className="mt-3 mb-4">
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) =>
          errorSet.has(i) ? null : (
            <button
              key={i}
              onClick={() => setExpandedIndex(i)}
              className="flex items-end gap-1.5 group text-left"
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`問題の図${pageLabel(i)}`}
                style={{ maxWidth: '160px', maxHeight: '120px' }}
                className="rounded border border-gray-200 object-contain group-hover:opacity-80 transition-opacity"
                onError={() => markError(i)}
              />
              <span className="text-xs text-blue-500 group-hover:text-blue-700 pb-1 whitespace-nowrap">
                {total > 1 ? `${i + 1}/${total} ` : ''}拡大 ↓
              </span>
            </button>
          )
        )}
      </div>
    </div>
  )
}
