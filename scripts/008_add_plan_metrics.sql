-- プランに数値化できる目標を追加

ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS target_value NUMERIC,
ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- コメントを追加
COMMENT ON COLUMN public.plans.target_value IS '目標値（例：900点、10回、50時間など）';
COMMENT ON COLUMN public.plans.current_value IS '現在値（進捗を追跡）';
COMMENT ON COLUMN public.plans.unit IS '単位（例：点、回、時間、ページなど）';
