// โหลด environment variables จาก .env.local ก่อน import อื่นๆ
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * สคริปต์สำหรับสร้างไฟล์ user mapping template
 * 
 * วิธีใช้:
 * 1. รัน: npx tsx scripts/generate-user-mapping.ts
 * 2. เปิดไฟล์ data/user-mapping.xlsx
 * 3. กรอกชื่อใน column displayName
 * 4. บันทึกไฟล์
 * 5. Restart server หรือ refresh
 */

import { aioApi } from '../lib/aio-api';
import { UserMapping } from '../lib/user-mapping';

async function main() {
  console.log('🔍 Fetching data from AIO API...\n');

  try {
    // Fetch test cycles
    console.log('📥 Fetching test cycles...');
    const allCycles = await aioApi.getTestCycles();
    console.log(`   Found ${allCycles.length} test cycles`);

    // Collect user IDs จาก test cycles
    const userIds = UserMapping.collectUserIds(allCycles);
    console.log(`\n✅ Found ${userIds.size} unique user IDs`);

    // แสดง sample IDs
    console.log('\n📋 Sample User IDs:');
    Array.from(userIds).slice(0, 5).forEach((id) => {
      console.log(`   - ${id}`);
    });
    if (userIds.size > 5) {
      console.log(`   ... and ${userIds.size - 5} more`);
    }

    // สร้าง template
    console.log('\n📝 Creating user mapping template...');
    UserMapping.createTemplate(userIds);

    console.log('\n✅ Done! Next steps:');
    console.log('   1. Open: data/user-mapping.xlsx');
    console.log('   2. Fill in the displayName column');
    console.log('   3. Save the file');
    console.log('   4. Restart your dev server\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
