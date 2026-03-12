'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// 模拟数据
const ticketTrendData = [
  { date: '01-01', created: 45, resolved: 40 },
  { date: '01-02', created: 52, resolved: 48 },
  { date: '01-03', created: 38, resolved: 45 },
  { date: '01-04', created: 65, resolved: 55 },
  { date: '01-05', created: 48, resolved: 50 },
  { date: '01-06', created: 55, resolved: 60 },
  { date: '01-07', created: 42, resolved: 38 },
];

const ticketTypeData = [
  { name: '事件管理', value: 35 },
  { name: '请求管理', value: 28 },
  { name: '变更管理', value: 22 },
  { name: '问题管理', value: 15 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const avgHandleTime = [
  { type: '事件管理', time: 4.5 },
  { type: '请求管理', time: 2.3 },
  { type: '变更管理', time: 8.2 },
  { type: '问题管理', time: 12.6 },
];

export default function TicketsStatisticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单统计</h1>
          <p className="text-gray-600 mt-1">工单数据分析和可视化展示</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">本月工单总数</p>
              <p className="text-2xl font-bold mt-1">345</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">平均处理时间</p>
              <p className="text-2xl font-bold mt-1">6.8小时</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">按时完成率</p>
              <p className="text-2xl font-bold mt-1">92.5%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">客户满意度</p>
              <p className="text-2xl font-bold mt-1">4.6分</p>
            </CardContent>
          </Card>
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
                  <LineChart data={ticketTrendData}>
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
                      data={ticketTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ticketTypeData.map((entry, index) => (
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

        {/* 平均处理时间 */}
        <Card>
          <CardHeader>
            <CardTitle>各类工单平均处理时间</CardTitle>
            <CardDescription>单位：小时</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgHandleTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="time" fill="#3b82f6" name="处理时间" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
