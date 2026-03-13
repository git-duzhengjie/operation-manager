'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Link,
  Loader2,
  ExternalLink,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Alert {
  id: string;
  alertId: string;
  source: string;
  level: string;
  levelLabel: string;
  title: string;
  description: string | null;
  assetId: number | null;
  assetName: string;
  customerId: number | null;
  customerName: string;
  status: string;
  statusLabel: string;
  ticketId: number | null;
  ticketCode: string | null;
  rawData: Record<string, unknown> | null;
  resolvedAt: string;
  createdAt: string;
}

interface Stats {
  today: number;
  critical: number;
  pending: number;
  resolved: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const levelConfig: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  warning: { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待处理', variant: 'secondary' },
  processing: { label: '处理中', variant: 'default' },
  resolved: { label: '已解决', variant: 'outline' },
  ignored: { label: '已忽略', variant: 'secondary' },
};

export default function MonitoringPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({ today: 0, critical: 0, pending: 0, resolved: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [sources, setSources] = useState<string[]>([]);
  const [levelOptions, setLevelOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 创建工单对话框状态
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [creatingTicketAlert, setCreatingTicketAlert] = useState<Alert | null>(null);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    type: 'incident',
    priority: 'high',
    description: '',
  });

  // 获取告警列表
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchKeyword) params.set('keyword', searchKeyword);
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));

      const response = await fetch(`/api/alerts?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data.alerts);
        setStats(result.data.stats);
        setPagination(result.data.pagination);
        setSources(result.data.sources);
        setLevelOptions(result.data.levelOptions);
        setStatusOptions(result.data.statusOptions);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('获取失败', { description: '无法获取告警列表' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, statusFilter, sourceFilter, searchKeyword, pagination.page, pagination.pageSize]);

  // 重置到第一页（筛选变化时）
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [levelFilter, statusFilter, sourceFilter, searchKeyword]);

  // 查看告警详情
  const handleViewDetail = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  // 更新告警状态
  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('状态更新成功');
        setStatusDialogOpen(false);
        setUpdatingStatus(null);
        fetchAlerts();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
      toast.error('更新失败', { description: '无法更新告警状态' });
    } finally {
      setSaving(false);
    }
  };

  // 创建工单（打开对话框）
  const handleCreateTicket = (alert: Alert) => {
    setCreatingTicketAlert(alert);
    setTicketForm({
      title: `[告警] ${alert.title}`,
      type: alert.level === 'critical' ? 'incident' : 'request',
      priority: alert.level === 'critical' ? 'urgent' : alert.level === 'warning' ? 'high' : 'medium',
      description: alert.description || `来源: ${alert.source}\n资产: ${alert.assetName}\n客户: ${alert.customerName}\n\n原始告警ID: ${alert.alertId}`,
    });
    setTicketDialogOpen(true);
  };

  // 确认创建工单
  const handleConfirmCreateTicket = async () => {
    if (!creatingTicketAlert) return;
    if (!ticketForm.title.trim()) {
      toast.error('请输入工单标题');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTicket',
          alertId: creatingTicketAlert.id,
          ...ticketForm,
          customerName: creatingTicketAlert.customerName,
          assetName: creatingTicketAlert.assetName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('工单创建成功', {
          description: `工单号: ${result.data.ticketCode}`,
        });
        setTicketDialogOpen(false);
        setCreatingTicketAlert(null);
        fetchAlerts();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('创建工单失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监控告警</h1>
          <p className="text-gray-600 mt-1">接收和管理监控系统推送的告警</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日告警</p>
                  <p className="text-2xl font-bold mt-1">{stats.today}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">严重告警</p>
                  <p className="text-2xl font-bold mt-1">{stats.critical}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待处理</p>
                  <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已解决</p>
                  <p className="text-2xl font-bold mt-1">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索告警ID、标题、资产..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="告警级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  {levelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 告警列表 */}
        <Card>
          {loading ? (
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              加载中...
            </CardContent>
          ) : alerts.length === 0 ? (
            <CardContent className="p-8 text-center text-gray-500">
              暂无告警数据
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>告警ID</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>资产</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>关联工单</TableHead>
                  <TableHead>接收时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const levelInfo = levelConfig[alert.level] || levelConfig.info;
                  const Icon = levelInfo.icon;
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-sm">{alert.alertId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${levelInfo.bgColor}`}>
                            <Icon className={`w-4 h-4 ${levelInfo.color}`} />
                          </div>
                          <span className={levelInfo.color + ' font-medium'}>
                            {alert.levelLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={alert.title}>
                        {alert.title}
                      </TableCell>
                      <TableCell>{alert.source}</TableCell>
                      <TableCell>{alert.assetName}</TableCell>
                      <TableCell>{alert.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[alert.status]?.variant || 'secondary'}>
                          {alert.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.ticketCode ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => router.push(`/tickets/${alert.ticketCode}`)}
                          >
                            <Link className="w-3 h-3 mr-1" />
                            {alert.ticketCode}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTicket(alert)}
                          >
                            创建工单
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{alert.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(alert)}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {alert.status !== 'resolved' && alert.status !== 'ignored' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUpdatingStatus(alert.id);
                                setStatusDialogOpen(true);
                              }}
                              title="更新状态"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* 分页 */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 告警详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>告警详情</DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">告警ID</Label>
                  <p className="font-mono">{selectedAlert.alertId}</p>
                </div>
                <div>
                  <Label className="text-gray-500">来源</Label>
                  <p>{selectedAlert.source}</p>
                </div>
                <div>
                  <Label className="text-gray-500">级别</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${levelConfig[selectedAlert.level]?.bgColor}`}>
                      {(() => {
                        const Icon = levelConfig[selectedAlert.level]?.icon || Info;
                        return <Icon className={`w-4 h-4 ${levelConfig[selectedAlert.level]?.color}`} />;
                      })()}
                    </div>
                    <span className={levelConfig[selectedAlert.level]?.color + ' font-medium'}>
                      {selectedAlert.levelLabel}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">状态</Label>
                  <Badge variant={statusConfig[selectedAlert.status]?.variant || 'secondary'}>
                    {selectedAlert.statusLabel}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">资产</Label>
                  <p>{selectedAlert.assetName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">客户</Label>
                  <p>{selectedAlert.customerName}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">标题</Label>
                <p className="font-medium">{selectedAlert.title}</p>
              </div>

              <div>
                <Label className="text-gray-500">描述</Label>
                <p className="text-gray-700">{selectedAlert.description || '-'}</p>
              </div>

              {selectedAlert.ticketCode && (
                <div>
                  <Label className="text-gray-500">关联工单</Label>
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      router.push(`/tickets/${selectedAlert.ticketCode}`);
                    }}
                  >
                    {selectedAlert.ticketCode}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">接收时间</Label>
                  <p className="text-sm">{selectedAlert.createdAt}</p>
                </div>
                <div>
                  <Label className="text-gray-500">解决时间</Label>
                  <p className="text-sm">{selectedAlert.resolvedAt}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更新状态对话框 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新告警状态</DialogTitle>
          </DialogHeader>

          <p className="py-4">请选择新的告警状态：</p>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => updatingStatus && handleUpdateStatus(updatingStatus, 'processing')}
              disabled={saving}
            >
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <span>处理中</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => updatingStatus && handleUpdateStatus(updatingStatus, 'resolved')}
              disabled={saving}
            >
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>已解决</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 col-span-2"
              onClick={() => updatingStatus && handleUpdateStatus(updatingStatus, 'ignored')}
              disabled={saving}
            >
              <XCircle className="w-6 h-6 text-gray-600" />
              <span>忽略</span>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建工单对话框 */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建工单</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {creatingTicketAlert && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">告警信息:</span>
                  <Badge className={levelConfig[creatingTicketAlert.level]?.bgColor + ' ' + levelConfig[creatingTicketAlert.level]?.color}>
                    {creatingTicketAlert.levelLabel}
                  </Badge>
                </div>
                <p className="text-gray-600">{creatingTicketAlert.alertId} - {creatingTicketAlert.title}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ticketTitle">工单标题 *</Label>
              <Input
                id="ticketTitle"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                placeholder="请输入工单标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticketType">工单类型</Label>
                <Select
                  value={ticketForm.type}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">事件管理</SelectItem>
                    <SelectItem value="request">请求管理</SelectItem>
                    <SelectItem value="change">变更管理</SelectItem>
                    <SelectItem value="problem">问题管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketPriority">优先级</Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">紧急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketDesc">工单描述</Label>
              <Textarea
                id="ticketDesc"
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="请输入工单描述"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmCreateTicket} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建工单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
