'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import type { Explanation, ExplanationImage } from '@/types'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024

const TAGS = [
  { label: '詳細解説',         color: 'bg-blue-100 text-blue-700 border-blue-300'   },
  { label: 'ゴロ・暗記法',     color: 'bg-green-100 text-green-700 border-green-300' },
  { label: '間違えやすいポイント', color: 'bg-amber-100 text-amber-700 border-amber-300'  },
] as const

function tagStyle(label: string) {
  return TAGS.find((t) => t.label === label)?.color ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:text-gray-300"
        onClick={onClose}
        aria-label="閉じる"
      >
        ×
      </button>
      <img
        src={url}
        alt="拡大表示"
        className="max-w-full max-h-full object-contain rounded shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function ExplanationCard({
  exp,
  onImageClick,
  isAdmin,
  onDelete,
}: {
  exp: Explanation
  onImageClick: (url: string) => void
  isAdmin: boolean
  onDelete: (id: string) => void
}) {
  const images = [...exp.explanation_images].sort((a, b) => a.display_order - b.display_order)
  const tags = exp.tags ?? []

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${tagStyle(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{exp.content}</p>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onImageClick(img.image_url)}
              className="focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded overflow-hidden"
              aria-label="画像を拡大"
            >
              <img
                src={img.image_url}
                alt="解説画像"
                className="w-24 h-24 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-gray-700">
          {new Date(exp.created_at).toLocaleDateString('ja-JP')}
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(exp.id)}
            className="text-[10px] text-red-500 hover:text-red-700 hover:underline"
          >
            削除
          </button>
        )}
      </div>
    </div>
  )
}

