import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

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
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
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
    const client = getDbClient();

    // 根据工单号查询
    const { data: ticket, error } = await client
      .from('tickets')
      .select('*')
      .eq('ticket_no', id)
      .single();

    if (error || !ticket) {
      console.error('Ticket not found:', error);
      return NextResponse.json({
        success: false,
        error: '工单不存在',
      }, { status: 404 });
    }

    const ticketData = {
      id: ticket.ticket_no || id,
      title: ticket.title || '',
      type: ticket.type ? (typeMap[String(ticket.type)] || String(ticket.type)) : '',
      status: ticket.status ? (statusMap[String(ticket.status)] || String(ticket.status)) : '',
      priority: ticket.priority ? (priorityMap[String(ticket.priority)] || String(ticket.priority)) : '',
      description: ticket.description || '',
      customer: ticket.customer_name || '-',
      project: '-',
      assignee: '未分配',
      createdAt: formatDateTime(ticket.created_at as string | null),
      updatedAt: formatDateTime(ticket.updated_at as string | null),
    };

    // 获取工单历史记录（如果有单独的表）
    let historyData: Array<{
      id: number;
      action: string;
      fromStatus: string | null;
      toStatus: string | null;
      comment: string | null;
      operator: string;
      createdAt: string;
    }> = [];

    // 尝试获取历史记录
    try {
      const { data: history } = await client
        .from('ticket_history')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      if (history && history.length > 0) {
        historyData = history.map((h: Record<string, unknown>) => ({
          id: h.id as number,
          action: (h.action as string) || '',
          fromStatus: h.from_status ? (statusMap[h.from_status as string] || h.from_status as string) : null,
          toStatus: h.to_status ? (statusMap[h.to_status as string] || h.to_status as string) : null,
          comment: (h.comment as string) || null,
          operator: '系统',
          createdAt: formatDateTime(h.created_at as string),
        }));
      }
    } catch {
      // 历史记录表可能不存在，使用默认空数组
    }

    // 如果没有历史记录，创建一条创建记录
    if (historyData.length === 0) {
      historyData = [{
        id: 1,
        action: 'created',
        fromStatus: null,
        toStatus: ticketData.status,
        comment: '工单创建',
        operator: '系统',
        createdAt: ticketData.createdAt,
      }];
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket: ticketData,
        history: historyData,
        attachments: [],
      },
    });
  } catch (error) {
    console.error('Failed to fetch ticket detail:', error);
    return NextResponse.json({
      success: false,
      error: '获取工单详情失败',
    }, { status: 500 });
  }
}
