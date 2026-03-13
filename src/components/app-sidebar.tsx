'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  Package,
  Settings,
  BookOpen,
  Calendar,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePermissions, PERMISSIONS, Permission } from '@/contexts/permission-context';

interface MenuItem {
  title: string;
  icon: typeof LayoutDashboard;
  href: string;
  permissions?: Permission[];
  children?: { title: string; href: string; permissions?: Permission[] }[];
}

const menuItems: MenuItem[] = [
  {
    title: '仪表板',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    title: '服务门户',
    icon: Building2,
    href: '/portal',
    children: [
      { title: '快速提单', href: '/portal/quick-submit', permissions: [PERMISSIONS.TICKET_CREATE] },
      { title: '工单查询', href: '/portal/tickets', permissions: [PERMISSIONS.TICKET_VIEW] },
      { title: '知识库', href: '/portal/knowledge', permissions: [PERMISSIONS.KNOWLEDGE_VIEW] },
    ],
  },
  {
    title: '工单管理',
    icon: Ticket,
    href: '/tickets',
    permissions: [PERMISSIONS.TICKET_VIEW],
    children: [
      { title: '工单列表', href: '/tickets', permissions: [PERMISSIONS.TICKET_VIEW] },
      { title: '工单统计', href: '/tickets/statistics', permissions: [PERMISSIONS.TICKET_VIEW] },
    ],
  },
  {
    title: '资产管理',
    icon: Package,
    href: '/assets',
    permissions: [PERMISSIONS.ASSET_VIEW],
    children: [
      { title: '资产台账', href: '/assets', permissions: [PERMISSIONS.ASSET_VIEW] },
      { title: '客户管理', href: '/assets/customers', permissions: [PERMISSIONS.ASSET_VIEW] },
      { title: '项目管理', href: '/assets/projects', permissions: [PERMISSIONS.ASSET_VIEW] },
    ],
  },
  {
    title: '知识库',
    icon: BookOpen,
    href: '/knowledge',
    permissions: [PERMISSIONS.KNOWLEDGE_VIEW],
    children: [
      { title: '文章管理', href: '/knowledge', permissions: [PERMISSIONS.KNOWLEDGE_VIEW] },
      { title: '分类标签', href: '/knowledge/tags', permissions: [PERMISSIONS.KNOWLEDGE_VIEW] },
    ],
  },
  {
    title: '服务管理',
    icon: Settings,
    href: '/services',
    permissions: [PERMISSIONS.SYSTEM_CONFIG],
    children: [
      { title: '服务目录', href: '/services/catalog', permissions: [PERMISSIONS.SYSTEM_CONFIG] },
      { title: '流程配置', href: '/services/workflows', permissions: [PERMISSIONS.SYSTEM_CONFIG] },
      { title: '表单模板', href: '/services/forms', permissions: [PERMISSIONS.SYSTEM_CONFIG] },
    ],
  },
  {
    title: '例行工作',
    icon: Calendar,
    href: '/scheduled-tasks',
    permissions: [PERMISSIONS.SYSTEM_CONFIG],
  },
  {
    title: '监控告警',
    icon: AlertTriangle,
    href: '/monitoring',
    permissions: [PERMISSIONS.MONITOR_VIEW],
  },
  {
    title: '系统设置',
    icon: Settings,
    href: '/settings',
    children: [
      { title: '用户管理', href: '/settings/users', permissions: [PERMISSIONS.USER_VIEW] },
      { title: '角色权限', href: '/settings/roles', permissions: [PERMISSIONS.ROLE_VIEW] },
      { title: '系统日志', href: '/settings/logs', permissions: [PERMISSIONS.LOG_VIEW] },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { hasAnyPermission, isLoading } = usePermissions();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // 根据当前路径自动展开包含该路径的菜单
  useEffect(() => {
    const newExpanded = new Set<string>();
    menuItems.forEach((item) => {
      if (item.children) {
        // 检查当前路径是否属于该菜单
        const isActive = pathname.startsWith(item.href) && item.href !== '/';
        if (isActive) {
          newExpanded.add(item.href);
        }
      }
    });
    setExpandedMenus(newExpanded);
  }, [pathname]);

  // 切换菜单展开状态
  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  // 检查菜单是否展开
  const isExpanded = (href: string) => expandedMenus.has(href);

  // 检查菜单或子菜单是否激活
  const isMenuActive = (item: MenuItem) => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  // 检查是否有权限访问菜单
  const canAccessItem = (item: MenuItem): boolean => {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    return hasAnyPermission(item.permissions);
  };

  // 检查子菜单是否有可访问项
  const hasAccessibleChildren = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => {
      if (!child.permissions || child.permissions.length === 0) {
        return true;
      }
      return hasAnyPermission(child.permissions);
    });
  };

  // 过滤菜单项
  const filteredMenuItems = menuItems.filter((item) => {
    // 如果有子菜单，检查是否有可访问的子菜单
    if (item.children) {
      return hasAccessibleChildren(item);
    }
    // 无子菜单，检查自身权限
    return canAccessItem(item);
  });

  // 过滤子菜单项
  const getFilteredChildren = (item: MenuItem) => {
    if (!item.children) return [];
    return item.children.filter((child) => {
      if (!child.permissions || child.permissions.length === 0) {
        return true;
      }
      return hasAnyPermission(child.permissions);
    });
  };

  if (isLoading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">运维管理系统</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 py-8 text-center text-gray-400">加载中...</div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">运维管理系统</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {filteredMenuItems.map((item) => (
          <div key={item.href} className="mb-1">
            <div className="flex items-center">
              <Link
                href={item.href}
                className={cn(
                  'flex-1 flex items-center px-4 py-2 text-sm font-medium transition-colors',
                  isMenuActive(item)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
              {item.children && (
                <button
                  onClick={() => toggleMenu(item.href)}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isExpanded(item.href) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {item.children && isExpanded(item.href) && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100">
                {getFilteredChildren(item).map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'block px-8 py-2 text-sm transition-colors',
                      pathname === child.href
                        ? 'text-blue-700 font-medium bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
