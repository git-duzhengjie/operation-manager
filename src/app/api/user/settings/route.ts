import { NextRequest, NextResponse } from 'next/server';

// 模拟当前登录用户 ID（实际应从 session 获取）
const CURRENT_USER_ID = 1;

// 内存存储（数据库不可用时的备选方案）
let memoryStore = {
  userInfo: {
    username: '管理员',
    email: 'admin@gov.com',
    phone: '138****8888',
    department: '运维部',
    position: '运维工程师',
    avatar: null as string | null,
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

// 检查数据库是否可用
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { db } = await import('@/db');
    // 简单查询测试连接
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// GET - 获取当前用户信息和设置
export async function GET() {
  try {
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // 数据库不可用，返回内存中的数据
      return NextResponse.json({
        success: true,
        data: {
          userInfo: memoryStore.userInfo,
          notificationSettings: memoryStore.notificationSettings,
        },
        source: 'memory', // 标识数据来源
      });
    }

    // 数据库可用，从数据库获取
    const { db, users, userSettings } = await import('@/db');
    const { eq } = await import('drizzle-orm');
    
    // 查询用户信息
    const userInfo = await db.select().from(users).where(eq(users.id, CURRENT_USER_ID));
    
    if (userInfo.length === 0) {
      // 如果用户不存在，创建默认用户
      await db.insert(users).values({
        id: CURRENT_USER_ID,
        username: 'admin',
        password: 'hashed_password',
        email: 'admin@gov.com',
        phone: '138****8888',
        realName: '管理员',
        role: 'admin',
        department: '运维部',
        position: '运维工程师',
        avatar: null,
      });
    }

    // 查询用户设置
    let settings = await db.select().from(userSettings).where(eq(userSettings.userId, CURRENT_USER_ID));
    
    if (settings.length === 0) {
      // 如果设置不存在，创建默认设置
      await db.insert(userSettings).values({
        userId: CURRENT_USER_ID,
        emailNotify: true,
        smsNotify: false,
        systemNotify: true,
        workorderNotify: true,
        alertNotify: true,
        knowledgeNotify: false,
      });
      settings = await db.select().from(userSettings).where(eq(userSettings.userId, CURRENT_USER_ID));
    }

    const user = userInfo[0] || {
      username: 'admin',
      email: 'admin@gov.com',
      phone: '138****8888',
      realName: '管理员',
      department: '运维部',
      position: '运维工程师',
      avatar: null,
    };

    const setting = settings[0] || {
      emailNotify: true,
      smsNotify: false,
      systemNotify: true,
      workorderNotify: true,
      alertNotify: true,
      knowledgeNotify: false,
    };

    return NextResponse.json({
      success: true,
      data: {
        userInfo: {
          username: user.realName || user.username,
          email: user.email,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          avatar: user.avatar,
        },
        notificationSettings: {
          emailNotify: setting.emailNotify,
          smsNotify: setting.smsNotify,
          systemNotify: setting.systemNotify,
          workorderNotify: setting.workorderNotify,
          alertNotify: setting.alertNotify,
          knowledgeNotify: setting.knowledgeNotify,
        },
      },
      source: 'database',
    });
  } catch (error) {
    console.error('获取用户设置失败:', error);
    // 出错时返回内存数据
    return NextResponse.json({
      success: true,
      data: {
        userInfo: memoryStore.userInfo,
        notificationSettings: memoryStore.notificationSettings,
      },
      source: 'memory',
    });
  }
}

// PUT - 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // 先更新内存存储（作为备份）
    if (type === 'userInfo') {
      memoryStore.userInfo = { ...memoryStore.userInfo, ...data };
    } else if (type === 'notificationSettings') {
      memoryStore.notificationSettings = { ...memoryStore.notificationSettings, ...data };
    }

    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // 数据库不可用，只更新内存
      return NextResponse.json({ 
        success: true, 
        message: '设置已保存（内存模式）',
        source: 'memory',
      });
    }

    // 数据库可用，更新数据库
    const { db, users, userSettings } = await import('@/db');
    const { eq } = await import('drizzle-orm');

    if (type === 'userInfo') {
      // 更新用户信息
      await db.update(users)
        .set({
          realName: data.username,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          avatar: data.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, CURRENT_USER_ID));

      return NextResponse.json({ 
        success: true, 
        message: '用户信息已更新',
        source: 'database',
      });
    } 
    
    if (type === 'notificationSettings') {
      // 更新通知设置
      await db.update(userSettings)
        .set({
          emailNotify: data.emailNotify,
          smsNotify: data.smsNotify,
          systemNotify: data.systemNotify,
          workorderNotify: data.workorderNotify,
          alertNotify: data.alertNotify,
          knowledgeNotify: data.knowledgeNotify,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, CURRENT_USER_ID));

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
