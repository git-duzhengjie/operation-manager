'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Workflow,
  ChevronRight,
  GripVertical,
  Play,
  CheckCircle2,
  AlertCircle,
  Bell,
  GitBranch,
  CircleDot,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 流程步骤类型
type StepType = 'start' | 'approval' | 'processing' | 'notification' | 'condition' | 'end';

interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  order: number;
  assignee?: {
    type: 'user' | 'role' | 'department' | 'script';
    value: string;
  };
  timeout?: number;
}

interface Workflow {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  catalogId: number | null;
  catalogName: string;
  description: string | null;
  steps: WorkflowStep[];
  stepCount: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStats {
  total: number;
  active: number;
  types: number;
}

// 步骤类型配置
const stepTypeConfig: Record<StepType, { label: string; color: string; icon: React.ReactNode }> = {
  start: { label: '开始', color: 'bg-green-500', icon: <Play className="w-3 h-3" /> },
  approval: { label: '审批', color: 'bg-orange-500', icon: <CheckCircle2 className="w-3 h-3" /> },
  processing: { label: '处理', color: 'bg-blue-500', icon: <CircleDot className="w-3 h-3" /> },
  notification: { label: '通知', color: 'bg-purple-500', icon: <Bell className="w-3 h-3" /> },
  condition: { label: '条件', color: 'bg-yellow-500', icon: <GitBranch className="w-3 h-3" /> },
  end: { label: '结束', color: 'bg-gray-500', icon: <CircleDot className="w-3 h-3" /> },
};

// 流程类型颜色
const typeColors: Record<string, string> = {
  incident: 'bg-red-100 text-red-700',
  change: 'bg-blue-100 text-blue-700',
  request: 'bg-green-100 text-green-700',
  problem: 'bg-orange-100 text-orange-700',
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({ total: 0, active: 0, types: 4 });
  const [typeOptions, setTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    type: 'request',
    catalogName: '',
    description: '',
    isActive: true,
    steps: [] as WorkflowStep[],
  });

