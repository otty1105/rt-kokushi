-- ============================================================
-- profiles テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname     text        NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 30),
  school_name  text        CHECK (char_length(school_name) <= 100),
  status       text        NOT NULL DEFAULT 'student'
               CHECK (status IN ('student', 'kokushi_ronin', 'graduate', 'other')),
  grade        integer     CHECK (grade BETWEEN 1 AND 6),
  is_exam_year boolean,
  target_year  integer     CHECK (target_year BETWEEN 2020 AND 2050),
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ読み書きできる
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- ロール権限付与
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
