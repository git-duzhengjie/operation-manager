'use client';

import { NotificationProvider } from '@/contexts/notification-context';
import { UserProvider } from '@/contexts/user-context';
import { CustomerServiceProvider } from '@/components/customer-service';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <NotificationProvider>
        <CustomerServiceProvider>
          {children}
        </CustomerServiceProvider>
      </NotificationProvider>
    </UserProvider>
  );
}
