'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Calendar, Clock, Play, Pause, Edit, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';

// 模拟例行任务数据
const mockTasks = [
  {
    id: 'SCH001',
    name: '每日系统巡检',
    type: 'inspection',
    frequency: 'daily',
    nextRun: '2024-01-16 08:00:00',
    lastRun: '2024-01-15 08:00:00',
    status: 'active',
    catalog: '系统巡检',
  },
  {
    id: 'SCH002',
    name: '每周数据库备份检查',
    type: 'backup',
    frequency: 'weekly',
    nextRun: '2024-01-21 02:00:00',
    lastRun: '2024-01-14 02:00:00',
    status: 'active',
    catalog: '备份检查',
  },
  {
    id: 'SCH003',
    name: '每月安全漏洞扫描',
    type: 'security',
    frequency: 'monthly',
    nextRun: '2024-02-01 03:00:00',
    lastRun: '2024-01-01 03:00:00',
    status: 'active',
    catalog: '安全扫描',
  },
  {
    id: 'SCH004',
    name: '每周日志归档',
    type: 'archive',
    frequency: 'weekly',
    nextRun: '2024-01-21 04:00:00',
    lastRun: '2024-01-14 04:00:00',
    status: 'paused',
    catalog: '日志管理',
  },
];

const frequencyMap: Record<string, { label: string; color: string }> = {
  once: { label: '一次性', color: 'text-gray-600' },
  daily: { label: '每日', color: 'text-blue-600' },
  weekly: { label: '每周', color: 'text-green-600' },
  monthly: { label: '每月', color: 'text-orange-600' },
};

export default function ScheduledTasksPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">例行工作</h1>
            <p className="text-gray-600 mt-1">管理定时自动执行的任务</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建任务
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总任务数</p>
                  <p className="text-2xl font-bold mt-1">24</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">运行中</p>
                  <p className="text-2xl font-bold mt-1">18</p>
                </div>
                <Play className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已暂停</p>
                  <p className="text-2xl font-bold mt-1">6</p>
                </div>
                <Pause className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日执行</p>
                  <p className="text-2xl font-bold mt-1">12</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
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
                  placeholder="搜索任务名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="执行频率" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部频率</SelectItem>
                  <SelectItem value="daily">每日</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>服务目录</TableHead>
                <TableHead>执行频率</TableHead>
                <TableHead>下次执行时间</TableHead>
                <TableHead>上次执行时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{task.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{task.catalog}</TableCell>
                  <TableCell>
                    <span className={frequencyMap[task.frequency].color + ' font-medium'}>
                      {frequencyMap[task.frequency].label}
                    </span>
                  </TableCell>
                  <TableCell>{task.nextRun}</TableCell>
                  <TableCell>{task.lastRun}</TableCell>
                  <TableCell>
                    <Switch
                      checked={task.status === 'active'}
                      onCheckedChange={(checked) => {
                        console.log('Toggle task:', task.id, checked);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
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
