export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
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

export default async function TestPage() {
  const years = await getAvailableYears()

  return (
    <div>
      <TestPageRefresher />
      <h2 className="text-2xl font-bold text-gray-800 mb-1">テストモード</h2>
      <p className="text-gray-600 mb-6 text-sm">年度・午前午後を選択してください</p>

      {years.length === 0 ? (
        <div className="text-center text-gray-500 py-16">データがありません</div>
      ) : (
        <div className="grid gap-4">
          {years.map(({ year, exam_num }) => (
            <div key={`${year}-${exam_num}`} className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold text-gray-700 mb-3">
                第{exam_num}回 ({year}年)
              </h3>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
