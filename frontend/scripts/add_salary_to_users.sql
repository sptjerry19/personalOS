-- Run once on Supabase (table: personal_users with DB_TABLE_PREFIX=personal_)
ALTER TABLE personal_users
  ADD COLUMN IF NOT EXISTS salary DECIMAL(14, 2);
