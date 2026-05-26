'use client';

import { useState, useEffect } from 'react';

export interface ConfigStatus {
  hasConfig: boolean;
  hasApiUrl: boolean;
  hasProjectId: boolean;
  hasApiToken: boolean;
  isComplete: boolean;
}

export function useConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/config/status');

      if (!response.ok) {
        throw new Error('Failed to check configuration status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error checking config status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Listen for config updates
    const handleConfigUpdate = () => {
      checkStatus();
    };
    
    window.addEventListener('config-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('config-updated', handleConfigUpdate);
    };
  }, []);

  return {
    status,
    isLoading,
    error,
    hasConfig: status?.isComplete ?? false,
    refetch: checkStatus,
  };
}
