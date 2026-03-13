'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 权限定义
export const PERMISSIONS = {
  // 工单权限
  TICKET_VIEW: 'ticket_view',
  TICKET_CREATE: 'ticket_create',
  TICKET_EDIT: 'ticket_edit',
  TICKET_DELETE: 'ticket_delete',
  TICKET_PROCESS: 'ticket_process',
  TICKET_EXPORT: 'ticket_export',
  
  // 资产权限
  ASSET_VIEW: 'asset_view',
  ASSET_CREATE: 'asset_create',
  ASSET_EDIT: 'asset_edit',
  ASSET_DELETE: 'asset_delete',
  
  // 知识库权限
  KNOWLEDGE_VIEW: 'knowledge_view',
  KNOWLEDGE_CREATE: 'knowledge_create',
  KNOWLEDGE_EDIT: 'knowledge_edit',
  KNOWLEDGE_DELETE: 'knowledge_delete',
  
  // 监控权限
  MONITOR_VIEW: 'monitor_view',
  MONITOR_CONFIG: 'monitor_config',
  ALERT_HANDLE: 'alert_handle',
  
  // 用户权限
  USER_VIEW: 'user_view',
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  
  // 系统权限
  SYSTEM_CONFIG: 'system_config',
  LOG_VIEW: 'log_view',
  
  // 角色权限
  ROLE_VIEW: 'role_view',
  ROLE_CREATE: 'role_create',
  ROLE_EDIT: 'role_edit',
  ROLE_DELETE: 'role_delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// 菜单权限映射
export const MENU_PERMISSIONS: Record<string, Permission[]> = {
  '/': [], // 仪表板所有人可见
  '/portal': [],
  '/portal/quick-submit': [PERMISSIONS.TICKET_CREATE],
  '/portal/tickets': [PERMISSIONS.TICKET_VIEW],
  '/portal/knowledge': [PERMISSIONS.KNOWLEDGE_VIEW],
  '/tickets': [PERMISSIONS.TICKET_VIEW],
  '/tickets/statistics': [PERMISSIONS.TICKET_VIEW],
  '/assets': [PERMISSIONS.ASSET_VIEW],
  '/assets/customers': [PERMISSIONS.ASSET_VIEW],
  '/assets/projects': [PERMISSIONS.ASSET_VIEW],
  '/knowledge': [PERMISSIONS.KNOWLEDGE_VIEW],
  '/knowledge/tags': [PERMISSIONS.KNOWLEDGE_VIEW],
  '/services': [PERMISSIONS.SYSTEM_CONFIG],
  '/services/catalog': [PERMISSIONS.SYSTEM_CONFIG],
  '/services/workflows': [PERMISSIONS.SYSTEM_CONFIG],
  '/services/forms': [PERMISSIONS.SYSTEM_CONFIG],
  '/scheduled-tasks': [PERMISSIONS.SYSTEM_CONFIG],
  '/monitoring': [PERMISSIONS.MONITOR_VIEW],
  '/settings': [PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW],
  '/settings/users': [PERMISSIONS.USER_VIEW],
  '/settings/roles': [PERMISSIONS.ROLE_VIEW],
  '/settings/logs': [PERMISSIONS.LOG_VIEW],
};

interface PermissionContextType {
  permissions: Permission[];
  role: string;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessMenu: (href: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// 角色默认权限（当数据库权限获取失败时使用）
const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS), // 管理员拥有所有权限
  internal: [
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_EDIT,
    PERMISSIONS.TICKET_PROCESS,
    PERMISSIONS.TICKET_EXPORT,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_EDIT,
    PERMISSIONS.KNOWLEDGE_VIEW,
    PERMISSIONS.KNOWLEDGE_CREATE,
    PERMISSIONS.KNOWLEDGE_EDIT,
    PERMISSIONS.MONITOR_VIEW,
    PERMISSIONS.ALERT_HANDLE,
  ],
  external: [
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.KNOWLEDGE_VIEW,
  ],
};

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // 从 localStorage 获取用户 ID
        const userId = localStorage.getItem('oms_user_id');
        
        const response = await fetch(`/api/auth/permissions${userId ? `?userId=${userId}` : ''}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setPermissions(result.data.permissions);
          setRole(result.data.role);
          // 同步存储角色到 localStorage
          localStorage.setItem('oms_user_role', result.data.role);
        } else {
          // 使用默认权限
          const storedRole = localStorage.getItem('oms_user_role') || 'external';
          setRole(storedRole);
          setPermissions(DEFAULT_ROLE_PERMISSIONS[storedRole] || []);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        // 使用默认权限
        const storedRole = localStorage.getItem('oms_user_role') || 'external';
        setRole(storedRole);
        setPermissions(DEFAULT_ROLE_PERMISSIONS[storedRole] || []);
      } finally {
        setIsLoading(false);
      }
    };

    const isLoggedIn = localStorage.getItem('oms_is_logged_in');
    if (isLoggedIn === 'true') {
      fetchPermissions();
    } else {
      setIsLoading(false);
    }
  }, []);

  // 手动刷新权限（用于登录后刷新）
  const refreshPermissions = async () => {
    setIsLoading(true);
    try {
      // 从 localStorage 获取用户 ID
      const userId = localStorage.getItem('oms_user_id');
      
      const response = await fetch(`/api/auth/permissions${userId ? `?userId=${userId}` : ''}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPermissions(result.data.permissions);
        setRole(result.data.role);
        localStorage.setItem('oms_user_role', result.data.role);
      } else {
        const storedRole = localStorage.getItem('oms_user_role') || 'external';
        setRole(storedRole);
        setPermissions(DEFAULT_ROLE_PERMISSIONS[storedRole] || []);
      }
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      const storedRole = localStorage.getItem('oms_user_role') || 'external';
      setRole(storedRole);
      setPermissions(DEFAULT_ROLE_PERMISSIONS[storedRole] || []);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查是否拥有某个权限
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  // 检查是否拥有任意一个权限
  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  // 检查是否拥有所有权限
  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };

  // 检查是否可以访问某个菜单
  const canAccessMenu = (href: string): boolean => {
    const requiredPermissions = MENU_PERMISSIONS[href];
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // 无权限要求的菜单，所有人可见
    }
    return hasAnyPermission(requiredPermissions);
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        role,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessMenu,
        refreshPermissions: refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
