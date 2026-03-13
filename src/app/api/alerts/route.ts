import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// 告警级别映射
const levelLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

// 状态映射
const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化告警数据
function formatAlert(row: Record<string, unknown> | null) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    alertId: row.alert_id as string,
    source: row.source as string,
    level: row.level as string,
    levelLabel: levelLabels[row.level as string] || row.level,
    title: row.title as string,
    description: row.description as string | null,
    assetId: row.asset_id as number | null,
    assetName: row.asset_name as string || '-',
    customerId: row.customer_id as number | null,
    customerName: row.customer_name as string || '-',
    status: row.status as string,
    statusLabel: statusLabels[row.status as string] || row.status,
    ticketId: row.ticket_id as number | null,
    ticketCode: row.ticket_code as string | null,
    rawData: row.raw_data as Record<string, unknown> | null,
    resolvedAt: formatTime(row.resolved_at as string),
    createdAt: formatTime(row.created_at as string),
  };
}

// 初始告警数据
const seedAlerts = [
  {
    alert_id: 'ZBX-2024-001234',
    source: 'Zabbix',
    level: 'critical',
    title: '服务器磁盘使用率超过90%',
    description: '应用服务器-01磁盘使用率达到92%，请及时处理',
    asset_name: '应用服务器-01',
    customer_name: '市财政局',
    status: 'processing',
    ticket_code: 'WO20240101001',
  },
  {
    alert_id: 'ZBX-2024-001235',
    source: 'Zabbix',
    level: 'warning',
    title: '数据库连接数接近上限',
    description: '数据库服务器-01连接数已达到80%上限',
    asset_name: '数据库服务器-01',
    customer_name: '市人社局',
    status: 'pending',
  },
  {
    alert_id: 'PRM-2024-001236',
    source: 'Prometheus',
    level: 'info',
    title: '应用响应时间变慢',
    description: '应用服务器-02平均响应时间超过200ms',
    asset_name: '应用服务器-02',
    customer_name: '市卫健委',
    status: 'resolved',
    ticket_code: 'WO20240101002',
  },
  {
    alert_id: 'ZBX-2024-001237',
    source: 'Zabbix',
    level: 'critical',
    title: '服务进程异常退出',
    description: '应用服务器-03上的nginx进程异常退出',
    asset_name: '应用服务器-03',
    customer_name: '市公安局',
    status: 'processing',
    ticket_code: 'WO20240101003',
  },
  {
    alert_id: 'ZBX-2024-001238',
    source: 'Zabbix',
    level: 'warning',
    title: 'CPU使用率过高',
    description: '数据库服务器-02 CPU使用率持续超过80%',
    asset_name: '数据库服务器-02',
    customer_name: '市教育局',
    status: 'pending',
  },
  {
    alert_id: 'PRM-2024-001239',
    source: 'Prometheus',
    level: 'info',
    title: '内存使用率提醒',
    description: '应用服务器-04内存使用率达到75%',
    asset_name: '应用服务器-04',
    customer_name: '市交通局',
    status: 'resolved',
  },
  {
    alert_id: 'ZBX-2024-001240',
    source: 'Zabbix',
    level: 'critical',
    title: '网络连接中断',
    description: '核心交换机-01到应用服务器-05的网络连接中断',
    asset_name: '核心交换机-01',
    customer_name: '市财政局',
    status: 'pending',
  },
  {
    alert_id: 'ZBX-2024-001241',
    source: 'Zabbix',
    level: 'warning',
    title: 'SSL证书即将过期',
    description: '门户网站SSL证书将在7天后过期',
    asset_name: '门户网站服务器',
    customer_name: '市人社局',
    status: 'processing',
    ticket_code: 'WO20240101004',
  },
  {
    alert_id: 'PRM-2024-001242',
    source: 'Prometheus',
    level: 'info',
    title: '日志文件增长过快',
    description: '应用服务器-06日志文件大小增长异常',
    asset_name: '应用服务器-06',
    customer_name: '市卫健委',
    status: 'ignored',
  },
  {
    alert_id: 'ZBX-2024-001243',
    source: 'Zabbix',
    level: 'critical',
    title: '数据库备份失败',
    description: '数据库服务器-03自动备份任务执行失败',
    asset_name: '数据库服务器-03',
    customer_name: '市公安局',
    status: 'pending',
  },
];

