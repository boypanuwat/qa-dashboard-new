# Quick Start Guide - Excel Cache System

## 🚀 Setup (5 นาที)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. Sync ข้อมูลครั้งแรก
```bash
npm run sync-cache
```

รอ ~20 วินาที จะได้:
- ✅ `data/aio-cache-testcycles.xlsx`
- ✅ `data/aio-cache-folders.xlsx`
- ✅ `data/user-mapping.xlsx` (template)

### 3. กรอก User Mapping
เปิดไฟล์ `data/user-mapping.xlsx`:
- กรอก column **displayName** (บังคับ)
- กรอก email, team, role (optional)
- บันทึก

### 4. Restart Dev Server
```bash
npm run dev
```

---

## 📊 การทำงานของระบบ

### Request แรก (ช้า ~10s)
```
Browser → Next.js → AIO API → Excel → Memory → Response
                    📡 10s    💾      ⚡
```

### Request ถัดไป (เร็ว < 1ms)
```
Browser → Next.js → Memory Cache → Response
                    ⚡ < 1ms
```

### หลัง 2 นาที (เร็ว ~50ms)
```
Browser → Next.js → Excel Cache → Memory → Response
                    💾 50ms      ⚡
```

### หลัง 10 นาที (ช้า ~10s)
```
Browser → Next.js → AIO API → Excel + Memory → Response
                    📡 10s     💾      ⚡
```

---

## 🔄 Maintenance

### Sync ตามตารางเวลา
```bash
# ทุก 10 นาที
npm run sync-cache cycles

# ทุก 6 ชั่วโมง
npm run sync-cache folders

# เมื่อมีคนใหม่
npm run sync-cache users
```

### ตรวจสอบสถานะ
```bash
npm run sync-cache status
```

### Force Refresh
```bash
npm run sync-cache clear
npm run sync-cache
```

---

## 📁 Files ที่สร้างขึ้น

```
data/
├── aio-cache-testcycles.xlsx    # 10,000 test cycles
├── aio-cache-folders.xlsx       # 100-500 folders
├── user-mapping.xlsx            # 50-200 users
└── .gitkeep

# ไฟล์เหล่านี้ไม่ถูก commit ใน Git
```

---

## ⚡ Performance

| Scenario | Speed | Cache Hit |
|----------|-------|-----------|
| 1st request | ~10s | ❌ API |
| 2nd request (< 2 min) | < 1ms | ✅ Memory |
| After 2-10 min | ~50ms | ✅ Excel |
| After 10+ min | ~10s | ❌ API (refresh) |

---

## 🎯 ใช้งานใน Code

```typescript
import { aioApi } from '@/lib/aio-api';
import { getUserName } from '@/lib/user-mapping';

// ดึงข้อมูล (มี cache อัตโนมัติ)
const cycles = await aioApi.getTestCycles();
const folders = await aioApi.getFolders();

// แสดงชื่อ user
const ownerName = getUserName(cycle.ownedByID);

// Filter
const myCycles = cycles.filter(c => 
  getUserName(c.ownedByID) === "วิชัย ชัยศรี"
);
```

---

## 🐛 Troubleshooting

**ข้อมูลไม่อัปเดต:**
```bash
npm run sync-cache clear
npm run sync-cache
```

**User name ไม่แสดง:**
1. เช็คว่ากรอก displayName ใน `user-mapping.xlsx` แล้วหรือยัง
2. Restart dev server

**Error: Project ID missing:**
1. สร้าง `.env.local`
2. เพิ่ม `NEXT_PUBLIC_AIO_PROJECT_ID=xxx`

---

## 📚 เอกสารเพิ่มเติม

- [DATABASE-ARCHITECTURE.md](DATABASE-ARCHITECTURE.md) - สถาปัตยกรรมแบบละเอียด
- [EXCEL-CACHE.md](EXCEL-CACHE.md) - Excel cache structure
- [USER-MAPPING.md](USER-MAPPING.md) - User mapping guide

---

## ✅ Checklist

- [ ] `npm install` เสร็จแล้ว
- [ ] `npm run sync-cache` เสร็จแล้ว
- [ ] เปิด `data/user-mapping.xlsx` กรอกชื่อแล้ว
- [ ] บันทึกไฟล์ Excel
- [ ] `npm run dev` แล้วเปิด browser
- [ ] เห็นข้อมูลแสดงใน dashboard

**All done! 🎉**
