'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
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
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

// 模拟表单模板数据
const mockForms = [
  {
    id: '1',
    name: '账号申请表单',
    catalog: '账号管理',
    fields: 8,
    isActive: true,
  },
  {
    id: '2',
    name: '设备采购申请表单',
    catalog: '硬件服务',
    fields: 12,
    isActive: true,
  },
  {
    id: '3',
    name: '软件安装申请表单',
    catalog: '软件服务',
    fields: 10,
    isActive: true,
  },
  {
    id: '4',
    name: '网络接入申请表单',
    catalog: '网络服务',
    fields: 9,
    isActive: true,
  },
];

export default function FormsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">表单模板</h1>
            <p className="text-gray-600 mt-1">管理自定义表单模板</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建表单
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">表单总数</p>
                  <p className="text-2xl font-bold mt-1">24</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">启用中</p>
                  <p className="text-2xl font-bold mt-1">20</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">字段类型</p>
                  <p className="text-2xl font-bold mt-1">15种</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 表单列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>表单名称</TableHead>
                <TableHead>服务目录</TableHead>
                <TableHead>字段数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>{form.catalog}</TableCell>
                  <TableCell>{form.fields} 个字段</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {form.isActive ? '启用' : '停用'}
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
