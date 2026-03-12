'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Workflow, FileText, FolderTree } from 'lucide-react';
import Link from 'next/link';

const serviceItems = [
  {
    title: '服务目录',
    description: '管理IT服务场景分类',
    icon: FolderTree,
    href: '/services/catalog',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: '流程配置',
    description: '配置工单处理流程',
    icon: Workflow,
    href: '/services/workflows',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: '表单模板',
    description: '管理自定义表单模板',
    icon: FileText,
    href: '/services/forms',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export default function ServicesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">服务管理</h1>
          <p className="text-gray-600 mt-1">配置服务目录、流程和表单模板</p>
        </div>

        {/* 服务项列表 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceItems.map((item) => (
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

        {/* 说明 */}
        <Card>
          <CardHeader>
            <CardTitle>服务管理说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>服务目录</strong>：管理IT服务的分类和子分类，作为提单的基础</p>
              <p><strong>流程配置</strong>：定义工单的处理流程、审批节点和处理人员</p>
              <p><strong>表单模板</strong>：设计不同类型工单的表单字段和校验规则</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
