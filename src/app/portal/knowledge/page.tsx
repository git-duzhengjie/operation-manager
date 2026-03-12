'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Clock, Eye } from 'lucide-react';
import { useState } from 'react';

// 模拟知识库数据
const mockArticles = [
  {
    id: '1',
    title: 'Windows Server 2019 系统安装配置指南',
    type: 'change',
    tags: ['服务器', 'Windows', '系统安装'],
    views: 1234,
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    title: '网络故障排查标准流程',
    type: 'incident',
    tags: ['网络', '故障排查', '流程'],
    views: 987,
    updatedAt: '2024-01-14',
  },
  {
    id: '3',
    title: '数据库备份与恢复操作手册',
    type: 'request',
    tags: ['数据库', '备份', '恢复'],
    views: 876,
    updatedAt: '2024-01-13',
  },
];

const articleTypes: Record<string, { label: string; color: string }> = {
  change: { label: '变更管理', color: 'bg-blue-100 text-blue-700' },
  incident: { label: '事件管理', color: 'bg-red-100 text-red-700' },
  request: { label: '请求管理', color: 'bg-green-100 text-green-700' },
};

export default function PortalKnowledgePage() {
  const [searchKeyword, setSearchKeyword] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库</h1>
          <p className="text-gray-600 mt-1">查阅运维知识库文档和解决方案</p>
        </div>

        {/* 搜索 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索知识库文章..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>搜索</Button>
            </div>
          </CardContent>
        </Card>

        {/* 热门分类 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">热门分类：</span>
          <Badge variant="outline" className="cursor-pointer">服务器</Badge>
          <Badge variant="outline" className="cursor-pointer">网络</Badge>
          <Badge variant="outline" className="cursor-pointer">数据库</Badge>
          <Badge variant="outline" className="cursor-pointer">安全</Badge>
        </div>

        {/* 文章列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Badge className={articleTypes[article.type].color + ' w-fit'}>
                  {articleTypes[article.type].label}
                </Badge>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
