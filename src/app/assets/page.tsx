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
import { Plus, Search, Filter, Download, Server, Network, Cpu, HardDrive, Loader2, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  name: string;
  type: string;
  typeName: string;
  model: string;
  ip: string;
  customerId?: number;
  customer: string | null;
  projectId?: number;
  project: string | null;
  status: string;
  statusName: string;
  location: string;
  specifications?: Record<string, unknown>;
  description?: string;
  createdAt?: string;
}

interface Stats {
  server: number;
  network: number;
  storage: number;
  application: number;
}

// 类型图标映射
const typeIcons: Record<string, React.ElementType> = {
  server: Server,
  network: Network,
  storage: HardDrive,
  application: Cpu,
};

// 状态样式映射
const statusStyles: Record<string, string> = {
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  fault: 'bg-red-100 text-red-700',
  offline: 'bg-gray-100 text-gray-700',
  maintenance: 'bg-blue-100 text-blue-700',
};

// 客户选项
const customerOptions = [
  { id: 1, name: '市财政局' },
  { id: 2, name: '市人社局' },
  { id: 3, name: '市卫健委' },
];

// 项目选项
const projectOptions = [
  { id: 1, name: '预算管理系统', customerId: 1 },
  { id: 2, name: '人事管理系统', customerId: 2 },
  { id: 3, name: '医院信息系统', customerId: 3 },
];

// 表单初始值
const emptyForm = {
  name: '',
  type: 'server',
  model: '',
  ip: '',
  customerId: '',
  projectId: '',
  status: 'normal',
  location: '',
  description: '',
};

