'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStatus } from '@/hooks/use-config-status';
import { Button } from '@/components/ui/button';
import { AlertCircle, X, Settings } from 'lucide-react';

export function ConfigAlertBanner() {
  const router = useRouter();
  const { status, isLoading, hasConfig } = useConfigStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from sessionStorage
  useEffect(() => {
    const dismissed = sessionStorage.getItem('config-alert-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if loading, has config, or dismissed
  if (isLoading || hasConfig || isDismissed) {
    return null;
  }

  // Don't show if config exists but incomplete (user is working on it)
  if (status?.hasConfig && !status?.isComplete) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('config-alert-dismissed', 'true');
  };

  const handleGoToSettings = () => {
    router.push('/settings');
  };

  return (
    <div className="relative border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              จำเป็นต้องตั้งค่า
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              กรุณาตั้งค่าข้อมูลการเชื่อมต่อ AIO Test Management เพื่อดูข้อมูลจริง ขณะนี้แสดงข้อมูลตัวอย่าง
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleGoToSettings}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              <Settings className="h-4 w-4" />
              ไปที่การตั้งค่า
            </Button>
            
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
