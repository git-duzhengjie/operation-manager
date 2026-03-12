'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Package, BookOpen, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';

// 模拟工单数据
const mockTickets = [
  { id: 'WO20240101001', title: '服务器磁盘空间不足告警', status: 'processing', priority: 'high', customer: '市财政局', description: '预算管理系统应用服务器磁盘空间使用率已超过90%' },
  { id: 'WO20240101002', title: '新员工入职账号申请', status: 'pending', priority: 'medium', customer: '市人社局', description: '新入职员工需要开通系统账号和邮箱' },
  { id: 'WO20240101003', title: '应用系统升级变更申请', status: 'resolved', priority: 'high', customer: '市卫健委', description: '医院信息系统需要从V2.0升级到V2.1版本' },
  { id: 'WO20240101004', title: '数据库性能问题排查', status: 'processing', priority: 'urgent', customer: '市公安局', description: '警务综合平台数据库响应缓慢' },
  { id: 'WO20240101005', title: '网络访问权限申请', status: 'closed', priority: 'low', customer: '市财政局', description: '申请访问预算管理系统的VPN权限' },
];

// 模拟资产数据
const mockAssets = [
  { id: 'SRV001', name: '应用服务器-01', type: '服务器', status: 'running', ip: '192.168.1.101', customer: '市财政局' },
  { id: 'SRV002', name: '数据库服务器-01', type: '服务器', status: 'running', ip: '192.168.1.102', customer: '市人社局' },
  { id: 'SRV003', name: '应用服务器-02', type: '服务器', status: 'warning', ip: '192.168.1.103', customer: '市卫健委' },
  { id: 'NET001', name: '核心交换机-01', type: '网络设备', status: 'running', ip: '192.168.1.1', customer: '市公安局' },
  { id: 'STO001', name: '存储阵列-01', type: '存储设备', status: 'running', ip: '192.168.1.200', customer: '市财政局' },
];

// 模拟知识库数据
const mockKnowledge = [
  { id: 'KB001', title: '服务器故障排查手册', category: '故障处理', tags: ['服务器', '故障'], views: 256 },
  { id: 'KB002', title: '数据库性能优化指南', category: '性能优化', tags: ['数据库', '性能'], views: 189 },
  { id: 'KB003', title: '网络安全配置规范', category: '安全配置', tags: ['网络', '安全'], views: 312 },
  { id: 'KB004', title: '应用部署操作流程', category: '操作规范', tags: ['部署', '流程'], views: 145 },
  { id: 'KB005', title: '备份恢复操作手册', category: '数据管理', tags: ['备份', '恢复'], views: 98 },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待分配', variant: 'secondary' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'outline' },
  closed: { label: '已关闭', variant: 'secondary' },
};

const assetStatusMap: Record<string, { label: string; color: string }> = {
  running: { label: '运行中', color: 'bg-green-100 text-green-700' },
  warning: { label: '告警', color: 'bg-yellow-100 text-yellow-700' },
  error: { label: '故障', color: 'bg-red-100 text-red-700' },
  offline: { label: '离线', color: 'bg-gray-100 text-gray-700' },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');

  // 搜索结果
  const results = useMemo(() => {
    if (!keyword.trim()) {
      return { tickets: [], assets: [], knowledge: [], total: 0 };
    }

    const kw = keyword.toLowerCase();
    
    const tickets = mockTickets.filter(t => 
      t.id.toLowerCase().includes(kw) ||
      t.title.toLowerCase().includes(kw) ||
      t.customer.toLowerCase().includes(kw) ||
      t.description.toLowerCase().includes(kw)
    );

    const assets = mockAssets.filter(a =>
      a.id.toLowerCase().includes(kw) ||
      a.name.toLowerCase().includes(kw) ||
      a.type.toLowerCase().includes(kw) ||
      a.customer.toLowerCase().includes(kw) ||
      a.ip.includes(kw)
    );

    const knowledge = mockKnowledge.filter(k =>
      k.id.toLowerCase().includes(kw) ||
      k.title.toLowerCase().includes(kw) ||
      k.category.toLowerCase().includes(kw) ||
      k.tags.some(tag => tag.toLowerCase().includes(kw))
    );

    return { tickets, assets, knowledge, total: tickets.length + assets.length + knowledge.length };
  }, [keyword]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">搜索结果</h1>
        <p className="text-gray-600 mt-1">
          {keyword ? `找到 ${results.total} 条与"${keyword}"相关的结果` : '请输入搜索关键词'}
        </p>
      </div>

      {/* 无结果提示 */}
      {keyword && results.total === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">未找到与"{keyword}"相关的结果</p>
            <p className="text-gray-400 mt-2">请尝试使用其他关键词</p>
          </CardContent>
        </Card>
      )}

      {/* 搜索结果 */}
      {keyword && results.total > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部 ({results.total})</TabsTrigger>
            <TabsTrigger value="tickets">工单 ({results.tickets.length})</TabsTrigger>
            <TabsTrigger value="assets">资产 ({results.assets.length})</TabsTrigger>
            <TabsTrigger value="knowledge">知识库 ({results.knowledge.length})</TabsTrigger>
          </TabsList>

          {/* 全部结果 */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {results.tickets.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Ticket className="w-4 h-4 mr-2" />
                    工单 ({results.tickets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.tickets.slice(0, 3).map(ticket => (
                    <Link 
                      key={ticket.id} 
                      href={`/tickets`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-blue-600">{ticket.id}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{ticket.title}</span>
                        </div>
                        <Badge variant={statusMap[ticket.status].variant}>
                          {statusMap[ticket.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{ticket.customer}</p>
                    </Link>
                  ))}
                  {results.tickets.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('tickets')}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      查看更多 {results.tickets.length - 3} 条工单
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {results.assets.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    资产 ({results.assets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.assets.map(asset => (
                    <Link 
                      key={asset.id} 
                      href={`/assets`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-blue-600">{asset.id}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{asset.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${assetStatusMap[asset.status].color}`}>
                          {assetStatusMap[asset.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{asset.type} · {asset.ip} · {asset.customer}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {results.knowledge.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    知识库 ({results.knowledge.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.knowledge.slice(0, 3).map(item => (
                    <Link 
                      key={item.id} 
                      href={`/portal/knowledge`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-sm text-gray-500">{item.views} 次浏览</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{item.category}</span>
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
                  {results.knowledge.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('knowledge')}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      查看更多 {results.knowledge.length - 3} 条知识
                    </button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 工单结果 */}
          <TabsContent value="tickets" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {results.tickets.map(ticket => (
                    <Link 
                      key={ticket.id} 
                      href={`/tickets`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-blue-600">{ticket.id}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{ticket.title}</span>
                        </div>
                        <Badge variant={statusMap[ticket.status].variant}>
                          {statusMap[ticket.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{ticket.customer} · {ticket.description}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 资产结果 */}
          <TabsContent value="assets" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {results.assets.map(asset => (
                    <Link 
                      key={asset.id} 
                      href={`/assets`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-blue-600">{asset.id}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{asset.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${assetStatusMap[asset.status].color}`}>
                          {assetStatusMap[asset.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{asset.type} · IP: {asset.ip} · {asset.customer}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 知识库结果 */}
          <TabsContent value="knowledge" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {results.knowledge.map(item => (
                    <Link 
                      key={item.id} 
                      href={`/portal/knowledge`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-sm text-gray-500">{item.views} 次浏览</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{item.category}</span>
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">搜索结果</h1>
            <p className="text-gray-600 mt-1">加载中...</p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">正在搜索...</div>
            </CardContent>
          </Card>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </AppLayout>
  );
}
