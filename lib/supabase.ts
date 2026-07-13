import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validação para evitar travamento da compilação (build) quando rodando localmente sem envs reais
const isValidUrl = /^https?:\/\//.test(supabaseUrl);

if (!isValidUrl || !supabaseAnonKey) {
  console.warn(
    'Atenção: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão configurados corretamente no .env.local.'
  );
}

// Usa valores reais ou fallbacks sintaticamente válidos para evitar erro de inicialização na build do Next.js
const urlToUse = isValidUrl ? supabaseUrl : 'https://dummy-placeholder-url.supabase.co';
const keyToUse = supabaseAnonKey || 'dummy-anon-key-placeholder';

export const supabase = createClient(urlToUse, keyToUse);
