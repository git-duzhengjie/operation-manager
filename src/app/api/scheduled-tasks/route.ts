import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取例行任务列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const taskType = searchParams.get('taskType') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const client = getDbClient();

    // 构建查询
    let query = client
      .from('scheduled_tasks')
      .select('*', { count: 'exact' });

    // 关键词搜索
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // 任务类型筛选
    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 排序和分页
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('查询例行任务列表失败:', error);
      return NextResponse.json(
        { success: false, error: '查询例行任务列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('获取例行任务列表异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST - 创建例行任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, cron_expression, task_type, task_config, status, created_by } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, error: '任务名称不能为空' },
        { status: 400 }
      );
    }

    if (!cron_expression) {
      return NextResponse.json(
        { success: false, error: '执行时间不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 计算下次执行时间
    const nextRunAt = calculateNextRun(cron_expression);

    // 创建任务
    const { data, error } = await client
      .from('scheduled_tasks')
      .insert({
        name,
        description: description || null,
        cron_expression,
        task_type: task_type || 'inspection',
        task_config: task_config || null,
        status: status || 'active',
        next_run_at: nextRunAt.toISOString(),
        created_by: created_by || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('创建例行任务失败:', error);
      return NextResponse.json(
        { success: false, error: '创建例行任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '例行任务创建成功',
    });
  } catch (error) {
    console.error('创建例行任务异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 简单的 cron 表达式解析（计算下次执行时间）
function calculateNextRun(cronExpression: string): Date {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    // 如果不是标准 cron 格式，默认返回明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const now = new Date();
  const next = new Date();

  // 简单处理：每日任务
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  }
  // 每周任务
  else if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const targetDay = parseInt(dayOfWeek);
    const currentDay = now.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntil);
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
  }
  // 每月任务
  else if (dayOfMonth !== '*' && month === '*') {
    const targetDate = parseInt(dayOfMonth);
    next.setDate(targetDate);
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }
  else {
    // 默认返回明天
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
  }

  return next;
}
