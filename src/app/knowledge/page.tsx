'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen, Clock, Eye, Edit, Trash2, Download, Upload, X, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

// 模拟知识库文章
const mockArticles = [
  {
    id: '1',
    title: 'Windows Server 2019 系统安装配置指南',
    type: 'change',
    tags: ['服务器', 'Windows', '系统安装'],
    author: '张三',
    views: 1234,
    version: 3,
    updatedAt: '2024-01-15',
    status: 'published',
    content: '详细介绍 Windows Server 2019 的安装步骤、系统配置、网络设置等内容。',
  },
  {
    id: '2',
    title: '网络故障排查标准流程',
    type: 'incident',
    tags: ['网络', '故障排查', '流程'],
    author: '李四',
    views: 987,
    version: 2,
    updatedAt: '2024-01-14',
    status: 'published',
    content: '介绍网络故障排查的标准流程，包括问题定位、诊断工具使用等。',
  },
  {
    id: '3',
    title: '数据库备份与恢复操作手册',
    type: 'request',
    tags: ['数据库', '备份', '恢复'],
    author: '王五',
    views: 876,
    version: 1,
    updatedAt: '2024-01-13',
    status: 'draft',
    content: '详细介绍数据库备份策略、备份操作步骤以及数据恢复流程。',
  },
  {
    id: '4',
    title: 'VPN连接问题排查指南',
    type: 'problem',
    tags: ['VPN', '网络', '排查'],
    author: '赵六',
    views: 654,
    version: 2,
    updatedAt: '2024-01-12',
    status: 'published',
    content: 'VPN连接常见问题及解决方案。',
  },
  {
    id: '5',
    title: 'Linux 系统性能优化指南',
    type: 'change',
    tags: ['服务器', 'Linux', '性能优化'],
    author: '张三',
    views: 567,
    version: 1,
    updatedAt: '2024-01-11',
    status: 'published',
    content: '介绍 Linux 系统性能监控、分析工具使用及优化方法。',
  },
  {
    id: '6',
    title: '网络安全漏洞修复方案',
    type: 'incident',
    tags: ['网络', '安全', '漏洞'],
    author: '李四',
    views: 890,
    version: 2,
    updatedAt: '2024-01-10',
    status: 'published',
    content: '常见网络安全漏洞的识别、评估和修复方案。',
  },
];

const articleTypes: Record<string, { label: string; color: string }> = {
  change: { label: '变更管理', color: 'bg-blue-100 text-blue-700' },
  incident: { label: '事件管理', color: 'bg-red-100 text-red-700' },
  request: { label: '请求管理', color: 'bg-green-100 text-green-700' },
  problem: { label: '问题管理', color: 'bg-orange-100 text-orange-700' },
};