// GET: 获取告警列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const keyword = searchParams.get('keyword');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const client = getDbClient();

    // 构建基础查询条件
    let countQuery = client
      .from('alerts')
      .select('*', { count: 'exact', head: true });

    if (level && level !== 'all') {
      countQuery = countQuery.eq('level', level);
    }
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    if (source && source !== 'all') {
      countQuery = countQuery.eq('source', source);
    }
    if (keyword) {
      countQuery = countQuery.or(`alert_id.ilike.%${keyword}%,title.ilike.%${keyword}%,asset_name.ilike.%${keyword}%`);
    }

    // 获取总数
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    // 分页查询数据
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let dataQuery = client
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (level && level !== 'all') {
      dataQuery = dataQuery.eq('level', level);
    }
    if (status && status !== 'all') {
      dataQuery = dataQuery.eq('status', status);
    }
    if (source && source !== 'all') {
      dataQuery = dataQuery.eq('source', source);
    }
    if (keyword) {
      dataQuery = dataQuery.or(`alert_id.ilike.%${keyword}%,title.ilike.%${keyword}%,asset_name.ilike.%${keyword}%`);
    }

    const { data, error } = await dataQuery;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 获取统计数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayData } = await client
      .from('alerts')
      .select('level, status')
      .gte('created_at', today.toISOString());

    const stats = {
      today: todayData?.length || 0,
      critical: todayData?.filter((a) => a.level === 'critical').length || 0,
      pending: todayData?.filter((a) => a.status === 'pending').length || 0,
      resolved: todayData?.filter((a) => a.status === 'resolved').length || 0,
    };

    // 获取来源列表
    const { data: sourcesData } = await client
      .from('alerts')
      .select('source');

    const sources = [...new Set(sourcesData?.map((a) => a.source) || [])];

    return NextResponse.json({
      success: true,
      data: {
        alerts: (data || []).map(formatAlert),
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        stats,
        sources,
        levelOptions: Object.entries(levelLabels).map(([value, label]) => ({
          value,
          label,
        })),
        statusOptions: Object.entries(statusLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json(
      { success: false, error: '获取告警列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建告警或初始化数据或创建工单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getDbClient();

    // 创建工单
    if (body.action === 'createTicket') {
      const { alertId, title, type, priority, description, customerName, assetName } = body;

      if (!alertId || !title) {
        return NextResponse.json(
          { success: false, error: '缺少告警ID或工单标题' },
          { status: 400 }
        );
      }

      // 生成工单号
      const now = new Date();
      const ticketCode = `WO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // 在 tickets 表中创建工单记录
      const { data: ticketData, error: ticketError } = await client
        .from('tickets')
        .insert({
          ticket_no: ticketCode,
          title,
          type: type || 'incident',
          status: 'pending',
          priority: priority || 'medium',
          description: description || '',
        })
        .select('id')
        .single();

      if (ticketError) {
        console.error('Failed to create ticket:', ticketError);
        // 如果创建工单失败，仍然更新告警的工单号，但不关联 ID
      }

      const ticketId = ticketData?.id;

      // 更新告警记录中的工单号和工单ID
      const updateData: Record<string, unknown> = {
        ticket_code: ticketCode,
        status: 'processing',
        updated_at: new Date().toISOString(),
      };

      if (ticketId) {
        updateData.ticket_id = ticketId;
      }

      const { data, error } = await client
        .from('alerts')
        .update(updateData)
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: {
          ticketCode,
          ticketId,
          alert: formatAlert(data),
        },
        message: '工单创建成功',
      });
    }

    // 初始化种子数据
    if (body.action === 'seed') {
      const { data, error } = await client
        .from('alerts')
        .insert(seedAlerts)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `成功插入 ${(data as unknown as Record<string, unknown>[])?.length || 0} 条告警`,
        data: (data as unknown as Record<string, unknown>[])?.map(formatAlert),
      });
    }

    // 创建新告警（接收外部告警推送）
    const { alertId, source, level, title, description, assetId, assetName, customerId, customerName, rawData } = body;

    if (!alertId || !source || !level || !title) {
      return NextResponse.json(
        { success: false, error: '告警ID、来源、级别和标题为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('alerts')
      .insert({
        alert_id: alertId,
        source,
        level,
        title,
        description: description || null,
        asset_id: assetId || null,
        asset_name: assetName || null,
        customer_id: customerId || null,
        customer_name: customerName || null,
        raw_data: rawData || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatAlert(data),
      message: '告警创建成功',
    });
  } catch (error) {
    console.error('Failed to create alert:', error);
    return NextResponse.json(
      { success: false, error: '创建告警失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新告警状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, ticketId, ticketCode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少告警ID' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (ticketId !== undefined) updateData.ticket_id = ticketId;
    if (ticketCode !== undefined) updateData.ticket_code = ticketCode;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await client
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatAlert(data),
      message: '告警更新成功',
    });
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json(
      { success: false, error: '更新告警失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除告警
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: '缺少告警ID' },
      { status: 400 }
    );
  }

  try {
    const client = getDbClient();

    const { error } = await client
      .from('alerts')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '告警删除成功',
    });
  } catch (error) {
    console.error('Failed to delete alert:', error);
    return NextResponse.json(
      { success: false, error: '删除告警失败' },
      { status: 500 }
    );
  }
}
