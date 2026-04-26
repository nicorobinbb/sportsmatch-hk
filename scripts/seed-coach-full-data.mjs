#!/usr/bin/env node
/**
 * Seed comprehensive mock data for 劉德華教練 (Coach ID: 54)
 */

const SUPABASE_URL = 'https://vosbykmmrfcyrdrkvinx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const coachId = 54;

const comprehensiveCoachData = {
  // Names
  name: '劉德華教練',
  name_zh: '劉德華',
  name_en: 'Coach Andy Lau',
  
  // Bio
  bio: `劉德華教練擁有超過15年嘅籃球教學經驗，曾經擔任香港青年軍助教，對於培養青少年球員有獨特嘅心得。

教練理念：
• 重視基本功訓練，相信紥實嘅基礎係成功嘅關鍵
• 因材施教，根據每位學員嘅特點制定個人化訓練計劃
• 強調團隊合作同體育精神嘅培養
• 結合現代籃球戰術同傳統訓練方法

無論係想打好基礎嘅初學者，定係準備比賽嘅選手，劉教練都能夠提供專業指導。`,
  
  // Category & Location
  sports_category: '籃球',
  location: '沙田、九龍城、觀塘',
  
  // Experience & Focus
  experience_level: '持牌教練、專業運動員',
  teaching_focus: ['競賽', '興趣'],
  age_groups: ['兒童（8至12歲）', '青少年（12-17歲）', '成人（18歲以上）'],
  
  // Contact
  whatsapp_number: '+852 9123 4567',
  facebook_url: 'https://facebook.com/andybasketballcoach',
  instagram_url: 'https://instagram.com/andy_basketball_hk',
  website_url: 'https://andybasketball.hk',
  youtube_url: 'https://youtube.com/@andybasketballhk',
  
  // SCRC
  scrc_number: 'SCRC2024HK123456',
  
  // Achievements
  teaching_achievements: `• 執教沙田區青少年籃球隊超過10年，培養出多位區隊代表
• 學員曾獲全港學界籃球賽冠軍、亞軍
• 累計執教學員超過500人，年齡涵蓋6至35歲
• 前香港浸會大學籃球隊助教（2015-2019）
• 曾擔任多間中小學籃球興趣班導師
• 獲頒「優秀青年教練」獎項（2018、2020、2022）`,
  
  sports_achievements: `• 前香港籃球青年軍成員（2005-2008）
• 曾代表香港參加亞洲青年籃球錦標賽
• 全港公開籃球聯賽甲組球員（10年經驗）
• 香港籃球總會註冊球員（2003-2018）
• 獲選沙田區傑出運動員（2006、2007）
• 香港籃球聯賽三分王（2012球季）`,
  
  // Qualifications
  qualifications: JSON.stringify([
    { text: "香港籃球總會註冊教練（二級）", proofUrl: "" },
    { text: "亞洲籃球總會認可教練資格", proofUrl: "" },
    { text: "香港體育學院運動教練文憑", proofUrl: "" },
    { text: "急救證書（聖約翰救傷隊）", proofUrl: "" },
    { text: "兒童體適能教練認證", proofUrl: "" },
    { text: "運動心理學基礎課程畢業", proofUrl: "" }
  ]),
  
  // Pricing Plans
  pricing_plans: JSON.stringify([
    { sessionType: "單對單", price: "400", duration: "60分鐘", minStudents: "", maxStudents: "", ageGroup: "" },
    { sessionType: "單對單", price: "550", duration: "90分鐘", minStudents: "", maxStudents: "", ageGroup: "" },
    { sessionType: "小組課堂", price: "250", duration: "90分鐘", minStudents: "3", maxStudents: "6", ageGroup: "兒童（8至12歲）" },
    { sessionType: "小組課堂", price: "300", duration: "90分鐘", minStudents: "3", maxStudents: "6", ageGroup: "青少年（12-17歲）" },
    { sessionType: "小組課堂", price: "280", duration: "90分鐘", minStudents: "4", maxStudents: "8", ageGroup: "成人（18歲以上）" }
  ]),
  
  // Package Details
  package_details: "10堂套餐：$3,500（88折）| 20堂套餐：$6,400（8折）| 兄弟姊妹同行：各減$50/堂 | 介紹新學員：送1堂",
  
  // Profile Image (placeholder - using a placeholder basketball image)
  profile_image_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop",
  
  // Status
  is_approved: true,
  is_featured: true,
  
  // Trial/Regular prices (legacy - setting to 0 as requested)
  trial_price: 0,
  regular_price: 0,
};

async function seedCoachData() {
  console.log(`Updating coach ${coachId} with comprehensive data...\n`);
  
  const { data, error } = await supabase
    .from('coaches')
    .update(comprehensiveCoachData)
    .eq('id', coachId)
    .select();
  
  if (error) {
    console.error('Error updating coach:', error);
    process.exit(1);
  }
  
  console.log('✓ Successfully updated 劉德華教練 with:');
  console.log('  - Basic info (name, bio, location)');
  console.log('  - Contact details (WhatsApp, social media)');
  console.log('  - Teaching achievements');
  console.log('  - Sports achievements');
  console.log('  - Teaching focus & age groups');
  console.log('  - 6 professional qualifications');
  console.log('  - 5 pricing plans');
  console.log('  - Package details');
  console.log('  - Profile image');
  console.log('  - SCRC number');
  console.log('  - Approved & featured status');
  
  console.log('\nCoach Portal will now display all sections:');
  console.log('  ✓ Profile header with stats');
  console.log('  ✓ About coach with bio');
  console.log('  ✓ Teaching achievements section');
  console.log('  ✓ Sports achievements section');
  console.log('  ✓ Professional qualifications list');
  console.log('  ✓ Pricing plans table');
  console.log('  ✓ Package details');
  console.log('  ✓ Contact methods');
  console.log('  ✓ Social media links');
}

seedCoachData().catch(console.error);
