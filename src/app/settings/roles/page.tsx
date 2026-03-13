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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  permissionIds: number[];
  createdAt: string;
}

interface Permission {
  id: number;
  name: string;
  code: string;
}

interface Stats {
  total: number;
  system: number;
  custom: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [stats, setStats] = useState<Stats>({ total: 0, system: 0, custom: 0 });
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/roles');
      const result = await response.json();

      if (result.success) {
        setRoles(result.data.roles);
        setPermissions(result.data.permissions);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('获取失败', { description: '无法获取角色列表' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // 打开新建对话框
  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
    });
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = async (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
    });
    setSelectedPermissions(role.permissionIds);
    setDialogOpen(true);
  };

  // 切换权限选择
  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  // 全选/取消全选分类权限
  const toggleCategoryPermissions = (category: string, permIds: number[]) => {
    const allSelected = permIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !permIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permIds])]);
    }
  };

  // 保存角色
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入角色名称');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('请输入角色代码');
      return;
    }
    if (!/^[a-z_]+$/.test(formData.code)) {
      toast.error('角色代码只能包含小写字母和下划线');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        // 更新角色
        const response = await fetch('/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRole.id,
            name: formData.name,
            description: formData.description,
            permissionIds: selectedPermissions,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('角色更新成功');
          setDialogOpen(false);
          fetchRoles();
        } else {
          throw new Error(result.error);
        }
      } else {
        // 创建角色
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            description: formData.description,
            permissionIds: selectedPermissions,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('角色创建成功');
          setDialogOpen(false);
          fetchRoles();
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Failed to save role:', error);
      toast.error(editingRole ? '更新角色失败' : '创建角色失败', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // 删除角色
  const handleDelete = async () => {
    if (!deletingRole) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/roles?id=${deletingRole.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('角色删除成功');
        setDeleteDialogOpen(false);
        setDeletingRole(null);
        fetchRoles();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('删除角色失败', {
        description: error instanceof Error ? error.message : undefined,
      });
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
            <h1 className="text-2xl font-bold text-gray-900">角色权限</h1>
            <p className="text-gray-600 mt-1">管理系统角色和权限配置</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            新建角色
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">角色总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">系统角色</p>
                  <p className="text-2xl font-bold mt-1">{stats.system}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">自定义角色</p>
                  <p className="text-2xl font-bold mt-1">{stats.custom}</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 角色列表 */}
        <Card>
          {loading ? (
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              加载中...
            </CardContent>
          ) : roles.length === 0 ? (
            <CardContent className="p-8 text-center text-gray-500">
              暂无角色数据
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>角色代码</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>用户数</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="font-mono text-sm">{role.code}</TableCell>
                    <TableCell className="max-w-xs truncate" title={role.description || ''}>
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.userCount} 人</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}>
                        {role.isSystem ? '系统角色' : '自定义'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingRole(role);
                              setDeleteDialogOpen(true);
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* 权限说明 */}
        <Card>
          <CardHeader>
            <CardTitle>权限说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{role.name}</h4>
                      <Badge className={role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}>
                        {role.isSystem ? '系统' : '自定义'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{role.description || '暂无描述'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {role.permissions.slice(0, 4).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {role.permissions.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新建/编辑角色对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新建角色'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>角色名称 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入角色名称"
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label>角色代码 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                  placeholder="请输入角色代码（小写字母和下划线）"
                  disabled={!!editingRole}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入角色描述"
                rows={2}
                disabled={editingRole?.isSystem}
              />
            </div>
            {editingRole?.isSystem && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>系统角色的基本信息不可修改，仅可调整权限配置</span>
              </div>
            )}

            {/* 权限配置 */}
            <div className="space-y-4">
              <Label>权限配置</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(permissions).map(([category, perms]) => {
                  const permIds = perms.map((p) => p.id);
                  const allSelected = permIds.every((id) => selectedPermissions.includes(id));
                  const someSelected = permIds.some((id) => selectedPermissions.includes(id));

                  return (
                    <div key={category} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{category}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => toggleCategoryPermissions(category, permIds)}
                        >
                          {allSelected ? '取消全选' : '全选'}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              {perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingRole ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              确定要删除角色 <span className="font-medium">{deletingRole?.name}</span> 吗？
            </p>
            <p className="text-sm text-red-500 mt-2">此操作不可撤销</p>
          </div>
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
