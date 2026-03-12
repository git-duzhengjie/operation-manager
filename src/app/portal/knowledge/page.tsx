'use client';

import { AppLayout } from '@/components/app-layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Clock, Eye, X } from 'lucide-react';
import { useState, useMemo } from 'react';

// 模拟知识库数据
const mockArticles = [
  {
    id: '1',
    title: 'Windows Server 2019 系统安装配置指南',
    type: 'change',
    tags: ['服务器', 'Windows', '系统安装'],
    views: 1234,
    updatedAt: '2024-01-15',
    description: '详细介绍 Windows Server 2019 的安装步骤、系统配置、网络设置等内容。',
  },
  {
    id: '2',
    title: '网络故障排查标准流程',
    type: 'incident',
    tags: ['网络', '故障排查', '流程'],
    views: 987,
    updatedAt: '2024-01-14',
    description: '介绍网络故障排查的标准流程，包括问题定位、诊断工具使用等。',
  },
  {
    id: '3',
    title: '数据库备份与恢复操作手册',
    type: 'request',
    tags: ['数据库', '备份', '恢复'],
    views: 876,
    updatedAt: '2024-01-13',
    description: '详细介绍数据库备份策略、备份操作步骤以及数据恢复流程。',
  },
  {
    id: '4',
    title: 'Linux 系统性能优化指南',
    type: 'change',
    tags: ['服务器', 'Linux', '性能优化'],
    views: 654,
    updatedAt: '2024-01-12',
    description: '介绍 Linux 系统性能监控、分析工具使用及优化方法。',
  },
  {
    id: '5',
    title: '网络安全漏洞修复方案',
    type: 'incident',
    tags: ['网络', '安全', '漏洞'],
    views: 1122,
    updatedAt: '2024-01-11',
    description: '常见网络安全漏洞的识别、评估和修复方案。',
  },
  {
    id: '6',
    title: '应用系统部署规范',
    type: 'request',
    tags: ['应用', '部署', '规范'],
    views: 543,
    updatedAt: '2024-01-10',
    description: '应用系统部署的标准流程和规范要求。',
  },
];

const articleTypes: Record<string, { label: string; color: string }> = {
  change: { label: '变更管理', color: 'bg-blue-100 text-blue-700' },
  incident: { label: '事件管理', color: 'bg-red-100 text-red-700' },
  request: { label: '请求管理', color: 'bg-green-100 text-green-700' },
};

export default function PortalKnowledgePage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // 过滤文章
  const filteredArticles = useMemo(() => {
    return mockArticles.filter(article => {
      // 标签过滤
      if (selectedTag && !article.tags.includes(selectedTag)) {
        return false;
      }
      // 关键词搜索
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(kw);
        const matchTag = article.tags.some(tag => tag.toLowerCase().includes(kw));
        const matchDesc = article.description.toLowerCase().includes(kw);
        if (!matchTitle && !matchTag && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [searchKeyword, selectedTag]);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('');
  };

  // 点击标签
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag('');
    } else {
      setSelectedTag(tag);
    }
  };

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
            <div className="flex items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索知识库文章..."
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
            </div>
          </CardContent>
        </Card>

        {/* 热门分类 */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-sm text-gray-600">热门分类：</span>
          {['服务器', '网络', '数据库', '安全', '应用'].map(tag => (
            <Badge 
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 搜索结果提示 */}
        {(searchKeyword || selectedTag) && (
          <div className="text-sm text-gray-600">
            找到 {filteredArticles.length} 篇相关文章
            {searchKeyword && ` · 关键词"${searchKeyword}"`}
            {selectedTag && ` · 标签"${selectedTag}"`}
          </div>
        )}

        {/* 文章列表 */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">未找到相关文章</p>
              <p className="text-gray-400 mt-2">请尝试其他关键词或清除筛选条件</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
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
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-gray-100"
                        onClick={() => handleTagClick(tag)}
                      >
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
        )}
      </div>
    </AppLayout>
  );
}
