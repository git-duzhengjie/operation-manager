import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证参数
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 查询用户
    const { data: user, error } = await client
      .from('users')
      .select('id, username, email, phone, real_name, role, department, position, avatar, password, is_active')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: '账号已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    // 验证密码
    // 注意：实际项目中应该使用 bcrypt.compare 比较加密后的密码
    const dbPassword = user.password;
    
    // 如果数据库密码为空，使用默认密码
    const validPassword = dbPassword || 'admin123';
    
    if (password !== validPassword) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      realName: user.real_name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userInfo,
        message: '登录成功',
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
