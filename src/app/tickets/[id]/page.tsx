'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Paperclip,
  History,
  Loader2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TicketData {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  customer?: string;
  project?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryItem {
  id: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  comment: string;
  operator: string;
  createdAt: string;
}

interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
}

interface TicketDetail {
  ticket: TicketData;
  history: HistoryItem[];
  attachments: Attachment[];
}

// 状态颜色
const statusColors: Record<string, string> = {
  '待分配': 'bg-orange-100 text-orange-700',
  '待审批': 'bg-yellow-100 text-yellow-700',
  '处理中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已关闭': 'bg-gray-100 text-gray-700',
};

// 优先级颜色
const priorityColors: Record<string, string> = {
  '低': 'text-gray-600',
  '中': 'text-blue-600',
  '高': 'text-orange-600',
  '紧急': 'text-red-600',
};

// 操作类型映射
const actionMap: Record<string, string> = {
  'created': '创建工单',
  'assigned': '分配工单',
  'processing': '开始处理',
  'resolved': '完成处理',
  'closed': '关闭工单',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || '获取工单详情失败');
        }
      } catch (err) {
        console.error('Failed to fetch ticket detail:', err);
        setError('获取工单详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetail();
  }, [ticketId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <p className="text-lg text-gray-600">{error || '工单不存在'}</p>
              <Button className="mt-4" onClick={() => router.push('/tickets')}>
                返回工单列表
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const { ticket, history, attachments } = data;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                <Badge className={statusColors[ticket.status]}>
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">工单号：{ticket.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              导出
            </Button>
            {ticket.status !== '已完成' && ticket.status !== '已关闭' && (
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                处理工单
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：工单信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">工单类型：</span>
                    <span className="font-medium">{ticket.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={cn('w-4 h-4', priorityColors[ticket.priority])} />
                    <span className="text-gray-600">优先级：</span>
                    <span className={cn('font-medium', priorityColors[ticket.priority])}>
                      {ticket.priority}
                    </span>
                  </div>
                  {ticket.customer && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">客户：</span>
                      <span className="font-medium">{ticket.customer}</span>
                    </div>
                  )}
                  {ticket.project && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">项目：</span>
                      <span className="font-medium">{ticket.project}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">处理人：</span>
                    <span className="font-medium">{ticket.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">创建时间：</span>
                    <span className="font-medium">{ticket.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">更新时间：</span>
                    <span className="font-medium">{ticket.updatedAt}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 问题描述 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">问题描述</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {ticket.description}
                </div>
              </CardContent>
            </Card>

            {/* 附件 */}
            {attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    附件 ({attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{file.fileName}</span>
                          {file.fileSize && (
                            <span className="text-sm text-gray-500">
                              ({(file.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          下载
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：处理历史 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  处理历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={item.id} className="relative pl-10">
                        {/* 时间点 */}
                        <div className={cn(
                          'absolute left-2 w-4 h-4 rounded-full border-2 border-white',
                          index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                        )} />
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {actionMap[item.action] || item.action}
                            </span>
                            <span className="text-xs text-gray-500">{item.createdAt}</span>
                          </div>
                          {item.fromStatus && item.toStatus && (
                            <p className="text-sm text-gray-600">
                              {item.fromStatus} → {item.toStatus}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                          <p className="text-xs text-gray-500 mt-1">操作人：{item.operator}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
