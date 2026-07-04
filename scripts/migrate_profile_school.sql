-- ============================================================
-- 1. schools テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id            serial  PRIMARY KEY,
  name          text    NOT NULL,
  program_years integer NOT NULL CHECK (program_years IN (3, 4))
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_select_all" ON public.schools;
CREATE POLICY "schools_select_all" ON public.schools FOR SELECT USING (true);

GRANT SELECT ON public.schools TO authenticated, anon;

-- ============================================================
-- 2. schools シードデータ
-- ============================================================

-- 4年制（大学）
INSERT INTO public.schools (name, program_years) VALUES
('北海道大学', 4),
('北海道科学大学', 4),
('日本医療大学', 4),
('弘前大学', 4),
('東北大学', 4),
('福島県立医科大学', 4),
('茨城県立医療大学', 4),
('つくば国際大学', 4),
('国際医療福祉大学（大田原）', 4),
('群馬県立県民健康科学大学', 4),
('群馬パース大学', 4),
('日本医療科学大学', 4),
('順天堂大学', 4),
('国際医療福祉大学（成田）', 4),
('帝京大学（東京）', 4),
('東京都立大学', 4),
('杏林大学', 4),
('駒澤大学', 4),
('北里大学', 4),
('新潟大学', 4),
('新潟医療福祉大学', 4),
('金沢大学', 4),
('岐阜医療科学大学', 4),
('名古屋大学', 4),
('藤田医科大学', 4),
('鈴鹿医療科学大学', 4),
('京都医療科学大学', 4),
('大阪大学', 4),
('大阪物療大学', 4),
('森ノ宮医療大学', 4),
('神戸常盤大学', 4),
('広島国際大学', 4),
('岡山大学', 4),
('川崎医療福祉大学', 4),
('徳島大学', 4),
('徳島文理大学', 4),
('九州大学', 4),
('純真学園大学', 4),
('帝京大学（福岡）', 4),
('熊本大学', 4);

-- 3年制（専門学校等）
INSERT INTO public.schools (name, program_years) VALUES
('自衛隊中央病院診療放射線技師養成所', 3),
('中央医療技術専門学校', 3),
('東京電子専門学校', 3),
('城西放射線技術専門学校', 3),
('東海医療技術専門学校', 3),
('専門学校東洋公衆衛生学院', 3),
('大阪行岡医療専門学校長柄校', 3),
('清恵会医療専門学校', 3),
('大阪ハイテクノロジー専門学校', 3),
('神戸総合医療専門学校', 3),
('静岡医療科学専門大学校', 3),
('川崎医療短期大学', 3),
('北海道医薬専門学校', 3),
('福岡医療専門学校', 3),
('専門学校日本福祉看護・診療放射線学院', 3),
('鹿児島医療技術専門学校', 3),
('日本文理大学医療専門学校', 3);

-- ============================================================
-- 3. profiles テーブル修正
-- ============================================================

-- display_name → nickname リネーム（display_name がある場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN display_name TO nickname;
  END IF;
END $$;

-- nickname カラムがまだない場合は追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;

-- その他の必要カラムを追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_exam_year boolean;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_year integer;

-- status の CHECK 制約（未設定の場合のみ追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('student', 'kokushi_ronin', 'graduate', 'other'));
  END IF;
END $$;

-- school_id の FK 制約（未設定の場合のみ追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_school_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_school_id_fkey
      FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
  END IF;
END $$;
