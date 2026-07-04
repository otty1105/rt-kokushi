import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 | MediOut',
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        利用規約
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>制定日：2026年7月</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>1. サービスについて</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          MediOut（以下「当サービス」）は、診療放射線技師国家試験の学習をサポートする過去問演習Webアプリです。
          一部の機能（回答履歴の保存・解説の投稿等）はログインが必要です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2. 禁止事項</h2>
        <p className="mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          ユーザーは以下の行為を行ってはなりません。
        </p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>著作権者の許可なく他者の著作物を転載・複製する行為</li>
          <li>他のユーザーや第三者への誹謗中傷・差別的言動</li>
          <li>当サービスのコンテンツを営利目的で無断利用する行為</li>
          <li>不正アクセス・サーバーへの過負荷をかける行為</li>
          <li>虚偽の情報を登録・投稿する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3. 解説投稿のルール</h2>
        <p className="mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          解説を投稿するユーザーは、以下に同意した上でご利用ください。
        </p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>投稿する解説はオリジナルの内容であること</li>
          <li>他者の著作物（参考書・Web記事等）のコピーを含まないこと</li>
          <li>投稿した解説は他のユーザーに公開されることに同意すること</li>
          <li>投稿内容に対して運営者が編集・削除する権利を持つこと</li>
        </ul>
        <p className="mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          解説投稿時には上記内容への同意チェックが必要です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4. 免責事項</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          当サービスは学習補助を目的としており、国家試験の合格を保証するものではありません。
          掲載している問題・解説の正確性について最善を尽くしていますが、
          内容の誤りにより生じた損害について、運営者は一切の責任を負いません。
          試験本番は必ず公式の問題集・参考書を併用してください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5. サービスの変更・終了</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          運営者は、ユーザーへの事前通知なく、当サービスの内容を変更・停止・終了する権利を有します。
          サービスの変更・終了により生じた損害について、運営者は責任を負いません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6. 準拠法・管轄裁判所</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          本規約は日本法に準拠します。当サービスに関する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>7. お問い合わせ</h2>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          本規約に関するご質問は、お問い合わせフォームよりご連絡ください。
        </p>
        <a
          href="/contact"
          className="mt-3 inline-block font-medium hover:underline"
          style={{ color: 'var(--text-accent)' }}
        >
          お問い合わせフォームへ →
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
