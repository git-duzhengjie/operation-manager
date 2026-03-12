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
import { Search, Filter, AlertTriangle, AlertCircle, Info, CheckCircle, Link } from 'lucide-react';
import { useState } from 'react';

// 模拟告警数据
const mockAlerts = [
  {
    id: 'ALT001',
    alertId: 'ZBX-2024-001234',
    source: 'Zabbix',
    level: 'critical',
    title: '服务器磁盘使用率超过90%',
    asset: '应用服务器-01',
    customer: '市财政局',
    status: 'processing',
    ticketId: 'WO20240101001',
    receivedAt: '2024-01-15 10:30:00',
  },
  {
    id: 'ALT002',
    alertId: 'ZBX-2024-001235',
    source: 'Zabbix',
    level: 'warning',
    title: '数据库连接数接近上限',
    asset: '数据库服务器-01',
    customer: '市人社局',
    status: 'pending',
    ticketId: null,
    receivedAt: '2024-01-15 11:20:00',
  },
  {
    id: 'ALT003',
    alertId: 'ZBX-2024-001236',
    source: 'Prometheus',
    level: 'info',
    title: '应用响应时间变慢',
    asset: '应用服务器-02',
    customer: '市卫健委',
    status: 'resolved',
    ticketId: 'WO20240101002',
    receivedAt: '2024-01-15 09:15:00',
  },
  {
    id: 'ALT004',
    alertId: 'ZBX-2024-001237',
    source: 'Zabbix',
    level: 'critical',
    title: '服务进程异常退出',
    asset: '应用服务器-03',
    customer: '市公安局',
    status: 'processing',
    ticketId: 'WO20240101003',
    receivedAt: '2024-01-15 08:45:00',
  },
];

const levelMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  critical: { 
    label: '严重', 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  },
  warning: { 
    label: '警告', 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  },
  info: { 
    label: '信息', 
    icon: Info, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待处理', variant: 'secondary' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'outline' },
};

export default function MonitoringPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监控告警</h1>
          <p className="text-gray-600 mt-1">接收和管理监控系统推送的告警</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日告警</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">严重告警</p>
                  <p className="text-2xl font-bold mt-1">23</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待处理</p>
                  <p className="text-2xl font-bold mt-1">45</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已解决</p>
                  <p className="text-2xl font-bold mt-1">1,234</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
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
                  placeholder="搜索告警ID、标题、资产..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="告警级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="critical">严重</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="info">信息</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                高级筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 告警列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>告警ID</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>资产</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>关联工单</TableHead>
                <TableHead>接收时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAlerts.map((alert) => {
                const levelInfo = levelMap[alert.level];
                const Icon = levelInfo.icon;
                return (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono">{alert.alertId}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${levelInfo.bgColor}`}>
                          <Icon className={`w-4 h-4 ${levelInfo.color}`} />
                        </div>
                        <span className={levelInfo.color + ' font-medium'}>
                          {levelInfo.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{alert.title}</TableCell>
                    <TableCell>{alert.source}</TableCell>
                    <TableCell>{alert.asset}</TableCell>
                    <TableCell>{alert.customer}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[alert.status].variant}>
                        {statusMap[alert.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {alert.ticketId ? (
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          <Link className="w-3 h-3 mr-1" />
                          {alert.ticketId}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          创建工单
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{alert.receivedAt}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">详情</Button>
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
