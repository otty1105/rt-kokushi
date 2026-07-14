import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MediOutについて | MediOut',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        MediOutについて
      </h1>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        運営者：MediOut
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          サイト概要
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          MediOutは、コメディカルのためのアウトプット特化型国試過去問演習サイトです。
          現在は診療放射線技師版（ベータ版）を公開中です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          過去問の出典
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          掲載している過去問題は、厚生労働省が公開する診療放射線技師国家試験の過去問題を使用しています。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          お問い合わせ
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          サービスに関するご質問・ご要望は、お問い合わせフォームよりご連絡ください。
        </p>
        <a
          href="/contact"
          className="mt-3 inline-block font-medium hover:underline"
          style={{ color: 'var(--text-accent)' }}
        >
          お問い合わせフォームへ →
        </a>
      </section>
    </div>
  )
}
