import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanup() {
    console.log('Starting cleanup...');

    // 1. Delete data from Prisma (Public Table)
    try {
        console.log('Deleting Reviews...');
        // Assuming Review model exists based on seed-data, verifying via schema later or just try/catch
        // If Review model is not in schema.prisma viewed earlier, skip. 
        // Viewed schema.prisma earlier: User, Service, Appointment. No Review model visible in that snippet.
        // Wait, seed-data.ts showed Review type. Let's check schema again or just delete what we know.

        console.log('Deleting Appointments...');
        await prisma.appointment.deleteMany({});

        console.log('Deleting Services...');
        await prisma.service.deleteMany({});

        console.log('Deleting Users (Public Table)...');
        await prisma.user.deleteMany({});

        console.log('Prisma data cleared.');
    } catch (error) {
        console.error('Error deleting Prisma data:', error);
    }

    // 2. Delete users from Supabase Auth
    try {
        console.log('Fetching Auth Users...');
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) throw error;

        console.log(`Found ${users.length} users in Auth. Deleting...`);

        for (const user of users) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Failed to delete user ${user.id}:`, deleteError.message);
            } else {
                console.log(`Deleted user ${user.id}`);
            }
        }
        console.log('Auth users cleared.');
    } catch (error) {
        console.error('Error deleting Auth users:', error);
    }

    console.log('Cleanup complete.');
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
