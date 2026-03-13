'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

// 不需要登录验证的页面路径
const publicPaths = ['/login', '/forgot-password', '/reset-password'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // 检查当前路径是否是公开页面
      const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
      
      if (isPublicPath) {
        // 公开页面，不需要验证，直接允许访问
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // 非公开页面，需要验证登录状态
      const isLoggedIn = localStorage.getItem('oms_is_logged_in');
      const userId = localStorage.getItem('oms_user_id');
      const userRole = localStorage.getItem('oms_user_role');

      if (isLoggedIn === 'true' && userId && userRole) {
        // 已登录，验证登录信息是否完整
        setIsAuthenticated(true);
      } else {
        // 未登录，清除所有登录信息并跳转到登录页
        localStorage.removeItem('oms_is_logged_in');
        localStorage.removeItem('oms_user_id');
        localStorage.removeItem('oms_user_role');
        localStorage.removeItem('oms_user_info');
        localStorage.removeItem('oms_notification_settings');
        
        setIsAuthenticated(false);
        router.push('/login');
      }
      
      setIsChecking(false);
    };

    // 使用 setTimeout 确保 localStorage 在客户端可用
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, [router, pathname]);

  // 检查中，显示加载状态
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 未认证，不渲染内容（正在跳转）
  if (!isAuthenticated) {
    return null;
  }

  // 已认证，渲染子组件
  return <>{children}</>;
}
