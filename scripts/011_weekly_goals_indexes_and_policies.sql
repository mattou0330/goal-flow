-- 週次目標のインデックスとポリシーを追加

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_weekly_goals_plan_id ON weekly_goals(plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week_start ON weekly_goals(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_status ON weekly_goals(status);

-- RLSを有効化
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがアクセス可能なポリシー（認証実装後に変更）
CREATE POLICY "Enable all access for weekly_goals" ON weekly_goals
  FOR ALL USING (true) WITH CHECK (true);
