import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 角色映射
const roleLabels: Record<string, string> = {
  admin: '管理员',
  internal: '内部人员',
  external: '外部人员',
};

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化用户数据
function formatUser(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    username: row.username as string,
    email: row.email as string,
    phone: row.phone as string | null,
    realName: row.real_name as string | null,
    role: row.role as string,
    roleLabel: roleLabels[row.role as string] || row.role,
    department: row.department as string | null,
    position: row.position as string | null,
    avatar: row.avatar as string | null,
    twoFactorEnabled: row.two_factor_enabled as boolean,
    isActive: row.is_active as boolean,
    lastLogin: formatTime(row.last_login_at as string),
    createdAt: formatTime(row.created_at as string),
  };
}

// GET: 获取用户列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const client = getSupabaseClient();

    // 构建计数查询
    let countQuery = client
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (role && role !== 'all') {
      countQuery = countQuery.eq('role', role);
    }
    if (status && status !== 'all') {
      countQuery = countQuery.eq('is_active', status === 'active');
    }
    if (keyword) {
      countQuery = countQuery.or(`username.ilike.%${keyword}%,real_name.ilike.%${keyword}%,email.ilike.%${keyword}%,department.ilike.%${keyword}%`);
    }

    // 获取总数
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    // 分页查询数据
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let dataQuery = client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (role && role !== 'all') {
      dataQuery = dataQuery.eq('role', role);
    }
    if (status && status !== 'all') {
      dataQuery = dataQuery.eq('is_active', status === 'active');
    }
    if (keyword) {
      dataQuery = dataQuery.or(`username.ilike.%${keyword}%,real_name.ilike.%${keyword}%,email.ilike.%${keyword}%,department.ilike.%${keyword}%`);
    }

    const { data, error } = await dataQuery;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 获取统计数据
    const { data: allUsers } = await client
      .from('users')
      .select('role, is_active');

    const stats = {
      total: allUsers?.length || 0,
      admin: allUsers?.filter((u) => u.role === 'admin').length || 0,
      internal: allUsers?.filter((u) => u.role === 'internal').length || 0,
      external: allUsers?.filter((u) => u.role === 'external').length || 0,
      active: allUsers?.filter((u) => u.is_active).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        users: (data || []).map(formatUser),
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { username, email, phone, realName, role, department, position, password } = body;

    if (!username || !email) {
      return NextResponse.json(
        { success: false, error: '用户名和邮箱为必填项' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: '邮箱已存在' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('users')
      .insert({
        username,
        email,
        phone: phone || null,
        real_name: realName || null,
        role: role || 'external',
        department: department || null,
        position: position || null,
        password: password || '',
        is_active: true,
        two_factor_enabled: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatUser(data),
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新用户
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { id, username, email, phone, realName, role, department, position, isActive, twoFactorEnabled, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (realName !== undefined) updateData.real_name = realName;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (twoFactorEnabled !== undefined) updateData.two_factor_enabled = twoFactorEnabled;
    // 只有密码非空时才更新密码
    if (password && password.trim()) updateData.password = password;

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatUser(data),
      message: '用户更新成功',
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { success: false, error: '更新用户失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 不允许删除 admin 用户
    const { data: user } = await client
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (user?.role === 'admin') {
      // 检查是否是最后一个管理员
      const { data: admins } = await client
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length <= 1) {
        return NextResponse.json(
          { success: false, error: '不能删除最后一个管理员账户' },
          { status: 400 }
        );
      }
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}
