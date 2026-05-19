# 📦 Test Run Cache System

## Overview

Test Run Cache เป็น **incremental per-folder caching system** ที่ออกแบบมาเพื่อลดเวลาการโหลดข้อมูล Test Runs จาก AIO API

### ปัญหาที่แก้ไข

- ❌ Test Runs มีจำนวนมาก (~10,000+ รายการ)
- ❌ การดึงข้อมูลทั้งหมดใช้เวลานาน (5-10 นาที)
- ❌ User ใช้งานเฉพาะ 1-2 folders ในแต่ละครั้ง

### วิธีแก้

✅ **Cache แบบ incremental per-folder** แทนที่จะ cache ทั้งหมด
✅ ดึงและ cache เฉพาะ folder ที่ user เลือก
✅ Cache มีอายุ 10 นาที (สามารถ refresh ได้ตามต้องการ)

---

## File Structure

```
data/testruns/
├── folder-729.xlsx      # Test runs for folder ID 729
├── folder-730.xlsx      # Test runs for folder ID 730
├── folder-731.xlsx      # Test runs for folder ID 731
└── index.json          # Cache metadata and tracking
```

### index.json Format

```json
{
  "729": {
    "folderId": 729,
    "folderName": "Sprint 23 - Release 1.5.0",
    "timestamp": 1704067200000,
    "expiresAt": 1704067800000,
    "testRunCount": 245,
    "fileName": "folder-729.xlsx"
  },
  "730": {
    "folderId": 730,
    "folderName": "Sprint 24 - Hotfix",
    "timestamp": 1704070800000,
    "expiresAt": 1704071400000,
    "testRunCount": 89,
    "fileName": "folder-730.xlsx"
  }
}
```

---

## Workflow

### 1. User เลือก Folder 729

```
1. Check cache: TestRunCache.isCacheValid(729)
   ├─ มี cache + valid (< 10 นาที)
   │  └─> Load จาก data/testruns/folder-729.xlsx (~50ms)
   │
   └─ หมดอายุหรือไม่มี cache
      └─> Fetch จาก API (10-30 วินาที)
          └─> Save to data/testruns/folder-729.xlsx
              └─> Update index.json
```

### 2. User เลือก Folder 730

```
1. Check cache: TestRunCache.isCacheValid(730)
   └─ ไม่มี cache
      └─> Fetch จาก API
          └─> Save to data/testruns/folder-730.xlsx (ไฟล์ใหม่)
              └─> Update index.json
```

### 3. User กลับมาที่ Folder 729 (ภายใน 10 นาที)

```
1. Check cache: TestRunCache.isCacheValid(729)
   └─ มี cache + valid
      └─> Load จากไฟล์ (~50ms) ⚡ เร็ว!
```

---

## API Usage

### Check Cache Validity

```typescript
import { TestRunCache } from '@/lib/testrun-cache';

const isValid = TestRunCache.isCacheValid(729);
// Returns true if cache exists and not expired (< 10 min)
```

### Load from Cache

```typescript
const testRuns = TestRunCache.load(729);
// Returns TestRunItem[] or null if not cached
```

### Save to Cache

```typescript
TestRunCache.save(729, "Sprint 23 - Release 1.5.0", testRunItems);
// Saves to data/testruns/folder-729.xlsx
// Updates index.json automatically
```

### Clear Specific Folder Cache

```typescript
TestRunCache.clearFolder(729);
// Deletes data/testruns/folder-729.xlsx
// Removes entry from index.json
```

### Clear All Test Run Caches

```typescript
TestRunCache.clearAll();
// Deletes all folder-*.xlsx files
// Resets index.json to {}
```

### Cleanup Old Caches

```typescript
TestRunCache.cleanupOld(24); // Remove caches older than 24 hours
```

### Get Cache Status

```typescript
TestRunCache.getStatus();
// Prints table of all cached folders with timestamps
```

---

## Integration in aio-api.ts

```typescript
async getTestRunsByFolder(folderID: number): Promise<TestRunItem[]> {
  // 1. Check cache first
  if (TestRunCache && TestRunCache.isCacheValid(folderID)) {
    console.log(`✅ Using cached test runs for folder ${folderID}`);
    const cached = TestRunCache.load(folderID);
    if (cached) return cached;
  }

  // 2. Fetch from API if not cached
  const cycles = await this.getTestCyclesByFolder(folderID);
  const folderName = cycles[0]?.folder?.name || `Folder ${folderID}`;
  
  console.log(`📡 Fetching test runs for folder ${folderID} from API...`);
  const testRuns = /* ... fetch logic ... */;
  
  // 3. Save to cache
  if (TestRunCache) {
    TestRunCache.save(folderID, folderName, testRuns);
  }
  
  return testRuns;
}
```

---

## CLI Commands

### View Cache Status

```bash
npm run sync-cache status
```

**Output:**
```
┌───────────┬─────────────────────────────────┬──────────────┬─────────────────┐
│ Folder ID │ Folder Name                     │ Test Runs    │ Cached At       │
├───────────┼─────────────────────────────────┼──────────────┼─────────────────┤
│ 729       │ Sprint 23 - Release 1.5.0       │ 245 items    │ 2 minutes ago   │
│ 730       │ Sprint 24 - Hotfix              │ 89 items     │ 5 minutes ago   │
└───────────┴─────────────────────────────────┴──────────────┴─────────────────┘
```

