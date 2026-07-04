import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'ログイン | 診療放射線技師 国家試験 過去問',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 py-16">読み込み中...</div>}>
      <LoginClient />
    </Suspense>
  )
}
