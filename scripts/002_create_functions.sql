-- 関数作成スクリプト
-- 週次進捗を計算する関数

CREATE OR REPLACE FUNCTION public.get_weekly_progress(p_week_start_date DATE)
RETURNS TABLE (
  metric_name TEXT,
  target_value DECIMAL,
  actual_value DECIMAL,
  unit TEXT,
  achievement_rate DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.metric_name,
    wt.target_value,
    COALESCE(SUM(r.quantity), 0) as actual_value,
    wt.unit,
    CASE 
      WHEN wt.target_value > 0 THEN 
        ROUND((COALESCE(SUM(r.quantity), 0) / wt.target_value * 100)::numeric, 2)
      ELSE 0
    END as achievement_rate
  FROM 
    public.weekly_targets wt
  LEFT JOIN 
    public.records r ON r.unit = wt.unit 
    AND r.performed_at >= p_week_start_date 
    AND r.performed_at < (p_week_start_date + INTERVAL '7 days')
  WHERE 
    wt.week_start_date = p_week_start_date
  GROUP BY 
    wt.id, wt.metric_name, wt.target_value, wt.unit
  ORDER BY 
    wt.created_at;
END;
$$;
