const { createClient } = require('@supabase/supabase-js');

const hasSupabaseKeys = 
  process.env.SUPABASE_URL && 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!hasSupabaseKeys) {
  console.warn("⚠️ Supabase Auth keys (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are missing in .env! DineFlow will fall back to local database authentication.");
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

module.exports = { supabase, hasSupabaseKeys };
