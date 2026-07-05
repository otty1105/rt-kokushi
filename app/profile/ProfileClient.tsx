'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Profile, UserStatus, School } from '@/types'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

const STATUS_LABELS: Record<UserStatus, string> = {
  student:       '在学中',
  kokushi_ronin: '国試浪人（既卒・国試受験予定）',
  graduate:      '既卒（就業中・非受験など）',
  other:         'その他',
}

const TARGET_YEARS = [2026, 2027, 2028, 2029, 2030]

export default function ProfileClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isSetup = searchParams.get('setup') === 'true'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [nickname, setNickname] = useState('')
  const [status, setStatus] = useState<UserStatus>('student')
  const [schoolId, setSchoolId] = useState<string>('')
  const [grade, setGrade] = useState<string>('')
  const [isExamYear, setIsExamYear] = useState<boolean>(false)
  const [targetYear, setTargetYear] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/schools', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([profileRes, schoolsRes]) => {
      if (profileRes.profile) {
        const p = profileRes.profile
        setProfile(p)
        setNickname(p.nickname ?? '')
        setStatus(p.status ?? 'student')
        setSchoolId(p.school_id?.toString() ?? '')
        setGrade(p.grade?.toString() ?? '')
        setIsExamYear(p.is_exam_year ?? false)
        setTargetYear(p.target_year?.toString() ?? '')
      }
      if (schoolsRes.schools) {
        const sorted = [...schoolsRes.schools].sort((a: School, b: School) =>
          (a.reading ?? '').localeCompare(b.reading ?? '', 'ja')
        )
        setSchools(sorted)
      }
    }).finally(() => setLoading(false))
  }, [])

  const isStudent = status === 'student'
  const isRonin = status === 'kokushi_ronin'
  const showTargetYear = (isStudent && !isExamYear) || isRonin

  function handleStatusChange(val: UserStatus) {
    setStatus(val)
    setGrade('')
    setIsExamYear(false)
    setTargetYear('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          status,
          school_id: schoolId && schoolId !== 'other' ? Number(schoolId) : null,
          grade: isStudent && grade ? Number(grade) : null,
          is_exam_year: isStudent ? isExamYear : null,
          target_year: showTargetYear && targetYear ? Number(targetYear) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'エラーが発生しました')
      setProfile(json.profile)
      setSaved(true)
      if (isSetup) {
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('本当に削除しますか？この操作は取り消せません')) return
    setError('')
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'アカウントの削除に失敗しました')
      }
      await getSupabaseBrowser().auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウントの削除に失敗しました')
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">読み込み中...</div>
  }

  function getRow(reading: string): string {
    const ch = reading[0] ?? ''
    if ('あいうえお'.includes(ch)) return 'あ行'
    if ('かきくけこがぎぐげご'.includes(ch)) return 'か行'
    if ('さしすせそざじずぜぞ'.includes(ch)) return 'さ行'
    if ('たちつてとだぢづでど'.includes(ch)) return 'た行'
    if ('なにぬねの'.includes(ch)) return 'な行'
    if ('はひふへほばびぶべぼぱぴぷぺぽ'.includes(ch)) return 'は行'
    if ('まみむめも'.includes(ch)) return 'ま行'
    if ('やゆよ'.includes(ch)) return 'や行'
    if ('らりるれろ'.includes(ch)) return 'ら行'
    return 'わ行'
  }

  const ROW_ORDER = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行']
  const schoolGroups = ROW_ORDER
    .map((row) => ({ row, items: schools.filter((s) => getRow(s.reading) === row) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        {isSetup ? 'ようこそ！プロフィールを設定しましょう' : 'プロフィール設定'}
      </h1>
      {isSetup && (
        <p className="text-sm text-gray-500 mb-6">
          ニックネームだけでも大丈夫です。あとから変更できます。
        </p>
      )}

      {!isSetup && !profile && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-6">
          プロフィールをまだ設定していません。ニックネームだけでも登録しておきましょう。
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

        {/* 1. ニックネーム */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム <span className="text-red-500 text-xs">必須</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={30}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 2. ステータス */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ステータス <span className="text-red-500 text-xs">必須</span>
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {(Object.entries(STATUS_LABELS) as [UserStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* 3. 学校名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学校名 <span className="text-xs text-gray-500">任意</span>
          </label>
          <select
            value={schoolId}
            onChange={(e) => { setSchoolId(e.target.value); setGrade('') }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">選択しない</option>
            {schoolGroups.map(({ row, items }) => (
              <optgroup key={row} label={row}>
                {items.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
            <option value="other">その他（リストにない学校）</option>
          </select>
        </div>

        {/* 4. 学年（在学中のみ） */}
        {isStudent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              学年 <span className="text-xs text-gray-500">任意</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">選択しない</option>
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>{g}年生</option>
              ))}
            </select>
          </div>
        )}

        {/* 5. 受験年度（在学中のみ） */}
        {isStudent && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isExamYear}
                onChange={(e) => setIsExamYear(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">今年が受験年度</span>
            </label>
          </div>
        )}

        {/* 6. 受験予定年度 */}
        {showTargetYear && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受験予定年度 <span className="text-xs text-gray-500">任意</span>
            </label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">選択しない</option>
              {TARGET_YEARS.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            プロフィールを保存しました
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg py-2.5 transition-colors"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>

      {!isSetup && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="text-xs text-gray-400 hover:text-red-600 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? '削除中...' : 'アカウントを削除する'}
          </button>
        </div>
      )}
    </div>
  )
}
