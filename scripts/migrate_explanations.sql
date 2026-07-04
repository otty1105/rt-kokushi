-- ============================================================
-- explanations テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS explanations (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_explanations_question_id ON explanations(question_id);
CREATE INDEX IF NOT EXISTS idx_explanations_user_id     ON explanations(user_id);

-- ============================================================
-- explanation_images テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS explanation_images (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  explanation_id uuid        NOT NULL REFERENCES explanations(id) ON DELETE CASCADE,
  image_url      text        NOT NULL,
  display_order  integer     NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_explanation_images_explanation_id ON explanation_images(explanation_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE explanations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_images ENABLE ROW LEVEL SECURITY;

-- 全員が読める（SELECTポリシーがないとPostgRESTのreturn=representationが403になる）
CREATE POLICY "explanations_select"
  ON explanations FOR SELECT USING (true);

CREATE POLICY "explanation_images_select"
  ON explanation_images FOR SELECT USING (true);

-- ログインユーザーが自分の解説を投稿できる
CREATE POLICY "explanations_insert"
  ON explanations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 解説の所有者が画像を追加できる
CREATE POLICY "explanation_images_insert"
  ON explanation_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM explanations e
      WHERE e.id = explanation_id AND e.user_id = auth.uid()
    )
  );

-- 自分の解説を削除できる（画像はCASCADEで削除される）
CREATE POLICY "explanations_delete"
  ON explanations FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ロール権限付与（RLSポリシーに加えてベース権限も必要）
-- ============================================================
GRANT SELECT ON public.explanations TO anon;
GRANT SELECT ON public.explanations TO authenticated;
GRANT INSERT, DELETE ON public.explanations TO authenticated;

GRANT SELECT ON public.explanation_images TO anon;
GRANT SELECT ON public.explanation_images TO authenticated;
GRANT INSERT ON public.explanation_images TO authenticated;

-- ============================================================
-- Storage: explanation-images バケット作成
-- （Supabase ダッシュボードの Storage > New bucket で作成する場合は不要）
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('explanation-images', 'explanation-images', true)
ON CONFLICT (id) DO NOTHING;

-- 認証済みユーザーがアップロードできる
CREATE POLICY "explanation_images_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'explanation-images' AND auth.role() = 'authenticated'
  );

-- 全員が閲覧できる（バケットがpublicなので通常は不要だが念のため）
CREATE POLICY "explanation_images_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'explanation-images');
