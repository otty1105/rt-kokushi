import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { createSupabaseServer } from '@/lib/supabase-server'
import Header from '@/components/Header'
import BetaBanner from '@/components/BetaBanner'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'MediOut 診療放射線技師国家試験対策',
  description: '診療放射線技師国家試験の過去問演習Webアプリ',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 min-h-screen">
        <BetaBanner />
        <Header initialUser={user} />
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        <Footer />
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
  },
  svg: { fontCache: 'global', mtextInheritFont: true },
};
`,
          }}
        />
        <Script
          id="mathjax"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
