# Custom Action Buttons

ชุดปุ่ม reusable สำหรับ actions ทั่วไปในแอปพลิเคชัน เพื่อให้โค้ดสั้นลงและ maintainable

## 📦 Components

### 1. `<ExportExcelButton>`
ปุ่มสำหรับ export ข้อมูลเป็น Excel

**Props:**
- `onClick: () => void` - Callback เมื่อคลิก
- `disabled?: boolean` - ปิดการใช้งาน (default: false)
- `size?: "default" | "sm" | "lg" | "icon"` - ขนาดปุ่ม (default: "default")

**ตัวอย่าง:**
```tsx
import { ExportExcelButton } from "@/components/ui/action-buttons";

<ExportExcelButton 
  onClick={handleExportExcel} 
  disabled={data.length === 0}
/>
```

---

### 2. `<ExportPDFButton>`
ปุ่มสำหรับ export ข้อมูลเป็น PDF พร้อม loading state

**Props:**
- `onClick: () => void` - Callback เมื่อคลิก
- `disabled?: boolean` - ปิดการใช้งาน (default: false)
- `loading?: boolean` - แสดง loading spinner (default: false)
- `size?: "default" | "sm" | "lg" | "icon"` - ขนาดปุ่ม (default: "default")

**ตัวอย่าง:**
```tsx
import { ExportPDFButton } from "@/components/ui/action-buttons";

<ExportPDFButton 
  onClick={handleExportPDF} 
  disabled={data.length === 0}
  loading={isExporting}
/>
```

---

### 3. `<RefreshButton>`
ปุ่มสำหรับ refresh ข้อมูล พร้อม spinning animation

**Props:**
- `onClick: () => void` - Callback เมื่อคลิก
- `disabled?: boolean` - ปิดการใช้งาน (default: false)
- `loading?: boolean` - แสดง spinning animation (default: false)
- `size?: "default" | "sm" | "lg" | "icon"` - ขนาดปุ่ม (default: "default")
- `title?: string` - Tooltip text (default: "Refresh data from API")

**ตัวอย่าง:**
```tsx
import { RefreshButton } from "@/components/ui/action-buttons";

<RefreshButton 
  onClick={handleRefresh} 
  disabled={!selectedItems.length}
  loading={isRefreshing}
/>
```

---

### 4. `<ActionButtonGroup>`
Container สำหรับจัดกลุ่มปุ่ม actions ให้เป็นระเบียบ

**Props:**
- `children: React.ReactNode` - ปุ่มต่างๆภายใน group
- `align?: "start" | "end" | "center"` - การจัดตำแหน่ง (default: "end")

**ตัวอย่าง:**
```tsx
import { 
  ActionButtonGroup, 
  RefreshButton, 
  ExportPDFButton, 
  ExportExcelButton 
} from "@/components/ui/action-buttons";

<ActionButtonGroup align="end">
  <RefreshButton onClick={handleRefresh} />
  <ExportPDFButton onClick={handleExportPDF} loading={exporting} />
  <ExportExcelButton onClick={handleExportExcel} />
</ActionButtonGroup>
```

---

## 🎨 ข้อดีของ Custom Components

### ก่อน (โค้ดยาว 30+ บรรทัด):
```tsx
<div className="flex gap-2">
  <Button
    variant="outline"
    onClick={handleRefresh}
    disabled={selectedCycleKeys.length === 0 || loadingTestRuns}
    title="Refresh data from API"
  >
    <RefreshCw className={`mr-2 h-4 w-4 ${loadingTestRuns ? 'animate-spin' : ''}`} />
    Refresh
  </Button>
  <Button
    variant="outline"
    onClick={handleExportPDF}
    disabled={loadedTestCycles.length === 0 || exportingPDF}
  >
    {exportingPDF ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Exporting...
      </>
    ) : (
      <>
        <FileText className="mr-2 h-4 w-4" />
        Export PDF
      </>
    )}
  </Button>
  <Button
    variant="outline"
    onClick={handleExportExcel}
    disabled={loadedTestCycles.length === 0}
  >
    <FileDown className="mr-2 h-4 w-4" />
    Export Excel
  </Button>
</div>
```

### หลัง (โค้ดสั้น 9 บรรทัด):
```tsx
<ActionButtonGroup>
  <RefreshButton
    onClick={handleRefresh}
    disabled={selectedCycleKeys.length === 0 || loadingTestRuns}
    loading={loadingTestRuns}
  />
  <ExportPDFButton onClick={handleExportPDF} disabled={!loadedTestCycles.length} loading={exportingPDF} />
  <ExportExcelButton onClick={handleExportExcel} disabled={!loadedTestCycles.length} />
</ActionButtonGroup>
```

### ✅ ประโยชน์:
- **สั้นลง 70%** - จาก 30+ บรรทัด เหลือ 9 บรรทัด
- **อ่านง่ายขึ้น** - เห็นเจตนาชัดเจนทันที
- **แก้ไขง่าย** - แก้ที่เดียว ใช้ได้ทุกที่
- **Consistent** - รูปแบบเหมือนกันทุกหน้า
- **Type-safe** - TypeScript ช่วยตรวจสอบ props

---

## 🔧 การ Extend

หากต้องการเพิ่มปุ่มใหม่ เช่น `ImportButton`:

```tsx
// เพิ่มใน components/ui/action-buttons.tsx
import { Upload } from "lucide-react";

interface ImportButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export function ImportButton({ onClick, disabled, loading }: ImportButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled || loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Importing...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </>
      )}
    </Button>
  );
}
```

---

## 📝 Best Practices

1. **ใช้ ActionButtonGroup เสมอ** - เพื่อความเป็นระเบียบ
2. **ตั้งชื่อ handler ให้ชัด** - `handleExportExcel`, `handleRefresh`
3. **Disable เมื่อไม่มีข้อมูล** - ป้องกัน error
4. **ใช้ loading state** - เพื่อ UX ที่ดี
5. **เก็บ business logic แยก** - component ทำหน้าที่ UI อย่างเดียว

---

## 📍 ใช้งานที่ไหนได้บ้าง?

- ✅ [app/test-cycles/page.tsx](../app/test-cycles/page.tsx) - ใช้งานแล้ว
- ⚪ app/dashboard/page.tsx - ยังไม่มีปุ่ม export
- ⚪ app/defects/page.tsx - ตรวจสอบว่ามีปุ่มที่ควรแปลงไหม
- ⚪ app/reports/page.tsx - อาจมีปุ่ม export ในอนาคต

---

**💡 Tip:** หากหน้าใดต้องการปุ่มเหล่านี้ ให้ import มาใช้เลย ไม่ต้องเขียนใหม่!
