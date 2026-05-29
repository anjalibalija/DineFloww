// Script: delete all users from Supabase Auth
// Run with: node delete_supabase_users.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAllSupabaseUsers() {
  console.log('🔍 Fetching all Supabase Auth users...');
  let page = 1;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (error) { console.error('Error fetching users:', error.message); break; }
    if (!data.users || data.users.length === 0) break;

    for (const user of data.users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`  ✗ Failed to delete ${user.email}: ${delErr.message}`);
      } else {
        console.log(`  ✓ Deleted: ${user.email}`);
        deleted++;
      }
    }

    if (data.users.length < 50) break;
    page++;
  }

  console.log(`\n✅ Done. Deleted ${deleted} user(s) from Supabase Auth.`);
}

deleteAllSupabaseUsers();
