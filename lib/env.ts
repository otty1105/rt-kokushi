// process.env.NEXT_PUBLIC_* は静的なドット記法でアクセスした場合のみ
// Next.jsがビルド時にクライアントバンドルへ値を埋め込む。
// process.env[name] のような動的アクセスは埋め込み対象にならず、
// ブラウザ側では常に undefined になるため、必ず直接参照すること。

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!rawUrl) {
  throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_URL が設定されていません')
}
if (!rawAnonKey) {
  throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません')
}

export const SUPABASE_URL = rawUrl
export const SUPABASE_ANON_KEY = rawAnonKey
