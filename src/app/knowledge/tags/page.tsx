'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

// 模拟标签数据
const mockTags = [
  { id: '1', name: '服务器', count: 45, color: 'bg-blue-100 text-blue-700' },
  { id: '2', name: '网络', count: 38, color: 'bg-green-100 text-green-700' },
  { id: '3', name: '数据库', count: 32, color: 'bg-purple-100 text-purple-700' },
  { id: '4', name: '安全', count: 28, color: 'bg-red-100 text-red-700' },
  { id: '5', name: '备份', count: 24, color: 'bg-orange-100 text-orange-700' },
  { id: '6', name: '监控', count: 21, color: 'bg-cyan-100 text-cyan-700' },
];

export default function KnowledgeTagsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">分类标签</h1>
            <p className="text-gray-600 mt-1">管理知识库文章标签分类</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增标签
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">标签总数</p>
                  <p className="text-2xl font-bold mt-1">24</p>
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
                  <p className="text-2xl font-bold mt-1">1,234</p>
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
                  <p className="text-2xl font-bold mt-1">服务器</p>
                </div>
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签列表 */}
        <Card>
          <CardHeader>
            <CardTitle>所有标签</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={tag.color}>{tag.name}</Badge>
                    <span className="text-sm text-gray-600">{tag.count} 篇文章</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
