'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  FolderTree, 
  Workflow, 
  FileText,
  Edit,
  Trash2,
  Settings,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceItem {
  id: string;
  catalogId: number;
  name: string;
  description: string | null;
  workflowId: number | null;
  formTemplateId: number | null;
  slaTime: number | null;
  sortOrder: number;
  isActive: boolean;
}

interface ServiceCatalog {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  children: ServiceItem[];
  itemCount: number;
}

interface Stats {
  catalogs: number;
  items: number;
  workflows: number;
  forms: number;
}

export default function ServiceCatalogPage() {
  const [catalogs, setCatalogs] = useState<ServiceCatalog[]>([]);
  const [stats, setStats] = useState<Stats>({ catalogs: 0, items: 0, workflows: 0, forms: 0 });
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<ServiceCatalog | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: ServiceItem; catalogId: number } | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; type: 'catalog' | 'item'; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [catalogForm, setCatalogForm] = useState({
    name: '',
    icon: '📁',
    description: '',
    isActive: true,
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    slaTime: 24,
    isActive: true,
  });

  // 当前操作的目录ID（用于添加服务项目）
  const [currentCatalogId, setCurrentCatalogId] = useState<number | null>(null);

  // 获取服务目录列表
  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/service-catalogs');
      const result = await response.json();

      if (result.success) {
        setCatalogs(result.data.catalogs);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch catalogs:', error);
      toast.error('获取失败', { description: '无法获取服务目录列表' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  // 打开新建目录对话框
  const handleCreateCatalog = () => {
    setEditingCatalog(null);
    setCatalogForm({ name: '', icon: '📁', description: '', isActive: true });
    setCatalogDialogOpen(true);
  };

  // 打开编辑目录对话框
  const handleEditCatalog = (catalog: ServiceCatalog) => {
    setEditingCatalog(catalog);
    setCatalogForm({
      name: catalog.name,
      icon: catalog.icon,
      description: catalog.description || '',
      isActive: catalog.isActive,
    });
    setCatalogDialogOpen(true);
  };

  // 保存目录
  const handleSaveCatalog = async () => {
    if (!catalogForm.name.trim()) {
      toast.error('请输入目录名称');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/service-catalogs';
      const method = editingCatalog ? 'PUT' : 'POST';
      const body = editingCatalog
        ? { id: editingCatalog.id, ...catalogForm }
        : catalogForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingCatalog ? '更新成功' : '创建成功');
        setCatalogDialogOpen(false);
        fetchCatalogs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save catalog:', error);
      toast.error('保存失败', { description: '无法保存服务目录' });
    } finally {
      setSaving(false);
    }
  };

  // 打开新建服务项目对话框
  const handleCreateItem = (catalogId: number) => {
    setCurrentCatalogId(catalogId);
    setEditingItem(null);
    setItemForm({ name: '', description: '', slaTime: 24, isActive: true });
    setItemDialogOpen(true);
  };

  // 打开编辑服务项目对话框
  const handleEditItem = (item: ServiceItem, catalogId: number) => {
    setCurrentCatalogId(catalogId);
    setEditingItem({ item, catalogId });
    setItemForm({
      name: item.name,
      description: item.description || '',
      slaTime: item.slaTime || 24,
      isActive: item.isActive,
    });
    setItemDialogOpen(true);
  };

  // 保存服务项目
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error('请输入服务项目名称');
      return;
    }
    if (!currentCatalogId) {
      toast.error('缺少目录ID');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/service-catalogs';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { type: 'item', id: editingItem.item.id, ...itemForm }
        : { type: 'item', catalogId: currentCatalogId, ...itemForm };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingItem ? '更新成功' : '创建成功');
        setItemDialogOpen(false);
        fetchCatalogs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('保存失败', { description: '无法保存服务项目' });
    } finally {
      setSaving(false);
    }
  };

  // 删除确认
  const handleDeleteConfirm = async () => {
    if (!deletingTarget) return;

    setSaving(true);
    try {
      const url = `/api/service-catalogs?id=${deletingTarget.id}&type=${deletingTarget.type}`;
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        toast.success('删除成功');
        setDeleteDialogOpen(false);
        setDeletingTarget(null);
        fetchCatalogs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('删除失败', { description: '无法删除' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">服务目录管理</h1>
            <p className="text-gray-600 mt-1">管理IT服务场景分类和流程配置</p>
          </div>
          <Button onClick={handleCreateCatalog}>
            <Plus className="w-4 h-4 mr-2" />
            新建目录
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📁</div>
              <div className="text-2xl font-bold">{stats.catalogs}</div>
              <div className="text-sm text-gray-600">服务目录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold">{stats.items}</div>
              <div className="text-sm text-gray-600">服务项目</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-2xl font-bold">{stats.workflows}</div>
              <div className="text-sm text-gray-600">流程定义</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-2xl font-bold">{stats.forms}</div>
              <div className="text-sm text-gray-600">表单模板</div>
            </CardContent>
          </Card>
        </div>

        {/* 服务目录列表 */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              加载中...
            </CardContent>
          </Card>
        ) : catalogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              暂无服务目录，点击&quot;新建目录&quot;创建第一个服务目录
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {catalogs.map((catalog) => (
              <Card key={catalog.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{catalog.icon}</div>
                      <div>
                        <CardTitle>{catalog.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {catalog.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCatalog(catalog)}
                        title="编辑目录"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingTarget({ id: catalog.id, type: 'catalog', name: catalog.name });
                          setDeleteDialogOpen(true);
                        }}
                        title="删除目录"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {catalog.children.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 text-sm">暂无服务项目</p>
                    ) : (
                      catalog.children.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FolderTree className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.slaTime && (
                                <span className="text-xs text-gray-500 ml-2 flex items-center inline-flex">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.slaTime}h
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              <Workflow className="w-3 h-3 mr-1" />
                              流程
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              表单
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditItem(item, Number(catalog.id))}
                              title="编辑"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingTarget({ id: item.id, type: 'item', name: item.name });
                                setDeleteDialogOpen(true);
                              }}
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleCreateItem(Number(catalog.id))}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加服务项目
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 目录对话框 */}
      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCatalog ? '编辑目录' : '新建目录'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catalogName">目录名称 *</Label>
              <Input
                id="catalogName"
                value={catalogForm.name}
                onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                placeholder="请输入目录名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalogIcon">图标</Label>
              <Input
                id="catalogIcon"
                value={catalogForm.icon}
                onChange={(e) => setCatalogForm({ ...catalogForm, icon: e.target.value })}
                placeholder="输入 emoji 图标"
                className="w-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalogDesc">描述</Label>
              <Textarea
                id="catalogDesc"
                value={catalogForm.description}
                onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                placeholder="请输入目录描述"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>状态</Label>
              <Switch
                checked={catalogForm.isActive}
                onCheckedChange={(v) => setCatalogForm({ ...catalogForm, isActive: v })}
              />
              <span className="text-sm text-gray-600">{catalogForm.isActive ? '启用' : '停用'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatalogDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCatalog} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCatalog ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 服务项目对话框 */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑服务项目' : '新建服务项目'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">项目名称 *</Label>
              <Input
                id="itemName"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="请输入项目名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDesc">描述</Label>
              <Textarea
                id="itemDesc"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="请输入项目描述"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slaTime">SLA 时间（小时）</Label>
              <Input
                id="slaTime"
                type="number"
                value={itemForm.slaTime}
                onChange={(e) => setItemForm({ ...itemForm, slaTime: parseInt(e.target.value) || 0 })}
                placeholder="期望处理时间"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>状态</Label>
              <Switch
                checked={itemForm.isActive}
                onCheckedChange={(v) => setItemForm({ ...itemForm, isActive: v })}
              />
              <span className="text-sm text-gray-600">{itemForm.isActive ? '启用' : '停用'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? '更新' : '创建'}
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
            确定要删除{deletingTarget?.type === 'catalog' ? '服务目录' : '服务项目'}
            &quot;{deletingTarget?.name}&quot;吗？
            {deletingTarget?.type === 'catalog' && ' 此操作将同时删除该目录下的所有服务项目。'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
