# QA Dashboard - Database & Cache Architecture

## 📊 ภาพรวมสถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────────────┐
│                    QA Dashboard Application                      │
│                     (Next.js + React)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │    lib/aio-api.ts     │
                │   (API Client Layer)   │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐        ┌────▼─────┐
   │ Memory  │         │  Excel  │        │   AIO    │
   │ Cache   │         │  Cache  │        │   API    │
   │ (2 min) │         │(10 min) │        │          │
   └─────────┘         └─────────┘        └──────────┘
   ⚡ < 1ms            💾 ~50ms            📡 10-30s
```

---

## 🗄️ Data Structure

### 1. Test Cycles (10,000 rows limit)
```typescript
{
  ID: number;
  key: "SCRUM-CY-123";
  title: string;
  ownedByID: "6092270a...";      // User ID
  ownedByName: "วิชัย ชัยศรี";    // 🔹 Denormalized
  folderID: 729;
  folderName: "Sprint 9";         // 🔹 Denormalized
  startDate: timestamp;
  endDate: timestamp;
  isClosed: boolean;
}
```

**Storage:**
- Excel: `data/aio-cache-testcycles.xlsx`
- Sheet: TestCycles (16 columns)
- Sync: Every 10 minutes

---

### 2. Test Runs (100,000 rows from recent cycles)
```typescript
{
  runID: number;
  testRunKey: "RUN-456";
  status: "Passed" | "Failed" | "Blocked";
  testCaseID: number;
  testCaseKey: "SCRUM-TC-789";
  testCaseTitle: string;
  assignedToID: string;
  assignedToName: "สมชาย ใจดี";   // 🔹 Denormalized
  executedByID: string;
  executedByName: "วิชัย ชัยศรี";  // 🔹 Denormalized
  executionDate: timestamp;
  environment: "prod" | "staging";
}
```

**Storage:**
- Excel: `data/aio-cache-testruns.xlsx`
- Sheet: TestRuns (26 columns)
- Sync: Every 5 minutes (sample only)

---

### 3. Folders (100-500 rows)
```typescript
{
  ID: number;
  name: "Sprint 9";
  parentID: 728;
  level: 2;                       // Hierarchy level
  path: "Sprints > Sprint 9";     // 🔹 Computed
  cyclesCount: 15;
  passed: 120;
  failed: 5;
  blocked: 2;
  notRun: 3;
}
```

**Storage:**
- Excel: `data/aio-cache-folders.xlsx`
- Sheet: Folders (11 columns)
- Sync: Every 6 hours

---

### 4. Users (50-200 rows)
```typescript
{
  userId: "6092270a7a30960069fcae4e";
  displayName: "วิชัย ชัยศรี";
  email: "vichai@example.com";
  team: "QA Team";
  role: "QA Engineer";
}
```

**Storage:**
- Excel: `data/user-mapping.xlsx`
- Sheet: Users (6 columns)
- Sync: Manual (when new users join)

---

## 🔄 3-Tier Caching Strategy

### Tier 1: Memory Cache (In-Process)
```typescript
let memoryCachedCycles: TestCycle[] | null = null;
let memoryCacheTimestamp: number = 0;
const MEMORY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
```

**Pros:**
- ⚡ Ultra-fast (< 1ms)
- Zero I/O overhead

**Cons:**
- ❌ Lost on restart
- ❌ Not shared across instances

**Use case:** High-frequency reads

---

### Tier 2: Excel Cache (File-based)
```typescript
// lib/excel-cache.ts
export class TestCycleCache {
  static save(cycles: TestCycle[]): void;
  static load(): TestCycle[] | null;
  static isValid(): boolean;
  static clear(): void;
}
```

**Pros:**
- 💾 Persistent across restarts
- 📊 Human-readable (open in Excel)
- 🚀 Fast (~50ms read)
- 💰 No cost

**Cons:**
- ⚠️ Not for concurrent writes
- ⚠️ Limited query capabilities

**Use case:** Medium-frequency reads, offline development

---

### Tier 3: AIO API (Remote)
```typescript
// Fetch from AIO Test Management API
const response = await fetch(`/api/aio/project/${PROJECT_ID}/testcycle`);
```

**Pros:**
- ✅ Always up-to-date
- ✅ Single source of truth

**Cons:**
- 🐌 Slow (10-30 seconds)
- 💸 Rate limits
- 📡 Requires internet

**Use case:** Cache misses, force refresh

---

## 📦 File Structure

```
data/                                    # Git-ignored
├── aio-cache-testcycles.xlsx           # 10,000 rows, ~2MB
│   ├── Sheet: TestCycles
│   └── Sheet: Metadata
├── aio-cache-testruns.xlsx             # 100,000 rows, ~5MB
│   ├── Sheet: TestRuns
│   └── Sheet: Metadata
├── aio-cache-folders.xlsx              # 100-500 rows, ~50KB
│   ├── Sheet: Folders
│   └── Sheet: Metadata
├── user-mapping.xlsx                   # 50-200 rows, ~20KB
│   ├── Sheet: Users
│   └── Sheet: Instructions
└── .gitkeep                            # Keep folder in git

lib/
├── excel-cache.ts                      # Excel I/O layer
├── user-mapping.ts                     # User mapping logic
├── aio-api.ts                          # API client + caching
└── types.ts                            # TypeScript interfaces

scripts/
├── sync-cache.ts                       # Sync tool
└── generate-user-mapping.ts            # User mapping generator
```

---

## 🚀 Usage Commands

```bash
# Initial setup
npm install
npm run sync-cache                      # Sync all data
npm run generate-users                  # Generate user mapping

