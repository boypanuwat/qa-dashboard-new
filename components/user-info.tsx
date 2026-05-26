'use client';

import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';

export function UserInfo() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
      <User className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{session.user.name}</span>
        <span className="text-xs text-muted-foreground">{session.user.email}</span>
      </div>
      {session.user.role === 'admin' && (
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
          Admin
        </span>
      )}
    </div>
  );
}
