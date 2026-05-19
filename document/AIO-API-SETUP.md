# 🔧 AIO API Configuration Guide

## ขั้นตอนการตั้งค่า API

### 1. หา API Token จาก AIO Test Management

1. เข้าไปที่ AIO Test Management: https://tcms.aioproduct.com
2. Login เข้าระบบ
3. ไปที่ **Settings** → **API Tokens** หรือ **Profile Settings**
4. สร้าง **New API Token**
5. Copy token ที่ได้ (หน้าตาประมาณ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. หา Project ID

จาก JSON ที่คุณมี (`response_testcyclelist.json`):
```json
{
  "jiraProjectID": 10000,  // ← นี่คือ Project ID
  ...
}
```

หรือดูจาก URL เวลาเข้า project:
- URL: `https://yourinstance.atlassian.net/browse/SCRUM`
- Project Key: `SCRUM`
- Project ID: `10000` (ดูจาก API response)

### 3. แก้ไขไฟล์ `.env.local`

เปิดไฟล์ `.env.local` และแทนค่าต่อไปนี้:

```env
# ✅ URL ของ AIO API (ปกติใช้อันนี้)
NEXT_PUBLIC_AIO_API_URL=https://tcms.aioproduct.com/aio-tcms/api/v1

# ✅ Project ID ของคุณ (เช่น 10000)
NEXT_PUBLIC_AIO_PROJECT_ID=10000

# ✅ API Token ที่ได้จากขั้นตอนที่ 1
NEXT_PUBLIC_AIO_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. เปิดใช้งาน Real API

เปิดไฟล์ `lib/aio-api.ts` และเปลี่ยน:

```typescript
// ✅ เปลี่ยนจาก true เป็น false
const USE_MOCK_DATA = false;  // ← เปลี่ยนตรงนี้
```

### 5. Restart Development Server

```bash
# หยุด server เดิม (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

---

## 📋 Checklist

- [ ] ได้ API Token จาก AIO Test Management แล้ว
- [ ] ทราบ Project ID (เช่น 10000)
- [ ] แก้ไขไฟล์ `.env.local` ครบทั้ง 3 ค่า
- [ ] เปลี่ยน `USE_MOCK_DATA = false` ใน `lib/aio-api.ts`
- [ ] Restart dev server

---

## 🔍 ตรวจสอบว่าทำงานหรือไม่

1. เปิด http://localhost:3000/test-cycles
2. เปิด Browser DevTools → Console
3. ถ้าเห็น error:
   - `API configuration is missing` → ตรวจสอบ `.env.local`
   - `401 Unauthorized` → Token ไม่ถูกต้อง
   - `403 Forbidden` → ไม่มีสิทธิ์เข้าถึง project
   - `404 Not Found` → URL หรือ Project ID ผิด

---

## 🎯 API Endpoints ที่ใช้

```
GET /project/{projectId}/test-cycle          # ดึง test cycles ทั้งหมด
GET /project/{projectId}/test-run            # ดึง test runs ทั้งหมด
GET /project/{projectId}/test-run?cycleId={id}  # ดึง test runs ของ cycle นั้น
```

---

## 💡 Tips

- **ถ้าต้องการใช้ Mock Data**: เปลี่ยน `USE_MOCK_DATA = true`
- **ถ้าต้องการใช้ Real API**: เปลี่ยน `USE_MOCK_DATA = false`
- ไฟล์ `.env.local` จะไม่ถูก commit ขึ้น Git (อยู่ใน `.gitignore` แล้ว)
- ถ้า API ช้า สามารถเพิ่ม `maxResults` parameter ให้น้อยลงได้
