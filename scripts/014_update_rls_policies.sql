-- Row Level Security (RLS) ポリシーを更新
-- 各ユーザーは自分のデータのみにアクセス可能

-- recordsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to records" ON public.records;

CREATE POLICY "Users can view their own records" ON public.records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records" ON public.records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" ON public.records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" ON public.records
  FOR DELETE USING (auth.uid() = user_id);

-- weekly_targetsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to weekly_targets" ON public.weekly_targets;

CREATE POLICY "Users can view their own weekly_targets" ON public.weekly_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly_targets" ON public.weekly_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly_targets" ON public.weekly_targets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly_targets" ON public.weekly_targets
  FOR DELETE USING (auth.uid() = user_id);

-- goalsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to goals" ON public.goals;

CREATE POLICY "Users can view their own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- plansテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to plans" ON public.plans;

CREATE POLICY "Users can view their own plans" ON public.plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" ON public.plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON public.plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" ON public.plans
  FOR DELETE USING (auth.uid() = user_id);

-- goal_logsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to goal_logs" ON public.goal_logs;

CREATE POLICY "Users can view their own goal_logs" ON public.goal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal_logs" ON public.goal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal_logs" ON public.goal_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal_logs" ON public.goal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- goal_weekly_targetsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to goal_weekly_targets" ON public.goal_weekly_targets;

CREATE POLICY "Users can view their own goal_weekly_targets" ON public.goal_weekly_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal_weekly_targets" ON public.goal_weekly_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal_weekly_targets" ON public.goal_weekly_targets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal_weekly_targets" ON public.goal_weekly_targets
  FOR DELETE USING (auth.uid() = user_id);

-- goal_reviewsテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to goal_reviews" ON public.goal_reviews;

CREATE POLICY "Users can view their own goal_reviews" ON public.goal_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal_reviews" ON public.goal_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal_reviews" ON public.goal_reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal_reviews" ON public.goal_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- profilesテーブルのポリシー
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);
