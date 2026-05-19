# Excel Cache System Documentation

## 📊 ภาพรวมระบบ

ระบบ Excel Cache ใช้ **3-Tier Caching Strategy** เพื่อความเร็วและ persistence:

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Memory Cache (2 min)     ⚡ < 1ms             │
│  Tier 2: Excel Cache (10 min)     💾 ~50ms             │
│  Tier 3: AIO API                   📡 10-30s            │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 โครงสร้างไฟล์

```
data/
├── aio-cache-testcycles.xlsx    # Test Cycles (10,000 rows)
├── aio-cache-testruns.xlsx      # Test Runs (100,000 rows)
├── aio-cache-folders.xlsx       # Folders with hierarchy
├── user-mapping.xlsx            # User master data
└── .gitkeep                     # Git placeholder
```

**Note:** ไฟล์ทั้งหมดไม่ถูก commit ใน Git (ดู `.gitignore`)

---

## 🚀 การใช้งาน

### 1. Setup (ครั้งแรก)

```bash
npm install
npm run sync-cache        # Sync ข้อมูลครั้งแรก
npm run generate-users    # สร้าง user mapping template
```

### 2. Sync ข้อมูลตามตารางเวลา

| Data Type | Command | Frequency | Duration |
|-----------|---------|-----------|----------|
| **Test Cycles** | `npm run sync-cache cycles` | ทุก 10 นาที | ~10s |
| **Folders** | `npm run sync-cache folders` | ทุก 6 ชั่วโมง | ~5s |
| **Users** | `npm run sync-cache users` | เมื่อมีคนใหม่ | ~3s |
| **Test Runs** | `npm run sync-cache runs` | Manual (ช้า) | ~60s |
| **All** | `npm run sync-cache` | ทุก 1 ชั่วโมง | ~20s |

### 3. ตรวจสอบสถานะ

```bash
npm run sync-cache status
```

Output:
```
📊 Cache Status:
================

Test Cycles:
  File: ✅ aio-cache-testcycles.xlsx
  Valid: ✅
  
Test Runs:
  File: ✅ aio-cache-testruns.xlsx
  Valid: ❌ (expired)
```

### 4. Clear Cache

```bash
npm run sync-cache clear
```

---

## 💾 Excel File Structure

### 1. **aio-cache-testcycles.xlsx**

**Sheet: TestCycles**
| Column | Type | Description |
|--------|------|-------------|
| ID | number | Unique ID |
| key | string | SCRUM-CY-123 |
| title | string | Test Cycle title |
| objective | string | Description |
| startDate | date | Start date |
| endDate | date | End date |
| createdDate | date | Created timestamp |
| updatedDate | date | Updated timestamp |
| isClosed | boolean | Closed status |
| isArchived | boolean | Archived status |
| folderID | number | Folder ID (FK) |
| folderName | string | 🔹 Denormalized |
| folderDescription | string | 🔹 Denormalized |
| folderParentID | number | Parent folder ID |
| ownedByID | string | Owner user ID |
| ownedByName | string | 🔹 Denormalized |
| fullData | string | JSON (for reconstruction) |

**Sheet: Metadata**
```json
{
  "lastSync": "2026-05-12T10:30:00Z",
  "totalRecords": 1234,
  "cacheDurationMinutes": 10,
  "version": "1.0"
}
```

---

### 2. **aio-cache-testruns.xlsx**

**Sheet: TestRuns** (Flat structure - 1 row per run)
| Column | Type | Description |
|--------|------|-------------|
| runID | number | Test Run ID |
| testRunKey | string | RUN-123 |
| status | string | Passed/Failed/Blocked |
| executionDate | date | When executed |
| updatedDate | date | Last update |
| executionTime | number | Duration (ms) |
| environment | string | prod/staging/dev |
| buildNumber | string | Build version |
| comment | string | Notes |
| testCaseID | number | Test Case ID (FK) |
| testCaseKey | string | SCRUM-TC-456 |
| testCaseTitle | string | Test Case title |
| testCaseDescription | string | Description |
| testCasePriority | string | High/Medium/Low |
| testCaseType | string | Smoke/Regression |
| testCaseStatus | string | Published/Draft |
| testRunItemID | number | Assignment ID |
| assignedToID | string | Assigned user ID |
| assignedToName | string | 🔹 Denormalized |
| executedByID | string | Executor user ID |
| executedByName | string | 🔹 Denormalized |
| assignmentDate | date | When assigned |
| testCaseFolderID | number | Folder ID |
| testCaseFolderName | string | 🔹 Denormalized |
| fullTestCase | string | JSON |
| fullTestRun | string | JSON |

---

### 3. **aio-cache-folders.xlsx**

**Sheet: Folders**
| Column | Type | Description |
|--------|------|-------------|
| ID | number | Folder ID |
| name | string | Folder name |
| description | string | Description |
| parentID | number | Parent folder ID |
| level | number | Hierarchy level (0 = root) |
| path | string | "Sprint 8 > env.prod" |
| cyclesCount | number | Number of cycles |
| passed | number | Tests passed |
| failed | number | Tests failed |
| blocked | number | Tests blocked |
| notRun | number | Tests not run |

