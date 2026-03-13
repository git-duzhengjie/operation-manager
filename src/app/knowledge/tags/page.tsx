'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Edit, Trash2, Tag, Search, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface TagItem {
  id: string;
  name: string;
  count: number;
}

interface TagStats {
  totalTags: number;
  totalArticles: number;
  hotTag: string;
}

// 预设颜色
const tagColors = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-yellow-100 text-yellow-700',
  'bg-teal-100 text-teal-700',
];

// 根据标签名生成一致的颜色
function getTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
}

export default function KnowledgeTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [stats, setStats] = useState<TagStats>({ totalTags: 0, totalArticles: 0, hotTag: '-' });
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<TagItem | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [saving, setSaving] = useState(false);

  // 新建标签弹窗
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTagName, setCreateTagName] = useState('');

  // 获取标签列表
  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);

      const response = await fetch(`/api/knowledge-tags?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTags(result.data.tags);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // 打开编辑弹窗
  const handleEdit = (tag: TagItem) => {
    setCurrentTag(tag);
    setNewTagName(tag.name);
    setEditDialogOpen(true);
  };

  // 打开删除弹窗
  const handleDelete = (tag: TagItem) => {
    setCurrentTag(tag);
    setDeleteDialogOpen(true);
  };

  // 重命名标签
  const handleRename = async () => {
    if (!currentTag || !newTagName.trim()) {
      alert('请输入标签名称');
      return;
    }

    if (newTagName === currentTag.name) {
      setEditDialogOpen(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/knowledge-tags/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: currentTag.name,
          newName: newTagName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setEditDialogOpen(false);
        fetchTags();
      } else {
        alert(result.error || '重命名失败');
      }
    } catch (error) {
      console.error('重命名标签失败:', error);
      alert('重命名失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除标签
  const handleConfirmDelete = async () => {
    if (!currentTag) return;

    setSaving(true);
    try {
      const response = await fetch('/api/knowledge-tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: currentTag.name }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setDeleteDialogOpen(false);
        fetchTags();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      alert('删除失败');
    } finally {
      setSaving(false);
    }
  };

  // 新建标签
  const handleCreate = async () => {
    if (!createTagName.trim()) {
      alert('请输入标签名称');
      return;
    }

    // 检查标签是否已存在
    if (tags.some(t => t.name === createTagName.trim())) {
      alert('标签已存在');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/knowledge-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createTagName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        alert('标签创建成功');
        setCreateDialogOpen(false);
        setCreateTagName('');
        fetchTags();
      } else {
        alert(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      alert('创建失败');
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
            <h1 className="text-2xl font-bold text-gray-900">分类标签</h1>
            <p className="text-gray-600 mt-1">管理知识库文章标签分类</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchTags}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增标签
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">标签总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalTags}</p>
                </div>
                <Tag className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">文章总数</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalArticles}</p>
                </div>
                <Tag className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">热门标签</p>
                  <p className="text-2xl font-bold mt-1">{stats.hotTag}</p>
                </div>
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索标签..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 标签列表 */}
        <Card>
          <CardHeader>
            <CardTitle>所有标签</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                加载中...
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无标签数据
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge className={getTagColor(tag.name)}>{tag.name}</Badge>
                      <span className="text-sm text-gray-600">{tag.count} 篇文章</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="编辑"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="删除"
                        onClick={() => handleDelete(tag)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新建标签弹窗 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>新增标签</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">标签名称</Label>
                <Input
                  id="tagName"
                  value={createTagName}
                  onChange={(e) => setCreateTagName(e.target.value)}
                  placeholder="请输入标签名称"
                />
              </div>
              <p className="text-sm text-gray-500">
                提示：创建的标签可在撰写文章时选择使用
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑标签弹窗 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>重命名标签</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newTagName">新标签名称</Label>
                <Input
                  id="newTagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="请输入新标签名称"
                />
              </div>
              <p className="text-sm text-gray-500">
                重命名后，所有使用该标签的文章都将更新
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleRename} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                保存
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
                确定要删除标签「{currentTag?.name}」吗？<br />
                该操作将从所有文章中移除此标签，共影响 {currentTag?.count || 0} 篇文章。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
