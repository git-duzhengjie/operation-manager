import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';
import bcrypt from 'bcryptjs';

// POST - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    // 验证参数
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 查询用户（用户名不区分大小写）
    const { data: users, error } = await client
      .from('users')
      .select('id, username, email, phone, real_name, role, department, position, avatar, password, is_active');

    // 在内存中查找匹配的用户（不区分大小写）
    const user = users?.find((u: Record<string, unknown>) => 
      String(u.username).toLowerCase() === username
    );

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
    const dbPassword = user.password as string;
    
    console.log('[Login Debug] Username:', username);
    console.log('[Login Debug] User found:', !!user);
    console.log('[Login Debug] DB password type:', typeof dbPassword);
    console.log('[Login Debug] DB password prefix:', dbPassword?.substring(0, 10));
    
    // 检查是否是 bcrypt 哈希密码（以 $2a$ 或 $2b$ 开头）
    let isValidPassword = false;
    
    if (dbPassword && (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$'))) {
      // bcrypt 加密密码验证
      isValidPassword = await bcrypt.compare(password, dbPassword);
      console.log('[Login Debug] bcrypt validation result:', isValidPassword);
    } else if (dbPassword) {
      // 明文密码验证
      isValidPassword = password === dbPassword;
      console.log('[Login Debug] plaintext validation result:', isValidPassword, 'input:', password, 'db:', dbPassword);
    } else {
      // 数据库密码为空，使用默认密码
      isValidPassword = password === 'admin123';
      console.log('[Login Debug] default password validation result:', isValidPassword);
    }
    
    if (!isValidPassword) {
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
