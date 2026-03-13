import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化服务目录数据
function formatCatalog(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name as string,
    icon: row.icon as string || '📁',
    description: row.description as string | null,
    sortOrder: row.sort_order as number || 0,
    isActive: row.is_active as boolean,
    createdAt: formatTime(row.created_at as string),
    updatedAt: formatTime(row.updated_at as string),
  };
}

// 格式化服务项目数据
function formatServiceItem(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    catalogId: row.catalog_id as number,
    name: row.name as string,
    description: row.description as string | null,
    workflowId: row.workflow_id as number | null,
    formTemplateId: row.form_template_id as number | null,
    slaTime: row.sla_time as number | null,
    sortOrder: row.sort_order as number || 0,
    isActive: row.is_active as boolean,
    createdAt: formatTime(row.created_at as string),
    updatedAt: formatTime(row.updated_at as string),
  };
}

// 初始服务目录数据
const seedCatalogs = [
  {
    name: '账号服务',
    icon: '👤',
    description: '账号申请、权限管理、密码重置等服务',
    sort_order: 1,
    is_active: true,
  },
  {
    name: '硬件服务',
    icon: '💻',
    description: '设备采购、维修、更换等硬件相关服务',
    sort_order: 2,
    is_active: true,
  },
  {
    name: '软件服务',
    icon: '📦',
    description: '软件安装、升级、授权等软件相关服务',
    sort_order: 3,
    is_active: true,
  },
  {
    name: '网络服务',
    icon: '🌐',
    description: '网络接入、VPN、网络故障等网络相关服务',
    sort_order: 4,
    is_active: true,
  },
  {
    name: '数据服务',
    icon: '📊',
    description: '数据备份、数据恢复、数据迁移等服务',
    sort_order: 5,
    is_active: true,
  },
  {
    name: '安全服务',
    icon: '🔒',
    description: '安全审计、漏洞修复、安全培训等服务',
    sort_order: 6,
    is_active: true,
  },
];

// 初始服务项目数据
const seedServiceItems = [
  // 账号服务
  { catalog_id: 1, name: '账号申请', description: '申请新的系统账号', sla_time: 24, sort_order: 1 },
  { catalog_id: 1, name: '权限变更', description: '申请系统权限变更', sla_time: 48, sort_order: 2 },
  { catalog_id: 1, name: '密码重置', description: '重置忘记的密码', sla_time: 4, sort_order: 3 },
  // 硬件服务
  { catalog_id: 2, name: '设备采购', description: '申请采购硬件设备', sla_time: 72, sort_order: 1 },
  { catalog_id: 2, name: '设备维修', description: '申请设备维修服务', sla_time: 24, sort_order: 2 },
  { catalog_id: 2, name: '设备更换', description: '申请更换故障设备', sla_time: 48, sort_order: 3 },
  // 软件服务
  { catalog_id: 3, name: '软件安装', description: '申请安装软件', sla_time: 24, sort_order: 1 },
  { catalog_id: 3, name: '软件升级', description: '申请软件版本升级', sla_time: 48, sort_order: 2 },
  { catalog_id: 3, name: '软件授权', description: '申请软件授权许可', sla_time: 72, sort_order: 3 },
  // 网络服务
  { catalog_id: 4, name: '网络接入', description: '申请网络接入服务', sla_time: 24, sort_order: 1 },
  { catalog_id: 4, name: 'VPN服务', description: '申请VPN访问权限', sla_time: 48, sort_order: 2 },
  { catalog_id: 4, name: '网络故障', description: '报告网络故障问题', sla_time: 4, sort_order: 3 },
  // 数据服务
  { catalog_id: 5, name: '数据备份', description: '申请数据备份服务', sla_time: 24, sort_order: 1 },
  { catalog_id: 5, name: '数据恢复', description: '申请数据恢复服务', sla_time: 8, sort_order: 2 },
  { catalog_id: 5, name: '数据迁移', description: '申请数据迁移服务', sla_time: 72, sort_order: 3 },
  // 安全服务
  { catalog_id: 6, name: '安全审计', description: '申请安全审计服务', sla_time: 168, sort_order: 1 },
  { catalog_id: 6, name: '漏洞修复', description: '报告安全漏洞', sla_time: 24, sort_order: 2 },
  { catalog_id: 6, name: '安全培训', description: '申请安全培训服务', sla_time: 168, sort_order: 3 },
];

