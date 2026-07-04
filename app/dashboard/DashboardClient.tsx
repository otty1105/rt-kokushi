'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { formatCategory } from '@/lib/categoryName'
import {
  IconFlame, IconBook,
  IconFlagFilled, IconAward,
  IconMessage2, IconX, IconChartBar, IconAtom,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnswerRow {
  question_id: string
  is_correct: boolean
  source: string
  answered_at: string
  questions: { id: string; year: number; exam_num: number; question_order: number; category: string } | null
}

interface FlaggedRow {
  question_id: string
  flagged_at: string
  questions: { id: string; year: number; exam_num: number; question_order: number } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStreak(answers: AnswerRow[]): number {
  if (answers.length === 0) return 0
  const dateSet = new Set(
    answers.map((a) => {
      const d = new Date(a.answered_at)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
  )
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dateSet.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)) streak++
    else break
  }
  return streak
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }: {
  label: string; value: string | number | null; sub?: string; icon: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface-1)', borderRadius: 10,
      border: '1px solid var(--border)', padding: '0.75rem 1rem',
    }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
      </div>
      <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {value ?? '—'}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ─── Subject Bar ──────────────────────────────────────────────────────────────

function SubjectBar({ category, correct, total, pct }: {
  category: string; correct: number; total: number; pct: number
}) {
  const color = pct >= 70 ? '#2563eb' : pct >= 50 ? '#6366f1' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between items-baseline mb-0.5">
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
          {formatCategory(category, 2025)}
        </span>
        <span style={{ fontSize: 12, color, fontWeight: 600 }}>
          {pct}%
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 3 }}>
            ({correct}/{total})
          </span>
        </span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardClient() {
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [flagged, setFlagged] = useState<FlaggedRow[]>([])
  const [expStats, setExpStats] = useState({ count: 0, likes: 0 })
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabaseBrowser()
    Promise.all([
      sb.from('user_answers')
        .select('question_id, is_correct, source, answered_at, questions:question_id(id, year, exam_num, question_order, category)')
        .order('answered_at', { ascending: true })
        .limit(10000),
      sb.from('flagged_questions')
        .select('question_id, flagged_at, questions:question_id(id, year, exam_num, question_order)')
        .order('flagged_at', { ascending: false })
        .limit(5),
      sb.from('explanations').select('id, explanation_likes(count)', { count: 'exact' }),
      sb.from('questions').select('category').limit(10000),
    ]).then(([ar, fr, er, cr]) => {
      setAnswers((ar.data ?? []) as unknown as AnswerRow[])
      setFlagged((fr.data ?? []) as unknown as FlaggedRow[])
      if (er.data) {
        const count = er.data.length
        const likes = er.data.reduce((s: number, e: { explanation_likes?: { count: number }[] }) => s + (e.explanation_likes?.[0]?.count ?? 0), 0)
        setExpStats({ count, likes })
      }
      const cats = Array.from(new Set((cr.data ?? []).map((r: { category: string }) => r.category).filter(Boolean))).sort() as string[]
      setAllCategories(cats)
      setLoading(false)
    })
  }, [])

  // ── Computations ─────────────────────────────────────────────────────────────

  const streak = useMemo(() => calcStreak(answers), [answers])

  const recentAccuracy = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000
    const recent = answers.filter((a) => new Date(a.answered_at).getTime() >= cutoff)
    if (recent.length === 0) return null
    return Math.round((recent.filter((a) => a.is_correct).length / recent.length) * 100)
  }, [answers])

  const uniqueStudyCount = useMemo(
    () => new Set(answers.filter((a) => a.source === 'study').map((a) => a.question_id)).size,
    [answers]
  )

  const catStats = useMemo(() => {
    const map = new Map<string, { correct: number; total: number; years: Set<number> }>()
    for (const a of answers) {
      if (!a.questions?.category) continue
      const cat = a.questions.category
      const cur = map.get(cat) ?? { correct: 0, total: 0, years: new Set() }
      cur.correct += a.is_correct ? 1 : 0
      cur.total += 1
      if (a.questions.year) cur.years.add(a.questions.year)
      map.set(cat, cur)
    }
    return Array.from(map.entries())
      .map(([category, { correct, total, years }]) => ({
        category, correct, total,
        yearCount: years.size,
        pct: Math.round((correct / total) * 100),
      }))
      .sort((a, b) => a.pct - b.pct)
  }, [answers])

  // 科目バッジ（全科目表示、正答率80%以上かつ5年分以上で獲得）
  const subjectBadges = useMemo(() =>
    allCategories.map((category) => {
      const stats = catStats.find((c) => c.category === category)
      return {
        category,
        pct: stats?.pct ?? 0,
        total: stats?.total ?? 0,
        yearCount: stats?.yearCount ?? 0,
        earned: (stats?.yearCount ?? 0) >= 5 && (stats?.pct ?? 0) >= 80,
      }
    }),
    [allCategories, catStats]
  )

  // 特殊バッジ
  const specialBadges = useMemo(() => [
    {
      id: 'streak30',
      icon: <IconFlame size={15} />,
      name: '継続の達人',
      earned: streak >= 30,
      progress: `${streak}日連続 / 30日`,
    },
    {
      id: 'output',
      icon: <IconMessage2 size={15} />,
      name: 'アウトプットの達人',
      earned: expStats.count >= 10 && expStats.likes >= 50,
      progress: `解説${expStats.count}件 · いいね${expStats.likes}件`,
    },
  ], [streak, expStats])

  const earnedCount = subjectBadges.filter((b) => b.earned).length + specialBadges.filter((b) => b.earned).length
  const totalBadges = subjectBadges.length + specialBadges.length

  async function unflag(questionId: string) {
    const sb = getSupabaseBrowser()
    await sb.from('flagged_questions').delete().eq('question_id', questionId)
    setFlagged((prev) => prev.filter((f) => f.question_id !== questionId))
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        読み込み中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
        ダッシュボード
      </h2>

      {/* ── 統計カード ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="直近30日の正答率" value={recentAccuracy !== null ? `${recentAccuracy}%` : '—'} icon={<IconChartBar size={16} />} />
        <StatCard label="演習問題数（重複除く）" value={uniqueStudyCount.toLocaleString()} icon={<IconBook size={16} />} />
        <StatCard label="連続学習日数" value={streak > 0 ? `${streak}日` : '0日'} icon={<IconFlame size={16} />} />
      </div>

      {/* ── 2カラム：科目別 ＋ フラグ/バッジ ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

        {/* 左：科目別正答率 */}
        {catStats.length > 0 && (
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '1rem',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              科目別正答率
            </h3>
            <div className="space-y-2.5">
              {catStats.map(({ category, correct, total, pct }) => (
                <SubjectBar key={category} category={category} correct={correct} total={total} pct={pct} />
              ))}
            </div>
          </div>
        )}

        {/* 右：フラグした問題 ＋ バッジ */}
        <div className="flex flex-col gap-4">

          {/* フラグした問題 */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '1rem',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <IconFlagFilled size={14} color="#6366f1" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>ブックマーク</h3>
            </div>
            {flagged.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
                演習モードでブックマークした問題が表示されます
              </p>
            ) : (
              <div className="space-y-1.5">
                {flagged.map((f) => {
                  const q = f.questions
                  if (!q) return null
                  const isPm = q.question_order > 100
                  const displayNum = isPm ? q.question_order - 100 : q.question_order
                  return (
                    <div key={f.question_id} className="flex items-center justify-between gap-2" style={{
                      padding: '0.4rem 0.6rem', borderRadius: 7,
                      border: '1px solid var(--border)', background: 'var(--surface-2)',
                    }}>
                      <Link href={`/study?focusId=${q.id}`} style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>
                        第{q.exam_num}回 {isPm ? '午後' : '午前'} 問{displayNum}
                      </Link>
                      <button onClick={() => unflag(f.question_id)} title="フラグ解除" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, borderRadius: 4,
                        border: '1px solid var(--border)', background: 'transparent',
                        cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
                      }}>
                        <IconX size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* バッジ */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '1rem',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <IconAward size={14} style={{ color: 'var(--text-accent)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>バッジ</h3>
              {totalBadges > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: 'var(--text-accent)', background: 'var(--bg-accent)',
                  borderRadius: 99, padding: '1px 7px', marginLeft: 'auto',
                }}>
                  {earnedCount} / {totalBadges}
                </span>
              )}
            </div>

            {/* 科目の達人：チップグリッド */}
            {allCategories.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <IconAtom size={11} style={{ display: 'inline', marginRight: 3 }} />科目の達人（正答率80%以上・5年分以上）
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.875rem' }}>
                  {subjectBadges.map(({ category, pct, yearCount, earned }) => (
                    <span
                      key={category}
                      title={earned ? `正答率 ${pct}%・${yearCount}年分（獲得済み）` : yearCount > 0 ? `正答率 ${pct}%・${yearCount}年分` : '未着手'}
                      style={{
                        fontSize: 12, fontWeight: earned ? 700 : 400, borderRadius: 99,
                        padding: '3px 10px',
                        background: earned ? '#dbeafe' : 'var(--surface-2)',
                        border: `1.5px solid ${earned ? '#93c5fd' : 'var(--border)'}`,
                        color: earned ? '#1d4ed8' : 'var(--text-secondary)',
                      }}
                    >
                      {earned ? '✓ ' : ''}{formatCategory(category, 2025)}の達人
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* 特殊バッジ */}
            <div className="space-y-2">
              {specialBadges.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5">
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: b.earned ? '#dbeafe' : 'var(--surface-2)',
                    border: `1.5px solid ${b.earned ? '#93c5fd' : 'var(--border)'}`,
                    color: b.earned ? '#1d4ed8' : 'var(--text-secondary)',
                    opacity: b.earned ? 1 : 0.45,
                  }}>
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 700, color: b.earned ? '#1d4ed8' : 'var(--text-secondary)' }}>
                      {b.name}
                    </p>
                    <p style={{ fontSize: 11, color: b.earned ? '#3b82f6' : 'var(--text-secondary)', marginTop: 1 }}>
                      {b.earned ? '✓ 獲得済み' : b.progress}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
