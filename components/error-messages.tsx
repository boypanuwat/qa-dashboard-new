'use client';

import { AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ConfigRequiredMessageProps {
  readonly title?: string;
  readonly message?: string;
  readonly showButton?: boolean;
}

export function ConfigRequiredMessage({
  title = 'Configuration Required',
  message = 'Please configure your AIO Test Management credentials in Settings to view real data.',
  showButton = true,
}: ConfigRequiredMessageProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-6">
          {message}
        </p>

        {showButton && (
          <Button
            onClick={() => router.push('/settings')}
            className="gap-2"
          >
            <SettingsIcon className="h-4 w-4" />
            Go to Settings
          </Button>
        )}
      </div>
    </div>
  );
}

interface ApiErrorMessageProps {
  readonly error: string;
  readonly details?: string;
  readonly onRetry?: () => void;
}

export function ApiErrorMessage({ error, details, onRetry }: ApiErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {error}
        </h3>
        
        {details && (
          <p className="text-sm text-muted-foreground mb-6">
            {details}
          </p>
        )}

        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
