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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Download, Server, Network, Cpu, HardDrive, Loader2 } from 'lucide-react';
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
  customer: string | null;
  project: string | null;
  status: string;
  statusName: string;
  location: string;
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

export default function AssetsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats>({ server: 0, network: 0, storage: 0, application: 0 });
  
  // 新增资产弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'server',
    model: '',
    ip: '',
    customerId: '',
    projectId: '',
    status: 'normal',
    location: '',
    description: '',
  });

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
    // 防抖搜索
    const timer = setTimeout(() => {
      fetchAssets();
    }, searchKeyword ? 300 : 0);

    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, searchKeyword]);

  // 重置表单
  const resetForm = () => {
    setNewAsset({
      name: '',
      type: 'server',
      model: '',
      ip: '',
      customerId: '',
      projectId: '',
      status: 'normal',
      location: '',
      description: '',
    });
  };

  // 打开新增弹窗
  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // 提交新资产
  const handleSubmit = async () => {
    // 验证必填项
    if (!newAsset.name.trim()) {
      toast.error('请输入资产名称');
      return;
    }
    if (!newAsset.type) {
      toast.error('请选择资产类型');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAsset.name.trim(),
          type: newAsset.type,
          model: newAsset.model.trim() || null,
          ip: newAsset.ip.trim() || null,
          customerId: newAsset.customerId ? parseInt(newAsset.customerId) : null,
          projectId: newAsset.projectId ? parseInt(newAsset.projectId) : null,
          status: newAsset.status,
          location: newAsset.location.trim() || null,
          description: newAsset.description.trim() || null,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || '资产创建成功');
        setDialogOpen(false);
        resetForm();
        // 刷新列表
        fetchAssets();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create asset:', error);
      toast.error('创建资产失败');
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
    if (!newAsset.customerId) return projectOptions;
    return projectOptions.filter(p => p.customerId === parseInt(newAsset.customerId));
  }, [newAsset.customerId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资产台账</h1>
            <p className="text-gray-600 mt-1">管理所有IT资产信息</p>
          </div>
          <Button onClick={handleOpenDialog}>
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
                          <Button variant="ghost" size="sm">
                            查看
                          </Button>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
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

      {/* 新增资产弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增资产</DialogTitle>
            <DialogDescription>
              填写资产基本信息，带 * 的为必填项
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">资产名称 *</Label>
              <Input
                id="name"
                placeholder="请输入资产名称"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">资产类型 *</Label>
              <Select
                value={newAsset.type}
                onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}
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
                value={newAsset.model}
                onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ip">IP地址</Label>
              <Input
                id="ip"
                placeholder="请输入IP地址"
                value={newAsset.ip}
                onChange={(e) => setNewAsset({ ...newAsset, ip: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">所属客户</Label>
              <Select
                value={newAsset.customerId}
                onValueChange={(value) => setNewAsset({ ...newAsset, customerId: value, projectId: '' })}
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
                value={newAsset.projectId}
                onValueChange={(value) => setNewAsset({ ...newAsset, projectId: value })}
                disabled={!newAsset.customerId}
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
                value={newAsset.status}
                onValueChange={(value) => setNewAsset({ ...newAsset, status: value })}
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
                value={newAsset.location}
                onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="请输入资产描述"
                value={newAsset.description}
                onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确定添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
