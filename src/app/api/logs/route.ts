import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/db-client';

// 操作类型映射
const actionTypeMap: Record<string, string[]> = {
  login: ['登录', '登出', '登录失败'],
  create: ['创建', '新增', '添加'],
  update: ['更新', '修改', '编辑'],
  delete: ['删除', '移除'],
  export: ['导出', '下载'],
  import: ['导入', '上传'],
  view: ['查看', '访问', '查询'],
};

// GET - 获取日志列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const actionType = searchParams.get('actionType') || 'all';
    const status = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const client = getDbClient();

    // 获取所有日志
    const { data: allLogs, error } = await client
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查询日志失败:', error);
      // 返回空数据而不是错误，让前端可以正常显示
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
          stats: {
            todayCount: 0,
            successCount: 0,
            failedCount: 0,
            activeUsers: 0,
          },
        },
      });
    }

    // 过滤日志
    let filteredLogs = allLogs || [];

    // 关键词搜索
    if (keyword) {
      const kw = keyword.toLowerCase();
      filteredLogs = filteredLogs.filter((log: Record<string, unknown>) => {
        const user = (log.user as string) || '';
        const action = (log.action as string) || '';
        const resource = (log.resource as string) || '';
        return (
          user.toLowerCase().includes(kw) ||
          action.toLowerCase().includes(kw) ||
          resource.toLowerCase().includes(kw)
        );
      });
    }

    // 操作类型筛选
    if (actionType !== 'all') {
      const actions = actionTypeMap[actionType] || [];
      filteredLogs = filteredLogs.filter((log: Record<string, unknown>) => {
        const action = (log.action as string) || '';
        return actions.some(a => action.includes(a));
      });
    }

    // 状态筛选
    if (status !== 'all') {
      filteredLogs = filteredLogs.filter((log: Record<string, unknown>) => {
        return (log.status as string) === status;
      });
    }

    // 日期范围筛选
    if (startDate) {
      filteredLogs = filteredLogs.filter((log: Record<string, unknown>) => {
        const createdAt = (log.created_at as string) || '';
        return createdAt >= startDate;
      });
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter((log: Record<string, unknown>) => {
        const createdAt = (log.created_at as string) || '';
        return createdAt <= endDate + 'T23:59:59';
      });
    }

    // 统计数据
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = (allLogs || []).filter((log: Record<string, unknown>) => {
      const createdAt = (log.created_at as string) || '';
      return createdAt.startsWith(today);
    });

    const stats = {
      todayCount: todayLogs.length,
      successCount: (allLogs || []).filter((log: Record<string, unknown>) => log.status === 'success').length,
      failedCount: (allLogs || []).filter((log: Record<string, unknown>) => log.status === 'failed').length,
      activeUsers: new Set((allLogs || []).map((log: Record<string, unknown>) => log.user).filter(Boolean)).size,
    };

    // 分页
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedLogs = filteredLogs.slice(offset, offset + pageSize);

    // 格式化日志数据
    const logs = paginatedLogs.map((log: Record<string, unknown>) => ({
      id: String(log.id),
      user: log.user || '-',
      action: log.action || '-',
      resource: log.resource || '-',
      resourceId: log.resource_id || '-',
      ip: log.ip || '-',
      status: log.status || 'success',
      details: log.details || null,
      createdAt: log.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('获取日志列表异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST - 记录日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, action, resource, resourceId, ip, status, details } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: '操作内容不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    const { data, error } = await client
      .from('system_logs')
      .insert({
        user: user || 'system',
        action,
        resource: resource || null,
        resource_id: resourceId || null,
        ip: ip || null,
        status: status || 'success',
        details: details || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('记录日志失败:', error);
      return NextResponse.json(
        { success: false, error: '记录日志失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '日志记录成功',
    });
  } catch (error) {
    console.error('记录日志异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 清理日志（保留最近N天）
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const client = getDbClient();

    // 获取所有日志
    const { data: allLogs } = await client
      .from('system_logs')
      .select('id, created_at');

    // 计算截止日期
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    // 找出需要删除的日志
    const logsToDelete = (allLogs || [])
      .filter((log: Record<string, unknown>) => {
        const createdAt = (log.created_at as string) || '';
        return createdAt < cutoffStr;
      })
      .map((log: Record<string, unknown>) => log.id);

    if (logsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要清理的日志',
        deletedCount: 0,
      });
    }

    // 删除旧日志
    for (const id of logsToDelete) {
      await client
        .from('system_logs')
        .delete()
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      message: `已清理 ${logsToDelete.length} 条日志`,
      deletedCount: logsToDelete.length,
    });
  } catch (error) {
    console.error('清理日志异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
