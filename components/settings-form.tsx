'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfigFormData {
  aioApiUrl: string;
  aioProjectId: string;
  aioToken: string;
}

export function SettingsForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<ConfigFormData>({
    aioApiUrl: '',
    aioProjectId: '',
    aioToken: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user configuration on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();
          setFormData({
            aioApiUrl: data.aioApiUrl || '',
            aioProjectId: data.aioProjectId || '',
            aioToken: data.aioToken || '',
          });
        }
      } catch (error) {
        console.error('Error loading config:', error);
        setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่าได้' });
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว!' });
        
        // Trigger config status refetch globally
        globalThis.window?.dispatchEvent(new CustomEvent('config-updated'));
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'ไม่สามารถบันทึกการตั้งค่าได้' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ConfigFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ตั้งค่า AIO Test Management</CardTitle>
        <CardDescription>
          ตั้งค่าข้อมูลการเชื่อมต่อ AIO Test Management API ของคุณ ข้อมูลจะถูกเก็บอย่างปลอดภัย
          และใช้สำหรับการเรียก API ทั้งหมดของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">เข้าสู่ระบบด้วย:</span>
              <span>{session?.user?.email}</span>
              {session?.user?.role === 'admin' && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                  ผู้ดูแลระบบ
                </span>
              )}
            </div>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="aioApiUrl">AIO API URL</Label>
            <Input
              id="aioApiUrl"
              type="url"
              placeholder="https://tcms.aiojiraapps.com/aio-tcms/api/v1"
              value={formData.aioApiUrl}
              onChange={(e) => handleChange('aioApiUrl', e.target.value)}
              required
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              ปกติใช้: https://tcms.aiojiraapps.com/aio-tcms/api/v1
            </p>
          </div>

          {/* Project ID */}
          <div className="space-y-2">
            <Label htmlFor="aioProjectId">Project ID / Key</Label>
            <Input
              id="aioProjectId"
              type="text"
              placeholder="Project key"
              value={formData.aioProjectId}
              onChange={(e) => handleChange('aioProjectId', e.target.value)}
              required
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Project key ของคุณใน Jira (เช่น PROJ เป็นต้น)
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="aioToken">API Token</Label>
            <div className="relative">
              <Input
                id="aioToken"
                type={showToken ? 'text' : 'password'}
                placeholder="กรอก API token ของคุณ"
                value={formData.aioToken}
                onChange={(e) => handleChange('aioToken', e.target.value)}
                required
                disabled={isSaving}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              ดึง token ได้จาก AIO Test Management → Settings → API Tokens
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                บันทึกการตั้งค่า
              </>
            )}
          </Button>
        </form>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium mb-1">ข้อมูลความปลอดภัย</p>
              <p className="text-xs">
                กรุณาอย่าแชร์ API token ของคุณให้ผู้อื่น
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
