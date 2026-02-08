import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少 Supabase 環境變數！請確認 .env.local 檔案設定正確。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
