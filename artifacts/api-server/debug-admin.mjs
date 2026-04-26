import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vosbykmmrfcyrdrkvinx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check admin user IDs
const adminUserIds = 'b45a40dc-6042-4be4-bc44-7f5ff2aba1e7'.split(',').map(id => id.trim()).filter(Boolean);
console.log('Admin User IDs:', adminUserIds);

// Check if user exists in auth
async function checkUser() {
  const userId = 'b45a40dc-6042-4be4-bc44-7f5ff2aba1e7';
  
  // Try to get user by ID using admin API
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error) {
    console.log('Error getting user:', error);
  } else {
    console.log('User found:', data.user?.email);
  }
}

checkUser();