export default function ExplanationSection({
  questionId,
  loggedIn,
  isAdmin = false,
}: {
  questionId: string
  loggedIn: boolean
  isAdmin?: boolean
}) {
  const [explanations, setExplanations] = useState<Explanation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isOriginal, setIsOriginal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveFilter(null)
    fetchExplanations()
  }, [questionId])

  function handlePostButtonClick() {
    const skipped = localStorage.getItem('explanation_copyright_ack') === '1'
    if (skipped) {
      setShowForm(true)
    } else {
      setDontShowAgain(false)
      setShowCopyrightWarning(true)
    }
  }

  function handleCopyrightAck() {
    if (dontShowAgain) {
      localStorage.setItem('explanation_copyright_ack', '1')
    }
    setShowCopyrightWarning(false)
    setShowForm(true)
  }

  async function fetchExplanations() {
    setLoading(true)
    const sb = getSupabaseBrowser()
    const { data } = await sb
      .from('explanations')
      .select('*, explanation_images(id, explanation_id, image_url, display_order, created_at)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })

    if (data) {
      setExplanations(
        data.map((e) => ({
          ...e,
          tags: (e.tags as string[]) ?? [],
          explanation_images: (e.explanation_images as ExplanationImage[]) ?? [],
        }))
      )
    }
    setLoading(false)
  }

  function toggleTag(label: string) {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const remaining = MAX_IMAGES - files.length
    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE).slice(0, remaining)

    if (valid.length < selected.length) {
      setError(`1ファイル5MB以下・最大${MAX_IMAGES}枚まで追加できます`)
    } else {
      setError(null)
    }

    setFiles((prev) => [...prev, ...valid])
    valid.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }

  function resetForm() {
    setContent('')
    setSelectedTags([])
    setFiles([])
    setPreviews([])
    setIsOriginal(false)
    setError(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/explanations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, content: content.trim(), tags: selectedTags }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.error('explanation insert error:', body)
      if (res.status === 401) {
        setError('ログインが必要です')
      } else {
        setError(`投稿に失敗しました。(${body.code ?? res.status}: ${body.error ?? 'unknown'})`)
      }
      setSubmitting(false)
      return
    }

    const explanation = await res.json()
    const sb = getSupabaseBrowser()

    if (files.length > 0) {
      const imageInserts: Pick<ExplanationImage, 'explanation_id' | 'image_url' | 'display_order'>[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${explanation.id}/${Date.now()}_${i}.${ext}`

        const { error: uploadError } = await sb.storage
          .from('explanation-images')
          .upload(path, file, { upsert: false })

        if (uploadError) continue

        const { data: { publicUrl } } = sb.storage.from('explanation-images').getPublicUrl(path)
        imageInserts.push({ explanation_id: explanation.id, image_url: publicUrl, display_order: i })
      }

      if (imageInserts.length > 0) {
        await sb.from('explanation_images').insert(imageInserts)
      }
    }

    resetForm()
    await fetchExplanations()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この解説を削除しますか？')) return
    const res = await fetch(`/api/explanations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setExplanations((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const filteredExplanations = activeFilter
    ? explanations.filter((e) => e.tags?.includes(activeFilter))
    : explanations

  return (
    <div className="mt-4">
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {showCopyrightWarning && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowCopyrightWarning(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-gray-800 mb-3">解説を投稿する前に</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              参考書・教科書・市販の問題集などの解説をそのまま転載することは、
              著作権法に違反する可能性があります。<br /><br />
              投稿する解説は、<span className="font-semibold text-gray-800">ご自身の言葉でオリジナルに作成したもの</span>をお使いください。
              著作権侵害に関するトラブルについて、当サイトは一切の責任を負いません。
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-600"
              />
              <span className="text-xs text-gray-600">以降このメッセージを表示しない</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCopyrightWarning(false)}
                className="flex-1 text-xs text-gray-600 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCopyrightAck}
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2 transition-colors"
              >
                理解しました
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            みんなの解説
            {explanations.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-gray-500">({explanations.length})</span>
            )}
          </h4>
          {loggedIn && !showForm && (
            <button
              onClick={handlePostButtonClick}
              className="text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              + 解説を投稿
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="解説を入力してください..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              required
            />

            {/* タグ選択 */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TAGS.map(({ label, color }) => {
                const active = selectedTags.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleTag(label)}
                    className={`text-[11px] font-medium border rounded-full px-2.5 py-0.5 transition-all ${
                      active
                        ? `${color} ring-2 ring-offset-1 ring-current`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 flex-shrink-0">
                    <img
                      src={src}
                      alt={`添付画像${i + 1}`}
                      className="w-20 h-20 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

            <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOriginal}
                onChange={(e) => setIsOriginal(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-600"
              />
              <span className="text-xs text-gray-600">
                この解説は自分自身が作成したオリジナルのものです
              </span>
            </label>

            <div className="flex items-center gap-2 mt-2">
              {files.length < MAX_IMAGES && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <span>📷</span> 画像を追加
                    {files.length > 0 && (
                      <span className="text-gray-500">({files.length}/{MAX_IMAGES})</span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim() || !isOriginal}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {submitting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </form>
        )}

        {/* フィルターボタン */}
        {explanations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className={`text-[11px] border rounded-full px-2.5 py-0.5 transition-colors ${
                activeFilter === null
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              すべて
            </button>
            {TAGS.map(({ label, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(activeFilter === label ? null : label)}
                className={`text-[11px] font-medium border rounded-full px-2.5 py-0.5 transition-colors ${
                  activeFilter === label
                    ? color
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-gray-500">読み込み中...</p>
        ) : explanations.length === 0 ? (
          <p className="text-xs text-gray-500">
            {loggedIn
              ? 'まだ解説はありません。最初の解説を投稿しましょう！'
              : 'まだ解説はありません。ログインして解説を投稿できます。'}
          </p>
        ) : filteredExplanations.length === 0 ? (
          <p className="text-xs text-gray-500">該当する解説がありません。</p>
        ) : (
          <div className="space-y-3">
            {filteredExplanations.map((exp) => (
              <ExplanationCard
                key={exp.id}
                exp={exp}
                onImageClick={setLightboxUrl}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
