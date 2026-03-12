'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderKanban } from 'lucide-react';
import { useState } from 'react';

// 模拟项目数据
const mockProjects = [
  {
    id: '1',
    name: '预算管理系统',
    code: 'BUDGET',
    customer: '市财政局',
    manager: '张三',
    status: 'active',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
  },
  {
    id: '2',
    name: '人事管理系统',
    code: 'HR',
    customer: '市人社局',
    manager: '李四',
    status: 'active',
    startDate: '2023-03-01',
    endDate: '2025-12-31',
  },
  {
    id: '3',
    name: '医院信息系统',
    code: 'HIS',
    customer: '市卫健委',
    manager: '王五',
    status: 'active',
    startDate: '2023-06-01',
    endDate: '2025-12-31',
  },
];

export default function ProjectsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
            <p className="text-gray-600 mt-1">管理各委办局项目信息</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增项目
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">项目总数</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <FolderKanban className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">运行中</p>
                  <p className="text-2xl font-bold mt-1">142</p>
                </div>
                <FolderKanban className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已结束</p>
                  <p className="text-2xl font-bold mt-1">14</p>
                </div>
                <FolderKanban className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索项目名称、客户..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>查询</Button>
            </div>
          </CardContent>
        </Card>

        {/* 项目列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始日期</TableHead>
                <TableHead>结束日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="font-mono">{project.code}</TableCell>
                  <TableCell>{project.customer}</TableCell>
                  <TableCell>{project.manager}</TableCell>
                  <TableCell>
                    <Badge variant="default">运行中</Badge>
                  </TableCell>
                  <TableCell>{project.startDate}</TableCell>
                  <TableCell>{project.endDate}</TableCell>
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
