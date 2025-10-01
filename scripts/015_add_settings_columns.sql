-- プロフィールテーブルに設定カラムを追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS week_start_day TEXT DEFAULT 'monday';

-- theme_colorの制約を追加（blue, green, purple, orange, red）
ALTER TABLE public.profiles
ADD CONSTRAINT check_theme_color CHECK (theme_color IN ('blue', 'green', 'purple', 'orange', 'red'));

-- week_start_dayの制約を追加（monday, sunday）
ALTER TABLE public.profiles
ADD CONSTRAINT check_week_start_day CHECK (week_start_day IN ('monday', 'sunday'));
