import { supabase } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { QuestionForTest } from '@/types'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import TestSolveClient from './TestSolveClient'

interface Props {
  params: { year: string; examNum: string; period: string }
}

// テストモードでは正答（correct_choices）を取得しない。
// ブラウザのNetworkタブから正答が見えてしまうカンニング対策のため、
// 採点は解答送信後に /api/test/submit でサーバーサイドのみで行う。
async function getQuestions(year: number, examNum: number, period: string) {
  const isAm = period === 'am'
  const orderMin = isAm ? 1 : 101
  const orderMax = isAm ? 100 : 200

  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, year, exam_num, question_order, category, question, select_count, is_invalid, image_url,
      choices (id, question_id, num, text)
    `)
    .eq('year', year)
    .eq('exam_num', examNum)
    .gte('question_order', orderMin)
    .lte('question_order', orderMax)
    .order('question_order', { ascending: true })

  if (error) return null
  return data
}

export default async function TestPeriodPage({ params }: Props) {
  const year = parseInt(params.year)
  const examNum = parseInt(params.examNum)
  const period = params.period

  if (!['am', 'pm'].includes(period) || isNaN(year) || isNaN(examNum)) {
    notFound()
  }

  // テストモードは採点結果をアカウントに記録するため、未ログインでは受験できない
  const supabaseServer = createSupabaseServer()
  const {
    data: { user },
  } = await supabaseServer.auth.getUser()
  if (!user) {
    const returnTo = `/test/${params.year}/${params.examNum}/${params.period}`
    const message = encodeURIComponent('テストモードを利用するにはログインしてください')
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}&message=${message}`)
  }

  const questions = await getQuestions(year, examNum, period)

  if (!questions || questions.length === 0) {
    notFound()
  }

  const periodLabel = period === 'am' ? '午前' : '午後'

  return (
    <div>
      <div className="mb-6">
        <Link href="/test" className="text-blue-600 hover:underline text-sm">
          ← テストモードに戻る
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 mt-2">
          第{examNum}回 ({year}年) {periodLabel}
        </h2>
        <p className="text-gray-500 text-sm mt-1">全{questions.length}問</p>
      </div>

      <TestSolveClient questions={questions as QuestionForTest[]} />
    </div>
  )
}
