-- ============================================================
-- profiles テーブル v2 マイグレーション
-- 変更点:
--   1. status の 'ronin' を 'kokushi_ronin' にリネーム
--   2. is_exam_year カラム追加（在学中ユーザーの受験年度フラグ）
-- ============================================================

-- 1. CHECK 制約を一時的に削除して status を更新
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

UPDATE profiles SET status = 'kokushi_ronin' WHERE status = 'ronin';

ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('student', 'kokushi_ronin', 'graduate', 'other'));

-- 2. is_exam_year カラム追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_exam_year boolean;
