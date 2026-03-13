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
import { Plus, Search, Edit, Trash2, Building2, Loader2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  code: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 状态样式映射
const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
};

// 状态名称映射
const statusNames: Record<string, string> = {
  active: '活跃',
  inactive: '停用',
};

// 表单初始值
const emptyForm = {
  name: '',
  code: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
};

export default function CustomersPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    projectCount: 0,
  });

  // 获取客户列表
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/customers?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCustomers(result.data);
        setPagination(result.pagination);

        // 更新统计
        const totalCount = result.pagination.total;
        const activeCount = result.data.filter(
          (c: Customer) => c.status === 'active'
        ).length;
        const projects = result.data.reduce(
          (sum: number, c: Customer) => sum + (c.projectCount || 0),
          0
        );
        setStats({
          total: totalCount,
          active: activeCount,
          projectCount: projects,
        });
      } else {
        toast.error(result.error || '获取客户列表失败');
      }
    } catch (error) {
      console.error('获取客户列表异常:', error);
      toast.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers();
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setFormData(emptyForm);
    setDialogMode('add');
    setCurrentCustomer(null);
    setDialogOpen(true);
  };

  // 打开查看弹窗
  const handleView = (customer: Customer) => {
    setFormData({
      name: customer.name,
      code: customer.code || '',
      contact: customer.contact || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      status: customer.status,
    });
    setCurrentCustomer(customer);
    setDialogMode('view');
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      code: customer.code || '',
      contact: customer.contact || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      status: customer.status,
    });
    setCurrentCustomer(customer);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入客户名称');
      return;
    }

    setSubmitting(true);
    try {
      const url =
        dialogMode === 'add'
          ? '/api/customers'
          : `/api/customers/${currentCustomer?.id}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || (dialogMode === 'add' ? '创建成功' : '更新成功'));
        setDialogOpen(false);
        fetchCustomers();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('提交客户异常:', error);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('删除成功');
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
        fetchCustomers();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除客户异常:', error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
            <p className="text-gray-600 mt-1">管理各委办局客户信息</p>
          </div>
          <Button onClick={handleAdd}>
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
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
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
                  <p className="text-2xl font-bold mt-1">{stats.projectCount}</p>
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
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
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
                  placeholder="搜索客户名称、代码、联系人..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>查询</Button>
            </div>
          </CardContent>
        </Card>

        {/* 客户列表 */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 text-gray-300 mb-4" />
              <p>暂无客户数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户名称</TableHead>
                  <TableHead>代码</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>项目数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="font-mono">{customer.code || '-'}</TableCell>
                    <TableCell>{customer.contact || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.projectCount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusStyles[customer.status] || statusStyles.inactive
                        }
                      >
                        {statusNames[customer.status] || customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(customer)}
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(customer)}
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add'
                  ? '新增客户'
                  : dialogMode === 'edit'
                  ? '编辑客户'
                  : '客户详情'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add'
                  ? '填写客户信息创建新客户'
                  : dialogMode === 'edit'
                  ? '修改客户信息'
                  : '查看客户详细信息'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    客户名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入客户名称"
                    disabled={dialogMode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">客户代码</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="请输入客户代码"
                    disabled={dialogMode === 'view'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">联系人</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="请输入联系人"
                    disabled={dialogMode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="请输入联系电话"
                    disabled={dialogMode === 'view'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="请输入邮箱"
                  disabled={dialogMode === 'view'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="请输入地址"
                  rows={2}
                  disabled={dialogMode === 'view'}
                />
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
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
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
                确定要删除客户「{customerToDelete?.name}」吗？此操作不可撤销。
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
