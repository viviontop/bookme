import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const email = `test_debug_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`Attempting to register user: ${email}`);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }

  console.log('SignUp Success:', signUpData.user?.id);
  console.log('User Metadata:', signUpData.user?.user_metadata);
  console.log('Session:', signUpData.session ? 'Session created' : 'No session (Email confirmation might be required)');

  console.log('--------------------------------------------------');
  console.log(`Attempting to login user: ${email}`);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('SignIn Error:', signInError);
    if (signInError.message.includes('Email not confirmed')) {
      console.log('HYPOTHESIS CONFIRMED: Email confirmation is enabled.');
    }
  } else {
    console.log('SignIn Success:', signInData.user?.id);
    console.log('Session obtained.');
  }
}

testAuth();
