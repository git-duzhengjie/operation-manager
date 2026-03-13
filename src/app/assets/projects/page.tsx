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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderKanban, Loader2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  code: string | null;
  customer_id: number | null;
  customerName: string | null;
  manager: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  name: string;
  code: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  suspended: number;
}

// 状态样式映射
const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

// 状态名称映射
const statusNames: Record<string, string> = {
  active: '运行中',
  completed: '已完成',
  suspended: '已暂停',
  cancelled: '已取消',
};

// 表单初始值
const emptyForm = {
  name: '',
  code: '',
  customerId: '',
  manager: '',
  startDate: '',
  endDate: '',
  status: 'active',
  description: '',
};

export default function ProjectsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    completed: 0,
    suspended: 0,
  });

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 获取客户列表（用于下拉选择）
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?pageSize=100');
      const result = await response.json();
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error('获取客户列表异常:', error);
    }
  };

  // 获取项目列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (customerFilter !== 'all') params.set('customerId', customerFilter);
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/projects?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setProjects(result.data);
        setPagination(result.pagination);
        setStats(result.stats);
      } else {
        toast.error(result.error || '获取项目列表失败');
      }
    } catch (error) {
      console.error('获取项目列表异常:', error);
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, customerFilter, pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchProjects();
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setFormData(emptyForm);
    setDialogMode('add');
    setCurrentProject(null);
    setDialogOpen(true);
  };

  // 打开查看弹窗
  const handleView = (project: Project) => {
    setFormData({
      name: project.name,
      code: project.code || '',
      customerId: project.customer_id ? String(project.customer_id) : '',
      manager: project.manager || '',
      startDate: project.start_date ? project.start_date.split('T')[0] : '',
      endDate: project.end_date ? project.end_date.split('T')[0] : '',
      status: project.status,
      description: project.description || '',
    });
    setCurrentProject(project);
    setDialogMode('view');
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      code: project.code || '',
      customerId: project.customer_id ? String(project.customer_id) : '',
      manager: project.manager || '',
      startDate: project.start_date ? project.start_date.split('T')[0] : '',
      endDate: project.end_date ? project.end_date.split('T')[0] : '',
      status: project.status,
      description: project.description || '',
    });
    setCurrentProject(project);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    setSubmitting(true);
    try {
      const url =
        dialogMode === 'add'
          ? '/api/projects'
          : `/api/projects/${currentProject?.id}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || null,
          customerId: formData.customerId ? parseInt(formData.customerId, 10) : null,
          manager: formData.manager || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          status: formData.status,
          description: formData.description || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || (dialogMode === 'add' ? '创建成功' : '更新成功'));
        setDialogOpen(false);
        fetchProjects();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('提交项目异常:', error);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('删除成功');
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除项目异常:', error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
            <p className="text-gray-600 mt-1">管理各委办局项目信息</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增项目
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">项目总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
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
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold mt-1">{stats.completed}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已暂停</p>
                  <p className="text-2xl font-bold mt-1">{stats.suspended}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索项目名称、代码、负责人..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部客户</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">运行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="suspended">已暂停</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>查询</Button>
            </div>
          </CardContent>
        </Card>

        {/* 项目列表 */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FolderKanban className="w-12 h-12 text-gray-300 mb-4" />
              <p>暂无项目数据</p>
            </div>
          ) : (
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
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="font-mono">{project.code || '-'}</TableCell>
                    <TableCell>{project.customerName || '-'}</TableCell>
                    <TableCell>{project.manager || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusStyles[project.status] || statusStyles.active
                        }
                      >
                        {statusNames[project.status] || project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.end_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(project)}
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(project)}
                          title="删除"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                共 {pagination.total} 条记录，第 {pagination.page} /{' '}
                {pagination.totalPages} 页
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 新增/编辑/查看弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add'
                  ? '新增项目'
                  : dialogMode === 'edit'
                  ? '编辑项目'
                  : '项目详情'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add'
                  ? '填写项目信息创建新项目'
                  : dialogMode === 'edit'
                  ? '修改项目信息'
                  : '查看项目详细信息'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    项目名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入项目名称"
                    disabled={dialogMode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">项目代码</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="请输入项目代码"
                    disabled={dialogMode === 'view'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">所属客户</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                    disabled={dialogMode === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">负责人</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) =>
                      setFormData({ ...formData, manager: e.target.value })
                    }
                    placeholder="请输入负责人"
                    disabled={dialogMode === 'view'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    disabled={dialogMode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    disabled={dialogMode === 'view'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={dialogMode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">运行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="suspended">已暂停</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入项目描述"
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </div>
            </div>

            <DialogFooter>
              {dialogMode === 'view' ? (
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  关闭
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {dialogMode === 'add' ? '创建' : '保存'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认弹窗 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除项目「{projectToDelete?.name}」吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
