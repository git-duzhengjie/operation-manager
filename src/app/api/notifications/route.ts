import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and, isNull, or } from 'drizzle-orm';

// 内存存储回退
const memoryNotifications = [
  {
    id: 1,
    title: '工单已分配',
    message: '工单 WO20240101001 已分配给您处理，请及时查看并处理。该工单为服务器磁盘空间不足告警，优先级为高。',
    type: 'info' as const,
    category: 'workorder' as const,
    isRead: false,
    userId: null,
    relatedId: 'WO20240101001',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 2,
    title: '告警通知',
    message: '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。',
    type: 'warning' as const,
    category: 'alert' as const,
    isRead: false,
    userId: null,
    relatedId: 'AST001',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 3,
    title: '工单已完成',
    message: '工单 WO20240101003 已被标记为已完成，感谢您的处理。',
    type: 'success' as const,
    category: 'workorder' as const,
    isRead: true,
    userId: null,
    relatedId: 'WO20240101003',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 4,
    title: '系统升级通知',
    message: '系统将于今晚22:00进行升级维护，预计维护时长1小时，届时系统将暂停服务。',
    type: 'info' as const,
    category: 'system' as const,
    isRead: true,
    userId: null,
    relatedId: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 5,
    title: '知识库更新',
    message: '有3篇新文章被添加到知识库：《服务器安全加固指南》、《常见网络问题解决方案》、《系统监控配置手册》。',
    type: 'success' as const,
    category: 'knowledge' as const,
    isRead: true,
    userId: null,
    relatedId: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 6,
    title: '资产到期提醒',
    message: '资产 AST001（应用服务器-01）的维保合同将于7天后到期，请及时续保。',
    type: 'warning' as const,
    category: 'asset' as const,
    isRead: false,
    userId: null,
    relatedId: 'AST001',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 7,
    title: '巡检任务完成',
    message: '本周例行巡检任务已完成，共检查设备45台，发现异常3项，已生成巡检报告。',
    type: 'success' as const,
    category: 'routine' as const,
    isRead: true,
    userId: null,
    relatedId: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    title: '新工单待审批',
    message: '您有2个变更申请等待审批，请及时处理。',
    type: 'info' as const,
    category: 'workorder' as const,
    isRead: true,
    userId: null,
    relatedId: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// 已读状态跟踪（内存回退时使用）
const readStatus = new Map<number, boolean>();

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

// GET: 获取通知列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  try {
    let dbNotifications;
    
    try {
      // 查询所有用户的通知（userId 为 null）和当前用户的通知
      dbNotifications = await db
        .select()
        .from(notifications)
        .where(isNull(notifications.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    } catch {
      // 数据库不可用，使用内存数据
      console.log('Database not available, using memory storage for notifications');
      let filtered = [...memoryNotifications];
      
      // 应用已读状态
      filtered = filtered.map(n => ({
        ...n,
        isRead: readStatus.get(n.id) ?? n.isRead,
      }));
      
      if (unreadOnly) {
        filtered = filtered.filter(n => !n.isRead);
      }
      
      return NextResponse.json({
        success: true,
        data: filtered.map(n => ({
          id: n.id.toString(),
          title: n.title,
          message: n.message,
          type: n.type,
          category: n.category,
          read: n.isRead,
          time: formatTime(n.createdAt),
          relatedId: n.relatedId,
        })),
        fallback: true,
      });
    }

    let result = dbNotifications;
    if (unreadOnly) {
      result = result.filter(n => !n.isRead);
    }

    return NextResponse.json({
      success: true,
      data: result.map(n => ({
        id: n.id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        read: n.isRead,
        time: formatTime(n.createdAt || new Date()),
        relatedId: n.relatedId,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({
      success: false,
      error: '获取通知失败',
    }, { status: 500 });
  }
}

// POST: 标记通知为已读
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === 'markRead' && id) {
      // 标记单个通知为已读
      try {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, parseInt(id)));
      } catch {
        // 内存回退
        readStatus.set(parseInt(id), true);
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllRead') {
      // 标记所有通知为已读
      try {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.isRead, false));
      } catch {
        // 内存回退
        memoryNotifications.forEach(n => readStatus.set(n.id, true));
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && id) {
      // 删除通知
      try {
        await db
          .delete(notifications)
          .where(eq(notifications.id, parseInt(id)));
      } catch {
        // 内存回退：从列表中移除
        const index = memoryNotifications.findIndex(n => n.id === parseInt(id));
        if (index > -1) {
          memoryNotifications.splice(index, 1);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'clearRead') {
      // 清除已读通知
      try {
        await db
          .delete(notifications)
          .where(eq(notifications.isRead, true));
      } catch {
        // 内存回退：移除已读通知
        const readIds = [...readStatus.entries()]
          .filter(([, isRead]) => isRead)
          .map(([id]) => id);
        
        for (let i = memoryNotifications.length - 1; i >= 0; i--) {
          if (readStatus.get(memoryNotifications[i].id) === true) {
            memoryNotifications.splice(i, 1);
          }
        }
        readIds.forEach(id => readStatus.delete(id));
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作',
    }, { status: 400 });
  } catch (error) {
    console.error('Failed to process notification action:', error);
    return NextResponse.json({
      success: false,
      error: '操作失败',
    }, { status: 500 });
  }
}
