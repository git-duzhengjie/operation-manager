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
  HelpCircle,
  ClipboardList,
  Workflow,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
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
      { title: '快速提单', href: '/portal/quick-submit' },
      { title: '工单查询', href: '/portal/tickets' },
      { title: '知识库', href: '/portal/knowledge' },
    ],
  },
  {
    title: '工单管理',
    icon: Ticket,
    href: '/tickets',
    children: [
      { title: '工单列表', href: '/tickets' },
      { title: '工单统计', href: '/tickets/statistics' },
    ],
  },
  {
    title: '资产管理',
    icon: Package,
    href: '/assets',
    children: [
      { title: '资产台账', href: '/assets' },
      { title: '客户管理', href: '/assets/customers' },
      { title: '项目管理', href: '/assets/projects' },
    ],
  },
  {
    title: '知识库',
    icon: BookOpen,
    href: '/knowledge',
    children: [
      { title: '文章管理', href: '/knowledge' },
      { title: '分类标签', href: '/knowledge/tags' },
    ],
  },
  {
    title: '服务管理',
    icon: Settings,
    href: '/services',
    children: [
      { title: '服务目录', href: '/services/catalog' },
      { title: '流程配置', href: '/services/workflows' },
      { title: '表单模板', href: '/services/forms' },
    ],
  },
  {
    title: '例行工作',
    icon: Calendar,
    href: '/scheduled-tasks',
  },
  {
    title: '监控告警',
    icon: AlertTriangle,
    href: '/monitoring',
  },
  {
    title: '系统设置',
    icon: Settings,
    href: '/settings',
    children: [
      { title: '用户管理', href: '/settings/users' },
      { title: '角色权限', href: '/settings/roles' },
      { title: '系统日志', href: '/settings/logs' },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
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
  const isMenuActive = (item: typeof menuItems[0]) => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">运维管理系统</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
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
                {item.children.map((child) => (
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
