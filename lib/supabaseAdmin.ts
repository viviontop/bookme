import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Server-side Supabase client using the service role key for auth verification
export const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

export default supabaseAdmin;
