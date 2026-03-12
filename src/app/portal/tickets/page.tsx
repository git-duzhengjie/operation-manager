'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Eye, Clock, User, Building2, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

// 模拟工单数据
const mockTickets = [
  {
    id: 'WO20240101001',
    title: '服务器磁盘空间不足告警',
    status: 'processing',
    priority: 'high',
    customer: '市财政局',
    project: '预算管理系统',
    assignee: '张三',
    description: '预算管理系统应用服务器磁盘空间使用率已超过90%，需要及时处理。',
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-15 11:20:00',
  },
  {
    id: 'WO20240101002',
    title: '新员工入职账号申请',
    status: 'pending',
    priority: 'medium',
    customer: '市人社局',
    project: '人事管理系统',
    assignee: '待分配',
    description: '新入职员工需要开通系统账号和邮箱。',
    createdAt: '2024-01-15 11:20:00',
    updatedAt: '2024-01-15 11:20:00',
  },
  {
    id: 'WO20240101003',
    title: '应用系统升级变更申请',
    status: 'resolved',
    priority: 'high',
    customer: '市卫健委',
    project: '医院信息系统',
    assignee: '王五',
    description: '医院信息系统需要从V2.0升级到V2.1版本。',
    createdAt: '2024-01-14 09:15:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: 'WO20240101004',
    title: '数据库性能问题排查',
    status: 'processing',
    priority: 'urgent',
    customer: '市公安局',
    project: '警务综合平台',
    assignee: '赵六',
    description: '警务综合平台数据库响应缓慢，需要进行性能排查和优化。',
    createdAt: '2024-01-14 16:45:00',
    updatedAt: '2024-01-15 08:30:00',
  },
  {
    id: 'WO20240101005',
    title: '网络访问权限申请',
    status: 'closed',
    priority: 'low',
    customer: '市财政局',
    project: '预算管理系统',
    assignee: '李四',
    description: '申请访问预算管理系统的VPN权限。',
    createdAt: '2024-01-13 14:30:00',
    updatedAt: '2024-01-14 09:00:00',
  },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待分配', variant: 'secondary' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'outline' },
  closed: { label: '已关闭', variant: 'secondary' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: 'text-red-600' },
  high: { label: '高', color: 'text-orange-600' },
  medium: { label: '中', color: 'text-blue-600' },
  low: { label: '低', color: 'text-gray-600' },
};

export default function PortalTicketsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);

  // 过滤工单
  const filteredTickets = useMemo(() => {
    if (!searchKeyword.trim()) {
      return mockTickets;
    }
    const keyword = searchKeyword.toLowerCase();
    return mockTickets.filter(ticket => 
      ticket.id.toLowerCase().includes(keyword) ||
      ticket.title.toLowerCase().includes(keyword)
    );
  }, [searchKeyword]);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('');
  };

  // 查看详情
  const handleViewDetail = (ticket: typeof mockTickets[0]) => {
    setSelectedTicket(ticket);
    setShowDetail(true);
  };

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
            <div className="flex items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="输入工单号或关键字..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchKeyword && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
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
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    暂无匹配的工单数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-blue-600">{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
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
                    <TableCell>{ticket.createdAt}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetail(ticket)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 工单详情对话框 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>工单详情</DialogTitle>
            <DialogDescription>
              工单号：{selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 mt-4">
              {/* 状态和优先级 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">当前状态</p>
                    <Badge variant={statusMap[selectedTicket.status].variant} className="mt-1">
                      {statusMap[selectedTicket.status].label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">优先级</p>
                    <span className={priorityMap[selectedTicket.priority].color + ' font-medium'}>
                      {priorityMap[selectedTicket.priority].label}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">客户</p>
                    <p className="font-medium">{selectedTicket.customer}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">项目</p>
                    <p className="font-medium">{selectedTicket.project}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">处理人</p>
                    <p className="font-medium">{selectedTicket.assignee}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 标题和描述 */}
              <div>
                <Label className="text-sm text-gray-500">标题</Label>
                <p className="font-medium text-lg mt-1">{selectedTicket.title}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">问题描述</Label>
                <p className="mt-1 text-gray-700">{selectedTicket.description}</p>
              </div>

              <Separator />

              {/* 时间信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">创建时间</p>
                    <p className="font-medium">{selectedTicket.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">更新时间</p>
                    <p className="font-medium">{selectedTicket.updatedAt}</p>
                  </div>
                </div>
              </div>

              {/* 处理进度 */}
              <div className="border-t pt-4">
                <Label className="text-sm text-gray-500">处理进度</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">工单已提交</p>
                      <p className="text-sm text-gray-500">{selectedTicket.createdAt}</p>
                    </div>
                  </div>
                  {selectedTicket.status !== 'pending' && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">已分配处理人：{selectedTicket.assignee}</p>
                        <p className="text-sm text-gray-500">系统自动分配</p>
                      </div>
                    </div>
                  )}
                  {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">工单已处理完成</p>
                        <p className="text-sm text-gray-500">{selectedTicket.updatedAt}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 关闭按钮 */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setShowDetail(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
