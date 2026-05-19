# Google Sheets Integration for Defect Analytics

## Overview
เนื่องจากไม่มีสิทธิ์ใช้ Jira API โดยตรง เราสามารถ export ข้อมูล defects จาก Jira เป็น CSV แล้วนำเข้า Google Sheets และดึงข้อมูลมาแสดงใน Dashboard ได้

## ขั้นตอนการ Setup

### 1. Export ข้อมูลจาก Jira
1. ไปที่ Jira → Filters → Create filter สำหรับ defects/bugs
2. Export ผลลัพธ์เป็น CSV (Export → CSV)
3. ข้อมูลที่ควรมี:
   - Issue Key
   - Summary
   - Status
   - Priority/Severity (Critical, Major, Minor)
   - Created Date
   - Resolved Date
   - Component/Module
   - Reporter
   - Assignee

### 2. นำเข้า Google Sheets
1. สร้าง Google Sheet ใหม่
2. Import CSV: File → Import → Upload → Replace spreadsheet
3. ตั้งชื่อ Sheet เช่น "Defects_Data"
4. จัดรูปแบบคอลัมน์:
   ```
   | Issue Key | Summary | Status | Severity | Created | Resolved | Module | Reopened |
   |-----------|---------|--------|----------|---------|----------|--------|----------|
   | BUG-123   | ...     | Done   | Critical | ...     | ...      | Login  | No       |
   ```

### 3. Publish Sheet as CSV
**วิธีที่ 1: Publish to Web (แนะนำสำหรับ public data)**
1. File → Share → Publish to web
2. เลือก Sheet ที่ต้องการ
3. Format: CSV
4. คัดลอก URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/export?format=csv&gid=[GID]`

**วิธีที่ 2: Google Sheets API (แนะนำสำหรับ private data)**
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. Enable Google Sheets API
4. สร้าง Service Account และดาวน์โหลด JSON key
5. Share Google Sheet ให้กับ Service Account email
6. ใช้ `googleapis` package ใน Node.js

## ตัวอย่างโค้ดสำหรับดึงข้อมูล

### วิธีที่ 1: Fetch CSV URL (ง่ายที่สุด)

**สร้างไฟล์ `lib/google-sheets.ts`:**

```typescript
import Papa from 'papaparse';

export interface DefectRow {
  issueKey: string;
  summary: string;
  status: string;
  severity: 'Critical' | 'Major' | 'Minor';
  created: string;
  resolved?: string;
  module: string;
  reopened: string;
}

// แทนที่ด้วย URL จริงจาก Google Sheets
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv';

// In-memory cache
let cachedData: DefectRow[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function fetchDefectsFromSheet(): Promise<DefectRow[]> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();
    
    const result = Papa.parse<DefectRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    cachedData = result.data;
    lastFetch = now;
    
    return cachedData;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return cachedData || []; // Return cached data if fetch fails
  }
}

// Transform functions for dashboard
export function calculateDefectMetrics(defects: DefectRow[]) {
  const total = defects.length;
  const critical = defects.filter(d => d.severity === 'Critical').length;
  const major = defects.filter(d => d.severity === 'Major').length;
  const minor = defects.filter(d => d.severity === 'Minor').length;
  
  const reopened = defects.filter(d => d.reopened === 'Yes').length;
  const reopenRate = total > 0 ? (reopened / total) * 100 : 0;

  return {
    total,
    critical,
    major,
    minor,
    reopenRate,
  };
}

