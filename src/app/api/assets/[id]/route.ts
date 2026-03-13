import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型名称映射
const typeNames: Record<string, string> = {
  server: '服务器',
  network: '网络设备',
  storage: '存储设备',
  application: '应用系统',
};

// 状态映射
const statusMap: Record<string, string> = {
  normal: '正常',
  warning: '告警',
  fault: '故障',
  offline: '离线',
  maintenance: '维护中',
};

// 客户和项目名称映射
const customerNames: Record<number, string> = {
  1: '市财政局',
  2: '市人社局',
  3: '市卫健委',
};

const projectNames: Record<number, string> = {
  1: '预算管理系统',
  2: '人事管理系统',
  3: '医院信息系统',
};

// 格式化资产数据
function formatAsset(row: Record<string, unknown>) {
  return {
    id: row.asset_code as string,
    name: row.name as string,
    type: row.type as string,
    typeName: typeNames[row.type as string] || (row.type as string),
    model: row.model as string | null,
    ip: row.ip as string | null,
    customerId: row.customer_id as number | null,
    customer: row.customer_id ? customerNames[row.customer_id as number] || null : null,
    projectId: row.project_id as number | null,
    project: row.project_id ? projectNames[row.project_id as number] || null : null,
    status: row.status as string,
    statusName: statusMap[row.status as string] || (row.status as string),
    location: row.location as string | null,
    specifications: row.specifications as Record<string, unknown> | null,
    description: row.description as string | null,
    createdAt: row.created_at as string,
  };
}

// GET: 获取单个资产详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('assets')
      .select('*')
      .eq('asset_code', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: '资产不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAsset(data),
    });
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取资产详情失败',
      },
      { status: 500 }
    );
  }
}

// PUT: 更新资产
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, type, model, ip, customerId, projectId, status, location, specifications, description } = body;

    // 验证必填字段
    if (!name || !type) {
      return NextResponse.json(
        {
          success: false,
          error: '资产名称和类型为必填项',
        },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('assets')
      .update({
        name,
        type,
        model: model || null,
        ip: ip || null,
        customer_id: customerId || null,
        project_id: projectId || null,
        status: status || 'normal',
        location: location || null,
        specifications: specifications || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('asset_code', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: '资产不存在或更新失败',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAsset(data),
      message: '资产更新成功',
    });
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新资产失败',
      },
      { status: 500 }
    );
  }
}

// DELETE: 删除资产
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('assets')
      .delete()
      .eq('asset_code', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: '资产不存在或删除失败',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '资产删除成功',
    });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除资产失败',
      },
      { status: 500 }
    );
  }
}