export default function AssetsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats>({ server: 0, network: 0, storage: 0, application: 0 });
  
  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  
  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 获取资产数据
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchKeyword) params.set('keyword', searchKeyword);

      const response = await fetch(`/api/assets?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAssets(result.data.assets);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, searchKeyword ? 300 : 0);

    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, searchKeyword]);

  // 查看资产详情
  const handleView = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/assets/${asset.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentAsset(result.data);
        setFormData({
          name: result.data.name || '',
          type: result.data.type || 'server',
          model: result.data.model || '',
          ip: result.data.ip || '',
          customerId: result.data.customerId?.toString() || '',
          projectId: result.data.projectId?.toString() || '',
          status: result.data.status || 'normal',
          location: result.data.location || '',
          description: result.data.description || '',
        });
        setDialogMode('view');
        setDialogOpen(true);
      } else {
        toast.error('获取资产详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      toast.error('获取资产详情失败');
    }
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setFormData(emptyForm);
    setCurrentAsset(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/assets/${asset.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentAsset(result.data);
        setFormData({
          name: result.data.name || '',
          type: result.data.type || 'server',
          model: result.data.model || '',
          ip: result.data.ip || '',
          customerId: result.data.customerId?.toString() || '',
          projectId: result.data.projectId?.toString() || '',
          status: result.data.status || 'normal',
          location: result.data.location || '',
          description: result.data.description || '',
        });
        setDialogMode('edit');
        setDialogOpen(true);
      } else {
        toast.error('获取资产详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      toast.error('获取资产详情失败');
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/assets/${assetToDelete.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || '资产删除成功');
        setDeleteDialogOpen(false);
        setAssetToDelete(null);
        fetchAssets();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('删除资产失败');
    } finally {
      setDeleting(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.name.trim()) {
      toast.error('请输入资产名称');
      return;
    }
    if (!formData.type) {
      toast.error('请选择资产类型');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = dialogMode === 'edit';
      const url = isEdit ? `/api/assets/${currentAsset?.id}` : '/api/assets';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          model: formData.model.trim() || null,
          ip: formData.ip.trim() || null,
          customerId: formData.customerId ? parseInt(formData.customerId) : null,
          projectId: formData.projectId ? parseInt(formData.projectId) : null,
          status: formData.status,
          location: formData.location.trim() || null,
          description: formData.description.trim() || null,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || (isEdit ? '资产更新成功' : '资产创建成功'));
        setDialogOpen(false);
        fetchAssets();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to submit asset:', error);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 统计卡片数据
  const statsCards = useMemo(() => [
    { title: '服务器', value: stats.server, icon: Server, color: 'text-blue-600' },
    { title: '网络设备', value: stats.network, icon: Network, color: 'text-green-600' },
    { title: '存储设备', value: stats.storage, icon: HardDrive, color: 'text-orange-600' },
    { title: '应用系统', value: stats.application, icon: Cpu, color: 'text-purple-600' },
  ], [stats]);

  // 根据客户筛选项目
  const filteredProjects = useMemo(() => {
    if (!formData.customerId) return projectOptions;
    return projectOptions.filter(p => p.customerId === parseInt(formData.customerId));
  }, [formData.customerId]);

  // 格式化创建时间
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资产台账</h1>
            <p className="text-gray-600 mt-1">管理所有IT资产信息</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增资产
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={cn('w-8 h-8', stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索资产名称、IP、型号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="资产类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="server">服务器</SelectItem>
                  <SelectItem value="network">网络设备</SelectItem>
                  <SelectItem value="storage">存储设备</SelectItem>
                  <SelectItem value="application">应用系统</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="warning">告警</SelectItem>
                  <SelectItem value="fault">故障</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
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

        {/* 资产列表 */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无资产数据
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">资产编号</TableHead>
                    <TableHead className="w-48">资产名称</TableHead>
                    <TableHead className="w-24">类型</TableHead>
                    <TableHead className="w-40">型号</TableHead>
                    <TableHead className="w-32">IP地址</TableHead>
                    <TableHead className="w-28">客户</TableHead>
                    <TableHead className="w-28">状态</TableHead>
                    <TableHead className="w-40">位置</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const TypeIcon = typeIcons[asset.type] || Server;
                    return (
                      <TableRow key={asset.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-blue-600">{asset.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{asset.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{asset.typeName}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{asset.model}</TableCell>
                        <TableCell className="font-mono text-sm">{asset.ip}</TableCell>
                        <TableCell className="text-gray-600">{asset.customer || '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusStyles[asset.status] || 'bg-gray-100 text-gray-700'}>
                            {asset.statusName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{asset.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(asset)}
                              title="查看"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(asset)}
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(asset)}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 查看/新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? '资产详情' : dialogMode === 'edit' ? '编辑资产' : '新增资产'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' 
                ? '查看资产详细信息' 
                : '填写资产基本信息，带 * 的为必填项'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">资产名称 *</Label>
              <Input
                id="name"
                placeholder="请输入资产名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">资产类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择资产类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">服务器</SelectItem>
                  <SelectItem value="network">网络设备</SelectItem>
                  <SelectItem value="storage">存储设备</SelectItem>
                  <SelectItem value="application">应用系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">型号</Label>
              <Input
                id="model"
                placeholder="请输入型号"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ip">IP地址</Label>
              <Input
                id="ip"
                placeholder="请输入IP地址"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">所属客户</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value, projectId: '' })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">所属项目</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                disabled={dialogMode === 'view' || !formData.customerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="warning">告警</SelectItem>
                  <SelectItem value="fault">故障</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                  <SelectItem value="maintenance">维护中</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                placeholder="请输入位置"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="请输入资产描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={dialogMode === 'view'}
              />
            </div>

            {/* 查看模式下显示额外信息 */}
            {dialogMode === 'view' && currentAsset && (
              <>
                <div className="space-y-2">
                  <Label>资产编号</Label>
                  <div className="text-sm font-mono text-blue-600">{currentAsset.id}</div>
                </div>
                <div className="space-y-2">
                  <Label>创建时间</Label>
                  <div className="text-sm text-gray-600">{formatDate(currentAsset.createdAt)}</div>
                </div>
              </>
            )}
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
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {dialogMode === 'edit' ? '保存修改' : '确定添加'}
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
              确定要删除资产 <span className="font-medium text-gray-900">{assetToDelete?.name}</span> 吗？
              <br />
              <span className="text-red-600">此操作不可恢复。</span>
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
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
