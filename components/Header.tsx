'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface Props {
  initialUser: User | null
}

export default function Header({ initialUser }: Props) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Sync auth state changes (sign in/out in other tabs, etc.)
  useEffect(() => {
    const sb = getSupabaseBrowser()
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleSignOut() {
    const sb = getSupabaseBrowser()
    await sb.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const avatarLetter = (user?.email?.[0] ?? user?.user_metadata?.name?.[0] ?? '?').toUpperCase()

  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 whitespace-nowrap flex-shrink-0 min-w-0">
          <Image
            src="/logo-header.png"
            alt="MediOut"
            width={909}
            height={202}
            priority
            className="h-6 sm:h-7 w-auto flex-shrink-0"
          />
          <span className="hidden sm:inline text-xs font-normal opacity-80 leading-tight">診療放射線技師国家試験対策</span>
        </a>

        <nav className="hidden md:flex gap-4 ml-auto text-sm items-center">
          <a href="/" className="hover:underline whitespace-nowrap">ホーム</a>
          <a href="/study" className="hover:underline whitespace-nowrap">学習</a>
          <a href="/test" className="hover:underline whitespace-nowrap">テスト</a>
          <a href="/dashboard" className="hover:underline whitespace-nowrap">ダッシュボード</a>
          <a href="/about" className="hover:underline whitespace-nowrap">MediOutについて</a>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-8 h-8 rounded-full overflow-hidden bg-white text-blue-700 font-bold text-sm flex items-center justify-center hover:opacity-90 flex-shrink-0"
                aria-label="ユーザーメニュー"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  avatarLetter
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 text-gray-800">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">ログイン中</p>
                    <p className="text-sm font-medium truncate">
                      {user.email ?? user.user_metadata?.name ?? 'ユーザー'}
                    </p>
                  </div>
                  <a
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    プロフィール設定
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="bg-white text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              ログイン
            </a>
          )}
        </nav>

        <button
          onClick={() => setMobileNavOpen((o) => !o)}
          className="md:hidden ml-auto p-1.5 -mr-1.5"
          aria-label="メニュー"
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </button>
      </div>

      {mobileNavOpen && (
        <nav className="md:hidden border-t border-blue-600 px-4 py-3 flex flex-col gap-1 text-sm">
          <a
            href="/"
            onClick={() => setMobileNavOpen(false)}
            className="py-2 hover:underline"
          >
            ホーム
          </a>
          <a
            href="/study"
            onClick={() => setMobileNavOpen(false)}
            className="py-2 hover:underline"
          >
            学習
          </a>
          <a
            href="/test"
            onClick={() => setMobileNavOpen(false)}
            className="py-2 hover:underline"
          >
            テスト
          </a>
          <a
            href="/dashboard"
            onClick={() => setMobileNavOpen(false)}
            className="py-2 hover:underline"
          >
            ダッシュボード
          </a>
          <a
            href="/about"
            onClick={() => setMobileNavOpen(false)}
            className="py-2 hover:underline"
          >
            MediOutについて
          </a>

          {user ? (
            <div className="pt-2 mt-1 border-t border-blue-600 flex flex-col gap-1">
              <p className="py-1 text-xs opacity-80 truncate">
                {user.email ?? user.user_metadata?.name ?? 'ユーザー'}
              </p>
              <a
                href="/profile"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 hover:underline"
              >
                プロフィール設定
              </a>
              <button
                onClick={() => {
                  setMobileNavOpen(false)
                  handleSignOut()
                }}
                className="py-2 text-left text-red-200 hover:underline"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <a
              href="/login"
              onClick={() => setMobileNavOpen(false)}
              className="mt-2 bg-white text-blue-700 px-3 py-2 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors"
            >
              ログイン
            </a>
          )}
        </nav>
      )}
    </header>
  )
}
