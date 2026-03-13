import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';
import type { WorkflowStep } from '@/storage/database/shared/schema';

// 流程类型映射
const typeLabels: Record<string, string> = {
  incident: '事件管理',
  change: '变更管理',
  request: '请求管理',
  problem: '问题管理',
};

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化流程数据
function formatWorkflow(row: Record<string, unknown> | null) {
  if (!row) { return null; }
  const steps = (row?.steps as WorkflowStep[]) || [];
  return {
    id: String(row.id),
    name: row.name as string,
    type: row.type as string,
    typeLabel: typeLabels[row.type as string] || row.type,
    catalogId: row.catalog_id as number | null,
    catalogName: row.catalog_name as string || '-',
    description: row.description as string | null,
    steps,
    stepCount: steps.length,
    isActive: row.is_active as boolean,
    version: row.version as number,
    createdAt: formatTime(row.created_at as string),
    updatedAt: formatTime(row.updated_at as string),
  };
}

// 初始流程数据
const seedWorkflows = [
  {
    name: '事件处理流程',
    type: 'incident',
    catalog_id: null,
    catalog_name: '事件管理',
    description: '用于处理IT事件的标准化流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '分类与初步诊断', type: 'processing' as const, order: 2, assignee: { type: 'role' as const, value: 'service_desk' } },
      { id: 's3', name: '分派处理', type: 'processing' as const, order: 3, assignee: { type: 'role' as const, value: 'it_support' } },
      { id: 's4', name: '解决方案确认', type: 'approval' as const, order: 4, assignee: { type: 'user' as const, value: 'requester' } },
      { id: 's5', name: '结束', type: 'end' as const, order: 5 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '变更审批流程',
    type: 'change',
    catalog_id: null,
    catalog_name: '变更管理',
    description: '用于IT变更的审批和实施流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '变更申请', type: 'processing' as const, order: 2, assignee: { type: 'user' as const, value: 'requester' } },
      { id: 's3', name: '技术评审', type: 'approval' as const, order: 3, assignee: { type: 'role' as const, value: 'tech_lead' } },
      { id: 's4', name: '变更审批', type: 'approval' as const, order: 4, assignee: { type: 'role' as const, value: 'change_manager' } },
      { id: 's5', name: '实施变更', type: 'processing' as const, order: 5, assignee: { type: 'role' as const, value: 'it_ops' } },
      { id: 's6', name: '变更验证', type: 'processing' as const, order: 6, assignee: { type: 'role' as const, value: 'qa' } },
      { id: 's7', name: '结束', type: 'end' as const, order: 7 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '服务请求流程',
    type: 'request',
    catalog_id: null,
    catalog_name: '请求管理',
    description: '用于处理用户服务请求的标准流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '请求受理', type: 'processing' as const, order: 2, assignee: { type: 'role' as const, value: 'service_desk' } },
      { id: 's3', name: '请求处理', type: 'processing' as const, order: 3, assignee: { type: 'role' as const, value: 'it_support' } },
      { id: 's4', name: '结束', type: 'end' as const, order: 4 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '问题管理流程',
    type: 'problem',
    catalog_id: null,
    catalog_name: '问题管理',
    description: '用于根本原因分析和问题解决的标准流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '问题登记', type: 'processing' as const, order: 2, assignee: { type: 'role' as const, value: 'problem_manager' } },
      { id: 's3', name: '根因分析', type: 'processing' as const, order: 3, assignee: { type: 'role' as const, value: 'tech_lead' } },
      { id: 's4', name: '解决方案制定', type: 'processing' as const, order: 4, assignee: { type: 'role' as const, value: 'it_ops' } },
      { id: 's5', name: '实施验证', type: 'approval' as const, order: 5, assignee: { type: 'role' as const, value: 'problem_manager' } },
      { id: 's6', name: '结束', type: 'end' as const, order: 6 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '账号申请流程',
    type: 'request',
    catalog_id: 1,
    catalog_name: '账号管理',
    description: '用于账号申请和权限变更的审批流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '提交申请', type: 'processing' as const, order: 2, assignee: { type: 'user' as const, value: 'requester' } },
      { id: 's3', name: '部门审批', type: 'approval' as const, order: 3, assignee: { type: 'role' as const, value: 'dept_manager' } },
      { id: 's4', name: 'IT审批', type: 'approval' as const, order: 4, assignee: { type: 'role' as const, value: 'it_manager' } },
      { id: 's5', name: '账号开通', type: 'processing' as const, order: 5, assignee: { type: 'role' as const, value: 'it_admin' } },
      { id: 's6', name: '结束', type: 'end' as const, order: 6 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '设备采购流程',
    type: 'request',
    catalog_id: 2,
    catalog_name: '硬件服务',
    description: '用于设备采购申请的审批流程',
    steps: [
      { id: 's1', name: '开始', type: 'start' as const, order: 1 },
      { id: 's2', name: '提交申请', type: 'processing' as const, order: 2, assignee: { type: 'user' as const, value: 'requester' } },
      { id: 's3', name: '部门审批', type: 'approval' as const, order: 3, assignee: { type: 'role' as const, value: 'dept_manager' } },
      { id: 's4', name: '财务审批', type: 'approval' as const, order: 4, assignee: { type: 'role' as const, value: 'finance' } },
      { id: 's5', name: '采购执行', type: 'processing' as const, order: 5, assignee: { type: 'role' as const, value: 'procurement' } },
      { id: 's6', name: '验收确认', type: 'approval' as const, order: 6, assignee: { type: 'user' as const, value: 'requester' } },
      { id: 's7', name: '结束', type: 'end' as const, order: 7 },
    ],
    is_active: true,
    version: 1,
  },
];

// GET: 获取流程列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  try {
    const client = getDbClient();

    let query = client
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 计算统计数据
    const { data: statsData } = await client
      .from('workflows')
      .select('is_active, type');

    const stats = {
      total: statsData?.length || 0,
      active: statsData?.filter((r) => r.is_active).length || 0,
      types: Object.keys(typeLabels).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        workflows: (data || []).map(formatWorkflow),
        stats,
        typeOptions: Object.entries(typeLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { success: false, error: '获取流程列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建流程或初始化数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getDbClient();

    // 初始化种子数据
    if (body.action === 'seed') {
      const { data, error } = await client
        .from('workflows')
        .insert(seedWorkflows)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `成功插入 ${(data as unknown as Record<string, unknown>[])?.length || 0} 个流程`,
        data: (data as unknown as Record<string, unknown>[])?.map(formatWorkflow),
      });
    }

    // 创建新流程
    const { name, type, catalogId, catalogName, description, steps, isActive } = body;

    if (!name || !type || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { success: false, error: '流程名称、类型和步骤为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('workflows')
      .insert({
        name,
        type,
        catalog_id: catalogId || null,
        catalog_name: catalogName || null,
        description: description || null,
        steps,
        is_active: isActive ?? true,
        version: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatWorkflow(data),
      message: '流程创建成功',
    });
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { success: false, error: '创建流程失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新流程
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, catalogId, catalogName, description, steps, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少流程ID' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 获取当前版本
    const { data: current } = await client
      .from('workflows')
      .select('version')
      .eq('id', id)
      .single();

    const currentVersion = (current as Record<string, unknown>)?.version as number | undefined;
    const { data, error } = await client
      .from('workflows')
      .update({
        name,
        type,
        catalog_id: catalogId || null,
        catalog_name: catalogName || null,
        description: description || null,
        steps,
        is_active: isActive,
        version: (currentVersion || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatWorkflow(data),
      message: '流程更新成功',
    });
  } catch (error) {
    console.error('Failed to update workflow:', error);
    return NextResponse.json(
      { success: false, error: '更新流程失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除流程
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: '缺少流程ID' },
      { status: 400 }
    );
  }

  try {
    const client = getDbClient();

    const { error } = await client
      .from('workflows')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '流程删除成功',
    });
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return NextResponse.json(
      { success: false, error: '删除流程失败' },
      { status: 500 }
    );
  }
}
