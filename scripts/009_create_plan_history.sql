-- プラン編集履歴テーブルの作成
CREATE TABLE IF NOT EXISTS plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  changed_by TEXT,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  field_name TEXT, -- 変更されたフィールド名
  old_value TEXT, -- 変更前の値
  new_value TEXT, -- 変更後の値
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_plan_history_plan_id ON plan_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_created_at ON plan_history(created_at DESC);

-- RLSポリシーの設定
ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan history"
  ON plan_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert plan history"
  ON plan_history FOR INSERT
  WITH CHECK (true);
