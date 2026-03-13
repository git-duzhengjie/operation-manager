import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 模拟当前登录用户 ID（实际应从 session 获取）
const CURRENT_USER_ID = 1;

// 中文权限名称到英文代码的映射
const PERMISSION_NAME_TO_CODE: Record<string, string> = {
  // 工单权限
  '查看工单列表': 'ticket_view',
  '创建工单': 'ticket_create',
  '编辑工单': 'ticket_edit',
  '删除工单': 'ticket_delete',
  '处理工单': 'ticket_process',
  '导出工单': 'ticket_export',
  
  // 资产权限
  '查看资产': 'asset_view',
  '创建资产': 'asset_create',
  '编辑资产': 'asset_edit',
  '删除资产': 'asset_delete',
  
  // 知识库权限
  '查看知识库': 'knowledge_view',
  '创建文章': 'knowledge_create',
  '编辑文章': 'knowledge_edit',
  '删除文章': 'knowledge_delete',
  
  // 监控权限
  '查看告警': 'monitor_view',
  '处理告警': 'alert_handle',
  '配置监控': 'monitor_config',
  
  // 用户权限
  '查看用户': 'user_view',
  '创建用户': 'user_create',
  '编辑用户': 'user_edit',
  '删除用户': 'user_delete',
  
  // 系统权限
  '查看设置': 'system_config',
  '修改设置': 'system_config',
  '查看日志': 'log_view',
  
  // 角色权限
  '查看角色': 'role_view',
  '管理角色': 'role_edit',
};

// GET - 获取当前用户权限
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 获取当前用户
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role, is_active')
      .eq('id', CURRENT_USER_ID)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: '账号已被禁用' },
        { status: 403 }
      );
    }

    // 查询角色 ID
    const { data: roleData } = await client
      .from('roles')
      .select('id')
      .eq('code', user.role)
      .single();

    let permissions: string[] = [];

    if (roleData) {
      // 获取角色权限
      const { data: rolePerms } = await client
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleData.id);

      if (rolePerms && rolePerms.length > 0) {
        const permIds = rolePerms.map((rp: Record<string, unknown>) => rp.permission_id);
        
        // 获取权限名称
        const { data: perms } = await client
          .from('permissions')
          .select('name')
          .in('id', permIds);

        // 将中文权限名称转换为英文代码
        const permNames = perms?.map((p: Record<string, unknown>) => p.name as string) || [];
        permissions = permNames
          .map((name) => PERMISSION_NAME_TO_CODE[name] || name)
          .filter(Boolean);
      }
    }

    // 如果没有权限数据，使用默认权限
    if (permissions.length === 0) {
      permissions = getDefaultPermissions(user.role);
    }

    return NextResponse.json({
      success: true,
      data: {
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    console.error('获取权限失败:', error);
    return NextResponse.json(
      { success: false, error: '获取权限失败' },
      { status: 500 }
    );
  }
}

// 默认权限（当数据库没有配置时使用）
function getDefaultPermissions(role: string): string[] {
  const defaultPermissions: Record<string, string[]> = {
    admin: [
      'ticket_view', 'ticket_create', 'ticket_edit', 'ticket_delete', 'ticket_process', 'ticket_export',
      'asset_view', 'asset_create', 'asset_edit', 'asset_delete',
      'knowledge_view', 'knowledge_create', 'knowledge_edit', 'knowledge_delete',
      'monitor_view', 'monitor_config', 'alert_handle',
      'user_view', 'user_create', 'user_edit', 'user_delete',
      'system_config', 'log_view',
      'role_view', 'role_edit',
    ],
    internal: [
      'ticket_view', 'ticket_create', 'ticket_edit', 'ticket_process', 'ticket_export',
      'asset_view', 'asset_create', 'asset_edit',
      'knowledge_view', 'knowledge_create', 'knowledge_edit',
      'monitor_view', 'alert_handle',
    ],
    external: [
      'ticket_view', 'ticket_create',
      'knowledge_view',
    ],
  };
  
  return defaultPermissions[role] || defaultPermissions.external;
}
