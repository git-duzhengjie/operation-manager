'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Filter, Download, Server, Network, Cpu, HardDrive, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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

export default function AssetsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats>({ server: 0, network: 0, storage: 0, application: 0 });

  // 获取资产数据
  useEffect(() => {
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

    // 防抖搜索
    const timer = setTimeout(() => {
      fetchAssets();
    }, searchKeyword ? 300 : 0);

    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, searchKeyword]);

  // 统计卡片数据
  const statsCards = useMemo(() => [
    { title: '服务器', value: stats.server, icon: Server, color: 'text-blue-600' },
    { title: '网络设备', value: stats.network, icon: Network, color: 'text-green-600' },
    { title: '存储设备', value: stats.storage, icon: HardDrive, color: 'text-orange-600' },
    { title: '应用系统', value: stats.application, icon: Cpu, color: 'text-purple-600' },
  ], [stats]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资产台账</h1>
            <p className="text-gray-600 mt-1">管理所有IT资产信息</p>
          </div>
          <Button>
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
    </AppLayout>
  );
}
