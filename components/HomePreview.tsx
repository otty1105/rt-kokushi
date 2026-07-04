import Link from 'next/link'

type Feature = {
  eyebrow: string
  title: string
  description: string
  points: string[]
  imageMobile: string
  imageDesktop: string
  href: string
  cta: string
  color: 'blue' | 'emerald' | 'amber'
  reverse?: boolean
  requiresAccount?: boolean
}

const FEATURES: Feature[] = [
  {
    eyebrow: 'STUDY MODE',
    title: '自己学習モード',
    description: '科目や年度で絞り込んで1問ずつコツコツ演習。解答直後に正解と、みんなの回答分布が確認できます。',
    points: ['科目・午前午後・年度で絞り込み', '解答直後に正解と正答率を表示', 'みんなの回答分布・解説も閲覧可能'],
    imageMobile: '/screenshots/study-mode.png',
    imageDesktop: '/screenshots/study-mode-desktop.png',
    href: '/study',
    cta: '自己学習モードを見る',
    color: 'emerald',
  },
  {
    eyebrow: 'TEST MODE',
    title: 'テストモード',
    description: '年度・午前午後を選んで、本番同様の形式で一気に解答。制限時間つきで実力を測れます。',
    points: ['年度別・午前午後別に選択', '制限時間つきで本番形式', '解答後に問題マップで一覧採点'],
    imageMobile: '/screenshots/test-mode.png',
    imageDesktop: '/screenshots/test-mode-desktop.png',
    href: '/test',
    cta: 'テストモードを見る',
    color: 'blue',
    reverse: true,
  },
  {
    eyebrow: 'DASHBOARD',
    title: 'ダッシュボード',
    description: '演習の記録が自動で蓄積。正答率や連続学習日数、科目別の得意・不得意がひと目でわかります。アカウント登録をすると利用できます。',
    points: ['直近30日の正答率・連続学習日数', '科目別の正答率をグラフで確認', 'ブックマークや科目バッジで学習管理'],
    imageMobile: '/screenshots/dashboard.png',
    imageDesktop: '/screenshots/dashboard-desktop.png',
    href: '/dashboard',
    cta: 'ダッシュボードを見る',
    color: 'amber',
    requiresAccount: true,
  },
]

const COLOR_STYLES: Record<Feature['color'], { badge: string; cta: string; ring: string }> = {
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    cta: 'text-blue-700 hover:text-blue-900',
    ring: 'from-blue-100 to-blue-50',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700',
    cta: 'text-emerald-700 hover:text-emerald-900',
    ring: 'from-emerald-100 to-emerald-50',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    cta: 'text-amber-700 hover:text-amber-900',
    ring: 'from-amber-100 to-amber-50',
  },
}

function FeatureRow({ feature }: { feature: Feature }) {
  const styles = COLOR_STYLES[feature.color]
  return (
    <div
      className={`flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-10`}
    >
      <div className="w-full md:flex-1 flex justify-center">
        {/* モバイル: スマホフレーム */}
        <div className={`md:hidden relative w-full max-w-[220px] shrink-0 rounded-[2rem] bg-gradient-to-b ${styles.ring} p-3 shadow-sm`}>
          <div className="rounded-[1.5rem] border-4 border-white overflow-hidden shadow-lg bg-white">
            <img src={feature.imageMobile} alt={feature.title} className="w-full h-auto block" />
          </div>
        </div>

        {/* PC: ブラウザフレーム */}
        <div className="hidden md:block w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
          <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          </div>
          <img src={feature.imageDesktop} alt={feature.title} className="w-full h-auto block" />
        </div>
      </div>

      <div className="flex-1 text-center md:text-left">
        <span className={`inline-block text-[11px] font-bold tracking-wide rounded-full px-2.5 py-1 ${styles.badge}`}>
          {feature.eyebrow}
        </span>
        {feature.requiresAccount && (
          <span className="inline-block text-[11px] font-bold tracking-wide rounded-full px-2.5 py-1 ml-2 bg-gray-100 text-gray-500">
            要アカウント登録
          </span>
        )}
        <h2 className="text-xl font-bold text-gray-800 mt-3">{feature.title}</h2>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{feature.description}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-gray-600 inline-block text-left">
          {feature.points.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className={`mt-1 shrink-0 ${styles.cta}`}>✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link href={feature.href} className={`text-sm font-semibold ${styles.cta} transition-colors`}>
            {feature.cta} →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HomePreview() {
  return (
    <div className="w-full max-w-4xl flex flex-col gap-16 py-4">
      {FEATURES.map((feature) => (
        <FeatureRow key={feature.title} feature={feature} />
      ))}
    </div>
  )
}
