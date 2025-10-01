-- ゴールの順序管理用のorderカラムを追加

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 既存のゴールに順序を設定（created_atの順序で）
WITH ordered_goals AS (
  SELECT 
    id,
    parent_id,
    ROW_NUMBER() OVER (PARTITION BY COALESCE(parent_id::text, 'root') ORDER BY created_at) as rn
  FROM public.goals
)
UPDATE public.goals g
SET display_order = og.rn
FROM ordered_goals og
WHERE g.id = og.id;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_goals_display_order ON public.goals(parent_id, display_order);

-- 順序を管理する関数を作成
CREATE OR REPLACE FUNCTION reorder_goals(
  goal_id UUID,
  new_parent_id UUID,
  target_position INTEGER
) RETURNS void AS $$
BEGIN
  -- 既存の位置から削除
  UPDATE public.goals
  SET display_order = display_order - 1
  WHERE parent_id IS NOT DISTINCT FROM (SELECT parent_id FROM public.goals WHERE id = goal_id)
    AND display_order > (SELECT display_order FROM public.goals WHERE id = goal_id);
  
  -- 新しい位置にスペースを作る
  UPDATE public.goals
  SET display_order = display_order + 1
  WHERE parent_id IS NOT DISTINCT FROM new_parent_id
    AND display_order >= target_position;
  
  -- ゴールを新しい位置に移動
  UPDATE public.goals
  SET parent_id = new_parent_id,
      display_order = target_position
  WHERE id = goal_id;
END;
$$ LANGUAGE plpgsql;
