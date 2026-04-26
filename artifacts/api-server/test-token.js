const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vosbykmmrfcyrdrkvinx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q'
);

async function test() {
  // Get a valid session token by creating a test user session
  // We'll test the middleware directly
  const { data, error } = await supabase.auth.admin.getUserById('b45a40dc-6042-4be4-bc44-7f5ff2aba1e7');
  console.log('User:', data?.user?.email);
  console.log('Error:', error);
}

test();
