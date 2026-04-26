#!/usr/bin/env node
/**
 * Find user and coach info for a given email
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vosbykmmrfcyrdrkvinx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node find-user.mjs <email>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findUser() {
  console.log(`Finding user: ${email}...\n`);
  
  // Find user by email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, raw_user_meta_data')
    .eq('email', email);
  
  if (userError) {
    console.error('Error finding user:', userError);
    
    // Try auth.users via RPC
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth error:', authError);
      process.exit(1);
    }
    
    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('User found (via auth):');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Created:', user.created_at);
    
    // Find coaches for this user
    const { data: coaches, error: coachError } = await supabase
      .from('coaches')
      .select('id, name, sports_category, location, is_approved, created_at')
      .eq('user_id', user.id);
    
    if (coachError) {
      console.error('Error finding coaches:', coachError);
    } else if (coaches && coaches.length > 0) {
      console.log('\nCoaches:');
      coaches.forEach(c => {
        console.log(`  - ID: ${c.id}, Name: ${c.name}, Sport: ${c.sports_category}, Approved: ${c.is_approved}`);
      });
    } else {
      console.log('\nNo coaches found for this user.');
    }
    
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('User not found!');
    process.exit(1);
  }
  
  const user = users[0];
  console.log('User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  
  // Find coaches for this user
  const { data: coaches, error: coachError } = await supabase
    .from('coaches')
    .select('id, name, sports_category, location, is_approved, created_at')
    .eq('user_id', user.id);
  
  if (coachError) {
    console.error('Error finding coaches:', coachError);
  } else if (coaches && coaches.length > 0) {
    console.log('\nCoaches:');
    coaches.forEach(c => {
      console.log(`  - ID: ${c.id}, Name: ${c.name}, Sport: ${c.sports_category}, Approved: ${c.is_approved}`);
    });
  } else {
    console.log('\nNo coaches found for this user.');
  }
}

findUser().catch(console.error);
