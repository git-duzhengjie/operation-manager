import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 初始通知数据
const seedNotifications = [
  {
    title: '工单已分配',
    message: '工单 WO20240101001 已分配给您处理，请及时查看并处理。该工单为服务器磁盘空间不足告警，优先级为高。',
    type: 'info',
    category: 'workorder',
    is_read: false,
    related_id: 'WO20240101001',
  },
  {
    title: '告警通知',
    message: '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。',
    type: 'warning',
    category: 'alert',
    is_read: false,
    related_id: 'AST001',
  },
  {
    title: '工单已完成',
    message: '工单 WO20240101003 已被标记为已完成，感谢您的处理。',
    type: 'success',
    category: 'workorder',
    is_read: true,
    related_id: 'WO20240101003',
  },
  {
    title: '系统升级通知',
    message: '系统将于今晚22:00进行升级维护，预计维护时长1小时，届时系统将暂停服务。',
    type: 'info',
    category: 'system',
    is_read: true,
    related_id: null,
  },
  {
    title: '知识库更新',
    message: '有3篇新文章被添加到知识库：《服务器安全加固指南》、《常见网络问题解决方案》、《系统监控配置手册》。',
    type: 'success',
    category: 'knowledge',
    is_read: true,
    related_id: null,
  },
  {
    title: '资产到期提醒',
    message: '资产 AST001（应用服务器-01）的维保合同将于7天后到期，请及时续保。',
    type: 'warning',
    category: 'asset',
    is_read: false,
    related_id: 'AST001',
  },
  {
    title: '巡检任务完成',
    message: '本周例行巡检任务已完成，共检查设备45台，发现异常3项，已生成巡检报告。',
    type: 'success',
    category: 'routine',
    is_read: true,
    related_id: null,
  },
  {
    title: '新工单待审批',
    message: '您有2个变更申请等待审批，请及时处理。',
    type: 'info',
    category: 'workorder',
    is_read: true,
    related_id: null,
  },
];

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '未知';
  
  const date = new Date(dateStr);
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

// 格式化通知数据
function formatNotification(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: row.title as string,
    message: row.message as string,
    type: row.type as string,
    category: row.category as string,
    read: row.is_read as boolean,
    time: formatTime(row.created_at as string),
    relatedId: row.related_id as string | null,
  };
}

// GET: 获取通知列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  try {
    const client = getSupabaseClient();

    // 构建查询
    let query = client
      .from('notifications')
      .select('*')
      .is('user_id', null) // 只查询系统通知（所有用户可见）
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(formatNotification),
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取通知失败',
      },
      { status: 500 }
    );
  }
}

// POST: 各种操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;
    const client = getSupabaseClient();

    if (action === 'seed') {
      // 初始化测试数据
      const { data, error } = await client
        .from('notifications')
        .insert(seedNotifications)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `成功插入 ${data?.length || 0} 条通知`,
        data: data,
      });
    }

    if (action === 'markRead' && id) {
      // 标记单个通知为已读
      const { error } = await client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', parseInt(id));

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'markAllRead') {
      // 标记所有通知为已读
      const { error } = await client
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .is('user_id', null);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && id) {
      // 删除通知
      const { error } = await client
        .from('notifications')
        .delete()
        .eq('id', parseInt(id));

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'clearRead') {
      // 清除已读通知
      const { error } = await client
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .is('user_id', null);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        success: false,
        error: '无效的操作',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process notification action:', error);
    return NextResponse.json(
      {
        success: false,
        error: '操作失败',
      },
      { status: 500 }
    );
  }
}

// PUT: 创建新通知
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, category, userId, relatedId } = body;

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: '标题和内容为必填项',
        },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('notifications')
      .insert({
        title,
        message,
        type: type || 'info',
        category: category || 'system',
        user_id: userId || null,
        related_id: relatedId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatNotification(data),
      message: '通知创建成功',
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建通知失败',
      },
      { status: 500 }
    );
  }
}