// GET: 获取服务目录列表（含服务项目）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeItems = searchParams.get('includeItems') !== 'false';

  try {
    const client = getSupabaseClient();

    // 获取服务目录
    const { data: catalogs, error: catalogError } = await client
      .from('service_catalogs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (catalogError) {
      console.error('Supabase query error:', catalogError);
      throw catalogError;
    }

    let items: Record<string, unknown>[] = [];
    if (includeItems) {
      // 获取服务项目
      const { data: itemsData, error: itemsError } = await client
        .from('service_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (itemsError) {
        console.error('Supabase query error:', itemsError);
        throw itemsError;
      }
      items = itemsData || [];
    }

    // 获取统计数据
    const { data: workflowsData } = await client.from('workflows').select('id');
    const { data: formsData } = await client.from('form_templates').select('id');

    // 组装数据：将服务项目按目录分组
    const catalogsWithItems = (catalogs || []).map((catalog) => {
      const catalogItems = items.filter(
        (item) => item.catalog_id === catalog.id
      );
      return {
        ...formatCatalog(catalog),
        children: catalogItems.map(formatServiceItem),
        itemCount: catalogItems.length,
      };
    });

    const stats = {
      catalogs: catalogs?.length || 0,
      items: items.length,
      workflows: workflowsData?.length || 0,
      forms: formsData?.length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        catalogs: catalogsWithItems,
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch service catalogs:', error);
    return NextResponse.json(
      { success: false, error: '获取服务目录失败' },
      { status: 500 }
    );
  }
}

// POST: 创建服务目录/项目或初始化数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 初始化种子数据
    if (body.action === 'seed') {
      // 先插入目录
      const { data: catalogsData, error: catalogsError } = await client
        .from('service_catalogs')
        .insert(seedCatalogs)
        .select();

      if (catalogsError) {
        console.error('Supabase insert error:', catalogsError);
        throw catalogsError;
      }

      // 再插入服务项目
      const { data: itemsData, error: itemsError } = await client
        .from('service_items')
        .insert(seedServiceItems)
        .select();

      if (itemsError) {
        console.error('Supabase insert error:', itemsError);
        throw itemsError;
      }

      return NextResponse.json({
        success: true,
        message: `成功插入 ${catalogsData?.length || 0} 个服务目录和 ${itemsData?.length || 0} 个服务项目`,
        data: {
          catalogs: catalogsData?.map(formatCatalog),
          items: itemsData?.map(formatServiceItem),
        },
      });
    }

    // 创建服务项目
    if (body.type === 'item') {
      const { catalogId, name, description, workflowId, formTemplateId, slaTime, isActive } = body;

      if (!catalogId || !name) {
        return NextResponse.json(
          { success: false, error: '目录ID和名称为必填项' },
          { status: 400 }
        );
      }

      const { data, error } = await client
        .from('service_items')
        .insert({
          catalog_id: catalogId,
          name,
          description: description || null,
          workflow_id: workflowId || null,
          form_template_id: formTemplateId || null,
          sla_time: slaTime || null,
          is_active: isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: formatServiceItem(data),
        message: '服务项目创建成功',
      });
    }

    // 创建服务目录
    const { name, icon, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: '目录名称为必填项' },
        { status: 400 }
      );
    }

    // 获取最大排序号
    const { data: maxSort } = await client
      .from('service_catalogs')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const { data, error } = await client
      .from('service_catalogs')
      .insert({
        name,
        icon: icon || '📁',
        description: description || null,
        sort_order: (maxSort?.[0]?.sort_order || 0) + 1,
        is_active: isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: formatCatalog(data),
      message: '服务目录创建成功',
    });
  } catch (error) {
    console.error('Failed to create service catalog:', error);
    return NextResponse.json(
      { success: false, error: '创建服务目录失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新服务目录/项目
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 更新服务项目
    if (body.type === 'item') {
      const { id, name, description, workflowId, formTemplateId, slaTime, isActive } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: '缺少服务项目ID' },
          { status: 400 }
        );
      }

      const { data, error } = await client
        .from('service_items')
        .update({
          name,
          description: description || null,
          workflow_id: workflowId || null,
          form_template_id: formTemplateId || null,
          sla_time: slaTime || null,
          is_active: isActive,
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
        data: formatServiceItem(data),
        message: '服务项目更新成功',
      });
    }

    // 更新服务目录
    const { id, name, icon, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少服务目录ID' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('service_catalogs')
      .update({
        name,
        icon,
        description: description || null,
        sort_order: sortOrder,
        is_active: isActive,
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
      data: formatCatalog(data),
      message: '服务目录更新成功',
    });
  } catch (error) {
    console.error('Failed to update service catalog:', error);
    return NextResponse.json(
      { success: false, error: '更新服务目录失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除服务目录/项目
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'catalog' or 'item'

  if (!id) {
    return NextResponse.json(
      { success: false, error: '缺少ID' },
      { status: 400 }
    );
  }

  try {
    const client = getSupabaseClient();

    if (type === 'item') {
      // 删除服务项目
      const { error } = await client
        .from('service_items')
        .delete()
        .eq('id', parseInt(id));

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: '服务项目删除成功',
      });
    }

    // 删除服务目录前，先删除其下的所有服务项目
    const { error: deleteItemsError } = await client
      .from('service_items')
      .delete()
      .eq('catalog_id', parseInt(id));

    if (deleteItemsError) {
      console.error('Supabase delete error:', deleteItemsError);
      throw deleteItemsError;
    }

    // 再删除目录
    const { error } = await client
      .from('service_catalogs')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '服务目录删除成功',
    });
  } catch (error) {
    console.error('Failed to delete service catalog:', error);
    return NextResponse.json(
      { success: false, error: '删除服务目录失败' },
      { status: 500 }
    );
  }
}
