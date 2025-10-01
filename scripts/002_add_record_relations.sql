-- 記録テーブルに週次目標とプランへの参照を追加

-- weekly_goal_idカラムを追加
ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS weekly_goal_id UUID REFERENCES public.weekly_goals(id) ON DELETE SET NULL;

-- plan_idカラムを追加
ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_records_weekly_goal_id ON public.records(weekly_goal_id);
CREATE INDEX IF NOT EXISTS idx_records_plan_id ON public.records(plan_id);

-- コメントを追加
COMMENT ON COLUMN public.records.weekly_goal_id IS '関連する週次目標のID';
COMMENT ON COLUMN public.records.plan_id IS '関連するプランのID';