  // 步骤编辑状态
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);

  // 获取流程列表
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterActive !== 'all') params.set('isActive', filterActive);

      const response = await fetch(`/api/workflows?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setWorkflows(result.data.workflows);
        setStats(result.data.stats);
        setTypeOptions(result.data.typeOptions);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('获取失败', { description: '无法获取流程列表' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [filterType, filterActive]);

  // 打开新建对话框
  const handleCreate = () => {
    setEditingWorkflow(null);
    setFormData({
      name: '',
      type: 'request',
      catalogName: '',
      description: '',
      isActive: true,
      steps: [
        { id: `s1`, name: '开始', type: 'start', order: 1 },
        { id: `s2`, name: '结束', type: 'end', order: 2 },
      ],
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      type: workflow.type,
      catalogName: workflow.catalogName || '',
      description: workflow.description || '',
      isActive: workflow.isActive,
      steps: [...workflow.steps],
    });
    setDialogOpen(true);
  };

  // 保存流程
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入流程名称');
      return;
    }
    if (formData.steps.length < 2) {
      toast.error('流程至少需要开始和结束两个步骤');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/workflows';
      const method = editingWorkflow ? 'PUT' : 'POST';
      const body = editingWorkflow
        ? { id: editingWorkflow.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingWorkflow ? '更新成功' : '创建成功', {
          description: `流程已${editingWorkflow ? '更新' : '创建'}`,
        });
        setDialogOpen(false);
        fetchWorkflows();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('保存失败', { description: '无法保存流程' });
    } finally {
      setSaving(false);
    }
  };

  // 删除流程
  const handleDelete = async () => {
    if (!deletingId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/workflows?id=${deletingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('删除成功', { description: '流程已删除' });
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchWorkflows();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('删除失败', { description: '无法删除流程' });
    } finally {
      setSaving(false);
    }
  };

  // 添加步骤
  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `s${Date.now()}`,
      name: '新步骤',
      type: 'processing',
      order: formData.steps.length,
    };
    // 插入到结束节点之前
    const steps = [...formData.steps];
    const endIndex = steps.findIndex(s => s.type === 'end');
    if (endIndex > 0) {
      steps.splice(endIndex, 0, newStep);
      // 重新排序
      steps.forEach((s, i) => s.order = i + 1);
    } else {
      steps.push(newStep);
    }
    setFormData({ ...formData, steps });
  };

  // 编辑步骤
  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep({ ...step });
    setStepDialogOpen(true);
  };

  // 保存步骤
  const handleSaveStep = () => {
    if (!editingStep) return;
    const steps = formData.steps.map(s => s.id === editingStep.id ? editingStep : s);
    setFormData({ ...formData, steps });
    setStepDialogOpen(false);
    setEditingStep(null);
  };

  // 删除步骤
  const handleDeleteStep = (stepId: string) => {
    const step = formData.steps.find(s => s.id === stepId);
    if (step?.type === 'start' || step?.type === 'end') {
      toast.error('不能删除开始或结束节点');
      return;
    }
    const steps = formData.steps.filter(s => s.id !== stepId);
    // 重新排序
    steps.forEach((s, i) => s.order = i + 1);
    setFormData({ ...formData, steps });
  };

  // 查看流程详情
  const handleViewDetail = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setDetailDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">流程配置</h1>
            <p className="text-gray-600 mt-1">配置工单处理流程和审批节点</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            新建流程
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">流程总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <Workflow className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">启用中</p>
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                </div>
                <Workflow className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">流程类型</p>
                  <p className="text-2xl font-bold mt-1">{stats.types}</p>
                </div>
                <Workflow className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选栏 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">流程类型：</span>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="全部类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">状态：</span>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 流程列表 */}
        <Card>
          {loading ? (
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              加载中...
            </CardContent>
          ) : workflows.length === 0 ? (
            <CardContent className="p-8 text-center text-gray-500">
              暂无流程数据，点击&quot;新建流程&quot;创建第一个流程
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>流程名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>服务目录</TableHead>
                  <TableHead>流程步骤</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[workflow.type] || 'bg-gray-100 text-gray-700'}>
                        {workflow.typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{workflow.catalogName}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleViewDetail(workflow)}
                      >
                        {workflow.stepCount} 步
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </TableCell>
                    <TableCell>v{workflow.version}</TableCell>
                    <TableCell>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                        {workflow.isActive ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{workflow.updatedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(workflow)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(workflow.id);
                            setDeleteDialogOpen(true);
                          }}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* 创建/编辑流程对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkflow ? '编辑流程' : '新建流程'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">流程名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入流程名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">流程类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择流程类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogName">服务目录</Label>
                <Input
                  id="catalogName"
                  value={formData.catalogName}
                  onChange={(e) => setFormData({ ...formData, catalogName: e.target.value })}
                  placeholder="关联的服务目录"
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                  />
                  <span className="text-sm">{formData.isActive ? '启用' : '停用'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">流程描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入流程描述"
                rows={2}
              />
            </div>

            {/* 流程步骤 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>流程步骤</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加步骤
                </Button>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                {formData.steps.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">暂无步骤</p>
                ) : (
                  <div className="space-y-2">
                    {formData.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 bg-white p-3 rounded border"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <div className={`w-6 h-6 rounded-full ${stepTypeConfig[step.type].color} text-white flex items-center justify-center`}>
                          {stepTypeConfig[step.type].icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {stepTypeConfig[step.type].label}
                            </Badge>
                          </div>
                          {step.assignee && (
                            <span className="text-xs text-gray-500">
                              处理人: {step.assignee.type === 'role' ? '角色' : step.assignee.type} - {step.assignee.value}
                            </span>
                          )}
                        </div>
                        {step.type !== 'start' && step.type !== 'end' && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStep(step)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStep(step.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                        {index < formData.steps.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-400 absolute right-[-20px]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingWorkflow ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑步骤对话框 */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑步骤</DialogTitle>
          </DialogHeader>

          {editingStep && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stepName">步骤名称</Label>
                <Input
                  id="stepName"
                  value={editingStep.name}
                  onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stepType">步骤类型</Label>
                <Select
                  value={editingStep.type}
                  onValueChange={(v) => setEditingStep({ ...editingStep, type: v as StepType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stepTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigneeType">处理人类型</Label>
                  <Select
                    value={editingStep.assignee?.type || ''}
                    onValueChange={(v) => setEditingStep({
                      ...editingStep,
                      assignee: { type: v as 'user' | 'role' | 'department', value: editingStep.assignee?.value || '' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">用户</SelectItem>
                      <SelectItem value="role">角色</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigneeValue">处理人</Label>
                  <Input
                    id="assigneeValue"
                    value={editingStep.assignee?.value || ''}
                    onChange={(e) => setEditingStep({
                      ...editingStep,
                      assignee: { type: editingStep.assignee?.type || 'role', value: e.target.value }
                    })}
                    placeholder="如: it_admin, dept_manager"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveStep}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 流程详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingWorkflow?.name} - 流程步骤</DialogTitle>
          </DialogHeader>

          {editingWorkflow && (
            <div className="py-4">
              <div className="flex items-center justify-start gap-6 overflow-x-auto pb-4 px-2">
                {editingWorkflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className={`w-10 h-10 rounded-full ${stepTypeConfig[step.type].color} text-white flex items-center justify-center mb-2`}>
                        {stepTypeConfig[step.type].icon}
                      </div>
                      <span className="text-sm font-medium text-center">{step.name}</span>
                      <span className="text-xs text-gray-500">{stepTypeConfig[step.type].label}</span>
                      {step.assignee && (
                        <span className="text-xs text-blue-600 mt-1">
                          {step.assignee.value}
                        </span>
                      )}
                    </div>
                    {index < editingWorkflow.steps.length - 1 && (
                      <ChevronRight className="w-6 h-6 text-gray-300 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要删除该流程吗？此操作不可恢复。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
