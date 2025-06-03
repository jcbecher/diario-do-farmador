import { createClient } from '@supabase/supabase-js';

// Estas variáveis serão substituídas pelos valores reais do seu projeto Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 