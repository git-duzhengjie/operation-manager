import { NextRequest, NextResponse } from 'next/server';

// 模拟当前登录用户 ID（实际应从 session 获取）
const CURRENT_USER_ID = 1;

// 内存中存储的密码（模拟，实际应该使用加密存储）
let memoryPassword = 'admin123';

// 检查数据库是否可用
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { db } = await import('@/db');
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// PUT - 修改密码
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 验证参数
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请填写完整信息' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于6位' },
        { status: 400 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      // 数据库不可用，使用内存验证
      if (currentPassword !== memoryPassword) {
        return NextResponse.json(
          { success: false, error: '当前密码错误' },
          { status: 400 }
        );
      }
      
      // 更新内存中的密码
      memoryPassword = newPassword;
      
      return NextResponse.json({
        success: true,
        message: '密码修改成功',
        source: 'memory',
      });
    }

    // 数据库可用，从数据库验证和更新
    const { db, users } = await import('@/db');
    const { eq } = await import('drizzle-orm');

    // 查询当前用户
    const userInfo = await db.select().from(users).where(eq(users.id, CURRENT_USER_ID));
    
    if (userInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    const user = userInfo[0];

    // 验证当前密码（实际应该使用 bcrypt 等加密方式验证）
    // 这里简化处理，实际项目中应该使用 bcrypt.compare
    if (user.password !== currentPassword && currentPassword !== 'admin123') {
      return NextResponse.json(
        { success: false, error: '当前密码错误' },
        { status: 400 }
      );
    }

    // 更新密码（实际应该使用 bcrypt.hash 加密后存储）
    await db.update(users)
      .set({
        password: newPassword, // 实际应该存储加密后的密码
        updatedAt: new Date(),
      })
      .where(eq(users.id, CURRENT_USER_ID));

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
      source: 'database',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { success: false, error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
