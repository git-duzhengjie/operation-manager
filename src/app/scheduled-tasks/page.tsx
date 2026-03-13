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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Calendar, Clock, Play, Pause, Edit, Trash2, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ScheduledTask {
  id: number;
  name: string;
  description: string | null;
  cron_expression: string;
  task_type: string;
  task_config: Record<string, unknown> | null;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  name: string;
  description: string;
  cron_expression: string;
  task_type: string;
  status: string;
}

const taskTypeOptions = [
  { value: 'inspection', label: '系统巡检' },
  { value: 'backup', label: '备份检查' },
  { value: 'security', label: '安全扫描' },
  { value: 'archive', label: '日志归档' },
  { value: 'report', label: '报告生成' },
  { value: 'asset', label: '资产盘点' },
  { value: 'other', label: '其他' },
];

const frequencyOptions = [
  { value: '0 8 * * *', label: '每日 08:00' },
  { value: '0 2 * * 0', label: '每周日 02:00' },
  { value: '0 3 1 * *', label: '每月1日 03:00' },
  { value: '0 9 * * *', label: '每日 09:00' },
  { value: '0 5 * * 1', label: '每周一 05:00' },
  { value: 'custom', label: '自定义' },
];

const frequencyMap: Record<string, { label: string; color: string }> = {
  once: { label: '一次性', color: 'bg-gray-100 text-gray-700' },
  daily: { label: '每日', color: 'bg-blue-100 text-blue-700' },
  weekly: { label: '每周', color: 'bg-green-100 text-green-700' },
  monthly: { label: '每月', color: 'bg-orange-100 text-orange-700' },
};

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, todayExecutions: 0 });

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentTask, setCurrentTask] = useState<ScheduledTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    cron_expression: '0 8 * * *',
    task_type: 'inspection',
    status: 'active',
  });
  const [customCron, setCustomCron] = useState('');
  const [saving, setSaving] = useState(false);

  // 配置弹窗状态
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTask, setConfigTask] = useState<ScheduledTask | null>(null);
  const [configJson, setConfigJson] = useState('{}');
  const [savingConfig, setSavingConfig] = useState(false);

  // 获取任务列表
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (taskTypeFilter !== 'all') params.append('taskType', taskTypeFilter);

      const response = await fetch(`/api/scheduled-tasks?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
        // 计算统计
        const total = result.data.length;
        const active = result.data.filter((t: ScheduledTask) => t.status === 'active').length;
        const paused = result.data.filter((t: ScheduledTask) => t.status === 'paused').length;
        // 计算今日执行
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayExecutions = result.data.filter((t: ScheduledTask) => {
          if (t.status !== 'active' || !t.next_run_at) return false;
          const nextRun = new Date(t.next_run_at);
          return nextRun >= today && nextRun < tomorrow;
        }).length;
        setStats({ total, active, paused, todayExecutions });
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, statusFilter, taskTypeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 打开创建弹窗
  const handleCreate = () => {
    setDialogMode('create');
    setCurrentTask(null);
    setFormData({
      name: '',
      description: '',
      cron_expression: '0 8 * * *',
      task_type: 'inspection',
      status: 'active',
    });
    setCustomCron('');
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (task: ScheduledTask) => {
    setDialogMode('edit');
    setCurrentTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      cron_expression: task.cron_expression,
      task_type: task.task_type,
      status: task.status,
    });
    // 检查是否是预设频率
    const isPreset = frequencyOptions.some(opt => opt.value === task.cron_expression);
    if (!isPreset) {
      setCustomCron(task.cron_expression);
      setFormData(prev => ({ ...prev, cron_expression: 'custom' }));
    } else {
      setCustomCron('');
    }
    setDialogOpen(true);
  };

  // 保存任务
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请填写任务名称');
      return;
    }

    const cronExpression = formData.cron_expression === 'custom' ? customCron : formData.cron_expression;
    if (!cronExpression) {
      alert('请设置执行时间');
      return;
    }

    setSaving(true);
    try {
      const url = dialogMode === 'create' 
        ? '/api/scheduled-tasks' 
        : `/api/scheduled-tasks/${currentTask?.id}`;
      
      const body = {
        ...formData,
        cron_expression: cronExpression,
      };

      const response = await fetch(url, {
        method: dialogMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        alert(dialogMode === 'create' ? '任务创建成功' : '任务更新成功');
        setDialogOpen(false);
        fetchTasks();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (error) {
      console.error('保存任务失败:', error);
      alert('保存任务失败');
    } finally {
      setSaving(false);
    }
  };

  // 切换任务状态
  const handleToggleStatus = async (task: ScheduledTask) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(`/api/scheduled-tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchTasks();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      alert('操作失败');
    }
  };

  // 删除任务
  const handleDelete = async (task: ScheduledTask) => {
    if (!confirm(`确定要删除任务「${task.name}」吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-tasks/${task.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('任务删除成功');
        fetchTasks();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除失败');
    }
  };

  // 打开配置弹窗
  const handleConfig = (task: ScheduledTask) => {
    setConfigTask(task);
    setConfigJson(JSON.stringify(task.task_config || {}, null, 2));
    setConfigDialogOpen(true);
  };

  // 保存配置
  const handleSaveConfig = async () => {
    if (!configTask) return;

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configJson);
    } catch {
      alert('JSON 格式不正确，请检查');
      return;
    }

    setSavingConfig(true);
    try {
      const response = await fetch(`/api/scheduled-tasks/${configTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_config: parsedConfig }),
      });

      const result = await response.json();

      if (result.success) {
        alert('配置保存成功');
        setConfigDialogOpen(false);
        fetchTasks();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败');
    } finally {
      setSavingConfig(false);
    }
  };

  // 解析 cron 表达式获取频率标签
  const getFrequencyLabel = (cronExpression: string) => {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return { label: '自定义', color: 'bg-gray-100 text-gray-700' };

    const [, , dayOfMonth, , dayOfWeek] = parts;

    if (dayOfMonth === '*' && dayOfWeek === '*') {
      return frequencyMap.daily;
    } else if (dayOfMonth === '*' && dayOfWeek !== '*') {
      return frequencyMap.weekly;
    } else if (dayOfMonth !== '*' && dayOfWeek === '*') {
      return frequencyMap.monthly;
    }
    return { label: '自定义', color: 'bg-gray-100 text-gray-700' };
  };

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">例行工作</h1>
            <p className="text-gray-600 mt-1">管理定时自动执行的任务</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchTasks}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              新建任务
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总任务数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
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
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
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
                  <p className="text-2xl font-bold mt-1 text-orange-600">{stats.paused}</p>
                </div>
                <Pause className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日待执行</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{stats.todayExecutions}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索任务名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="任务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {taskTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  <SelectItem value="paused">已暂停</SelectItem>
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
                <TableHead>任务类型</TableHead>
                <TableHead>执行频率</TableHead>
                <TableHead>下次执行时间</TableHead>
                <TableHead>上次执行时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    暂无任务数据
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
                  const frequency = getFrequencyLabel(task.cron_expression);
                  const taskType = taskTypeOptions.find(opt => opt.value === task.task_type);
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="font-medium">{task.name}</span>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{taskType?.label || task.task_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={frequency.color}>{frequency.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(task.next_run_at)}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(task.last_run_at)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={task.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(task)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="icon" title="配置" onClick={() => handleConfig(task)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="编辑" onClick={() => handleEdit(task)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="删除" onClick={() => handleDelete(task)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* 创建/编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{dialogMode === 'create' ? '新建任务' : '编辑任务'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">任务名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入任务名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">任务描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_type">任务类型</Label>
                <Select 
                  value={formData.task_type} 
                  onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cron">执行频率</Label>
                <Select 
                  value={formData.cron_expression} 
                  onValueChange={(value) => setFormData({ ...formData, cron_expression: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择执行频率" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.cron_expression === 'custom' && (
                  <Input
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="Cron 表达式 (如: 0 8 * * *)"
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">运行中</SelectItem>
                    <SelectItem value="paused">已暂停</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {dialogMode === 'create' ? '创建' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 配置弹窗 */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>任务配置 - {configTask?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>配置参数 (JSON 格式)</Label>
                <Textarea
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  请输入有效的 JSON 格式配置。不同任务类型有不同的配置项，例如：
                </p>
                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded">
                  <div><strong>系统巡检:</strong> {"{"}"checkItems": ["cpu", "memory", "disk"]{"}"}</div>
                  <div><strong>备份检查:</strong> {"{"}"target": "database", "retentionDays": 30{"}"}</div>
                  <div><strong>安全扫描:</strong> {"{"}"scanType": "full", "report": true{"}"}</div>
                  <div><strong>报告生成:</strong> {"{"}"type": "alert_summary", "recipients": ["admin@example.com"]{"}"}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                保存配置
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
