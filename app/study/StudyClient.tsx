'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { QuestionWithChoices } from '@/types'
import { supabase } from '@/lib/supabase'
import { formatCategory } from '@/lib/categoryName'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import QuestionImage from '@/components/QuestionImage'
import MathText from '@/components/MathText'
import ExplanationSection from '@/components/ExplanationSection'

interface Props {
  questions: QuestionWithChoices[]
  categories: string[]
  allYears: number[]
  isAdmin?: boolean
}

interface AnswerState {
  selectedNums: number[]
  submitted: boolean
}

interface SimilarQuestionInfo {
  id: string
  year: number
  exam_num: number
  question_order: number
  question: string
  similarity_type: 'near_duplicate' | 'same_theme'
}

function isCorrect(q: QuestionWithChoices, selectedNums: number[]): boolean {
  const correctNums = q.correct_choices.map((c) => c.num)
  // select_count=1 かつ正答が複数件の場合：選んだ1つが正答群に含まれていれば正解
  if (q.select_count === 1 && correctNums.length > 1) {
    return selectedNums.length === 1 && correctNums.includes(selectedNums[0])
  }
  // それ以外：完全一致
  const sorted = [...correctNums].sort()
  const selected = [...selectedNums].sort()
  return sorted.length === selected.length && sorted.every((n, i) => n === selected[i])
}

