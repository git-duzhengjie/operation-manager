'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
  
  // 新建工单对话框状态
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTicketNo, setNewTicketNo] = useState('');
  
  // 表单字段
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    priority: 'medium',
    customer: '',
    project: '',
    description: '',
    assignee: '',
  });

  const handleNewTicket = () => {
    setShowNewTicket(true);
  };

  const resetForm = () => {
    setFormData({
      type: '',
      title: '',
      priority: 'medium',
      customer: '',
      project: '',
      description: '',
      assignee: '',
    });
  };

  const handleSubmit = async () => {
    // 验证
    if (!formData.type) {
      toast.error('请选择工单类型');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('请输入工单标题');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入问题描述');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成工单号
      const ticketNo = `WO${Date.now().toString().slice(-10)}`;
      setNewTicketNo(ticketNo);
      
      setShowNewTicket(false);
      setShowSuccess(true);
      resetForm();
      
      toast.success('工单创建成功');
    } catch (error) {
      toast.error('创建失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowNewTicket(false);
    resetForm();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工单管理</h1>
            <p className="text-gray-600 mt-1">管理所有运维工单</p>
          </div>
          <Button onClick={handleNewTicket}>
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
                      <Button variant="ghost" size="icon" title="查看">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="编辑">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="删除">
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

      {/* 新建工单对话框 */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建工单</DialogTitle>
            <DialogDescription>
              填写工单信息，创建新的运维工单
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">工单类型 *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">事件管理</SelectItem>
                    <SelectItem value="request">请求管理</SelectItem>
                    <SelectItem value="change">变更管理</SelectItem>
                    <SelectItem value="problem">问题管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">紧急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">客户</Label>
                <Select value={formData.customer} onValueChange={(value) => setFormData({...formData, customer: value})}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="财政局">市财政局</SelectItem>
                    <SelectItem value="人社局">市人社局</SelectItem>
                    <SelectItem value="卫健委">市卫健委</SelectItem>
                    <SelectItem value="公安局">市公安局</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">项目</Label>
                <Select value={formData.project} onValueChange={(value) => setFormData({...formData, project: value})}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="预算系统">预算管理系统</SelectItem>
                    <SelectItem value="人事系统">人事管理系统</SelectItem>
                    <SelectItem value="医院系统">医院信息系统</SelectItem>
                    <SelectItem value="警务系统">警务综合平台</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">指派给</Label>
              <Select value={formData.assignee} onValueChange={(value) => setFormData({...formData, assignee: value})}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="选择处理人（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="张三">张三</SelectItem>
                  <SelectItem value="李四">李四</SelectItem>
                  <SelectItem value="王五">王五</SelectItem>
                  <SelectItem value="赵六">赵六</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                placeholder="请输入工单标题"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">问题描述 *</Label>
              <Textarea
                id="description"
                placeholder="请详细描述问题或需求..."
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '创建中...' : '创建工单'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 成功提示 */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">工单创建成功</DialogTitle>
            <DialogDescription className="text-center">
              工单号：
              <div className="font-mono text-lg font-bold text-blue-600 mt-2">
                {newTicketNo}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="outline" onClick={() => setShowSuccess(false)}>
              关闭
            </Button>
            <Button onClick={() => setShowSuccess(false)}>
              查看工单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
