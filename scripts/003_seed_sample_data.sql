-- サンプルデータ投入スクリプト
-- テスト用のサンプルデータ

-- 今週の開始日を計算（月曜日）
DO $$
DECLARE
  v_week_start DATE;
BEGIN
  v_week_start := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6) % 7;

  -- 週次目標のサンプルデータ
  INSERT INTO public.weekly_targets (week_start_date, metric_name, target_value, unit)
  VALUES 
    (v_week_start, '運動', 5, '回'),
    (v_week_start, '読書', 3, '時間'),
    (v_week_start, '勉強', 10, '時間')
  ON CONFLICT (week_start_date, metric_name) DO NOTHING;

  -- 記録のサンプルデータ
  INSERT INTO public.records (quantity, unit, memo, performed_at)
  VALUES 
    (1, '回', 'ジョギング30分', v_week_start + INTERVAL '1 day'),
    (1, '回', '筋トレ', v_week_start + INTERVAL '2 days'),
    (1.5, '時間', '小説を読んだ', v_week_start + INTERVAL '1 day'),
    (2, '時間', 'プログラミング学習', v_week_start + INTERVAL '2 days'),
    (3, '時間', '英語学習', v_week_start + INTERVAL '3 days');
END $$;
