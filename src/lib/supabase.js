import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnon);

/*
SQL — run once in Supabase SQL Editor:

CREATE TABLE user_data (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms       jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_posts jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data" ON user_data
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE cached_posts (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  posts        jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_fetched timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cached_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own posts" ON cached_posts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
*/
