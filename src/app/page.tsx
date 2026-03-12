'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  'Ticket': Ticket,
  'Clock': Clock,
  'CheckCircle': CheckCircle,
  'AlertTriangle': AlertTriangle,
};

interface StatItem {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface TrendItem {
  date: string;
  created: number;
  resolved: number;
}

interface TypeItem {
  name: string;
  value: number;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  time: string;
}

interface DashboardData {
  stats: StatItem[];
  ticketTrend: TrendItem[];
  ticketType: TypeItem[];
  recentTickets: RecentTicket[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">加载数据失败，请刷新页面重试</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">运维管理仪表板</h1>
          <p className="text-gray-600 mt-1">实时监控系统运行状态和工单处理情况</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.stats.map((stat) => {
            const IconComponent = iconMap[stat.icon] || Ticket;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 工单趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle>工单趋势</CardTitle>
              <CardDescription>近7天工单创建与完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.ticketTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" name="新建工单" />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" name="完成工单" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 工单类型分布 */}
          <Card>
            <CardHeader>
              <CardTitle>工单类型分布</CardTitle>
              <CardDescription>各类工单占比情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ticketType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.ticketType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近工单 */}
        <Card>
          <CardHeader>
            <CardTitle>最近工单</CardTitle>
            <CardDescription>最新提交的工单列表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">工单号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">标题</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">优先级</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">提交时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                      <td className="py-3 px-4 font-mono text-sm text-blue-600">{ticket.id}</td>
                      <td className="py-3 px-4">{ticket.title}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          ticket.status === '处理中' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === '待分配' ? 'bg-orange-100 text-orange-700' :
                          ticket.status === '待审批' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          ticket.priority === '紧急' ? 'text-red-600' :
                          ticket.priority === '高' ? 'text-orange-600' :
                          ticket.priority === '中' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{ticket.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/portal/quick-submit')}
          >
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">快速提单</p>
                <p className="text-sm text-gray-600">快速提交新的工单</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/assets')}
          >
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">资产查询</p>
                <p className="text-sm text-gray-600">查看资产台账信息</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/portal/knowledge')}
          >
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-purple-100">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">知识库</p>
                <p className="text-sm text-gray-600">查阅运维知识文档</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