# Regular sync
npm run sync-cache cycles               # Test Cycles only
npm run sync-cache folders              # Folders only
npm run sync-cache runs                 # Test Runs (sample)
npm run sync-cache users                # User mapping

# Maintenance
npm run sync-cache status               # Check cache status
npm run sync-cache clear                # Clear all caches
```

---

## 📈 Performance Comparison

| Operation | Memory | Excel | SQLite | API |
|-----------|--------|-------|--------|-----|
| **Read 10K rows** | < 1ms | ~50ms | ~5ms | 10-30s |
| **Write 10K rows** | N/A | ~200ms | ~100ms | 5-10s |
| **Query/Filter** | Fast* | Slow† | ⚡ Fast | N/A |
| **Persistent** | ❌ | ✅ | ✅ | N/A |
| **Setup** | ✅ Easy | ✅ Easy | ⚠️ Medium | N/A |
| **Concurrent** | ✅ | ❌ | ✅ | N/A |

\* *Requires array filtering in memory*  
† *Must load entire file first*

---

## 🎯 Why Excel? (Not SQLite)

### Excel Advantages for This Use Case:
1. **Zero setup** - No database installation
2. **Human-readable** - Open and inspect data easily
3. **Export-ready** - Already in Excel format
4. **Good enough** - 10K rows performs acceptably
5. **No dependencies** - Just `xlsx` npm package

### When to Migrate to SQLite:
- ❌ Data > 50,000 rows
- ❌ Complex joins/aggregations
- ❌ Concurrent writes needed
- ❌ Real-time analytics
- ❌ Deploy to serverless (Vercel)

---

## 🔐 Security & Git

### .gitignore Rules
```gitignore
# Local data cache
/data/*.xlsx
/data/*.json
!/data/.gitkeep
```

**Why:**
- Cache files may contain sensitive data
- Files change frequently (noise in git)
- Each developer maintains their own cache

---

## 🧪 Testing Strategy

### 1. Development
```typescript
// Use mock data (fast)
const USE_MOCK_DATA = true;
```

### 2. Staging
```typescript
// Use Excel cache (realistic, fast)
const USE_MOCK_DATA = false;
// Sync once per day
```

### 3. Production
```typescript
// Use Excel cache + auto-sync
// Cron job: */10 * * * * npm run sync-cache cycles
```

---

## 📊 Data Flow Diagram

```
┌──────────┐
│  Browser │
└─────┬────┘
      │ 1. Request data
      ▼
┌─────────────────┐
│  Next.js Page   │
│  (Server Side)  │
└─────┬───────────┘
      │ 2. await aioApi.getTestCycles()
      ▼
┌─────────────────────────────────────────────┐
│           lib/aio-api.ts                     │
│  ┌────────────────────────────────────────┐ │
│  │ Check Memory Cache (< 2 min)?         │ │
│  │  ✅ → Return immediately               │ │
│  └────────────┬───────────────────────────┘ │
│               │ ❌                           │
│  ┌────────────▼───────────────────────────┐ │
│  │ Check Excel Cache (< 10 min)?         │ │
│  │  ✅ → Load → Memory → Return           │ │
│  └────────────┬───────────────────────────┘ │
│               │ ❌                           │
│  ┌────────────▼───────────────────────────┐ │
│  │ Fetch from AIO API                     │ │
│  │  → Save to Excel → Memory → Return     │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🔮 Future Enhancements

### Phase 1: Current ✅
- [x] Excel cache layer
- [x] User mapping system
- [x] Sync scripts
- [x] Documentation

### Phase 2: Optimization 🚧
- [ ] Incremental sync (only changed records)
- [ ] Compression (gzip Excel files)
- [ ] Batch processing for large datasets
- [ ] Admin UI for cache management

### Phase 3: Advanced 🔮
- [ ] SQLite migration (for complex queries)
- [ ] Real-time webhooks from AIO
- [ ] Background sync worker (BullMQ)
- [ ] Redis cache layer (distributed)
- [ ] GraphQL API wrapper

---

## 📚 Documentation Index

1. [USER-MAPPING.md](USER-MAPPING.md) - User mapping system guide
2. [EXCEL-CACHE.md](EXCEL-CACHE.md) - Excel cache detailed documentation
3. [AIO-API-SETUP.md](AIO-API-SETUP.md) - AIO API configuration

---

## ❓ FAQ

**Q: Excel ไฟล์ใหญ่ขึ้นเรื่อยๆ ทำไง?**  
A: ตั้ง limit ในการ sync (เช่น เก็บเฉพาะ 10,000 rows ล่าสุด)

**Q: Deploy Vercel ได้ไหม?**  
A: ได้ แต่ต้องเก็บ cache ที่อื่น (Redis, Vercel KV) เพราะ serverless ไม่มี persistent disk

**Q: ทำไมไม่ใช้ PostgreSQL?**  
A: Over-engineering สำหรับ read-heavy use case ขนาดนี้ Excel + Memory cache เพียงพอ

**Q: Concurrent users เท่าไหร่รับได้?**  
A: ~10-50 users ถ้ามากกว่านี้แนะนำย้ายไป SQLite หรือ PostgreSQL

**Q: ข้อมูลจะ out-of-sync ไหม?**  
A: ได้ ช่วง 0-10 นาที แต่ไม่เป็นปัญหาสำหรับ dashboard ที่ไม่ต้อง real-time

---

## 👨‍💻 Contributing

เมื่อเพิ่ม feature ใหม่ที่เกี่ยวกับ cache:
1. Update cache classes ใน `lib/excel-cache.ts`
2. Update sync script ใน `scripts/sync-cache.ts`
3. Update types ใน `lib/types.ts`
4. Update documentation ใน `EXCEL-CACHE.md`
5. Test กับข้อมูลจริง
