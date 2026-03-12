'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Shield, FileText, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

const settingsItems = [
  {
    title: '用户管理',
    description: '管理系统用户账户和权限',
    icon: Users,
    href: '/settings/users',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: '角色权限',
    description: '配置角色和权限信息',
    icon: Shield,
    href: '/settings/roles',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: '系统日志',
    description: '查看系统操作日志',
    icon: FileText,
    href: '/settings/logs',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-1">管理系统用户、角色和权限配置</p>
        </div>

        {/* 设置项列表 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${item.bgColor}`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">系统版本</p>
                <p className="font-medium mt-1">v1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">部署环境</p>
                <p className="font-medium mt-1">生产环境</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">数据库状态</p>
                <p className="font-medium mt-1 text-green-600">正常</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">最后更新</p>
                <p className="font-medium mt-1">2024-01-15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全配置 */}
        <Card>
          <CardHeader>
            <CardTitle>安全配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">双因素认证</p>
                  <p className="text-sm text-gray-600 mt-1">
                    支持短信验证码或动态口令
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  已启用
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">等保等级</p>
                  <p className="text-sm text-gray-600 mt-1">
                    符合等保三级要求
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  三级
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">密码策略</p>
                  <p className="text-sm text-gray-600 mt-1">
                    最少8位，包含大小写字母、数字和特殊字符
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  强
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
