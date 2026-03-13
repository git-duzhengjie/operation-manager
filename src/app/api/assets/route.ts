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
function formatAsset(row: Record<string, unknown> | null) {
  if (!row) {
    return null;
  }
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

// GET: 获取资产列表和统计数据
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');

  try {
    const client = getSupabaseClient();

    // 构建查询
    let query = client
      .from('assets')
      .select('*', { count: 'exact' });

    // 应用过滤条件
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 排序
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 关键词过滤（在内存中进行，因为 Supabase 不支持多字段模糊查询）
    let filteredData = data || [];
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredData = filteredData.filter(
        (row) =>
          (row.name as string)?.toLowerCase().includes(lowerKeyword) ||
          (row.asset_code as string)?.toLowerCase().includes(lowerKeyword) ||
          (row.ip as string)?.toLowerCase().includes(lowerKeyword) ||
          (row.model as string)?.toLowerCase().includes(lowerKeyword)
      );
    }

    // 格式化数据
    const assetsData = filteredData.map(formatAsset);

    // 统计数据
    const { data: statsData } = await client
      .from('assets')
      .select('type');

    const stats = {
      server: statsData?.filter((r) => r.type === 'server').length || 0,
      network: statsData?.filter((r) => r.type === 'network').length || 0,
      storage: statsData?.filter((r) => r.type === 'storage').length || 0,
      application: statsData?.filter((r) => r.type === 'application').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        assets: assetsData,
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取资产数据失败',
      },
      { status: 500 }
    );
  }
}

// POST: 新增资产
export async function POST(request: NextRequest) {
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

    // 插入资产
    const { data, error } = await client
      .from('assets')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create asset');
    }

    // 生成资产编号
    const assetCode = `AST${String(data.id).padStart(3, '0')}`;

    // 更新资产编号
    const { data: updatedData, error: updateError } = await client
      .from('assets')
      .update({ asset_code: assetCode })
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    if (!updatedData) {
      throw new Error('Failed to update asset code');
    }

    return NextResponse.json({
      success: true,
      data: formatAsset(updatedData),
      message: '资产创建成功',
    });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建资产失败',
      },
      { status: 500 }
    );
  }
}
