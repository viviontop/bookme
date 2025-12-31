import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Fail-fast guard in browser: ensure the public key is not a service role key
if (typeof window !== 'undefined') {
  try {
    const parts = supabaseAnonKey.split('.')
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]))
      if (payload?.role === 'service_role') {
        // Prevent leaking the service key further in the client runtime
        console.error('[Security] NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a service role key. Replace it with the anon public key in your env.');
        supabaseAnonKey = ''
      }
    }
  } catch (_e) {
    // ignore decode issues; supabase-js will surface auth errors if key is invalid
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
});

export default supabase;
