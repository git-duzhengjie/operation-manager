'use client';

import { NotificationProvider } from '@/contexts/notification-context';
import { UserProvider } from '@/contexts/user-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </UserProvider>
  );
}
