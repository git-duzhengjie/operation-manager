'use client';

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
import { Search, Download, FileText, ChevronLeft, ChevronRight, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface LogItem {
  id: string;
  user: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  status: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface LogStats {
  todayCount: number;
  successCount: number;
  failedCount: number;
  activeUsers: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [stats, setStats] = useState<LogStats>({ todayCount: 0, successCount: 0, failedCount: 0, activeUsers: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 获取日志列表
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('pageSize', String(pagination.pageSize));
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (actionFilter !== 'all') params.append('actionType', actionFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/logs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setStats(result.data.stats);
        setPagination(prev => ({
          ...prev,
          ...result.data.pagination,
        }));
      }
    } catch (error) {
      console.error('获取日志列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchKeyword, actionFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  // 重置筛选
  const handleReset = () => {
    setSearchKeyword('');
    setActionFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 分页
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 导出日志
  const handleExport = () => {
    // 构建 CSV 数据
    const headers = ['ID', '用户', '操作', '资源', '资源ID', 'IP地址', '状态', '时间'];
    const rows = logs.map(log => [
      log.id,
      log.user,
      log.action,
      log.resource,
      log.resourceId,
      log.ip,
      log.status === 'success' ? '成功' : '失败',
      log.createdAt,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `系统日志_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 清理旧日志
  const handleCleanup = async () => {
    if (!confirm('确定要清理 30 天前的日志吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch('/api/logs?days=30', { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        fetchLogs();
      } else {
        alert(result.error || '清理失败');
      }
    } catch (error) {
      console.error('清理日志失败:', error);
      alert('清理失败');
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">系统日志</h1>
            <p className="text-gray-600 mt-1">查看系统操作日志和审计记录</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCleanup}>
              <Trash2 className="w-4 h-4 mr-2" />
              清理日志
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出日志
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日操作</p>
                  <p className="text-2xl font-bold mt-1">{stats.todayCount.toLocaleString()}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">成功操作</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.successCount.toLocaleString()}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">失败操作</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{stats.failedCount.toLocaleString()}</p>
                </div>
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">活跃用户</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{stats.activeUsers}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索用户、操作、资源..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="login">登录/登出</SelectItem>
                  <SelectItem value="create">创建</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="export">导出</SelectItem>
                  <SelectItem value="import">导入</SelectItem>
                  <SelectItem value="view">查看</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                  placeholder="开始日期"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">至</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                  placeholder="结束日期"
                />
              </div>
            </div>
            <div className="flex items-center justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={handleReset}>
                重置
              </Button>
              <Button onClick={handleSearch}>
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 日志列表 */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">加载中...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">暂无日志数据</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>资源</TableHead>
                    <TableHead>资源ID</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono text-sm">{log.resourceId}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.status === 'success' ? 'default' : 'destructive'}
                          className={log.status === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {log.status === 'success' ? '成功' : '失败'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatTime(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
