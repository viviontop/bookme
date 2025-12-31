import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

// Initialize Supabase with Service Role Key (Admin rights)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function inspectAuth() {
    console.log('Connecting to Supabase Admin...');

    // List all users in the Auth system
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`\nFound ${users.length} users in Supabase Auth System:`);

    if (users.length === 0) {
        console.log('-> NO USERS FOUND. This confirms why login fails.');
        console.log('   The users you see in the "Table Editor" are likely only in the public table, not the auth system.');
        return;
    }

    users.forEach(u => {
        console.log(`- ${u.email} (Verified: ${u.email_confirmed_at ? 'YES' : 'NO'}) [ID: ${u.id}]`);
    });

    console.log('\nVerification complete.');
}

inspectAuth();
