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
import { Plus, Search, Filter, Download, Server, Network, Cpu, HardDrive } from 'lucide-react';
import { useState } from 'react';

// 模拟资产数据
const mockAssets = [
  {
    id: 'AST001',
    name: '应用服务器-01',
    type: 'server',
    model: 'Dell PowerEdge R740',
    ip: '192.168.1.101',
    customer: '市财政局',
    project: '预算管理系统',
    status: 'normal',
    location: '机房A区-机柜01',
  },
  {
    id: 'AST002',
    name: '核心交换机-01',
    type: 'network',
    model: 'Cisco Catalyst 9300',
    ip: '192.168.1.1',
    customer: '市财政局',
    project: '预算管理系统',
    status: 'normal',
    location: '机房A区-机柜02',
  },
  {
    id: 'AST003',
    name: '数据库服务器-01',
    type: 'server',
    model: 'Huawei RH2288H V5',
    ip: '192.168.1.102',
    customer: '市人社局',
    project: '人事管理系统',
    status: 'warning',
    location: '机房B区-机柜01',
  },
  {
    id: 'AST004',
    name: '应用服务器-02',
    type: 'server',
    model: 'Lenovo SR650',
    ip: '192.168.1.103',
    customer: '市卫健委',
    project: '医院信息系统',
    status: 'normal',
    location: '机房B区-机柜02',
  },
];

const assetTypeIcons: Record<string, any> = {
  server: Server,
  network: Network,
  storage: HardDrive,
  application: Cpu,
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  normal: { label: '正常', variant: 'default' },
  warning: { label: '告警', variant: 'outline' },
  fault: { label: '故障', variant: 'destructive' },
  offline: { label: '离线', variant: 'secondary' },
};

export default function AssetsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">服务器</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <Server className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">网络设备</p>
                  <p className="text-2xl font-bold mt-1">89</p>
                </div>
                <Network className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">存储设备</p>
                  <p className="text-2xl font-bold mt-1">45</p>
                </div>
                <HardDrive className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">应用系统</p>
                  <p className="text-2xl font-bold mt-1">234</p>
                </div>
                <Cpu className="w-8 h-8 text-purple-600" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>资产编号</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>型号</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>客户/项目</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAssets.map((asset) => {
                const Icon = assetTypeIcons[asset.type] || Server;
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono">{asset.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-500" />
                        {asset.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.type === 'server' ? '服务器' : 
                       asset.type === 'network' ? '网络设备' : 
                       asset.type === 'storage' ? '存储设备' : '应用系统'}
                    </TableCell>
                    <TableCell>{asset.model}</TableCell>
                    <TableCell className="font-mono">{asset.ip}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{asset.customer}</div>
                        <div className="text-gray-500">{asset.project}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[asset.status].variant}>
                        {statusMap[asset.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">查看</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
