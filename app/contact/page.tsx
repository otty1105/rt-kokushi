import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'お問い合わせ | MediOut',
}

const faqs = [
  {
    q: '無料で使えますか？',
    a: 'ベータ版公開中は全機能を無料でご利用いただけます。今後、一部機能を有料化する可能性がありますが、その際は事前にお知らせします。',
  },
  {
    q: 'ログインは必須ですか？',
    a: '問題の閲覧はログインなしでも可能ですが、回答履歴の保存・解説の投稿・ダッシュボードの利用にはログインが必要です。',
  },
  {
    q: '解説投稿のルールはありますか？',
    a: 'オリジナルの内容であること・著作権侵害がないことが条件です。投稿前に表示される同意事項をご確認ください。詳しくは利用規約をご参照ください。',
  },
  {
    q: '不具合・改善要望はどこに送ればいいですか？',
    a: '下記のお問い合わせフォームからお送りください。内容を確認のうえ対応いたします。',
  },
]

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        お問い合わせ
      </h1>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        MediOut 運営（個人事業主）
      </p>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          よくある質問
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-xl p-5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Q. {faq.q}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* フォーム */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          お問い合わせフォーム
        </h2>
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <ContactForm />
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          メールでのお問い合わせ：
          <a
            href="mailto:medical.output@gmail.com"
            className="hover:underline ml-1"
            style={{ color: 'var(--text-accent)' }}
          >
            medical.output@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
