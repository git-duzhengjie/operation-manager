'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, BookOpen, Search, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const portalItems = [
  {
    title: '快速提单',
    description: '快速提交新的运维工单',
    icon: Ticket,
    href: '/portal/quick-submit',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: '工单查询',
    description: '查看工单处理状态和进度',
    icon: Search,
    href: '/portal/tickets',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: '知识库',
    description: '查阅运维知识库文档',
    icon: BookOpen,
    href: '/portal/knowledge',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

export default function PortalPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">服务门户</h1>
          <p className="text-gray-600 mt-1">统一的运维服务入口，便于用户快速提单和查询</p>
        </div>

        {/* 服务项列表 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portalItems.map((item) => (
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

        {/* 帮助信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <CardTitle>使用帮助</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. <strong>快速提单</strong>：选择服务类型，填写问题描述，快速提交工单</p>
              <p>2. <strong>工单查询</strong>：输入工单号或关键字，查看工单处理进度</p>
              <p>3. <strong>知识库</strong>：查阅常见问题解决方案和操作指南</p>
            </div>
          </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card>
          <CardHeader>
            <CardTitle>联系我们</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">服务热线</p>
                <p className="font-medium mt-1">400-xxx-xxxx</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">工作时间</p>
                <p className="font-medium mt-1">周一至周五 9:00-18:00</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">紧急联系</p>
                <p className="font-medium mt-1">xxx-xxxx-xxxx</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
