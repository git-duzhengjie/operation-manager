import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取单个例行任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getDbClient();

    const { data, error } = await client
      .from('scheduled_tasks')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('获取例行任务详情异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新例行任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, cron_expression, task_type, task_config, status } = body;

    const client = getDbClient();

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (cron_expression !== undefined) {
      updateData.cron_expression = cron_expression;
      // 重新计算下次执行时间
      const nextRunAt = calculateNextRun(cron_expression);
      updateData.next_run_at = nextRunAt.toISOString();
    }
    if (task_type !== undefined) updateData.task_type = task_type;
    if (task_config !== undefined) updateData.task_config = task_config;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await client
      .from('scheduled_tasks')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('更新例行任务失败:', error);
      return NextResponse.json(
        { success: false, error: '更新例行任务失败' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '例行任务更新成功',
    });
  } catch (error) {
    console.error('更新例行任务异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除例行任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getDbClient();

    const { error } = await client
      .from('scheduled_tasks')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('删除例行任务失败:', error);
      return NextResponse.json(
        { success: false, error: '删除例行任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '例行任务删除成功',
    });
  } catch (error) {
    console.error('删除例行任务异常:', error);
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const now = new Date();
  const next = new Date();

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const targetDay = parseInt(dayOfWeek);
    const currentDay = now.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntil);
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
  } else if (dayOfMonth !== '*' && month === '*') {
    const targetDate = parseInt(dayOfMonth);
    next.setDate(targetDate);
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
  }

  return next;
}
