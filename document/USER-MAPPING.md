# User Mapping System

เนื่องจาก AIO API ไม่มี endpoint สำหรับดึงข้อมูล users ระบบจึงใช้ **Manual Mapping** แทน

## 📋 วิธีการใช้งาน

### 1. Generate User Mapping Template

```bash
npm install           # ติดตั้ง dependencies (รวม tsx)
npm run generate-users
```

สคริปต์จะ:
- ดึงข้อมูลจาก AIO API
- รวบรวม unique user IDs ทั้งหมด
- สร้างไฟล์ `data/user-mapping.xlsx`

### 2. กรอกข้อมูล User

เปิดไฟล์ `data/user-mapping.xlsx` แล้วกรอก:

| userId | displayName | email | team | role |
|--------|------------|-------|------|------|
| 6092270a7a30960069fcae4e | วิชัย ชัยศรี | vichai@example.com | QA Team | QA Engineer |
| 6040535ad4c6210071a4527a | สมชาย ใจดี | somchai@example.com | Dev Team | Developer |

**หมายเหตุ:**
- `displayName` (บังคับ) - ชื่อที่จะแสดงในระบบ
- `email`, `team`, `role` (optional) - สำหรับใช้ในอนาคต

### 3. Restart Server

```bash
npm run dev
```

ระบบจะโหลด mapping จากไฟล์ Excel อัตโนมัติ

### 4. ใช้งานใน Code

```typescript
import { getUserName, getUserInfo } from '@/lib/user-mapping';

// ดึงชื่อ
const ownerName = getUserName(cycle.ownedByID);

// ดึงข้อมูลเต็ม
const ownerInfo = getUserInfo(cycle.ownedByID);
console.log(ownerInfo.displayName, ownerInfo.email, ownerInfo.team);
```

---

## 🔄 Update User Mapping

เมื่อมี user ใหม่:

```bash
npm run generate-users   # สร้าง template ใหม่ (จะรักษาข้อมูลเดิมไว้)
# เปิด data/user-mapping.xlsx
# กรอกชื่อสำหรับ user ใหม่
# Restart server
```

---

## 📊 Database Schema ที่แนะนำ

ถ้าต้องการเก็บข้อมูลเพิ่มเติมในอนาคต:

### 1. **Users** (Master Data)
```typescript
{
  userId: string;        // AIO/Jira user ID
  displayName: string;   // ชื่อแสดง
  email: string;
  team: string;          // "QA Team", "Dev Team"
  role: string;          // "QA Engineer", "Developer"
  isActive: boolean;
}
```

### 2. **Test Cycles** (Transaction Data)
```typescript
{
  ID: number;
  key: string;
  title: string;
  ownedByID: string;
  ownedByName: string;    // Denormalized จาก Users
  folderID: number;
  folderName: string;     // Denormalized
  startDate: number;
  endDate: number;
  isClosed: boolean;
  stats: {
    totalTests: number;
    passed: number;
    failed: number;
    blocked: number;
  }
}
```

### 3. **Test Runs** (Execution Data)
```typescript
{
  ID: number;
  testCaseID: number;
  testCycleID: number;
  assignedToID: string;
  assignedToName: string; // Denormalized
  executedByID: string;
  executedByName: string; // Denormalized
  status: string;
  executionDate: number;
  executionTime: number;
}
```

### 4. **Folders** (Hierarchy)
```typescript
{
  ID: number;
  name: string;
  description: string;
  parentID: number;
  path: string;           // "Sprint 8 > env.prod"
  level: number;
}
```

---

## 🎯 Sync Strategy

| Data Type | Sync Frequency | Cache Duration | Notes |
|-----------|---------------|----------------|-------|
| **Users** | Manual update | Persistent | ต้องอัปเดตเมื่อมีคนใหม่ |
| **Folders** | Every 6 hours | 6 hours | ไม่ค่อยเปลี่ยน |
| **Test Cycles** | Every 10 min | 10 minutes | อัปเดตบ่อย |
| **Test Runs** | Every 5 min | 5 minutes | Real-time ที่สุด |

---

## 🔮 Future Improvements

1. **Jira API Integration** - Auto-fetch user info จาก Jira
2. **Admin UI** - หน้าจอสำหรับจัดการ user mapping
3. **Auto-sync** - ตรวจจับ user ใหม่อัตโนมัติ
4. **SQLite Migration** - ย้ายไปใช้ SQLite เพื่อ query ที่ซับซ้อนขึ้น
