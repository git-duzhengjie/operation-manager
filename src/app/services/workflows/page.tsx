'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Workflow } from 'lucide-react';

// 模拟流程数据
const mockWorkflows = [
  {
    id: '1',
    name: '事件处理流程',
    type: 'incident',
    catalog: '事件管理',
    steps: 5,
    isActive: true,
  },
  {
    id: '2',
    name: '变更审批流程',
    type: 'change',
    catalog: '变更管理',
    steps: 7,
    isActive: true,
  },
  {
    id: '3',
    name: '服务请求流程',
    type: 'request',
    catalog: '请求管理',
    steps: 4,
    isActive: true,
  },
  {
    id: '4',
    name: '问题管理流程',
    type: 'problem',
    catalog: '问题管理',
    steps: 6,
    isActive: true,
  },
];

const typeMap: Record<string, { label: string; color: string }> = {
  incident: { label: '事件管理', color: 'bg-red-100 text-red-700' },
  change: { label: '变更管理', color: 'bg-blue-100 text-blue-700' },
  request: { label: '请求管理', color: 'bg-green-100 text-green-700' },
  problem: { label: '问题管理', color: 'bg-orange-100 text-orange-700' },
};

export default function WorkflowsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">流程配置</h1>
            <p className="text-gray-600 mt-1">配置工单处理流程</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建流程
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">流程总数</p>
                  <p className="text-2xl font-bold mt-1">12</p>
                </div>
                <Workflow className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">启用中</p>
                  <p className="text-2xl font-bold mt-1">10</p>
                </div>
                <Workflow className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">服务类型</p>
                  <p className="text-2xl font-bold mt-1">4</p>
                </div>
                <Workflow className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 流程列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>流程名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>服务目录</TableHead>
                <TableHead>流程步骤</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWorkflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>
                    <Badge className={typeMap[workflow.type].color}>
                      {typeMap[workflow.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{workflow.catalog}</TableCell>
                  <TableCell>{workflow.steps} 步</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {workflow.isActive ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
