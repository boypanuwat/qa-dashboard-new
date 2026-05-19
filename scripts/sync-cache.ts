// โหลด environment variables จาก .env.local ก่อน import อื่นๆ
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * สคริปต์สำหรับ Sync ข้อมูลจาก AIO API ไปยัง Excel Cache
 * 
 * วิธีใช้:
 * - npm run sync-cache           # Sync ทั้งหมด
 * - npm run sync-cache cycles    # Sync เฉพาะ Test Cycles
 * - npm run sync-cache runs      # Sync เฉพาะ Test Runs
 * - npm run sync-cache folders   # Sync เฉพาะ Folders
 * - npm run sync-cache users     # Sync เฉพาะ Users
 */

import { aioApi } from '../lib/aio-api';
import {
  TestCycleCache,
  FolderCache,
  CacheManager,
} from '../lib/excel-cache';
import { UserMapping } from '../lib/user-mapping';

const args = process.argv.slice(2);
const command = args[0] || 'all';

async function syncTestCycles() {
  console.log('\n📥 Syncing Test Cycles...');
  console.log('================================');
  console.log('PROJECT_ID:', process.env.NEXT_PUBLIC_AIO_PROJECT_ID ? 'Set ✅' : 'Missing ❌');
  
  try {
    // Force fetch from API (bypass cache)
    TestCycleCache.clear();
    console.log('Fetching from aioApi.getTestCycles()...');
    const cycles = await aioApi.getTestCycles();
    
    console.log(`✅ Synced ${cycles.length} test cycles`);
    return cycles.length;
  } catch (error) {
    console.error('❌ Error syncing test cycles:', error);
    return 0;
  }
}

async function syncFolders() {
  console.log('\n📥 Syncing Folders...');
  console.log('================================');
  
  try {
    const folders = await aioApi.getFolders();
    FolderCache.save(folders);
    
    console.log(`✅ Synced ${folders.length} folders`);
    return folders.length;
  } catch (error) {
    console.error('❌ Error syncing folders:', error);
    return 0;
  }
}

async function syncTestRuns(sampleSize: number = 5) {
  console.log('\n📥 Syncing Test Runs (Sample by Folder)...');
  console.log('================================');
  console.log(`⚠️  Syncing test runs from ${sampleSize} most recent folders`);
  console.log('   (Test runs are cached per folder on-demand)\n');
  
  try {
    // Get recent folders (with most recent cycles)
    const folders = await aioApi.getFolders();
    const recentFolders = folders
      .filter(f => f.cyclesCount > 0)
      .slice(0, sampleSize);
    
    console.log(`Selected ${recentFolders.length} recent folders:`);
    recentFolders.forEach((f, i) => {
      console.log(`  ${i + 1}. Folder ${f.ID}: ${f.name} (${f.cyclesCount} cycles)`);
    });
    
    // Fetch test runs for each folder
    let totalTestRuns = 0;
    for (const folder of recentFolders) {
      try {
        console.log(`\n  Fetching runs for folder ${folder.ID}: ${folder.name}...`);
        const runs = await aioApi.getTestRunsByFolder(folder.ID);
        totalTestRuns += runs.length;
        console.log(`    ✅ ${runs.length} test runs cached`);
      } catch (error) {
        console.log(`    ❌ Failed: ${error}`);
      }
    }
    
    console.log(`\n✅ Total ${totalTestRuns} test runs synced`);
    return totalTestRuns;
  } catch (error) {
    console.error('❌ Error syncing test runs:', error);
    return 0;
  }
}

async function syncUsers() {
  console.log('\n📥 Syncing User Mapping...');
  console.log('================================');
  
  try {
    // Get all cycles to extract user IDs
    const cycles = await aioApi.getTestCycles();
    const userIds = UserMapping.collectUserIds(cycles);
    
    // Create/update template
    UserMapping.createTemplate(userIds);
    
    console.log(`✅ Updated user mapping template with ${userIds.size} users`);
    return userIds.size;
  } catch (error) {
    console.error('❌ Error syncing users:', error);
    return 0;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   AIO Cache Sync Tool                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  const startTime = Date.now();
  
  try {
    switch (command) {
      case 'cycles':
        await syncTestCycles();
        break;
        
      case 'runs':
        await syncTestRuns(10); // Sync from 10 recent folders
        break;
        
      case 'folders':
        await syncFolders();
        break;
        
      case 'users':
        await syncUsers();
        break;
        
      case 'clear':
        console.log('\n🗑️  Clearing all caches...\n');
        CacheManager.clearAll();
        aioApi.clearTestRunCache(); // Clear test run cache too
        break;
        
      case 'status':
        CacheManager.getStatus();
        console.log('\n');
        aioApi.getTestRunCacheStatus(); // Show test run cache status
        break;
        
      case 'all':
      default:
        console.log('Syncing all data sources...\n');
        await syncTestCycles();
        await syncFolders();
        await syncUsers();
        console.log('\n⚠️  Skipping test runs (too large, use: npm run sync-cache runs)');
        break;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ✅ Sync Complete                     ║');
    console.log(`║   Duration: ${duration}s                      ║`);
    console.log('╚════════════════════════════════════════╝\n');
    
    // Show final status
    CacheManager.getStatus();
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm run sync-cache [command]

Commands:
  all       Sync all data (default)
  cycles    Sync test cycles only
  runs      Sync test runs (sample)
  folders   Sync folders only
  users     Sync user mapping
  clear     Clear all caches
  status    Show cache status

Examples:
  npm run sync-cache
  npm run sync-cache cycles
  npm run sync-cache status
  `);
  process.exit(0);
}

main();
