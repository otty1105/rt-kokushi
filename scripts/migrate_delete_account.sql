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
-- 前提となるテーブル定義（本リポジトリのマイグレーションスクリプトで確認済み）：
--   profiles.id            REFERENCES auth.users(id) ON DELETE CASCADE
--   explanations.user_id   REFERENCES auth.users(id) ON DELETE CASCADE
--   explanation_images.explanation_id REFERENCES explanations(id) ON DELETE CASCADE
--
-- user_answers / explanation_likes はダッシュボードで直接作成されたテーブルのため
-- 本リポジトリのSQL履歴には定義がありません。user_id カラム名を前提にしています。
-- 実際のカラム名が異なる場合は書き換えてください。
--
-- ⚠️ 実行前に必ず、auth.users を参照している全テーブルを確認してください。
-- CASCADE 設定のない参照が残っていると、最後の DELETE FROM auth.users で
-- 外部キー制約違反が発生し、関数全体がロールバックされます。
--
--   SELECT tc.table_name, kcu.column_name, rc.delete_rule
--   FROM information_schema.table_constraints tc
--   JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
--   JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
--   JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
--   WHERE ccu.table_name = 'users' AND ccu.table_schema = 'auth';
--
-- ここに出てきたテーブルのうち、下の関数でDELETEしていないもの
-- （例: flagged_questions など）があれば、DELETE文を追加してください。
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

  -- いいね（他人の解説につけたものも含む）
  DELETE FROM public.explanation_likes WHERE user_id = uid;

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
