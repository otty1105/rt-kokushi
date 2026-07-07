'use client'

import { useState, useEffect, useRef } from 'react'
import { QuestionForTest, UserAnswer, GradedResult } from '@/types'
import { formatCategory } from '@/lib/categoryName'
import QuestionImage from '@/components/QuestionImage'
import MathText from '@/components/MathText'

interface Props {
  questions: QuestionForTest[]
}

type Phase = 'pre' | 'solve' | 'grading' | 'result'

const EXAM_SECONDS = 9300 // 2h35m

function formatChoiceText(text: string): string {
  return text.replace(/(\d[\d,.]*)\s+([A-Z]{1,4}\s*―)/g, '$1　$2')
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TestSolveClient({ questions }: Props) {
  const [phase, setPhase] = useState<Phase>('pre')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({})
  const [pending, setPending] = useState<number[]>([])
  const [flags, setFlags] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS)
  const [gradedResults, setGradedResults] = useState<Record<string, GradedResult>>({})
  const [gradingError, setGradingError] = useState(false)
  const sessionIdRef = useRef<string>(crypto.randomUUID())

  const valid = questions.filter((q) => !q.is_invalid)

  // Tick timer
  useEffect(() => {
    if (phase !== 'solve') return
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Auto-grade at 0
  useEffect(() => {
    if (phase === 'solve' && timeLeft === 0) finishTest(answers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  // 採点は解答送信後にサーバーサイドで行う（correct_choicesはクライアントに渡さない）
  async function finishTest(finalAnswers: Record<string, UserAnswer>) {
    setGradingError(false)
    setPhase('grading')
    const items = valid.map((q) => ({
      question_id: q.id,
      selected_nums: finalAnswers[q.id]?.selectedNums ?? [],
    }))

    try {
      const res = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current, items }),
      })
      if (!res.ok) throw new Error(`grading failed: ${res.status}`)
      const data = await res.json()
      const map: Record<string, GradedResult> = {}
      for (const r of data.results as { question_id: string; is_correct: boolean; correct_nums: number[] }[]) {
        map[r.question_id] = { isCorrect: r.is_correct, correctNums: r.correct_nums }
      }
      setGradedResults(map)
      setPhase('result')
    } catch (err) {
      console.error('[test/submit] failed:', err)
      setGradingError(true)
      setPhase('solve')
    }
  }

  function startTest() {
    setCurrentIndex(0)
    setAnswers({})
    setPending([])
    setFlags(new Set())
    setTimeLeft(EXAM_SECONDS)
    setGradedResults({})
    setGradingError(false)
    sessionIdRef.current = crypto.randomUUID()
    setPhase('solve')
  }

  // 問題移動時：pendingをcommit（DB保存・採点は最終提出時にまとめて行う）
  function navigateTo(targetIndex: number | 'result') {
    const q = valid[currentIndex]
    const newAnswers =
      pending.length > 0
        ? { ...answers, [q.id]: { questionId: q.id, selectedNums: pending } }
        : answers
    if (newAnswers !== answers) setAnswers(newAnswers)

    if (targetIndex === 'result') {
      finishTest(newAnswers)
    } else {
      setCurrentIndex(targetIndex)
      setPending(newAnswers[valid[targetIndex].id]?.selectedNums ?? [])
    }
  }

  function handleToggle(num: number, selectCount: number) {
    setPending((prev) => {
      if (selectCount === 1) return [num]
      if (prev.includes(num)) return prev.filter((n) => n !== num)
      if (prev.length >= selectCount) return prev
      return [...prev, num]
    })
  }

  function toggleFlag(id: string) {
    setFlags((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ─── PRE ─────────────────────────────────────────────────────────────────
  if (phase === 'pre') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-600 mb-1">
            有効問題数：<span className="font-bold text-gray-800">{valid.length}</span>問
          </p>
          {questions.length !== valid.length && (
            <p className="text-xs text-gray-500 mb-1">
              無効問題 {questions.length - valid.length} 問を除く
            </p>
          )}
          <p className="text-gray-600 text-sm mb-6">制限時間：2時間35分</p>
          <button
            onClick={startTest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-3 text-lg transition-colors"
          >
            テスト開始
          </button>
        </div>
      </div>
    )
  }

  // ─── GRADING ──────────────────────────────────────────────────────────────
  if (phase === 'grading') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
          採点中...
        </div>
      </div>
    )
  }

  // ─── RESULT ───────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const correct = valid.filter((q) => gradedResults[q.id]?.isCorrect).length
    const total = valid.length
    const unanswered = total - Object.keys(answers).length
    const score = Math.round((correct / total) * 100)
    const flagged = valid.filter((q) => flags.has(q.id))

    return (
      <div className="space-y-4">
        {/* Score */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-xl font-bold text-gray-700 mb-4">採点結果</h3>
          <div className="text-6xl font-bold text-blue-600 mb-2">{score}点</div>
          <p className="text-gray-600">
            {total}問中 <span className="font-bold text-gray-700">{correct}</span>問正解
          </p>
          {unanswered > 0 && (
            <p className="text-amber-600 text-sm mt-1">未回答 {unanswered}問</p>
          )}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${score}%` }} />
          </div>
          <div className="flex gap-3 mt-5 justify-center">
            <button
              onClick={startTest}
              className="flex-1 border border-blue-600 text-blue-600 font-bold rounded-lg py-2.5 text-sm hover:bg-blue-50 transition-colors"
            >
              もう一度受ける
            </button>
            <a
              href="/dashboard"
              className="flex-1 bg-blue-600 text-white font-bold rounded-lg py-2.5 text-sm text-center hover:bg-blue-700 transition-colors"
            >
              ダッシュボードを見る
            </a>
          </div>
        </div>

        {/* Problem map */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-bold text-gray-700 mb-2 text-sm">問題マップ</h3>
          <div className="flex gap-3 text-xs text-gray-600 mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />正解
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" />不正解
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />未回答
            </span>
            <span>🚩 フラグあり</span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {valid.map((q) => {
              const ok = gradedResults[q.id]?.isCorrect ?? false
              const ans = !!answers[q.id]
              const fl = flags.has(q.id)
              let cls =
                'relative flex items-center justify-center text-[10px] font-bold rounded border aspect-square '
              if (!ans) cls += 'bg-gray-100 border-gray-300 text-gray-500'
              else if (ok) cls += 'bg-green-100 border-green-400 text-green-800'
              else cls += 'bg-red-100 border-red-400 text-red-700'
              return (
                <div key={q.id} className={cls} title={`問${q.question_order}`}>
                  {q.question_order}
                  {fl && (
                    <span className="absolute -top-1 -right-1 text-[8px] leading-none">🚩</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Flagged questions */}
        {flagged.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-bold text-gray-700 mb-3">🚩 フラグをつけた問題（{flagged.length}問）</h3>
            <div className="space-y-2">
              {flagged.map((q) => {
                const ans = answers[q.id]
                const ok = gradedResults[q.id]?.isCorrect ?? false
                const correctNums = [...(gradedResults[q.id]?.correctNums ?? [])].sort((a, b) => a - b)
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg p-3 border text-sm ${
                      !ans
                        ? 'border-gray-200 bg-gray-50'
                        : ok
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${ok ? 'text-green-600' : !ans ? 'text-gray-500' : 'text-red-500'}`}>
                        {!ans ? '－' : ok ? '○' : '×'}
                      </span>
                      <span className="text-xs text-gray-600">問{q.question_order}</span>
                    </div>
                    <p className="text-gray-800 line-clamp-2 mb-1"><MathText text={q.question} /></p>
                    <p className="text-xs text-gray-600">
                      正解：{correctNums.join('・')}
                      {ans ? (
                        <span className="ml-2">回答：{[...ans.selectedNums].sort().join('・')}</span>
                      ) : (
                        <span className="ml-2 text-gray-500">未回答</span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-question results */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">問題別結果</h3>
          <div className="space-y-2">
            {valid.map((q) => {
              const ans = answers[q.id]
              const ok = gradedResults[q.id]?.isCorrect ?? false
              const correctNums = [...(gradedResults[q.id]?.correctNums ?? [])].sort((a, b) => a - b)
              const fl = flags.has(q.id)
              return (
                <div
                  key={q.id}
                  className={`rounded-lg p-3 border text-sm ${
                    !ans
                      ? 'border-gray-200 bg-gray-50'
                      : ok
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`font-bold text-base flex-shrink-0 ${
                        !ans ? 'text-gray-500' : ok ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {!ans ? '－' : ok ? '○' : '×'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <p className="text-[10px] text-gray-700 leading-none mb-0.5">
                          診療放射線技師国家試験 第{q.exam_num}回（{q.year}年）{q.question_order <= 100 ? '午前' : '午後'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-600">問{q.question_order > 100 ? q.question_order - 100 : q.question_order}</span>
                          {fl && <span className="text-xs">🚩</span>}
                          {q.category && (
                            <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                              {formatCategory(q.category, q.year)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-800 line-clamp-2"><MathText text={q.question} /></p>
                      <p className="text-xs text-gray-600 mt-1">
                        正解：{correctNums.join('・')}
                        {ans ? (
                          <span className="ml-2">回答：{[...ans.selectedNums].sort().join('・')}</span>
                        ) : (
                          <span className="ml-2 text-gray-500">未回答</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button
            onClick={startTest}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2.5 transition-colors"
          >
            もう一度
          </button>
          <a
            href="/test"
            className="flex-1 text-center border border-gray-300 rounded-lg py-2.5 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            年度選択に戻る
          </a>
        </div>
      </div>
    )
  }

  // ─── SOLVE ────────────────────────────────────────────────────────────────
  const q = valid[currentIndex]
  const answeredCount = Object.keys(answers).length + (pending.length > 0 && !answers[q.id] ? 1 : 0)
  const timerUrgent = timeLeft < 300

  return (
    <div>
      {gradingError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-100 text-red-700 text-sm">
          採点に失敗しました。通信状態を確認し、もう一度「採点する」を押してください。
        </div>
      )}

      {/* Timer bar */}
      <div
        className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl ${
          timerUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-800'
        }`}
      >
        <span className="text-sm font-medium">残り時間</span>
        <span className={`text-2xl font-bold font-mono tabular-nums ${timerUrgent ? 'animate-pulse' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        <button
          onClick={() => navigateTo('result')}
          className="text-xs bg-white border border-gray-300 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          採点する
        </button>
      </div>

      <div className="flex gap-3 items-start">
        {/* ── Left sidebar: question tiles ── */}
        <div className="flex-shrink-0 w-32 sm:w-40">
          <div className="bg-white rounded-xl shadow p-2.5 sticky top-4">
            <div className="text-[11px] text-gray-700 mb-2 text-center">
              {answeredCount} / {valid.length} 回答
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
              {valid.map((vq, i) => {
                const isActive = i === currentIndex
                const fl = flags.has(vq.id)
                const ans = answers[vq.id] || (i === currentIndex && pending.length > 0)

                let cls =
                  'relative flex items-center justify-center text-[10px] font-bold rounded border aspect-square cursor-pointer transition-colors select-none '
                if (fl) {
                  cls += 'bg-yellow-100 border-yellow-400 text-yellow-800'
                } else if (ans) {
                  cls += 'bg-blue-100 border-blue-300 text-blue-700'
                } else {
                  cls += 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }
                if (isActive) cls += ' ring-2 ring-blue-500 ring-offset-1'

                return (
                  <button key={vq.id} onClick={() => navigateTo(i)} className={cls}>
                    {vq.question_order > 100 ? vq.question_order - 100 : vq.question_order}
                    {fl && (
                      <span className="absolute -top-1 -right-1 text-[8px] leading-none pointer-events-none">
                        🚩
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Main: question ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow p-5 mb-3">
            {/* Question header */}
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">
                  診療放射線技師国家試験 第{q.exam_num}回（{q.year}年）{q.question_order <= 100 ? '午前' : '午後'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-700">問{q.question_order > 100 ? q.question_order - 100 : q.question_order}</span>
                  {q.category && (
                    <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                      {formatCategory(q.category, q.year)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleFlag(q.id)}
                className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  flags.has(q.id)
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-700 font-medium'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                🚩 {flags.has(q.id) ? 'フラグ解除' : 'フラグ'}
              </button>
            </div>

            <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap mb-4">
              <MathText text={q.question} />
            </p>

            {q.image_url && <QuestionImage questionId={q.id} fallbackUrl={q.image_url} />}

            {q.select_count > 1 && (
              <p className="text-xs text-amber-600 mb-2">{q.select_count}つ選べ</p>
            )}

            <div className="space-y-2">
              {q.choices.sort((a, b) => a.num - b.num).map((choice) => {
                const selected = pending.includes(choice.num)
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleToggle(choice.num, q.select_count)}
                    className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span className="font-bold mr-2">{choice.num}.</span>
                    <MathText text={formatChoiceText(choice.text)} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              前の問題
            </button>
            <button
              onClick={() =>
                currentIndex < valid.length - 1
                  ? navigateTo(currentIndex + 1)
                  : navigateTo('result')
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2.5 text-sm transition-colors"
            >
              {currentIndex < valid.length - 1 ? '次の問題' : '採点する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
