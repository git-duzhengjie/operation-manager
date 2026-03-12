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
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { useState } from 'react';

// 模拟客户数据
const mockCustomers = [
  {
    id: '1',
    name: '市财政局',
    code: 'FIN',
    contact: '李主任',
    phone: '138****1234',
    email: 'finance@gov.cn',
    projectCount: 5,
  },
  {
    id: '2',
    name: '市人社局',
    code: 'HR',
    contact: '王科长',
    phone: '139****5678',
    email: 'hr@gov.cn',
    projectCount: 3,
  },
  {
    id: '3',
    name: '市卫健委',
    code: 'HEALTH',
    contact: '张主任',
    phone: '137****9012',
    email: 'health@gov.cn',
    projectCount: 4,
  },
];

export default function CustomersPage() {
  const [searchKeyword, setSearchKeyword] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
            <p className="text-gray-600 mt-1">管理各委办局客户信息</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增客户
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">客户总数</p>
                  <p className="text-2xl font-bold mt-1">45</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">项目总数</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">活跃客户</p>
                  <p className="text-2xl font-bold mt-1">42</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
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
                  placeholder="搜索客户名称、联系人..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>查询</Button>
            </div>
          </CardContent>
        </Card>

        {/* 客户列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>项目数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="font-mono">{customer.code}</TableCell>
                  <TableCell>{customer.contact}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.projectCount}</TableCell>
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