export default function KnowledgePage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  // 新建文章对话框
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    type: '',
    tags: '',
    content: '',
  });

  // 批量导入对话框
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<string>('');
  const [importing, setImporting] = useState(false);

  // 编辑文章
  const [showEdit, setShowEdit] = useState(false);
  const [editArticle, setEditArticle] = useState<typeof mockArticles[0] | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    type: '',
    tags: '',
    content: '',
  });

  // 删除确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string>('');

  // 过滤文章
  const filteredArticles = useMemo(() => {
    return mockArticles.filter(article => {
      if (tagFilter !== 'all' && !article.tags.includes(tagFilter)) {
        return false;
      }
      if (typeFilter !== 'all' && article.type !== typeFilter) {
        return false;
      }
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(kw);
        const matchTag = article.tags.some(tag => tag.toLowerCase().includes(kw));
        const matchContent = article.content.toLowerCase().includes(kw);
        if (!matchTitle && !matchTag && !matchContent) {
          return false;
        }
      }
      return true;
    });
  }, [searchKeyword, typeFilter, tagFilter]);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('');
  };

  // 新建文章
  const handleNewArticle = () => {
    setShowNewArticle(true);
  };

  const handleSubmitArticle = async () => {
    if (!articleFormData.title.trim()) {
      toast.error('请输入文章标题');
      return;
    }
    if (!articleFormData.type) {
      toast.error('请选择文章类型');
      return;
    }
    if (!articleFormData.content.trim()) {
      toast.error('请输入文章内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowNewArticle(false);
      setShowSuccess(true);
      setArticleFormData({ title: '', type: '', tags: '', content: '' });
      toast.success('文章创建成功');
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 批量导入
  const handleImport = () => {
    setShowImport(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file.name);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) {
      toast.error('请选择要导入的文件');
      return;
    }

    setImporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowImport(false);
      setImportFile('');
      toast.success('批量导入成功，共导入 3 篇文章');
    } catch (error) {
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 导出
  const handleExport = () => {
    // 构建 CSV 数据
    const headers = ['ID', '标题', '类型', '标签', '作者', '浏览量', '版本', '更新时间', '状态'];
    const rows = filteredArticles.map(article => [
      article.id,
      article.title,
      articleTypes[article.type].label,
      article.tags.join(';'),
      article.author,
      article.views,
      article.version,
      article.updatedAt,
      article.status === 'published' ? '已发布' : '草稿',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `知识库文章_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`已导出 ${filteredArticles.length} 篇文章`);
  };

  // 编辑文章
  const handleEdit = (article: typeof mockArticles[0]) => {
    setEditArticle(article);
    setEditFormData({
      title: article.title,
      type: article.type,
      tags: article.tags.join(', '),
      content: article.content,
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.title.trim()) {
      toast.error('请输入文章标题');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowEdit(false);
      setEditArticle(null);
      toast.success('文章已更新');
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除文章
  const handleDelete = (articleId: string) => {
    setArticleToDelete(articleId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('文章已删除');
      setShowDeleteConfirm(false);
      setArticleToDelete('');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
            <p className="text-gray-600 mt-1">管理运维知识文档和解决方案</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>
            <Button onClick={handleNewArticle}>
              <Plus className="w-4 h-4 mr-2" />
              新建文章
            </Button>
          </div>
        </div>

        {/* 标签筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <Badge 
                variant={tagFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTagFilter('all')}
              >
                全部
              </Badge>
              {['服务器', '网络', '数据库', '安全', '备份', '监控'].map((tag) => (
                <Badge
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setTagFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索文章标题、内容、标签..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchKeyword && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="文章类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="change">变更管理</SelectItem>
                  <SelectItem value="incident">事件管理</SelectItem>
                  <SelectItem value="request">请求管理</SelectItem>
                  <SelectItem value="problem">问题管理</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 搜索结果提示 */}
        {(searchKeyword || typeFilter !== 'all' || tagFilter !== 'all') && (
          <div className="text-sm text-gray-600">
            找到 {filteredArticles.length} 篇文章
            {searchKeyword && ` · 关键词"${searchKeyword}"`}
            {typeFilter !== 'all' && ` · 类型"${articleTypes[typeFilter]?.label}"`}
            {tagFilter !== 'all' && ` · 标签"${tagFilter}"`}
          </div>
        )}

        {/* 文章列表 */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">未找到相关文章</p>
              <p className="text-gray-400 mt-2">请尝试其他搜索条件</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge className={articleTypes[article.type].color}>
                      {articleTypes[article.type].label}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2 line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {article.views}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.updatedAt}
                    </div>
                    <div>版本 {article.version}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 新建文章对话框 */}
      <Dialog open={showNewArticle} onOpenChange={setShowNewArticle}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建文章</DialogTitle>
            <DialogDescription>
              创建新的知识库文章
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>文章标题 *</Label>
              <Input
                placeholder="请输入文章标题"
                value={articleFormData.title}
                onChange={(e) => setArticleFormData({...articleFormData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>文章类型 *</Label>
                <Select 
                  value={articleFormData.type} 
                  onValueChange={(value) => setArticleFormData({...articleFormData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change">变更管理</SelectItem>
                    <SelectItem value="incident">事件管理</SelectItem>
                    <SelectItem value="request">请求管理</SelectItem>
                    <SelectItem value="problem">问题管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>标签</Label>
                <Input
                  placeholder="多个标签用逗号分隔"
                  value={articleFormData.tags}
                  onChange={(e) => setArticleFormData({...articleFormData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>文章内容 *</Label>
              <Textarea
                placeholder="请输入文章内容..."
                rows={10}
                value={articleFormData.content}
                onChange={(e) => setArticleFormData({...articleFormData, content: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewArticle(false)}>
                取消
              </Button>
              <Button onClick={handleSubmitArticle} disabled={isSubmitting}>
                {isSubmitting ? '创建中...' : '创建文章'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量导入对话框 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量导入</DialogTitle>
            <DialogDescription>
              导入知识库文章文件
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此区域</p>
              <p className="text-sm text-gray-400">支持 CSV、JSON 格式，单个文件不超过 10MB</p>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                选择文件
              </Button>
            </div>
            
            {importFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">{importFile}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setImportFile('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowImport(false)}>
                取消
              </Button>
              <Button onClick={handleConfirmImport} disabled={importing}>
                {importing ? '导入中...' : '确认导入'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑文章对话框 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑文章</DialogTitle>
            <DialogDescription>
              修改文章信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>文章标题 *</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>文章类型</Label>
                <Select 
                  value={editFormData.type} 
                  onValueChange={(value) => setEditFormData({...editFormData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change">变更管理</SelectItem>
                    <SelectItem value="incident">事件管理</SelectItem>
                    <SelectItem value="request">请求管理</SelectItem>
                    <SelectItem value="problem">问题管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>标签</Label>
                <Input
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({...editFormData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>文章内容</Label>
              <Textarea
                rows={10}
                value={editFormData.content}
                onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                取消
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这篇文章吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 成功提示 */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">文章创建成功</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="outline" onClick={() => setShowSuccess(false)}>
              关闭
            </Button>
            <Button onClick={() => setShowSuccess(false)}>
              继续创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
