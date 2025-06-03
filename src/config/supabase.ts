import { createClient } from '@supabase/supabase-js';

// Estas variáveis serão substituídas pelos valores reais do seu projeto Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'As variáveis de ambiente do Supabase não estão configuradas. ' +
    'Certifique-se de que você tem um arquivo .env com REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY'
  );
}

// Log detalhado para debug
console.log('🔧 Configuração do Supabase:', {
  urlStatus: supabaseUrl && supabaseUrl.length > 0 ? '✅ Configurado' : `❌ ${supabaseUrl === '' ? 'Vazio' : 'Não Configurado'}`,
  keyStatus: supabaseAnonKey && supabaseAnonKey.length > 0 ? '✅ Configurado' : `❌ ${supabaseAnonKey === '' ? 'Vazio' : 'Não Configurado'}`,
  urlProvided: !!supabaseUrl,
  keyProvided: !!supabaseAnonKey,
});

// Criar uma única instância do cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'app.auth.token',
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  }
});

// Exportar a instância única
export { supabase }; 