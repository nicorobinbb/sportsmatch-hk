import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vosbykmmrfcyrdrkvinx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q'
);

// Test with a dummy token to see if the method works
async function test() {
  const { data, error } = await supabase.auth.getUser('invalid-token');
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
