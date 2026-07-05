-- ============================================================
-- アカウント削除用 RPC 関数
-- Supabase の SQL Editor で実行してください（service_role キーは不要）。
-- ============================================================
--
-- auth.users の削除には昇格権限が必要なため、SECURITY DEFINER で
-- 関数所有者（SQL Editorで実行する場合は postgres ロール）の権限で実行する。
-- 関数内部では auth.uid() で呼び出し元ユーザーのIDのみを対象にするため、
-- クライアント側（Next.js）は service_role キーを一切使わずに
-- 「自分のアカウントだけ」削除できる。
--
-- 実際に稼働中のDBで pg_constraint を確認した結果（2026-07時点）：
--   public.profiles.profiles_id_fkey            -> auth.users(id)        : NO ACTION（CASCADEではない）
--   public.explanation_images_explanation_id_fkey -> explanations(id)     : CASCADE
--   public.explanation_likes_explanation_id_fkey  -> explanations(id)    : NO ACTION（CASCADEではない）
--   explanations.user_id -> auth.users(id) の制約は存在しない
--   user_answers / explanation_likes の user_id -> auth.users(id) の制約も存在しない
--
-- 上記のとおりリポジトリ内の他のマイグレーションスクリプトの記述（ON DELETE CASCADE）と
-- 実際のスキーマは一致していない。特に explanation_likes.explanation_id が NO ACTION のため、
-- 「自分の解説に他人がつけたいいね」を先に消さないと DELETE FROM explanations が失敗する。
-- 下の関数はこれを踏まえて明示的に削除している。
--
-- ⚠️ 今後スキーマを変更した場合は、以下のクエリで auth.users / explanations を
-- 参照している制約を再確認し、CASCADEでない参照が残っていないか確認すること。
--
--   SELECT conrelid::regclass, conname,
--     CASE confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
--       WHEN 'd' THEN 'SET DEFAULT' WHEN 'r' THEN 'RESTRICT' ELSE 'NO ACTION' END
--   FROM pg_constraint
--   WHERE confrelid IN ('auth.users'::regclass, 'public.explanations'::regclass)
--     AND contype = 'f';
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- 自分がつけたいいね
  DELETE FROM public.explanation_likes WHERE user_id = uid;

  -- 自分の解説に他人がつけたいいね
  -- （explanation_likes.explanation_id は NO ACTION のため、explanations削除前に消す必要がある）
  DELETE FROM public.explanation_likes
  WHERE explanation_id IN (SELECT id FROM public.explanations WHERE user_id = uid);

  -- 回答履歴
  DELETE FROM public.user_answers WHERE user_id = uid;

  -- 解説投稿（explanation_images は ON DELETE CASCADE で連動削除される）
  DELETE FROM public.explanations WHERE user_id = uid;

  -- プロフィール
  DELETE FROM public.profiles WHERE id = uid;

  -- 認証ユーザー本体（上記CASCADEにより通常は既に空だが、明示的に削除）
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
