import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | MediOut',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        プライバシーポリシー
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>制定日：2026年7月</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>1. 収集する情報</h2>
        <p className="mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          MediOut（以下「当サービス」）は、以下の情報を収集します。
        </p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>メールアドレス</li>
          <li>ニックネーム</li>
          <li>学校名</li>
          <li>回答履歴（選択した選択肢・正誤・日時）</li>
          <li>投稿した解説・画像</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2. 利用目的</h2>
        <ul className="list-disc list-inside space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>サービスの提供・運営</li>
          <li>機能改善およびコンテンツの充実</li>
          <li>学習状況の可視化・統計分析（個人を特定しない形）</li>
          <li>お問い合わせへの対応</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3. 第三者への提供</h2>
        <p className="mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          当サービスは、以下のサービスを利用しており、それらにデータを送信します。
        </p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li><strong>Supabase</strong>（データベース・ストレージ）：回答履歴・解説・プロフィール情報を保存します。</li>
          <li><strong>Google</strong>（OAuth認証）：Googleアカウントでのログインに利用します。</li>
        </ul>
        <p className="mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          上記以外の第三者に個人情報を提供することはありません（法令に基づく場合を除く）。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4. Cookieの使用</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          当サービスでは、認証・セッション管理のためにCookieを使用しています。
          Cookieにより、ログイン状態が維持されます。ブラウザの設定でCookieを無効にすることができますが、
          その場合はログインが必要な機能をご利用いただけません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5. 運営者情報</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          運営者：MediOut（個人事業主）
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6. お問い合わせ</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          本ポリシーに関するご質問は、下記メールアドレスまでお問い合わせください。
        </p>
        <a
          href="mailto:medical.output@gmail.com"
          className="mt-2 inline-block font-medium"
          style={{ color: 'var(--text-accent)' }}
        >
          medical.output@gmail.com
        </a>
      </section>

      <div
        className="mt-10 pt-6 border-t text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        以上
      </div>
    </div>
  )
}
