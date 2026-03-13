import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 内存存储（数据库不可用时的备选方案）
const memoryStore: Record<number, {
  userInfo: {
    username: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    avatar: string | null;
  };
  notificationSettings: {
    emailNotify: boolean;
    smsNotify: boolean;
    systemNotify: boolean;
    workorderNotify: boolean;
    alertNotify: boolean;
    knowledgeNotify: boolean;
  };
}> = {};

// GET - 获取当前用户信息和设置
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '1';
  const numericUserId = parseInt(userId, 10);

  try {
    const client = getSupabaseClient();

    // 查询用户信息
    const { data: user, error } = await client
      .from('users')
      .select('id, username, email, phone, real_name, department, position, avatar')
      .eq('id', numericUserId)
      .single();

    if (error || !user) {
      // 用户不存在，返回内存数据
      const stored = memoryStore[numericUserId];
      if (stored) {
        return NextResponse.json({
          success: true,
          data: stored,
          source: 'memory',
        });
      }
      
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 查询用户设置
    const { data: settings } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', numericUserId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        userInfo: {
          username: user.real_name || user.username,
          email: user.email,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          avatar: user.avatar,
        },
        notificationSettings: {
          emailNotify: settings?.email_notify ?? true,
          smsNotify: settings?.sms_notify ?? false,
          systemNotify: settings?.system_notify ?? true,
          workorderNotify: settings?.workorder_notify ?? true,
          alertNotify: settings?.alert_notify ?? true,
          knowledgeNotify: settings?.knowledge_notify ?? false,
        },
      },
      source: 'database',
    });
  } catch (error) {
    console.error('获取用户设置失败:', error);
    
    // 出错时返回内存数据
    const stored = memoryStore[numericUserId];
    if (stored) {
      return NextResponse.json({
        success: true,
        data: stored,
        source: 'memory',
      });
    }
    
    return NextResponse.json(
      { success: false, error: '获取用户设置失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, userId } = body;
    const numericUserId = userId ? parseInt(userId, 10) : 1;

    // 初始化内存存储
    if (!memoryStore[numericUserId]) {
      memoryStore[numericUserId] = {
        userInfo: {
          username: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          avatar: null,
        },
        notificationSettings: {
          emailNotify: true,
          smsNotify: false,
          systemNotify: true,
          workorderNotify: true,
          alertNotify: true,
          knowledgeNotify: false,
        },
      };
    }

    // 先更新内存存储（作为备份）
    if (type === 'userInfo') {
      memoryStore[numericUserId].userInfo = { ...memoryStore[numericUserId].userInfo, ...data };
    } else if (type === 'notificationSettings') {
      memoryStore[numericUserId].notificationSettings = { ...memoryStore[numericUserId].notificationSettings, ...data };
    }

    const client = getSupabaseClient();

    if (type === 'userInfo') {
      // 更新用户信息
      const { error } = await client
        .from('users')
        .update({
          real_name: data.username,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          avatar: data.avatar,
        })
        .eq('id', numericUserId);

      if (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ 
          success: true, 
          message: '设置已保存（内存模式）',
          source: 'memory',
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: '用户信息已更新',
        source: 'database',
      });
    } 
    
    if (type === 'notificationSettings') {
      // 检查设置是否存在
      const { data: existingSettings } = await client
        .from('user_settings')
        .select('id')
        .eq('user_id', numericUserId)
        .single();

      if (existingSettings) {
        // 更新通知设置
        await client
          .from('user_settings')
          .update({
            email_notify: data.emailNotify,
            sms_notify: data.smsNotify,
            system_notify: data.systemNotify,
            workorder_notify: data.workorderNotify,
            alert_notify: data.alertNotify,
            knowledge_notify: data.knowledgeNotify,
          })
          .eq('user_id', numericUserId);
      } else {
        // 创建通知设置
        await client
          .from('user_settings')
          .insert({
            user_id: numericUserId,
            email_notify: data.emailNotify,
            sms_notify: data.smsNotify,
            system_notify: data.systemNotify,
            workorder_notify: data.workorderNotify,
            alert_notify: data.alertNotify,
            knowledge_notify: data.knowledgeNotify,
          });
      }

      return NextResponse.json({ 
        success: true, 
        message: '通知设置已更新',
        source: 'database',
      });
    }

    return NextResponse.json(
      { success: false, error: '无效的更新类型' },
      { status: 400 }
    );
  } catch (error) {
    console.error('更新用户设置失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户设置失败' },
      { status: 500 }
    );
  }
}
