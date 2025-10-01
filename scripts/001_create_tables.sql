-- テーブル作成スクリプト
-- GoalFlowダッシュボードのデータベーススキーマ

-- 記録テーブル
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  memo TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 週次目標テーブル
CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  target_value DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start_date, metric_name)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_records_performed_at ON public.records(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_week_start ON public.weekly_targets(week_start_date);

-- Row Level Security (RLS) を有効化
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;

-- IF NOT EXISTSを削除してポリシー作成の互換性を向上
-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Allow all access to records" ON public.records;
CREATE POLICY "Allow all access to records" ON public.records
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to weekly_targets" ON public.weekly_targets;
CREATE POLICY "Allow all access to weekly_targets" ON public.weekly_targets
  FOR ALL USING (true) WITH CHECK (true);
