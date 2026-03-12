import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, ticketHistory, ticketAttachments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// 内存数据回退
const memoryTickets: Record<string, {
  id: number;
  ticketNo: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  customer: string;
  project: string;
  assignee: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}> = {
  'WO20240101001': {
    id: 1,
    ticketNo: 'WO20240101001',
    title: '服务器磁盘空间不足告警',
    type: 'incident',
    status: 'processing',
    priority: 'high',
    customer: '市财政局',
    project: '预算管理系统',
    assignee: '张三',
    description: '预算管理系统应用服务器磁盘空间使用率已超过90%，需要及时处理。\n\n受影响服务器信息：\n- 主机名：APP-SRV-001\n- IP地址：192.168.1.100\n- 磁盘：/dev/sda1\n- 当前使用率：92.5%\n\n需要清理日志文件或扩容磁盘空间。',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  'WO20240101002': {
    id: 2,
    ticketNo: 'WO20240101002',
    title: '新员工入职账号申请',
    type: 'request',
    status: 'pending',
    priority: 'medium',
    customer: '市人社局',
    project: '人事管理系统',
    assignee: '李四',
    description: '新入职员工需要开通系统账号和邮箱。\n\n员工信息：\n- 姓名：王建国\n- 部门：信息中心\n- 职位：系统管理员\n- 入职日期：2024-01-20\n\n需要开通的账号：\n1. 域账号\n2. 邮箱账号\n3. OA系统账号\n4. VPN账号',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  'WO20240101003': {
    id: 3,
    ticketNo: 'WO20240101003',
    title: '应用系统升级变更申请',
    type: 'change',
    status: 'assigned',
    priority: 'high',
    customer: '市卫健委',
    project: '医院信息系统',
    assignee: '王五',
    description: '医院信息系统需要从V2.0升级到V2.1版本。\n\n变更内容：\n- 版本升级：V2.0 -> V2.1\n- 升级时间：2024-01-20 22:00\n- 预计时长：2小时\n\n变更原因：\n修复已知安全漏洞，优化系统性能。\n\n回滚计划：\n如升级失败，将在30分钟内回滚至V2.0版本。',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  'WO20240101004': {
    id: 4,
    ticketNo: 'WO20240101004',
    title: '数据库性能问题排查',
    type: 'problem',
    status: 'processing',
    priority: 'urgent',
    customer: '市教育局',
    project: '学籍管理系统',
    assignee: '赵六',
    description: '学籍管理系统数据库响应缓慢，影响正常业务操作。\n\n问题描述：\n- 问题发现时间：2024-01-15 09:00\n- 影响范围：所有查询操作\n- 症状：查询响应时间超过10秒\n\n初步分析：\n- 数据库CPU使用率正常\n- 内存使用率正常\n- 可能存在慢查询需要优化',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  'WO20240101005': {
    id: 5,
    ticketNo: 'WO20240101005',
    title: '网络访问权限申请',
    type: 'request',
    status: 'resolved',
    priority: 'low',
    customer: '市住建局',
    project: '房产管理系统',
    assignee: '孙七',
    description: '申请开通房产管理系统外网访问权限。\n\n申请人信息：\n- 姓名：周明\n- 部门：房产科\n- 申请原因：居家办公需要\n\n需要开通的权限：\n- 外网VPN访问\n- 系统远程访问',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
};

// 工单历史记录
const memoryTicketHistory: Record<string, Array<{
  id: number;
  ticketId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  comment: string;
  operator: string;
  createdAt: Date;
}>> = {
  'WO20240101001': [
    { id: 1, ticketId: 1, action: 'created', fromStatus: null, toStatus: 'pending', comment: '工单创建', operator: '系统', createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    { id: 2, ticketId: 1, action: 'assigned', fromStatus: 'pending', toStatus: 'assigned', comment: '分配给张三处理', operator: '管理员', createdAt: new Date(Date.now() - 9 * 60 * 1000) },
    { id: 3, ticketId: 1, action: 'processing', fromStatus: 'assigned', toStatus: 'processing', comment: '开始处理，正在清理日志文件', operator: '张三', createdAt: new Date(Date.now() - 5 * 60 * 1000) },
  ],
  'WO20240101002': [
    { id: 1, ticketId: 2, action: 'created', fromStatus: null, toStatus: 'pending', comment: '工单创建', operator: '系统', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
  ],
  'WO20240101003': [
    { id: 1, ticketId: 3, action: 'created', fromStatus: null, toStatus: 'pending', comment: '工单创建', operator: '系统', createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    { id: 2, ticketId: 3, action: 'assigned', fromStatus: 'pending', toStatus: 'assigned', comment: '分配给王五评估', operator: '管理员', createdAt: new Date(Date.now() - 45 * 60 * 1000) },
  ],
  'WO20240101004': [
    { id: 1, ticketId: 4, action: 'created', fromStatus: null, toStatus: 'pending', comment: '工单创建', operator: '系统', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 2, ticketId: 4, action: 'assigned', fromStatus: 'pending', toStatus: 'processing', comment: '紧急处理中，已定位慢查询', operator: '赵六', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  ],
  'WO20240101005': [
    { id: 1, ticketId: 5, action: 'created', fromStatus: null, toStatus: 'pending', comment: '工单创建', operator: '系统', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { id: 2, ticketId: 5, action: 'resolved', fromStatus: 'pending', toStatus: 'resolved', comment: '已开通VPN权限', operator: '孙七', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ],
};

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

// 格式化时间
function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// GET: 获取工单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let ticketData: {
      id: string;
      title: string;
      type: string;
      status: string;
      priority: string;
      description: string | null;
      customer?: string;
      project?: string;
      assignee: string;
      createdAt: string;
      updatedAt: string;
    };
    let historyData: Array<{
      id: number;
      action: string;
      fromStatus: string | null;
      toStatus: string | null;
      comment: string | null;
      operator: string;
      createdAt: string;
    }>;
    let attachmentsData: Array<{
      id: number;
      fileName: string;
      filePath: string;
      fileSize: number | null;
    }> = [];
    let useFallback = false;

    try {
      // 尝试从数据库获取
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.ticketNo, id))
        .limit(1);

      if (!ticket) {
        return NextResponse.json({
          success: false,
          error: '工单不存在',
        }, { status: 404 });
      }

      ticketData = {
        id: ticket.ticketNo || '',
        title: ticket.title || '',
        type: ticket.type ? (typeMap[ticket.type] || ticket.type) : '',
        status: ticket.status ? (statusMap[ticket.status] || ticket.status) : '',
        priority: ticket.priority ? (priorityMap[ticket.priority] || ticket.priority) : '',
        description: ticket.description,
        assignee: ticket.assigneeId?.toString() || '未分配',
        createdAt: formatDateTime(ticket.createdAt || new Date()),
        updatedAt: formatDateTime(ticket.updatedAt || new Date()),
      };

      // 获取历史记录
      const history = await db
        .select()
        .from(ticketHistory)
        .where(eq(ticketHistory.ticketId, ticket.id))
        .orderBy(desc(ticketHistory.createdAt));

      historyData = history.map(h => ({
        id: h.id,
        action: h.action || '',
        fromStatus: h.fromStatus ? (statusMap[h.fromStatus] || h.fromStatus) : null,
        toStatus: h.toStatus ? (statusMap[h.toStatus] || h.toStatus) : null,
        comment: h.comment,
        operator: h.operatorId?.toString() || '系统',
        createdAt: formatDateTime(h.createdAt || new Date()),
      }));

      // 获取附件
      const attachments = await db
        .select()
        .from(ticketAttachments)
        .where(eq(ticketAttachments.ticketId, ticket.id));

      attachmentsData = attachments.map(a => ({
        id: a.id,
        fileName: a.fileName || '',
        filePath: a.filePath || '',
        fileSize: a.fileSize,
      }));

    } catch {
      // 使用内存数据
      console.log('Database not available, using memory data for ticket detail');
      useFallback = true;

      const memoryTicket = memoryTickets[id];
      if (!memoryTicket) {
        return NextResponse.json({
          success: false,
          error: '工单不存在',
        }, { status: 404 });
      }

      ticketData = {
        id: memoryTicket.ticketNo,
        title: memoryTicket.title,
        type: typeMap[memoryTicket.type] || memoryTicket.type,
        status: statusMap[memoryTicket.status] || memoryTicket.status,
        priority: priorityMap[memoryTicket.priority] || memoryTicket.priority,
        description: memoryTicket.description,
        customer: memoryTicket.customer,
        project: memoryTicket.project,
        assignee: memoryTicket.assignee,
        createdAt: formatDateTime(memoryTicket.createdAt),
        updatedAt: formatDateTime(memoryTicket.updatedAt),
      };

      historyData = (memoryTicketHistory[id] || []).map(h => ({
        id: h.id,
        action: h.action,
        fromStatus: h.fromStatus ? statusMap[h.fromStatus] : null,
        toStatus: h.toStatus ? statusMap[h.toStatus] : null,
        comment: h.comment,
        operator: h.operator,
        createdAt: formatDateTime(h.createdAt),
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket: ticketData,
        history: historyData,
        attachments: attachmentsData,
      },
      fallback: useFallback,
    });
  } catch (error) {
    console.error('Failed to fetch ticket detail:', error);
    return NextResponse.json({
      success: false,
      error: '获取工单详情失败',
    }, { status: 500 });
  }
}