---

### 4. **user-mapping.xlsx**

**Sheet: Users**
| Column | Type | Description |
|--------|------|-------------|
| userId | string | AIO/Jira user ID |
| displayName | string | ชื่อแสดง (⭐ บังคับ) |
| email | string | Email address |
| team | string | QA Team / Dev Team |
| role | string | QA Engineer / Developer |
| _note | string | New / Existing |

---

## 🔧 การใช้งานใน Code

### Import Cache Classes

```typescript
import {
  TestCycleCache,
  TestRunCache,
  FolderCache,
  CacheManager
} from '@/lib/excel-cache';
```

### ตัวอย่าง: Load Test Cycles

```typescript
// ใช้ aioApi (มี 3-tier caching อัตโนมัติ)
const cycles = await aioApi.getTestCycles();

// หรือใช้ cache โดยตรง
const cachedCycles = TestCycleCache.load();
if (cachedCycles) {
  // Use cached data
}
```

### ตัวอย่าง: Force Refresh

```typescript
// Clear cache แล้ว fetch ใหม่
TestCycleCache.clear();
const freshCycles = await aioApi.getTestCycles();
```

### ตัวอย่าง: Check Cache Status

```typescript
if (TestCycleCache.isValid()) {
  console.log('Cache is still valid');
} else {
  console.log('Cache expired, need refresh');
}
```

### ตัวอย่าง: Manual Save

```typescript
const cycles = await fetchFromAPI();
TestCycleCache.save(cycles);
```

---

## 🎯 Best Practices

### 1. **Denormalization ที่เหมาะสม**
✅ **ควร Denormalize:**
- User names (ใช้บ่อย, ไม่เปลี่ยน)
- Folder names (แสดงใน UI)
- Status/Priority names (reference data)

❌ **ไม่ควร Denormalize:**
- Large objects (test steps, attachments)
- Frequently changing data

### 2. **Cache Duration**
```typescript
Test Cycles:  10 minutes  (อัปเดตบ่อย)
Test Runs:     5 minutes  (real-time)
Folders:       6 hours    (เปลี่ยนน้อย)
Users:         1 day      (เปลี่ยนน้อยมาก)
```

### 3. **Data Limit**
- Test Cycles: เก็บล่าสุด 10,000 rows
- Test Runs: เก็บจาก recent cycles (10-20 cycles)
- Folders: เก็บทั้งหมด (~100-500 folders)

### 4. **Error Handling**
```typescript
const cycles = TestCycleCache.load();
if (!cycles || cycles.length === 0) {
  // Fallback to API
  return await aioApi.getTestCycles();
}
```

---

## 📈 Performance Metrics

| Operation | Memory | Excel | API |
|-----------|--------|-------|-----|
| **Speed** | < 1ms | ~50ms | 10-30s |
| **Size** | ~5MB RAM | ~2-5MB disk | N/A |
| **Persistent** | ❌ | ✅ | N/A |
| **Query** | ⚡ Fast | ⚠️ Medium | ❌ Slow |

---

## 🔄 Sync Automation (Future)

### Option 1: Cron Job
```bash
# crontab -e
*/10 * * * * cd /path/to/project && npm run sync-cache cycles
```

### Option 2: Next.js API Route
```typescript
// app/api/sync/route.ts
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== 'Bearer SECRET') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  await syncCache();
  return Response.json({ success: true });
}
```

### Option 3: Background Worker
```typescript
// Use bullmq or similar
import Queue from 'bull';

const syncQueue = new Queue('cache-sync');

syncQueue.process(async (job) => {
  await syncCache();
});

// Schedule every 10 minutes
syncQueue.add({}, { repeat: { cron: '*/10 * * * *' } });
```

---

## 🐛 Troubleshooting

### Cache ไม่อัปเดต
```bash
npm run sync-cache clear
npm run sync-cache
```

### Excel file ใหญ่เกินไป
- ลด data limit ใน sync script
- แยกเป็นหลายไฟล์ตาม date range

### Memory leak
- Restart server ทุก 24 ชั่วโมง
- ใช้ `process.memoryUsage()` ตรวจสอบ

---

## 📚 Related Files

- [lib/excel-cache.ts](lib/excel-cache.ts) - Core cache implementation
- [lib/user-mapping.ts](lib/user-mapping.ts) - User mapping system
- [lib/aio-api.ts](lib/aio-api.ts) - API client with caching
- [scripts/sync-cache.ts](scripts/sync-cache.ts) - Sync script
- [.gitignore](.gitignore) - Ignore cache files

---

## 💡 Future Enhancements

1. **SQLite Migration** - สำหรับ complex queries
2. **Compression** - ลด file size ด้วย gzip
3. **Incremental Sync** - Sync เฉพาะที่เปลี่ยนแปลง
4. **Real-time Webhook** - รับ notification จาก AIO
5. **Admin UI** - จัดการ cache ผ่าน web interface
