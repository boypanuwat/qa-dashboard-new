/**
 * ตัวอย่างการใช้งาน User Mapping System
 */

import { aioApi } from '@/lib/aio-api';
import { getUserName, getUserInfo } from '@/lib/user-mapping';

// ตัวอย่างที่ 1: แสดงชื่อเจ้าของ Test Cycle
export async function displayTestCycleOwner() {
  const cycles = await aioApi.getTestCycles();
  
  cycles.slice(0, 5).forEach((cycle) => {
    const ownerName = getUserName(cycle.ownedByID);
    console.log(`${cycle.key}: ${cycle.title}`);
    console.log(`   Owner: ${ownerName}`);
    console.log('');
  });
}

// ตัวอย่างที่ 2: Filter Test Cycles by Owner
export async function filterByOwner(ownerUserId: string) {
  const cycles = await aioApi.getTestCycles();
  const ownerName = getUserName(ownerUserId);
  
  const filtered = cycles.filter((c) => c.ownedByID === ownerUserId);
  
  console.log(`Test Cycles owned by ${ownerName}:`);
  console.log(`Found ${filtered.length} cycles`);
  
  return filtered;
}

// ตัวอย่างที่ 3: แสดงข้อมูลเต็มของ User
export async function displayUserDetails(userId: string) {
  const userInfo = getUserInfo(userId);
  
  console.log('User Information:');
  console.log(`  Name: ${userInfo.displayName}`);
  console.log(`  Email: ${userInfo.email || 'N/A'}`);
  console.log(`  Team: ${userInfo.team || 'N/A'}`);
  console.log(`  Role: ${userInfo.role || 'N/A'}`);
}

// ตัวอย่างที่ 4: Enrich Test Cycle Data with User Names
export async function enrichTestCycleData() {
  const cycles = await aioApi.getTestCycles();
  
  // เพิ่มชื่อ user เข้าไปใน object
  const enriched = cycles.map((cycle) => ({
    ...cycle,
    ownerName: getUserName(cycle.ownedByID),
    folderName: cycle.folder?.name || 'N/A',
  }));
  
  return enriched;
}

// ตัวอย่างที่ 5: Group Test Cycles by Owner
export async function groupByOwner() {
  const cycles = await aioApi.getTestCycles();
  
  const grouped = new Map<string, typeof cycles>();
  
  cycles.forEach((cycle) => {
    const ownerName = getUserName(cycle.ownedByID);
    if (!grouped.has(ownerName)) {
      grouped.set(ownerName, []);
    }
    grouped.get(ownerName)!.push(cycle);
  });
  
  // แสดงสรุป
  console.log('\nTest Cycles by Owner:');
  grouped.forEach((cycles, ownerName) => {
    console.log(`  ${ownerName}: ${cycles.length} cycles`);
  });
  
  return grouped;
}

// ตัวอย่างที่ 6: Stats by Team
export async function getStatsByTeam() {
  const cycles = await aioApi.getTestCycles();
  
  const teamStats = new Map<string, { cycles: number; owners: Set<string> }>();
  
  cycles.forEach((cycle) => {
    const userInfo = getUserInfo(cycle.ownedByID);
    const team = userInfo.team || 'Unknown Team';
    
    if (!teamStats.has(team)) {
      teamStats.set(team, { cycles: 0, owners: new Set() });
    }
    
    const stats = teamStats.get(team)!;
    stats.cycles++;
    stats.owners.add(userInfo.displayName);
  });
  
  console.log('\nStats by Team:');
  teamStats.forEach((stats, team) => {
    console.log(`  ${team}:`);
    console.log(`    Cycles: ${stats.cycles}`);
    console.log(`    Members: ${stats.owners.size}`);
  });
  
  return teamStats;
}
