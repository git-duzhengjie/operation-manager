'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, FileText, Eye, Loader2, GripVertical, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 字段类型定义
interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'file' | 'user' | 'department';
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: { label: string; value: string }[];
  order: number;
}

// 表单模板定义
interface FormTemplate {
  id: string;
  name: string;
  catalogId: number | null;
  catalogName: string;
  description: string | null;
  fields: FormField[];
  isActive: boolean;
  version: number;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

// 统计数据
interface Stats {
  total: number;
  active: number;
  fieldTypes: number;
}

// 服务目录选项
interface CatalogOption {
  id: number;
  name: string;
}

// 字段类型选项
const fieldTypeOptions = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '复选框' },
  { value: 'date', label: '日期' },
  { value: 'datetime', label: '日期时间' },
  { value: 'file', label: '文件上传' },
  { value: 'user', label: '用户选择' },
  { value: 'department', label: '部门选择' },
];

// 空字段模板
const emptyField: FormField = {
  id: '',
  name: '',
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
  options: [],
  order: 0,
};

export default function FormsPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, fieldTypes: 10 });
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([]);
  const [filterCatalog, setFilterCatalog] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    catalogId: '',
    catalogName: '',
    description: '',
    isActive: true,
    fields: [] as FormField[],
  });

  // 当前编辑的字段
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);

  // 删除确认
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<FormTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 获取表单模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCatalog !== 'all') params.set('catalogId', filterCatalog);
      if (filterStatus !== 'all') params.set('isActive', filterStatus);

      const response = await fetch(`/api/forms?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data.templates);
        setStats(result.data.stats);
        setCatalogs(result.data.catalogs);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterCatalog, filterStatus]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      catalogId: '',
      catalogName: '',
      description: '',
      isActive: true,
      fields: [],
    });
    setCurrentTemplate(null);
  };

  // 打开新增弹窗
  const handleAdd = () => {
    resetForm();
    setDialogMode('add');
    setDialogOpen(true);
  };

  // 打开查看弹窗
  const handleView = async (template: FormTemplate) => {
    try {
      const response = await fetch(`/api/forms/${template.id}`);
      const result = await response.json();

      if (result.success) {
        setCurrentTemplate(result.data);
        setFormData({
          name: result.data.name,
          catalogId: result.data.catalogId?.toString() || '',
          catalogName: result.data.catalogName || '',
          description: result.data.description || '',
          isActive: result.data.isActive,
          fields: result.data.fields || [],
        });
        setDialogMode('view');
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast.error('获取表单模板详情失败');
    }
  };

  // 打开编辑弹窗
  const handleEdit = async (template: FormTemplate) => {
    try {
      const response = await fetch(`/api/forms/${template.id}`);
      const result = await response.json();

      if (result.success) {
        setCurrentTemplate(result.data);
        setFormData({
          name: result.data.name,
          catalogId: result.data.catalogId?.toString() || '',
          catalogName: result.data.catalogName || '',
          description: result.data.description || '',
          isActive: result.data.isActive,
          fields: result.data.fields || [],
        });
        setDialogMode('edit');
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast.error('获取表单模板详情失败');
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (template: FormTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/forms/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('表单模板删除成功');
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
        fetchTemplates();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('删除表单模板失败');
    } finally {
      setDeleting(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入表单名称');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = dialogMode === 'edit';
      const url = isEdit ? `/api/forms/${currentTemplate?.id}` : '/api/forms';
      const method = isEdit ? 'PUT' : 'POST';

      const catalog = catalogs.find(c => c.id.toString() === formData.catalogId);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          catalogId: formData.catalogId ? parseInt(formData.catalogId) : null,
          catalogName: catalog?.name || '',
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          fields: formData.fields,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || (isEdit ? '表单模板更新成功' : '表单模板创建成功'));
        setDialogOpen(false);
        fetchTemplates();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 添加字段
  const handleAddField = () => {
    const newField: FormField = {
      ...emptyField,
      id: `field_${Date.now()}`,
      order: formData.fields.length + 1,
    };
    setEditingField(newField);
    setFieldDialogOpen(true);
  };

  // 保存字段
  const handleSaveField = () => {
    if (!editingField) return;

    if (!editingField.name.trim() || !editingField.label.trim()) {
      toast.error('字段名称和标签为必填项');
      return;
    }

    const existingIndex = formData.fields.findIndex(f => f.id === editingField.id);
    let newFields: FormField[];

    if (existingIndex >= 0) {
      newFields = [...formData.fields];
      newFields[existingIndex] = editingField;
    } else {
      newFields = [...formData.fields, { ...editingField, order: formData.fields.length + 1 }];
    }

    setFormData({ ...formData, fields: newFields });
    setFieldDialogOpen(false);
    setEditingField(null);
  };

  // 编辑字段
  const handleEditField = (field: FormField) => {
    setEditingField({ ...field });
    setFieldDialogOpen(true);
  };

  // 删除字段
  const handleDeleteField = (fieldId: string) => {
    const newFields = formData.fields
      .filter(f => f.id !== fieldId)
      .map((f, index) => ({ ...f, order: index + 1 }));
    setFormData({ ...formData, fields: newFields });
  };

  // 添加选项（用于 select/radio/checkbox 类型）
  const handleAddOption = () => {
    if (!editingField) return;
    const options = editingField.options || [];
    setEditingField({
      ...editingField,
      options: [...options, { label: '', value: '' }],
    });
  };

  // 更新选项
  const handleUpdateOption = (index: number, field: 'label' | 'value', value: string) => {
    if (!editingField?.options) return;
    const newOptions = [...editingField.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditingField({ ...editingField, options: newOptions });
  };

  // 删除选项
  const handleDeleteOption = (index: number) => {
    if (!editingField?.options) return;
    const newOptions = editingField.options.filter((_, i) => i !== index);
    setEditingField({ ...editingField, options: newOptions });
  };

  // 切换状态
  const handleToggleStatus = async (template: FormTemplate) => {
    try {
      const response = await fetch(`/api/forms/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          catalogId: template.catalogId,
          catalogName: template.catalogName,
          description: template.description,
          isActive: !template.isActive,
          fields: template.fields,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(template.isActive ? '表单模板已停用' : '表单模板已启用');
        fetchTemplates();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('操作失败');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">表单模板</h1>
            <p className="text-gray-600 mt-1">管理自定义表单模板</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新建表单
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">表单总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
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
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">字段类型</p>
                  <p className="text-2xl font-bold mt-1">{stats.fieldTypes}种</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Select value={filterCatalog} onValueChange={setFilterCatalog}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="服务目录" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部目录</SelectItem>
                  {catalogs.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 表单列表 */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无表单模板数据
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>表单名称</TableHead>
                    <TableHead>服务目录</TableHead>
                    <TableHead>字段数量</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.catalogName || '-'}</TableCell>
                      <TableCell>{template.fieldCount} 个字段</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => handleToggleStatus(template)}
                        />
                      </TableCell>
                      <TableCell>{template.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(template)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(template)}
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
          </CardContent>
        </Card>
      </div>

      {/* 查看/新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? '查看表单' : dialogMode === 'edit' ? '编辑表单' : '新建表单'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' ? '查看表单模板详情' : '配置表单基本信息和字段'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>表单名称 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入表单名称"
                  disabled={dialogMode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label>服务目录</Label>
                <Select
                  value={formData.catalogId}
                  onValueChange={(value) => {
                    const catalog = catalogs.find(c => c.id.toString() === value);
                    setFormData({ ...formData, catalogId: value, catalogName: catalog?.name || '' });
                  }}
                  disabled={dialogMode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择服务目录" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入表单描述"
                  rows={2}
                  disabled={dialogMode === 'view'}
                />
              </div>
              {dialogMode !== 'add' && (
                <div className="space-y-2">
                  <Label>状态</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      disabled={dialogMode === 'view'}
                    />
                    <span className="text-sm">{formData.isActive ? '启用' : '停用'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 字段配置 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>字段配置</Label>
                {dialogMode !== 'view' && (
                  <Button variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="w-4 h-4 mr-1" />
                    添加字段
                  </Button>
                )}
              </div>

              {formData.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded-lg">
                  暂无字段，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.fields.sort((a, b) => a.order - b.order).map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                          <Badge variant="secondary" className="text-xs">
                            {fieldTypeOptions.find(t => t.value === field.type)?.label || field.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          字段名: {field.name}
                          {field.placeholder && ` | 提示: ${field.placeholder}`}
                        </div>
                      </div>
                      {dialogMode !== 'view' && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {dialogMode === 'edit' ? '保存修改' : '创建表单'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 字段编辑弹窗 */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingField?.id && formData.fields.some(f => f.id === editingField.id) ? '编辑字段' : '添加字段'}</DialogTitle>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>字段名称 *</Label>
                  <Input
                    value={editingField.name}
                    onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                    placeholder="英文字段名，如 applicant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>显示标签 *</Label>
                  <Input
                    value={editingField.label}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    placeholder="显示名称，如 申请人"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>字段类型</Label>
                  <Select
                    value={editingField.type}
                    onValueChange={(value) => setEditingField({ ...editingField, type: value as FormField['type'], options: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择字段类型">
                        {fieldTypeOptions.find(t => t.value === editingField.type)?.label || editingField.type}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>是否必填</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={editingField.required}
                      onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                    />
                    <span className="text-sm">{editingField.required ? '必填' : '选填'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>占位提示</Label>
                <Input
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="输入框内的提示文字"
                />
              </div>

              {/* 选项配置（select/radio/checkbox 类型） */}
              {['select', 'radio', 'checkbox'].includes(editingField.type) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>选项配置</Label>
                    <Button variant="outline" size="sm" onClick={handleAddOption}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加选项
                    </Button>
                  </div>
                  {editingField.options?.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={opt.label}
                        onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                        placeholder="显示文本"
                        className="flex-1"
                      />
                      <Input
                        value={opt.value}
                        onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                        placeholder="值"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveField}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除表单模板 <span className="font-medium text-gray-900">{templateToDelete?.name}</span> 吗？
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
