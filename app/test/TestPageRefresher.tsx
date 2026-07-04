'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestPageRefresher() {
  const router = useRouter()
  useEffect(() => {
    router.refresh()
  }, [])
  return null
}
