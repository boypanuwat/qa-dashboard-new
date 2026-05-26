import { SettingsForm } from '@/components/settings-form';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">ตั้งค่า</h1>
        </div>
        <p className="text-muted-foreground">
          จัดการการตั้งค่าส่วนตัวและข้อมูลการเชื่อมต่อ API
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
