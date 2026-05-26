'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  showIcon?: boolean;
}

export function LogoutButton({ variant = 'ghost', showIcon = true }: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Button variant={variant} onClick={handleLogout} className="gap-2">
      {showIcon && <LogOut className="h-4 w-4" />}
      Sign Out
    </Button>
  );
}
