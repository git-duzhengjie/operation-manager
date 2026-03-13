import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化角色数据
async function formatRole(role: Record<string, unknown>, client: ReturnType<typeof getSupabaseClient>) {
  // 获取角色用户数
  const { count: userCount } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', role.code);

  // 获取角色权限
  const { data: rolePerms } = await client
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', role.id);

  const permissionIds = rolePerms?.map((rp: Record<string, unknown>) => rp.permission_id) || [];

  // 获取权限详情
  let permissions: string[] = [];
  if (permissionIds.length > 0) {
    const { data: perms } = await client
      .from('permissions')
      .select('name')
      .in('id', permissionIds);
    permissions = perms?.map((p: Record<string, unknown>) => p.name as string) || [];
  }

  return {
    id: String(role.id),
    name: role.name as string,
    code: role.code as string,
    description: role.description as string | null,
    isSystem: role.is_system as boolean,
    userCount: userCount || 0,
    permissions,
    permissionIds: permissionIds.map(Number),
    createdAt: formatTime(role.created_at as string),
  };
}

// GET: 获取角色列表或单个角色详情
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const client = getSupabaseClient();

    if (id) {
      // 获取单个角色详情
      const { data: role, error } = await client
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !role) {
        return NextResponse.json(
          { success: false, error: '角色不存在' },
          { status: 404 }
        );
      }

      // 获取角色权限ID列表
      const { data: rolePerms } = await client
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', id);

      return NextResponse.json({
        success: true,
        data: {
          ...await formatRole(role, client),
          permissionIds: rolePerms?.map((rp: Record<string, unknown>) => rp.permission_id) || [],
        },
      });
    }

    // 获取所有角色
    const { data: roles, error } = await client
      .from('roles')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 格式化角色数据
    const formattedRoles = await Promise.all(
      (roles || []).map((role) => formatRole(role, client))
    );

    // 获取所有权限
    const { data: permissions } = await client
      .from('permissions')
      .select('*')
      .order('category', { ascending: true });

    // 按分类分组权限
    const permissionsByCategory: Record<string, Array<{ id: number; name: string; code: string }>> = {};
    (permissions || []).forEach((perm: Record<string, unknown>) => {
      const category = perm.category as string;
      if (!permissionsByCategory[category]) {
        permissionsByCategory[category] = [];
      }
      permissionsByCategory[category].push({
        id: perm.id as number,
        name: perm.name as string,
        code: perm.code as string,
      });
    });

    // 统计信息
    const stats = {
      total: formattedRoles.length,
      system: formattedRoles.filter((r) => r.isSystem).length,
      custom: formattedRoles.filter((r) => !r.isSystem).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        roles: formattedRoles,
        permissions: permissionsByCategory,
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json(
      { success: false, error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建角色
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { name, code, description, permissionIds } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: '角色名称和代码为必填项' },
        { status: 400 }
      );
    }

    // 检查角色代码是否已存在
    const { data: existingRole } = await client
      .from('roles')
      .select('id')
      .eq('code', code)
      .single();

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: '角色代码已存在' },
        { status: 400 }
      );
    }

    // 创建角色
    const { data: role, error } = await client
      .from('roles')
      .insert({
        name,
        code,
        description: description || null,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // 添加权限
    if (permissionIds && permissionIds.length > 0) {
      const permRecords = permissionIds.map((permId: number) => ({
        role_id: role.id,
        permission_id: permId,
      }));

      await client
        .from('role_permissions')
        .insert(permRecords);
    }

    return NextResponse.json({
      success: true,
      data: await formatRole(role, client),
      message: '角色创建成功',
    });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json(
      { success: false, error: '创建角色失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新角色
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { id, name, description, permissionIds } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少角色ID' },
        { status: 400 }
      );
    }

    // 检查角色是否存在
    const { data: existingRole } = await client
      .from('roles')
      .select('is_system, code')
      .eq('id', id)
      .single();

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: '角色不存在' },
        { status: 404 }
      );
    }

    // 更新角色基本信息（系统角色不允许修改基本信息）
    if (!existingRole.is_system) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length > 1) {
        const { error } = await client
          .from('roles')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      }
    }

    // 更新权限（系统角色也允许修改权限）
    if (permissionIds !== undefined) {
      // 删除旧权限
      await client
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      // 添加新权限
      if (permissionIds.length > 0) {
        const permRecords = permissionIds.map((permId: number) => ({
          role_id: id,
          permission_id: permId,
        }));

        await client
          .from('role_permissions')
          .insert(permRecords);
      }
    }

    // 获取更新后的角色数据
    const { data: role } = await client
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: await formatRole(role, client),
      message: '角色更新成功',
    });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json(
      { success: false, error: '更新角色失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少角色ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查是否为系统角色
    const { data: role } = await client
      .from('roles')
      .select('is_system, code')
      .eq('id', id)
      .single();

    if (role?.is_system) {
      return NextResponse.json(
        { success: false, error: '系统角色不能删除' },
        { status: 400 }
      );
    }

    // 检查是否有用户使用该角色
    const { count } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role?.code);

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: `该角色下有 ${count} 个用户，不能删除` },
        { status: 400 }
      );
    }

    // 删除角色权限关联
    await client
      .from('role_permissions')
      .delete()
      .eq('role_id', id);

    // 删除角色
    const { error } = await client
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '角色删除成功',
    });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json(
      { success: false, error: '删除角色失败' },
      { status: 500 }
    );
  }
}
