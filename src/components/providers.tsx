'use client';

import { NotificationProvider } from '@/contexts/notification-context';
import { UserProvider } from '@/contexts/user-context';
import { PermissionProvider } from '@/contexts/permission-context';
import { CustomerServiceProvider } from '@/components/customer-service';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PermissionProvider>
        <NotificationProvider>
          <CustomerServiceProvider>
            {children}
          </CustomerServiceProvider>
        </NotificationProvider>
      </PermissionProvider>
    </UserProvider>
  );
}
