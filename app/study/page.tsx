export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { QuestionWithChoices } from '@/types'
import { getIsAdmin } from '@/lib/admin'
import StudyClient from './StudyClient'

const SELECT_FIELDS = `
  id, year, exam_num, question_order, category, question, select_count, is_invalid, image_url,
  choices (id, question_id, num, text),
  correct_choices (id, question_id, num)
`

async function fetchAllQuestions() {
  const PAGE = 1000
  const all: QuestionWithChoices[] = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('questions')
      .select(SELECT_FIELDS)
      .order('year', { ascending: false })
      .order('exam_num', { ascending: true })
      .order('question_order', { ascending: true })
      .range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    all.push(...(data as QuestionWithChoices[]))
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function getData() {
  const [questions, yearsResult] = await Promise.all([
    fetchAllQuestions(),
    supabase
      .from('questions')
      .select('year')
      .order('year', { ascending: false })
      .limit(20000),
  ])

  const allYears = Array.from(new Set((yearsResult.data || []).map((r) => r.year))).sort(
    (a, b) => b - a
  )

  const categorySet = new Set<string>()
  for (const q of questions) {
    if (q.category) categorySet.add(q.category)
  }

  return {
    questions,
    categories: Array.from(categorySet).sort(),
    allYears,
  }
}

export default async function StudyPage() {
  const [{ questions, categories, allYears }, isAdmin] = await Promise.all([
    getData(),
    getIsAdmin(),
  ])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">自己学習モード</h2>
      <p className="text-gray-600 mb-6 text-sm">絞り込みながら問題を解いて、すぐに正解を確認できます</p>

      <Suspense fallback={<div className="text-gray-500 text-sm">読み込み中...</div>}>
        <StudyClient
          questions={questions as QuestionWithChoices[]}
          categories={categories}
          allYears={allYears}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  )
}
