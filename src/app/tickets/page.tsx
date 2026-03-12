'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

// 模拟工单数据
const mockTickets = [
  {
    id: 'WO20240101001',
    title: '服务器磁盘空间不足告警',
    type: 'incident',
    status: 'processing',
    priority: 'high',
    customer: '市财政局',
    project: '预算管理系统',
    assignee: '张三',
    createdAt: '2024-01-15 10:30:00',
  },
  {
    id: 'WO20240101002',
    title: '新员工入职账号申请',
    type: 'request',
    status: 'pending',
    priority: 'medium',
    customer: '市人社局',
    project: '人事管理系统',
    assignee: '李四',
    createdAt: '2024-01-15 11:20:00',
  },
  {
    id: 'WO20240101003',
    title: '应用系统升级变更申请',
    type: 'change',
    status: 'assigned',
    priority: 'high',
    customer: '市卫健委',
    project: '医院信息系统',
    assignee: '王五',
    createdAt: '2024-01-15 09:15:00',
  },
  {
    id: 'WO20240101004',
    title: '数据库性能问题排查',
    type: 'problem',
    status: 'processing',
    priority: 'urgent',
    customer: '市公安局',
    project: '警务综合平台',
    assignee: '赵六',
    createdAt: '2024-01-14 16:45:00',
  },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待分配', variant: 'secondary' },
  assigned: { label: '已分配', variant: 'outline' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'default' },
  closed: { label: '已关闭', variant: 'secondary' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: 'text-red-600' },
  high: { label: '高', color: 'text-orange-600' },
  medium: { label: '中', color: 'text-blue-600' },
  low: { label: '低', color: 'text-gray-600' },
};

const typeMap: Record<string, string> = {
  incident: '事件管理',
  request: '请求管理',
  change: '变更管理',
  problem: '问题管理',
};

export default function TicketsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工单管理</h1>
            <p className="text-gray-600 mt-1">管理所有运维工单</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建工单
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索工单号、标题、客户..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待分配</SelectItem>
                  <SelectItem value="assigned">已分配</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="closed">已关闭</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="incident">事件管理</SelectItem>
                  <SelectItem value="request">请求管理</SelectItem>
                  <SelectItem value="change">变更管理</SelectItem>
                  <SelectItem value="problem">问题管理</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                高级筛选
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
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
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>客户/项目</TableHead>
                <TableHead>处理人</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-blue-600">
                    {ticket.id}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {ticket.title}
                  </TableCell>
                  <TableCell>{typeMap[ticket.type]}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[ticket.status].variant}>
                      {statusMap[ticket.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={priorityMap[ticket.priority].color + ' font-medium'}>
                      {priorityMap[ticket.priority].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{ticket.customer}</div>
                      <div className="text-gray-500">{ticket.project}</div>
                    </div>
                  </TableCell>
                  <TableCell>{ticket.assignee}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {ticket.createdAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
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