function SimilarQuestionsPanel({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [similars, setSimilars] = useState<SimilarQuestionInfo[] | null>(null)
  const router = useRouter()

  async function handleOpen() {
    setOpen(true)
    if (similars !== null) return
    setLoading(true)
    try {
      const { data: rows, error: rowsError } = await supabase
        .from('similar_questions')
        .select('question_id_1, question_id_2, similarity_type')
        .or(`question_id_1.eq.${questionId},question_id_2.eq.${questionId}`)

      if (rowsError || !rows || rows.length === 0) {
        setSimilars([])
        return
      }

      const otherIds = rows.map((r) =>
        r.question_id_1 === questionId ? r.question_id_2 : r.question_id_1
      )

      const { data: qs, error: qsError } = await supabase
        .from('questions')
        .select('id, year, exam_num, question_order, question')
        .in('id', otherIds)

      if (qsError || !qs) {
        setSimilars([])
        return
      }

      const qMap = new Map(qs.map((q) => [q.id, q]))
      const result: SimilarQuestionInfo[] = rows
        .map((r) => {
          const otherId = r.question_id_1 === questionId ? r.question_id_2 : r.question_id_1
          const q = qMap.get(otherId)
          if (!q) return null
          return {
            id: q.id,
            year: q.year,
            exam_num: q.exam_num,
            question_order: q.question_order,
            question: q.question,
            similarity_type: r.similarity_type as 'near_duplicate' | 'same_theme',
          }
        })
        .filter((x): x is SimilarQuestionInfo => x !== null)

      setSimilars(result)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="mt-3 w-full border border-indigo-300 text-indigo-600 rounded-lg py-2 text-sm hover:bg-indigo-50 transition-colors"
      >
        類題を見る
      </button>
    )
  }

  return (
    <div className="mt-3 border border-indigo-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-indigo-700">類題</span>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-600"
        >
          閉じる
        </button>
      </div>
      {loading && <p className="text-sm text-gray-500">読み込み中...</p>}
      {similars && similars.length === 0 && (
        <p className="text-sm text-gray-500">類題が見つかりませんでした</p>
      )}
      {similars && similars.length > 0 && (
        <ul className="space-y-2">
          {similars.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => router.push(`/study?focusId=${s.id}`)}
                className="w-full text-left rounded-lg border border-gray-200 px-3 py-2 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-gray-600">
                    {s.year}年 第{s.exam_num}回 問{s.question_order}
                  </span>
                  <span
                    className={`text-xs rounded px-1.5 py-0.5 font-medium ${
                      s.similarity_type === 'near_duplicate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {s.similarity_type === 'near_duplicate' ? 'ほぼ同じ問題' : '同テーマの問題'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{s.question}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ChoiceStat { choice_num: number; count: number }

// "TR — 600 TE — 15" → "TR — 600　TE — 15" のように選択肢内パラメータ間に全角スペースを挿入
// "TR ― 600 TE ― 15" → "TR ― 600　TE ― 15"（U+2015 HORIZONTAL BAR対応）
function formatChoiceText(text: string): string {
  return text.replace(/(\d[\d,.]*)\s+([A-Z]{1,4}\s*―)/g, '$1　$2')
}

function QuestionCard({ q, loggedIn, returnTo, isAdmin }: { q: QuestionWithChoices; loggedIn: boolean; returnTo: string; isAdmin: boolean }) {
  const [state, setState] = useState<AnswerState>({ selectedNums: [], submitted: false })
  const [choiceStats, setChoiceStats] = useState<ChoiceStat[] | null>(null)
  const [userHistory, setUserHistory] = useState<{ total: number; correct: number } | null>(null)
  const [flagged, setFlagged] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    getSupabaseBrowser()
      .from('flagged_questions')
      .select('question_id')
      .eq('question_id', q.id)
      .maybeSingle()
      .then(({ data }) => setFlagged(!!data))
  }, [loggedIn, q.id])

  async function toggleFlag() {
    const sb = getSupabaseBrowser()
    if (flagged) {
      await sb.from('flagged_questions').delete().eq('question_id', q.id)
      setFlagged(false)
    } else {
      await sb.from('flagged_questions').upsert({ question_id: q.id })
      setFlagged(true)
    }
  }

  const correctNums = q.correct_choices.map((c) => c.num)
  const ok = state.submitted && isCorrect(q, state.selectedNums)

  function handleToggle(num: number) {
    if (state.submitted || q.is_invalid) return
    setState((prev) => {
      if (q.select_count === 1) {
        return { ...prev, selectedNums: [num] }
      }
      if (prev.selectedNums.includes(num)) {
        return { ...prev, selectedNums: prev.selectedNums.filter((n) => n !== num) }
      }
      if (prev.selectedNums.length >= q.select_count) return prev
      return { ...prev, selectedNums: [...prev.selectedNums, num] }
    })
  }

  function handleSubmit() {
    if (state.selectedNums.length === 0) return
    const correct = isCorrect(q, state.selectedNums)
    const selected = [...state.selectedNums]
    setState((prev) => ({ ...prev, submitted: true }))

    // 初回回答かどうかをlocalStorageで判定（みんなの統計は初回のみ記録）
    const localKey = `cs_${q.id}`
    const isFirstAttempt = !localStorage.getItem(localKey)

    if (isFirstAttempt) {
      localStorage.setItem(localKey, '1')
      fetch('/api/choice-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: q.id, selected_nums: selected }),
      }).then(() => {
        fetch(`/api/choice-stats?questionId=${q.id}`)
          .then((r) => r.json())
          .then((data) => setChoiceStats(data.stats ?? []))
          .catch(() => {})
      }).catch(() => {})
    } else {
      // 2回目以降も統計表示だけ行う
      fetch(`/api/choice-stats?questionId=${q.id}`)
        .then((r) => r.json())
        .then((data) => setChoiceStats(data.stats ?? []))
        .catch(() => {})
    }

    // 回答を保存 → res.okで認証確認 → DBから正確な履歴を取得
    // loggedInの初期化タイミングに依存しないようにAPIレスポンスで判断
    fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: [{ question_id: q.id, is_correct: correct, selected_nums: selected }], source: 'study' }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[answers] save failed:', res.status, err)
        return
      }
      const { data } = await getSupabaseBrowser()
        .from('user_answers')
        .select('is_correct')
        .eq('question_id', q.id)
      if (data && data.length > 0) {
        setUserHistory({
          total: data.length,
          correct: data.filter((r) => r.is_correct).length,
        })
      }
    }).catch(() => {})
  }

  function handleReset() {
    setState({ selectedNums: [], submitted: false })
    setChoiceStats(null)
    setUserHistory(null)
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">
          診療放射線技師国家試験 第{q.exam_num}回（{q.year}年）{q.question_order <= 100 ? '午前' : '午後'}
        </p>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-700">問{q.question_order > 100 ? q.question_order - 100 : q.question_order}</span>
            {q.category && (
              <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                {formatCategory(q.category, q.year)}
              </span>
            )}
            {q.is_invalid && (
              <span className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-0.5 font-medium">
                不適切問題
              </span>
            )}
          </div>
          {loggedIn && (
            <button
              onClick={toggleFlag}
              className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                flagged
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-700 font-medium'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔖 {flagged ? 'ブックマーク解除' : 'ブックマーク'}
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap mb-3">
        <MathText text={q.question} />
      </p>

      {q.image_url && <QuestionImage questionId={q.id} fallbackUrl={q.image_url} />}

      {q.select_count > 1 && (
        <p className="text-xs text-amber-600 mb-2">{q.select_count}つ選べ</p>
      )}

      <div className="space-y-2 mb-4">
        {q.choices.sort((a, b) => a.num - b.num).map((choice) => {
          const selected = state.selectedNums.includes(choice.num)
          const isCorrectChoice = correctNums.includes(choice.num)

          let className = 'w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors '
          if (q.is_invalid) {
            className += 'border-gray-200 text-gray-500 cursor-not-allowed'
          } else if (state.submitted) {
            if (isCorrectChoice) {
              className += 'border-blue-400 bg-blue-50 text-blue-800'
            } else if (selected && !isCorrectChoice) {
              className += 'border-red-400 bg-red-50 text-red-700'
            } else {
              className += 'border-gray-200 text-gray-600'
            }
          } else {
            className += selected
              ? 'border-blue-500 bg-blue-50 text-blue-800'
              : 'border-gray-200 hover:bg-gray-50 text-gray-800'
          }

          return (
            <button key={choice.id} onClick={() => handleToggle(choice.num)} className={className}>
              <span className="font-bold mr-2">{choice.num}.</span>
              <MathText text={formatChoiceText(choice.text)} />
              {state.submitted && isCorrectChoice && (
                <span className="ml-2 text-blue-600 font-bold">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {q.is_invalid ? (
        <p className="text-sm text-orange-600 text-center py-2">この問題は不適切問題のため回答できません</p>
      ) : !state.submitted ? (
        <button
          onClick={handleSubmit}
          disabled={state.selectedNums.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg py-2 transition-colors"
        >
          回答する
        </button>
      ) : (
        <div>
          {/* 正解・不正解バナー */}
          <div className={`rounded-lg py-3 px-4 mb-3 text-center ${ok ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-xl font-bold ${ok ? 'text-blue-600' : 'text-red-500'}`}>
              {ok ? '✓ 正解！' : '✗ 不正解'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              正解：<span className="font-bold">{correctNums.sort().join('・')}</span>
            </p>
          </div>

          {/* みんなの回答統計 */}
          {choiceStats && (() => {
            const total = choiceStats.reduce((s, c) => s + Number(c.count), 0)
            const sortedChoices = q.choices.sort((a, b) => a.num - b.num)
            if (total < 10) {
              return (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">みんなの回答</p>
                  <div className="space-y-2 mb-2">
                    {sortedChoices.map((choice, i) => {
                      const skeletonWidths = [38, 58, 44, 22, 62]
                      return (
                        <div key={choice.num} className="flex items-center gap-2 text-xs">
                          <span className="w-4 flex-shrink-0 font-bold text-gray-300">{choice.num}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-gray-300" style={{ width: `${skeletonWidths[i % 5]}%` }} />
                          </div>
                          <span className="w-8 text-right text-gray-300 font-medium">—</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-gray-700 text-center">集計中</p>
                </div>
              )
            }
            return (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-2">みんなの回答 <span className="font-normal text-gray-500">（{total.toLocaleString()}件）</span></p>
                <div className="space-y-2">
                  {sortedChoices.map((choice) => {
                    const stat = choiceStats.find((s) => s.choice_num === choice.num)
                    const cnt = stat ? Number(stat.count) : 0
                    const pct = Math.round((cnt / total) * 100)
                    const isCorrectChoice = correctNums.includes(choice.num)
                    const wasSelected = state.selectedNums.includes(choice.num)
                    return (
                      <div key={choice.num} className="flex items-center gap-2 text-xs">
                        <span className={`w-5 flex-shrink-0 font-bold text-center ${isCorrectChoice ? 'text-blue-600' : wasSelected ? 'text-red-600' : 'text-gray-500'}`}>
                          {choice.num}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${isCorrectChoice ? 'bg-blue-400' : wasSelected ? 'bg-red-300' : 'bg-gray-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`w-9 text-right font-medium ${isCorrectChoice ? 'text-blue-600' : wasSelected ? 'text-red-600' : 'text-gray-600'}`}>
                          {pct}%
                        </span>
                        {wasSelected && (
                          <span className={`text-[10px] font-bold ${isCorrectChoice ? 'text-blue-500' : 'text-red-600'}`}>
                            あなた
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* 個人の回答履歴 */}
          {userHistory && userHistory.total > 0 && (
            <div className={`mb-3 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm border ${
              userHistory.correct / userHistory.total >= 0.6
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <span className="text-gray-600 font-medium">あなたの記録</span>
              <span className={`font-bold ${
                userHistory.correct / userHistory.total >= 0.6 ? 'text-blue-600' : 'text-orange-500'
              }`}>
                {userHistory.total}回中 {userHistory.correct}回正解
                <span className="font-normal text-xs text-gray-600 ml-1">
                  （{Math.round((userHistory.correct / userHistory.total) * 100)}%）
                </span>
              </span>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            もう一度
          </button>
          <SimilarQuestionsPanel questionId={q.id} />
          {!loggedIn && (
            <a
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="mt-3 flex items-center justify-center gap-1.5 w-full border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>💬</span> ログインして解説を投稿する
            </a>
          )}
          <ExplanationSection questionId={q.id} loggedIn={loggedIn} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  )
}

export default function StudyClient({ questions, categories, allYears, isAdmin = false }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const focusId = searchParams.get('focusId')
  const categoryParam = searchParams.get('category') ?? ''

  const [filterCategory, setFilterCategory] = useState(categoryParam)
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'am' | 'pm'>('all')
  const [filterYear, setFilterYear] = useState('')
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const questionsRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 10

  useEffect(() => {
    // Router Cacheが古いデータを返す場合に強制リフレッシュ
    router.refresh()
  }, [])

  useEffect(() => {
    const sb = getSupabaseBrowser()
    sb.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const filtered = useMemo(() => {
    if (focusId) {
      return questions.filter((q) => q.id === focusId)
    }
    return questions.filter((q) => {
      if (filterCategory && q.category !== filterCategory) return false
      if (filterPeriod === 'am' && q.question_order > 100) return false
      if (filterPeriod === 'pm' && q.question_order <= 100) return false
      if (filterYear && q.year !== parseInt(filterYear)) return false
      return true
    })
  }, [questions, filterCategory, filterPeriod, filterYear, focusId])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handlePageChange(newPage: number) {
    setPage(newPage)
    questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleFilterChange(fn: () => void) {
    fn()
    setPage(1)
  }

  if (focusId) {
    return (
      <div>
        <button
          onClick={() => router.push('/study')}
          className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← 全問題に戻る
        </button>
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">問題が見つかりませんでした</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => (
              <QuestionCard key={q.id} q={q} loggedIn={loggedIn} returnTo={pathname} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">科目</label>
          <select
            value={filterCategory}
            onChange={(e) => handleFilterChange(() => setFilterCategory(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">すべての科目</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">午前・午後</label>
          <div className="flex gap-1">
            {(['all', 'am', 'pm'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleFilterChange(() => setFilterPeriod(p))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filterPeriod === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-blue-50'
                }`}
              >
                {p === 'all' ? '全て' : p === 'am' ? '午前' : '午後'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">年度</label>
          <select
            value={filterYear}
            onChange={(e) => handleFilterChange(() => setFilterYear(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">すべての年度</option>
            {allYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {filtered.length}問 ヒット
      </div>

      {paged.length === 0 ? (
        <div className="text-center text-gray-500 py-16">該当する問題がありません</div>
      ) : (
        <>
          <div ref={questionsRef} className="space-y-4">
            {paged.map((q) => (
              <QuestionCard key={`${q.id}-${filterCategory}-${filterPeriod}-${filterYear}`} q={q} loggedIn={loggedIn} returnTo={pathname} isAdmin={isAdmin} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
              >
                前へ
              </button>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput ?? page}
                  onFocus={() => setPageInput(String(page))}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(pageInput ?? '')
                    if (!isNaN(v) && v >= 1 && v <= totalPages) handlePageChange(v)
                    setPageInput(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = parseInt(pageInput ?? '')
                      if (!isNaN(v) && v >= 1 && v <= totalPages) handlePageChange(v)
                      setPageInput(null)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  className="w-12 text-center border border-gray-300 rounded px-1 py-1 text-sm"
                />
                <span>/ {totalPages}</span>
              </div>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
