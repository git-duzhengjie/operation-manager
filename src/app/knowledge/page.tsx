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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, BookOpen, Clock, Eye, Edit, Trash2, Download, Upload } from 'lucide-react';
import { useState } from 'react';

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
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>
            <Button>
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
                  className="pl-10"
                />
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
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 文章列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={articleTypes[article.type].color}>
                    {articleTypes[article.type].label}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-gray-600">文章总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">56,789</div>
              <div className="text-sm text-gray-600">总浏览量</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Edit className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">456</div>
              <div className="text-sm text-gray-600">本月更新</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Download className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">789</div>
              <div className="text-sm text-gray-600">下载次数</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
