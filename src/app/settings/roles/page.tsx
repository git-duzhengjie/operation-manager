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
import { Plus, Edit, Trash2, Shield, Check, X } from 'lucide-react';

// 模拟角色数据
const mockRoles = [
  {
    id: '1',
    name: '系统管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    userCount: 12,
    permissions: ['工单管理', '资产管理', '知识库', '系统设置'],
    isSystem: true,
  },
  {
    id: '2',
    name: '运维人员',
    code: 'internal',
    description: '内部运维人员，负责工单处理',
    userCount: 45,
    permissions: ['工单管理', '资产管理', '知识库'],
    isSystem: true,
  },
  {
    id: '3',
    name: '普通用户',
    code: 'external',
    description: '外部用户，可提交和查看工单',
    userCount: 199,
    permissions: ['工单提交', '工单查看', '知识库查看'],
    isSystem: true,
  },
];

export default function RolesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">角色权限</h1>
            <p className="text-gray-600 mt-1">管理系统角色和权限配置</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建角色
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">角色总数</p>
                  <p className="text-2xl font-bold mt-1">3</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">系统角色</p>
                  <p className="text-2xl font-bold mt-1">3</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">自定义角色</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 角色列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>角色代码</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>用户数</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="font-mono">{role.code}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.userCount} 人</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? 'default' : 'secondary'}>
                      {role.isSystem ? '系统角色' : '自定义'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!role.isSystem && (
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* 权限说明 */}
        <Card>
          <CardHeader>
            <CardTitle>权限说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">系统管理员</h4>
                  <p className="text-sm text-gray-600">
                    拥有系统所有功能的完整访问权限，包括用户管理、系统配置、数据导出等高级功能
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">运维人员（内部）</h4>
                  <p className="text-sm text-gray-600">
                    可以处理工单、管理资产、编辑知识库，但不能修改系统配置和用户权限
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">普通用户（外部）</h4>
                  <p className="text-sm text-gray-600">
                    可以提交工单、查看自己提交的工单、浏览知识库，权限最为受限
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">自定义角色</h4>
                  <p className="text-sm text-gray-600">
                    可根据实际需求创建自定义角色，灵活配置所需权限
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
