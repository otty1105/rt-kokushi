export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import TestPageRefresher from './TestPageRefresher'

async function getAvailableYears() {
  const { data, error } = await supabase
    .from('questions')
    .select('year, exam_num')
    .order('year', { ascending: false })
    .order('exam_num', { ascending: true })
    .limit(20000)
  if (error || !data) return []

  const seen = new Set<string>()
  const results: { year: number; exam_num: number }[] = []
  for (const row of data) {
    const key = `${row.year}-${row.exam_num}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push({ year: row.year, exam_num: row.exam_num })
    }
  }
  return results.sort((a, b) => b.year - a.year || b.exam_num - a.exam_num)
}

const LOGIN_MESSAGE = 'テストモードを利用するにはログインしてください'

export default async function TestPage() {
  const supabaseServer = createSupabaseServer()
  const { data: { user } } = await supabaseServer.auth.getUser()
  const loggedIn = !!user

  const years = await getAvailableYears()
  const loginHref = `/login?returnTo=%2Ftest&message=${encodeURIComponent(LOGIN_MESSAGE)}`

  return (
    <div>
      <TestPageRefresher />
      <h2 className="text-2xl font-bold text-gray-800 mb-1">テストモード</h2>
      <p className="text-gray-600 mb-6 text-sm">年度・午前午後を選択してください</p>

      {!loggedIn && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-6 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>🔒 {LOGIN_MESSAGE}</span>
          <Link
            href={loginHref}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors"
          >
            ログイン / 新規登録
          </Link>
        </div>
      )}

      {years.length === 0 ? (
        <div className="text-center text-gray-500 py-16">データがありません</div>
      ) : (
        <div className="grid gap-4">
          {years.map(({ year, exam_num }) => (
            <div key={`${year}-${exam_num}`} className={`bg-white rounded-xl shadow p-5 ${!loggedIn ? 'opacity-70' : ''}`}>
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                {!loggedIn && <span aria-hidden>🔒</span>}
                第{exam_num}回 ({year}年)
              </h3>
              {loggedIn ? (
                <div className="flex gap-3">
                  <Link
                    href={`/test/${year}/${exam_num}/am`}
                    className="flex-1 text-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg py-2 transition-colors"
                  >
                    午前（問1〜100）
                  </Link>
                  <Link
                    href={`/test/${year}/${exam_num}/pm`}
                    className="flex-1 text-center bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold rounded-lg py-2 transition-colors"
                  >
                    午後（問1〜100）
                  </Link>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold rounded-lg py-2 transition-colors text-sm"
                >
                  ログインすると挑戦できます
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
