# Google Sheets Authentication Setup Guide

## 🎯 Overview
ระบบนี้ใช้ Google Sheets เป็น database สำหรับเก็บข้อมูล users และ configurations

## 📋 Step 1: Create Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้าง Spreadsheet ใหม่
3. สร้าง 2 tabs ดังนี้:

### Tab 1: "Users"
โครงสร้างคอลัมน์:
```
A: email | B: passwordHash | C: name | D: role | E: createdAt
```

ตัวอย่างข้อมูล (row 1 = header):
```
email                    | passwordHash                                                     | name          | role  | createdAt
admin@example.com        | $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        | Admin User    | admin | 2026-05-26T10:00:00Z
user@example.com         | $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        | Test User     | user  | 2026-05-26T10:00:00Z
```

### Tab 2: "Configs"
โครงสร้างคอลัมน์:
```
A: email | B: aioApiUrl | C: aioProjectId | D: aioToken | E: updatedAt
```

ตัวอย่างข้อมูล:
```
email                    | aioApiUrl                                              | aioProjectId | aioToken                                     | updatedAt
admin@example.com        | https://tcms.aiojiraapps.com/aio-tcms/api/v1           | SCRUM        | OTQ1YzA1YmMtNDc2My0zNWJhLThhMjktZGFk...      | 2026-05-26T10:00:00Z
```

4. Copy Spreadsheet ID จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
                                           ^^^^^^^^^^^^^^^^^
   ```

## 🔧 Step 2: Create Google Service Account

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)

2. **สร้าง Project ใหม่** (หรือใช้ project ที่มี):
   - คลิก "Select a project" → "New Project"
   - ตั้งชื่อ project (เช่น "QA Dashboard Auth")
   - คลิก "Create"

3. **Enable Google Sheets API**:
   - ไปที่ "APIs & Services" → "Library"
   - ค้นหา "Google Sheets API"
   - คลิก "Enable"

4. **สร้าง Service Account**:
   - ไปที่ "APIs & Services" → "Credentials"
   - คลิก "Create Credentials" → "Service Account"
   - ตั้งชื่อ (เช่น "qa-dashboard-auth")
   - คลิก "Create and Continue"
   - Role: เลือก "Editor" (หรือ "Basic" → "Editor")
   - คลิก "Done"

5. **Download JSON Key**:
   - คลิกที่ Service Account ที่สร้าง
   - ไปที่ tab "Keys"
   - คลิก "Add Key" → "Create new key"
   - เลือก "JSON"
   - คลิก "Create" → ไฟล์จะถูก download

6. **Copy Service Account Email**:
   - จะอยู่ในรูปแบบ: `xxx@xxx.iam.gserviceaccount.com`
   - Copy email นี้ไว้

## 🔐 Step 3: Share Google Sheet

1. เปิด Google Sheet ที่สร้างไว้
2. คลิก "Share" (มุมขวาบน)
3. Paste Service Account Email ที่ copy ไว้
4. Role: เลือก "Editor"
5. **ยกเลิกติ๊ก "Notify people"** (ไม่ต้องส่ง email)
6. คลิก "Share"

## ⚙️ Step 4: Configure Environment Variables

1. เปิดไฟล์ `.env.local`

2. **NEXTAUTH_SECRET**:
   ```bash
   # Generate on macOS/Linux
   openssl rand -base64 32
   
   # หรือใช้ online generator: https://generate-secret.vercel.app/32
   ```
   
   แทนที่:
   ```
   NEXTAUTH_SECRET=your-generated-secret-here
   ```

3. **NEXTAUTH_URL**:
   ```
   # Local development
   NEXTAUTH_URL=http://localhost:3000
   
   # Production (Vercel)
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **AUTH_SPREADSHEET_ID**:
   ```
   AUTH_SPREADSHEET_ID=1uU_Ir9Lc059CmtNAhgQiDKAchzoTZcjEJaQUxYLThc4
   ```
   (แทนด้วย ID จาก URL ของ Google Sheet)

5. **GOOGLE_SERVICE_ACCOUNT_KEY**:
   - เปิดไฟล์ JSON ที่ download มา
   - Copy **ทั้งหมด** (เป็น JSON object)
   - แปลงเป็น single line (ลบ newline ออก)
   - Paste ลงใน .env.local:
   
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"qa-dashboard-auth","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n","client_email":"qa-dashboard-auth@qa-dashboard-auth.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
   ```

## 🧪 Step 5: Create First User

ใช้ script นี้สร้าง user แรก:

```bash
# Create script
cat > scripts/create-first-user.ts << 'EOF'
import bcrypt from 'bcryptjs';

const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Admin User';

const passwordHash = bcrypt.hashSync(password, 10);

console.log('Add this row to "Users" sheet:');
console.log('---');
console.log(`${email}\t${passwordHash}\t${name}\tadmin\t${new Date().toISOString()}`);
EOF

# Run script
npx tsx scripts/create-first-user.ts your-email@example.com your-password "Your Name"
```

Copy output และ paste ใน Google Sheet (tab "Users")

## ✅ Step 6: Verify Setup

1. Restart dev server:
   ```bash
   npm run dev
   ```

2. ไปที่: http://localhost:3000/api/auth/signin

3. ถ้าเห็นหน้า login = setup สำเร็จ! 🎉

## 🔒 Security Notes

- ❌ **อย่า commit** `.env.local` หรือ Service Account JSON key
- ✅ เพิ่ม `.env.local` ใน `.gitignore`
- ✅ ใช้ Environment Variables ใน Vercel สำหรับ production
- ✅ Rotate Service Account keys เป็นประจำ (ทุก 90 วัน)
- ✅ ตั้ง Google Sheet เป็น private (share กับ service account อย่างเดียว)

## 🚀 Deploy to Vercel

1. ไปที่ Vercel Dashboard → Project Settings → Environment Variables

2. เพิ่ม variables ทั้งหมดจาก `.env.local`:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (ใช้ production URL)
   - `AUTH_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`

3. Redeploy

## 🆘 Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set"
- ตรวจสอบว่า set environment variable ใน `.env.local` แล้ว
- Restart dev server

### Error: "Error fetching user from Google Sheets"
- ตรวจสอบว่า Share Google Sheet ให้ Service Account แล้ว
- ตรวจสอบว่า Spreadsheet ID ถูกต้อง
- ตรวจสอบว่า Tab names เป็น "Users" และ "Configs" (case-sensitive)

### Error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY format"
- ตรวจสอบว่า JSON format ถูกต้อง
- ลบ newline ออก (ต้องเป็น single line)
- ตรวจสอบว่าไม่มี escape characters ผิดพลาด

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com)