### Sync Sample Folders

```bash
npm run sync-cache runs
```

- Syncs test runs from **10 most recent folders**
- Takes 2-5 minutes
- Useful for pre-warming cache

### Clear All Caches

```bash
npm run sync-cache clear
```

Clears:
- Test Cycles cache (`data/testcycles.xlsx`)
- Folders cache (`data/folders.xlsx`)
- **All** Test Run caches (`data/testruns/folder-*.xlsx`)

---

## Cache Duration & Expiry

### Default Settings

```typescript
CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
```

### When Cache Expires

1. ถ้า timestamp ปัจจุบัน > `expiresAt` → Cache expired
2. System จะดึงข้อมูลใหม่จาก API
3. Update cache file + timestamp ใหม่

### Manual Refresh

User สามารถ force refresh ได้โดย:
1. Click refresh button บน UI (ถ้ามี)
2. รัน `npm run sync-cache clear` แล้ว refresh หน้าเว็บ
3. เรียก `aioApi.clearTestRunCache(folderId)` ใน code

---

## Excel File Structure

### Columns

| Column | Description | Example |
|--------|-------------|---------|
| testRunItemID | Unique ID | 12345 |
| testCaseID | Test Case ID | 67890 |
| testCaseKey | Test Case Key | TC-001 |
| testCaseName | Test Case Name | Login with valid credentials |
| priority | Priority | High |
| estimatedTime | Estimated Time (sec) | 120 |
| testCycleKey | Test Cycle Key | CY-2024-01 |
| testCycleTitle | Test Cycle Title | Sprint 23 Testing |
| status | Status | Passed |
| executedBy | Executed By Name | สมชาย ใจดี |
| executionDate | Execution Date (Thai) | 01/01/2567 14:30:00 |

### User Name Denormalization

Test Run cache **denormalizes** user IDs เป็นชื่อจริง:

```
executedByID: "12345" → executedBy: "สมชาย ใจดี"
```

ใช้ `user-mapping.xlsx` ในการแปลง (ถ้ามี)

---

## Performance

| Operation | Time | Cache Type |
|-----------|------|------------|
| Load from Excel | ~50ms | Excel Cache |
| Fetch from API (1 folder) | 10-30s | API |
| Fetch from API (10 folders) | 2-5 min | API |
| Check cache validity | <1ms | Index JSON |

---

## Best Practices

✅ **DO:**
- ใช้ `npm run sync-cache runs` ในตอนเช้าก่อนทำงาน (pre-warm)
- Check cache status ด้วย `npm run sync-cache status`
- Clear cache เมื่อรู้ว่ามีข้อมูลใหม่: `aioApi.clearTestRunCache(folderId)`

❌ **DON'T:**
- อย่า sync ทุก folder พร้อมกัน (ใช้เวลานาน)
- อย่า set cache duration น้อยกว่า 5 นาที (API overload)
- อย่า manual delete ไฟล์ใน `data/testruns/` (ใช้ clear command)

---

## Troubleshooting

### ❓ Cache ไม่ทำงาน

**Check:**
```bash
npm run sync-cache status
```

**Debug:**
1. ตรวจสอบว่ามี folder `data/testruns/` หรือไม่
2. ตรวจสอบว่ามี `index.json` หรือไม่
3. ตรวจสอบว่า user-mapping.xlsx มีข้อมูลหรือไม่

### ❓ ข้อมูลไม่อัพเดต

**Solution:**
```bash
# Clear cache สำหรับ folder เดียว
node -e "const { TestRunCache } = require('./lib/testrun-cache'); TestRunCache.clearFolder(729);"

# หรือ clear ทั้งหมด
npm run sync-cache clear
```

### ❓ ใช้ memory เยอะ

**Solution:**
```bash
# Cleanup old caches (> 24 hours)
node -e "const { TestRunCache } = require('./lib/testrun-cache'); TestRunCache.cleanupOld(24);"
```

---

## Technical Details

### Cache Validation Logic

```typescript
static isCacheValid(folderId: number): boolean {
  const index = this.loadIndex();
  const entry = index[folderId];
  
  if (!entry) return false;
  if (!fs.existsSync(entry.fileName)) return false;
  
  const now = Date.now();
  return now < entry.expiresAt; // Within 10 minutes
}
```

### Deduplication Logic

เมื่อมี test runs จากหลาย cycles ในฟolder เดียวกัน:
```typescript
// Keep only the most recent run per test case
const testRunMap = new Map<number, TestRunItem>();
allTestRuns.forEach((testRun) => {
  const existing = testRunMap.get(testRun.testCase.ID);
  if (!existing || 
      testRun.runs[0]?.executionDate > existing.runs[0]?.executionDate) {
    testRunMap.set(testRun.testCase.ID, testRun);
  }
});
```

---

## Future Enhancements

🔮 **Possible improvements:**
- [ ] Add "Refresh" button on UI for manual cache invalidation
- [ ] Show cache age indicator on folder selection
- [ ] Background sync for recently accessed folders
- [ ] Compress Excel files (GZIP) to save disk space
- [ ] Add cache statistics (hit rate, miss rate)
