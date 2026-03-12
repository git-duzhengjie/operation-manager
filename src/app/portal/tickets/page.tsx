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
import { Search, Eye } from 'lucide-react';
import { useState } from 'react';

// 模拟工单数据
const mockTickets = [
  {
    id: 'WO20240101001',
    title: '服务器磁盘空间不足告警',
    status: 'processing',
    priority: 'high',
    createdAt: '2024-01-15 10:30:00',
  },
  {
    id: 'WO20240101002',
    title: '新员工入职账号申请',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-15 11:20:00',
  },
  {
    id: 'WO20240101003',
    title: '应用系统升级变更申请',
    status: 'resolved',
    priority: 'high',
    createdAt: '2024-01-14 09:15:00',
  },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待分配', variant: 'secondary' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'outline' },
  closed: { label: '已关闭', variant: 'secondary' },
};

export default function PortalTicketsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单查询</h1>
          <p className="text-gray-600 mt-1">查看您提交的工单状态和处理进度</p>
        </div>

        {/* 搜索 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="输入工单号或关键字..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>查询</Button>
            </div>
          </CardContent>
        </Card>

        {/* 工单列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工单号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-blue-600">{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[ticket.status].variant}>
                      {statusMap[ticket.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.priority}</TableCell>
                  <TableCell>{ticket.createdAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      详情
                    </Button>
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
