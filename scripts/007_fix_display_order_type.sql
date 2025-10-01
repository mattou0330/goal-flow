-- display_orderカラムの型をINTEGERからNUMERICに変更
ALTER TABLE goals 
ALTER COLUMN display_order TYPE NUMERIC USING display_order::NUMERIC;
