-- weekly_goalsテーブルにuser_idカラムを追加

-- user_idカラムを追加
ALTER TABLE public.weekly_goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON public.weekly_goals(user_id);

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow all access to weekly_goals" ON public.weekly_goals;

-- RLSポリシーを作成
CREATE POLICY "Users can view their own weekly_goals" ON public.weekly_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly_goals" ON public.weekly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly_goals" ON public.weekly_goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly_goals" ON public.weekly_goals
  FOR DELETE USING (auth.uid() = user_id);