export function groupDefectsByModule(defects: DefectRow[]) {
  const moduleMap = new Map<string, { critical: number; major: number; minor: number }>();
  
  defects.forEach(defect => {
    if (!moduleMap.has(defect.module)) {
      moduleMap.set(defect.module, { critical: 0, major: 0, minor: 0 });
    }
    const stats = moduleMap.get(defect.module)!;
    
    if (defect.severity === 'Critical') stats.critical++;
    else if (defect.severity === 'Major') stats.major++;
    else if (defect.severity === 'Minor') stats.minor++;
  });

  return Array.from(moduleMap.entries())
    .map(([module, severity]) => ({
      module,
      count: severity.critical + severity.major + severity.minor,
      severity,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
}
```

**ติดตั้ง dependencies:**
```bash
npm install papaparse
npm install -D @types/papaparse
```

**สร้าง API route `app/api/defects/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { fetchDefectsFromSheet, calculateDefectMetrics, groupDefectsByModule } from '@/lib/google-sheets';

export async function GET() {
  try {
    const defects = await fetchDefectsFromSheet();
    const metrics = calculateDefectMetrics(defects);
    const topModules = groupDefectsByModule(defects);

    return NextResponse.json({
      metrics,
      topModules,
      defects, // raw data for charts
    });
  } catch (error) {
    console.error('Error in defects API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defects data' },
      { status: 500 }
    );
  }
}
```

**ใช้งานใน component `app/defects/page.tsx`:**

```typescript
"use client";

import { useEffect, useState } from "react";

export default function DefectsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/defects')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data</div>;

  // Render with real data
  return (
    <div>
      <h1>Total Defects: {data.metrics.total}</h1>
      {/* ... */}
    </div>
  );
}
```

### วิธีที่ 2: Google Sheets API (สำหรับ Private Data)

**ติดตั้ง dependencies:**
```bash
npm install googleapis
```

**สร้างไฟล์ `lib/google-sheets-api.ts`:**

```typescript
import { google } from 'googleapis';

// สร้าง Service Account และดาวน์โหลด JSON key
// เก็บไว้ใน environment variables
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'Defects_Data'; // ชื่อ sheet

export async function getDefectsFromGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:H`, // Columns A-H
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return [];

  // First row is header
  const [header, ...dataRows] = rows;

  // Map to objects
  return dataRows.map(row => ({
    issueKey: row[0],
    summary: row[1],
    status: row[2],
    severity: row[3],
    created: row[4],
    resolved: row[5],
    module: row[6],
    reopened: row[7],
  }));
}
```

**ตั้งค่า environment variables (`.env.local`):**

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
GOOGLE_SHEET_ID='1a2b3c4d5e6f...'
```

## ตัวอย่างข้อมูลใน Google Sheets

| Issue Key | Summary | Status | Severity | Created | Resolved | Module | Reopened |
|-----------|---------|--------|----------|---------|----------|--------|----------|
| BUG-001 | Payment fails on checkout | Done | Critical | 2026-05-01 | 2026-05-03 | Payment | No |
| BUG-002 | Login timeout error | Done | Major | 2026-05-02 | 2026-05-05 | Login | Yes |
| BUG-003 | Notification delay | Open | Minor | 2026-05-10 | | Notification | No |
| BUG-004 | Cart total incorrect | Done | Critical | 2026-05-05 | 2026-05-07 | Shopping Cart | No |

## Automation Tips

### 1. Auto-sync จาก Jira
- ใช้ Zapier หรือ Make.com เชื่อม Jira → Google Sheets
- ตั้ง trigger: เมื่อ issue ถูกสร้าง/อัพเดท → อัพเดท Google Sheets

### 2. Scheduled Updates
- ใช้ Google Apps Script ใน Sheets เพื่อ refresh data จาก Jira ทุก ๆ ชั่วโมง
- หรือใช้ Cron job ใน Next.js (Vercel Cron Jobs)

### 3. Real-time Updates
- ใช้ WebSocket หรือ Server-Sent Events ถ้าต้องการ real-time
- หรือ polling ทุก 1-5 นาที (ใน client component)

## Best Practices

1. **Cache Data**: เก็บข้อมูลใน memory cache อย่างน้อย 5-10 นาที
2. **Error Handling**: มี fallback เป็น mock data เมื่อดึงข้อมูลไม่ได้
3. **Loading States**: แสดง skeleton/loading เมื่อดึงข้อมูล
4. **Data Validation**: Validate ข้อมูลจาก Sheets ก่อนใช้งาน
5. **Security**: อย่า expose Sheet URL ที่ public ถ้ามีข้อมูลสำคัญ

## สรุป

**แนะนำใช้วิธีที่ 1 (CSV URL)** สำหรับ:
- เริ่มต้นใช้งานง่าย ไม่ซับซ้อน
- ข้อมูล public หรือ internal only
- ไม่ต้องการ authentication

**แนะนำใช้วิธีที่ 2 (API)** สำหรับ:
- ข้อมูลที่ sensitive ไม่ควร public
- ต้องการ access control ที่ดีกว่า
- ต้องการ write data กลับไปที่ Sheet

---

**ติดปัญหา?** ตรวจสอบ:
- ✅ Sheet ถูก publish/share แล้วหรือยัง
- ✅ URL ถูกต้อง และเข้าถึงได้
- ✅ Format ข้อมูลใน Sheet ตรงกับ type definitions
- ✅ CORS settings (ถ้าดึงจาก client-side)
