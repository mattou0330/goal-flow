-- ゴール管理機能のテーブルを作成

-- ゴールテーブル
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プランテーブル
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 記録テーブル（ゴール用）
CREATE TABLE IF NOT EXISTS public.goal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  log_type TEXT DEFAULT 'note' CHECK (log_type IN ('note', 'milestone', 'issue', 'decision')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 週次目標テーブル（ゴール用）
CREATE TABLE IF NOT EXISTS public.goal_weekly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, week_start)
);

-- レビューテーブル
CREATE TABLE IF NOT EXISTS public.goal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  what_went_well TEXT,
  what_to_improve TEXT,
  next_actions TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_goals_parent_id ON public.goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_plans_goal_id ON public.plans(goal_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);
CREATE INDEX IF NOT EXISTS idx_goal_logs_goal_id ON public.goal_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_weekly_targets_goal_id ON public.goal_weekly_targets(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal_id ON public.goal_reviews(goal_id);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goal_weekly_targets_updated_at ON public.goal_weekly_targets;
CREATE TRIGGER update_goal_weekly_targets_updated_at
  BEFORE UPDATE ON public.goal_weekly_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーの設定
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_weekly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_reviews ENABLE ROW LEVEL SECURITY;

-- 全アクセス許可ポリシー（開発用）
DROP POLICY IF EXISTS "Allow all access to goals" ON public.goals;
CREATE POLICY "Allow all access to goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to plans" ON public.plans;
CREATE POLICY "Allow all access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to goal_logs" ON public.goal_logs;
CREATE POLICY "Allow all access to goal_logs" ON public.goal_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to goal_weekly_targets" ON public.goal_weekly_targets;
CREATE POLICY "Allow all access to goal_weekly_targets" ON public.goal_weekly_targets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to goal_reviews" ON public.goal_reviews;
CREATE POLICY "Allow all access to goal_reviews" ON public.goal_reviews FOR ALL USING (true) WITH CHECK (true);
