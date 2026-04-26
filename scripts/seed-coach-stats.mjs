#!/usr/bin/env node
/**
 * Seed script to create mock analytics data for coaches
 * Usage: node scripts/seed-coach-stats.mjs <coach_id>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from api-server
 dotenv.config({ path: join(__dirname, '../artifacts/api-server/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const coachId = process.argv[2];

if (!coachId) {
  console.error('Usage: node seed-coach-stats.mjs <coach_id>');
  console.error('Example: node seed-coach-stats.mjs 1');
  process.exit(1);
}

async function seedStats() {
  console.log(`Seeding stats for coach ${coachId}...`);

  // Create coach_stats entry
  const { data: existingStats } = await supabase
    .from('coach_stats')
    .select('*')
    .eq('coach_id', coachId)
    .single();

  const mockStats = {
    coach_id: parseInt(coachId),
    total_profile_views: Math.floor(Math.random() * 1000) + 100,
    total_contact_unlocks: Math.floor(Math.random() * 50) + 5,
    total_revenue: (Math.floor(Math.random() * 2000) + 500) * 100, // in cents
    total_wishlist_saves: Math.floor(Math.random() * 30) + 3,
    unlock_price: 3000, // $30.00 in cents
    unlock_price_enabled: 1,
  };

  if (existingStats) {
    const { error } = await supabase
      .from('coach_stats')
      .update(mockStats)
      .eq('coach_id', coachId);
    
    if (error) {
      console.error('Error updating stats:', error);
      process.exit(1);
    }
    console.log('✓ Updated existing stats');
  } else {
    const { error } = await supabase
      .from('coach_stats')
      .insert(mockStats);
    
    if (error) {
      console.error('Error inserting stats:', error);
      process.exit(1);
    }
    console.log('✓ Created new stats entry');
  }

  // Create some daily analytics for the past 30 days
  console.log('Creating daily analytics...');
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dailyStats = {
      coach_id: parseInt(coachId),
      date: date.toISOString(),
      profile_views: Math.floor(Math.random() * 50) + 1,
      contact_unlocks: Math.floor(Math.random() * 5),
      unlock_revenue: Math.floor(Math.random() * 200) * 100,
      wishlist_adds: Math.floor(Math.random() * 3),
      wishlist_removes: Math.floor(Math.random() * 1),
      phone_clicks: Math.floor(Math.random() * 3),
      whatsapp_clicks: Math.floor(Math.random() * 5),
    };

    // Upsert (insert or update)
    const { error } = await supabase
      .from('coach_analytics')
      .upsert(dailyStats, { onConflict: ['coach_id', 'date'] });

    if (error) {
      console.error(`Error inserting day ${i}:`, error);
    }
  }

  console.log('✓ Created 30 days of analytics');
  console.log('\nDone! Stats summary:');
  console.log(`  - Profile views: ${mockStats.total_profile_views}`);
  console.log(`  - Contact unlocks: ${mockStats.total_contact_unlocks}`);
  console.log(`  - Revenue: $${(mockStats.total_revenue / 100).toFixed(2)}`);
  console.log(`  - Wishlist saves: ${mockStats.total_wishlist_saves}`);
}

seedStats().catch(console.error);
