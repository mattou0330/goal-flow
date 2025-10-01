-- すべてのテーブルにuser_idカラムを追加
-- 既存のデータには最初の認証ユーザーのIDを設定

-- recordsテーブルにuser_idを追加
ALTER TABLE public.records 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- weekly_targetsテーブルにuser_idを追加
ALTER TABLE public.weekly_targets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- goalsテーブルにuser_idを追加
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- plansテーブルにuser_idを追加
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- goal_logsテーブルにuser_idを追加
ALTER TABLE public.goal_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- goal_weekly_targetsテーブルにuser_idを追加
ALTER TABLE public.goal_weekly_targets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- goal_reviewsテーブルにuser_idを追加
ALTER TABLE public.goal_reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_records_user_id ON public.records(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_user_id ON public.weekly_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_logs_user_id ON public.goal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_weekly_targets_user_id ON public.goal_weekly_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_reviews_user_id ON public.goal_reviews(user_id);
