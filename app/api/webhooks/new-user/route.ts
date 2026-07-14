import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/mailer'

// Supabase Database Webhooks（Database > Webhooks）から
// auth.users への INSERT を検知して呼び出される想定。
// Webhook作成時にヘッダー `x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>` を設定すること。

interface AuthUserWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: { email?: string | null } | null
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET
  const received = request.headers.get('x-webhook-secret')
  if (!expected || !received) return false

  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(received)
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as AuthUserWebhookPayload | null
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  if (body.schema !== 'auth' || body.table !== 'users' || body.type !== 'INSERT') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const email = body.record?.email
  if (!email) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    await sendWelcomeEmail(email)
  } catch (err) {
    console.error('[new-user webhook] send email error:', err)
    return NextResponse.json({ error: 'send failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
