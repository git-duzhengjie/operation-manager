'use client';

import { NotificationProvider } from '@/contexts/notification-context';
import { UserProvider } from '@/contexts/user-context';
import { PermissionProvider } from '@/contexts/permission-context';
import { CustomerServiceProvider } from '@/components/customer-service';
import { AuthGuard } from '@/components/auth-guard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PermissionProvider>
        <NotificationProvider>
          <CustomerServiceProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </CustomerServiceProvider>
        </NotificationProvider>
      </PermissionProvider>
    </UserProvider>
  );
}
