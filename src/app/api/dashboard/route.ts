import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { eq, sql, and, gte, desc, lte } from 'drizzle-orm';

// 内存数据回退
const memoryTickets = [
  { id: 1, ticketNo: 'WO20240101001', title: '服务器磁盘空间不足告警', type: 'incident', priority: 'high', status: 'processing', createdAt: new Date(Date.now() - 10 * 60 * 1000) },
  { id: 2, ticketNo: 'WO20240101002', title: '新员工入职账号申请', type: 'request', priority: 'medium', status: 'pending', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 3, ticketNo: 'WO20240101003', title: '应用系统升级变更申请', type: 'change', priority: 'high', status: 'assigned', createdAt: new Date(Date.now() - 60 * 60 * 1000) },
  { id: 4, ticketNo: 'WO20240101004', title: '数据库性能问题排查', type: 'problem', priority: 'urgent', status: 'processing', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 5, ticketNo: 'WO20240101005', title: '网络访问权限申请', type: 'request', priority: 'low', status: 'resolved', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: 6, ticketNo: 'WO20240101006', title: 'VPN账号开通申请', type: 'request', priority: 'medium', status: 'pending', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: 7, ticketNo: 'WO20240101007', title: '服务器重启申请', type: 'change', priority: 'low', status: 'assigned', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 8, ticketNo: 'WO20240101008', title: '系统登录异常', type: 'incident', priority: 'high', status: 'processing', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
];

// 生成趋势数据的辅助函数
function generateTrendData() {
  const data = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    data.push({
      date: dateStr,
      created: Math.floor(Math.random() * 30) + 30,
      resolved: Math.floor(Math.random() * 25) + 25,
    });
  }
  
  return data;
}

// 格式化时间
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

// 状态映射
const statusMap: Record<string, string> = {
  'pending': '待分配',
  'assigned': '待审批',
  'processing': '处理中',
  'resolved': '已完成',
  'closed': '已关闭',
};

// 优先级映射
const priorityMap: Record<string, string> = {
  'low': '低',
  'medium': '中',
  'high': '高',
  'urgent': '紧急',
};

// 类型映射
const typeMap: Record<string, string> = {
  'change': '变更管理',
  'incident': '事件管理',
  'request': '请求管理',
  'problem': '问题管理',
};

// GET: 获取仪表板数据
export async function GET() {
  try {
    let statsData;
    let trendData;
    let typeData;
    let recentTicketsData;
    let useFallback = false;

    try {
      // 尝试从数据库获取数据
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. 统计数据
      const [pendingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.status, 'pending'));

      const [processingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.status, 'processing'));

      const [resolvedThisMonth] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.status, 'resolved'),
          gte(tickets.resolvedAt!, monthStart)
        ));

      const [urgentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.priority, 'urgent'),
          sql`${tickets.status} NOT IN ('resolved', 'closed')`
        ));

      statsData = {
        pending: pendingCount?.count || 0,
        processing: processingCount?.count || 0,
        resolvedThisMonth: resolvedThisMonth?.count || 0,
        urgent: urgentCount?.count || 0,
      };

      // 2. 趋势数据 - 近7天
      trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 1);

        const [createdCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(and(
            gte(tickets.createdAt, dateStart),
            lte(tickets.createdAt, dateEnd)
          ));

        const [resolvedCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(and(
            gte(tickets.resolvedAt!, dateStart),
            lte(tickets.resolvedAt!, dateEnd)
          ));

        const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        trendData.push({
          date: dateStr,
          created: createdCount?.count || 0,
          resolved: resolvedCount?.count || 0,
        });
      }

      // 3. 类型分布
      const typeCounts = await db
        .select({
          type: tickets.type,
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .groupBy(tickets.type);

      typeData = typeCounts.map(t => ({
        name: typeMap[t.type] || t.type,
        value: t.count,
      }));

      // 4. 最近工单
      const recentTickets = await db
        .select()
        .from(tickets)
        .orderBy(desc(tickets.createdAt))
        .limit(5);

      recentTicketsData = recentTickets.map(t => ({
        id: t.ticketNo || '',
        title: t.title || '',
        status: statusMap[t.status || ''] || t.status,
        priority: priorityMap[t.priority || ''] || t.priority,
        time: formatTime(t.createdAt || new Date()),
      }));

    } catch (dbError) {
      console.log('Database not available, using memory data for dashboard');
      useFallback = true;

      // 使用内存数据
      const pendingTickets = memoryTickets.filter(t => t.status === 'pending');
      const processingTickets = memoryTickets.filter(t => t.status === 'processing');
      const resolvedTickets = memoryTickets.filter(t => t.status === 'resolved');
      const urgentTickets = memoryTickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status));

      statsData = {
        pending: pendingTickets.length,
        processing: processingTickets.length,
        resolvedThisMonth: 156, // 模拟本月完成数
        urgent: urgentTickets.length,
      };

      trendData = generateTrendData();

      // 计算类型分布
      const typeCounts: Record<string, number> = {};
      memoryTickets.forEach(t => {
        typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
      });
      typeData = Object.entries(typeCounts).map(([type, count]) => ({
        name: typeMap[type] || type,
        value: count,
      }));

      recentTicketsData = memoryTickets
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(t => ({
          id: t.ticketNo,
          title: t.title,
          status: statusMap[t.status] || t.status,
          priority: priorityMap[t.priority] || t.priority,
          time: formatTime(t.createdAt),
        }));
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: [
          { title: '待处理工单', value: statsData.pending.toString(), icon: 'Ticket', color: 'text-orange-600', bgColor: 'bg-orange-100' },
          { title: '处理中工单', value: statsData.processing.toString(), icon: 'Clock', color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { title: '本月完成', value: statsData.resolvedThisMonth.toString(), icon: 'CheckCircle', color: 'text-green-600', bgColor: 'bg-green-100' },
          { title: '紧急工单', value: statsData.urgent.toString(), icon: 'AlertTriangle', color: 'text-red-600', bgColor: 'bg-red-100' },
        ],
        ticketTrend: trendData,
        ticketType: typeData,
        recentTickets: recentTicketsData,
      },
      fallback: useFallback,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({
      success: false,
      error: '获取仪表板数据失败',
    }, { status: 500 });
  }
}
