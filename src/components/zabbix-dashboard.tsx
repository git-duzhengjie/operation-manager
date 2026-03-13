'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Server,
  ExternalLink,
  Loader2,
  RefreshCw,
  Activity,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ZabbixProblem {
  id: string;
  eventId: string;
  triggerId: string;
  name: string;
  severity: string;
  level: string;
  levelLabel: string;
  color: string;
  acknowledged: boolean;
  clock: string;
  time: string;
  opdata: string;
  hosts: Array<{
    hostid: string;
    host: string;
    name: string;
  }>;
}

interface ZabbixStats {
  totalProblems: number;
  todayProblems: number;
  totalHosts: number;
  activeTriggers: number;
  severityCount: {
    disaster: number;
    high: number;
    average: number;
    warning: number;
    info: number;
  };
  acknowledged: number;
  unacknowledged: number;
}

interface ZabbixDashboardProps {
  zabbixUrl?: string;
}

const levelConfig: Record<string, { icon: typeof AlertTriangle; colorClass: string; bgClass: string }> = {
  critical: { icon: AlertTriangle, colorClass: 'text-red-600', bgClass: 'bg-red-100' },
  warning: { icon: AlertCircle, colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
  info: { icon: Info, colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
};

export function ZabbixDashboard({ zabbixUrl }: ZabbixDashboardProps) {
  const [problems, setProblems] = useState<ZabbixProblem[]>([]);
  const [stats, setStats] = useState<ZabbixStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [configStatus, setConfigStatus] = useState<'checking' | 'configured' | 'not_configured'>('checking');
  const [frontendUrl, setFrontendUrl] = useState<string>('');

  // 检查 Zabbix 配置状态
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/zabbix?action=version');
        const result = await response.json();
        
        if (result.success) {
          setConfigStatus('configured');
          setFrontendUrl(result.data.zabbixUrl || '');
        } else {
          setConfigStatus('not_configured');
        }
      } catch {
        setConfigStatus('not_configured');
      }
    };
    
    checkConfig();
  }, []);

  // 获取统计数据
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/zabbix?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
        setFrontendUrl(result.data.zabbixUrl || '');
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 获取问题列表
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/zabbix?action=problems&limit=20');
      const result = await response.json();
      
      if (result.success) {
        setProblems(result.data.problems);
        setFrontendUrl(result.data.zabbixUrl || '');
      } else {
        console.error('Failed to fetch problems:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast.error('获取告警数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (configStatus === 'configured') {
      fetchStats();
      fetchProblems();
    }
  }, [configStatus]);

  // 刷新数据
  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchProblems()]);
    toast.success('数据已刷新');
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  // 未配置状态
  if (configStatus === 'checking') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">检查 Zabbix 配置...</span>
      </div>
    );
  }

  if (configStatus === 'not_configured') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-900">Zabbix 未配置</h3>
              <p className="text-sm text-orange-700 mt-1">
                请设置以下环境变量来启用 Zabbix 监控集成：
              </p>
              <ul className="text-sm text-orange-600 mt-2 list-disc list-inside space-y-1">
                <li><code className="bg-orange-100 px-1 rounded">NEXT_PUBLIC_ZABBIX_URL</code> - Zabbix 服务器地址</li>
                <li><code className="bg-orange-100 px-1 rounded">ZABBIX_USER</code> - Zabbix 用户名</li>
                <li><code className="bg-orange-100 px-1 rounded">ZABBIX_PASSWORD</code> - Zabbix 密码</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zabbix 实时监控</h2>
          <p className="text-sm text-gray-600 mt-1">
            数据来源：Zabbix 监控系统
            {frontendUrl && (
              <a
                href={frontendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:underline inline-flex items-center"
              >
                打开 Zabbix <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || statsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">当前问题</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.totalProblems || 0}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">今日告警</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.todayProblems || 0}
                </p>
              </div>
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">监控主机</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.totalHosts || 0}
                </p>
              </div>
              <Server className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">待确认</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.unacknowledged || 0}
                </p>
              </div>
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">已确认</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.acknowledged || 0}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 问题级别分布 */}
      {stats && (
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-red-100 rounded-lg p-3 text-center">
            <p className="text-xs text-red-800">灾难</p>
            <p className="text-xl font-bold text-red-900">{stats.severityCount.disaster}</p>
          </div>
          <div className="bg-orange-100 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-800">严重</p>
            <p className="text-xl font-bold text-orange-900">{stats.severityCount.high}</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-800">一般严重</p>
            <p className="text-xl font-bold text-yellow-900">{stats.severityCount.average}</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-800">警告</p>
            <p className="text-xl font-bold text-blue-900">{stats.severityCount.warning}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-800">信息</p>
            <p className="text-xl font-bold text-gray-900">{stats.severityCount.info}</p>
          </div>
        </div>
      )}

      {/* 问题列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">最新问题</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">加载中...</span>
            </div>
          ) : problems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p>暂无活动问题</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">级别</TableHead>
                  <TableHead>问题描述</TableHead>
                  <TableHead className="w-32">主机</TableHead>
                  <TableHead className="w-20">状态</TableHead>
                  <TableHead className="w-24">时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem) => {
                  const config = levelConfig[problem.level] || levelConfig.info;
                  const Icon = config.icon;
                  
                  return (
                    <TableRow key={problem.id}>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${config.colorClass}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{problem.levelLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                          {problem.name}
                        </p>
                        {problem.opdata && (
                          <p className="text-xs text-gray-500">{problem.opdata}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {problem.hosts.map((h) => (
                          <span key={h.hostid} className="text-xs text-gray-600 block truncate">
                            {h.name}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell>
                        {problem.acknowledged ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            已确认
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                            待确认
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {formatTime(problem.time)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
