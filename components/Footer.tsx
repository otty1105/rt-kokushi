export default function Footer() {
  return (
    <footer
      className="mt-16 border-t"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
    >
      <div
        className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          MediOut
        </span>
        <nav className="flex gap-5">
          <a href="/about" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
            MediOutについて
          </a>
          <a href="/privacy" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
            プライバシーポリシー
          </a>
          <a href="/terms" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
            利用規約
          </a>
          <a href="/contact" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
            お問い合わせ
          </a>
        </nav>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          © 2026 MediOut
        </span>
      </div>
    </footer>
  )
}
