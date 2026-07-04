import { redirect } from 'next/navigation'
import { getIsAdmin } from '@/lib/admin'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const isAdmin = await getIsAdmin()
  if (!isAdmin) redirect('/')

  const sb = createSupabaseServer()
  const { data: submissions } = await sb
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        管理者ページ
      </h1>

      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          お問い合わせ一覧
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
            ({submissions?.length ?? 0}件)
          </span>
        </h2>

        {!submissions || submissions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>まだお問い合わせはありません。</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              >
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className="text-xs font-medium border rounded-full px-2 py-0.5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {s.category}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {s.name && <span className="mr-2">{s.name}</span>}
                  <span>{s.email}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {s.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
