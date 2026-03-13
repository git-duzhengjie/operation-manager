import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 模拟当前登录用户 ID（实际应从 session 获取）
const CURRENT_USER_ID = 1;

// 内存中存储的密码（数据库不可用时的备选方案）
let memoryPassword = 'admin123';

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

    const client = getSupabaseClient();

    // 查询当前用户
    const { data: userInfo, error: queryError } = await client
      .from('users')
      .select('id, password')
      .eq('id', CURRENT_USER_ID)
      .single();

    if (queryError || !userInfo) {
      // 数据库不可用或用户不存在，使用内存验证
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

    // 从数据库验证当前密码
    // 注意：实际项目中应该使用 bcrypt.compare 比较加密后的密码
    // 如果密码为空，允许使用默认密码 admin123
    const dbPassword = userInfo.password;
    const defaultPassword = 'admin123';
    
    if (dbPassword && dbPassword !== currentPassword) {
      return NextResponse.json(
        { success: false, error: '当前密码错误' },
        { status: 400 }
      );
    }
    
    // 如果数据库密码为空，验证默认密码
    if (!dbPassword && currentPassword !== defaultPassword) {
      return NextResponse.json(
        { success: false, error: '当前密码错误，默认密码为 admin123' },
        { status: 400 }
      );
    }

    // 更新密码
    // 注意：实际项目中应该使用 bcrypt.hash 加密后存储
    const { error: updateError } = await client
      .from('users')
      .update({ password: newPassword })
      .eq('id', CURRENT_USER_ID);

    if (updateError) {
      console.error('Update password error:', updateError);
      return NextResponse.json(
        { success: false, error: '密码修改失败' },
        { status: 500 }
      );
    }

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
