import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { FormTemplateField } from '@/storage/database/shared/schema';

// 服务目录选项
const catalogOptions = [
  { id: 1, name: '账号管理' },
  { id: 2, name: '硬件服务' },
  { id: 3, name: '软件服务' },
  { id: 4, name: '网络服务' },
  { id: 5, name: '数据服务' },
  { id: 6, name: '安全服务' },
];

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化表单模板数据
function formatFormTemplate(row: Record<string, unknown> | null) {
  if (!row) { return null; }
  return {
    id: String(row.id),
    name: row.name as string,
    catalogId: row.catalog_id as number | null,
    catalogName: row.catalog_name as string,
    description: row.description as string | null,
    fields: row.fields as FormTemplateField[],
    isActive: row.is_active as boolean,
    version: row.version as number,
    fieldCount: (row.fields as FormTemplateField[])?.length || 0,
    createdAt: formatTime(row.created_at as string),
    updatedAt: formatTime(row.updated_at as string),
  };
}

// 初始表单模板数据
const seedTemplates = [
  {
    name: '账号申请表单',
    catalog_id: 1,
    catalog_name: '账号管理',
    description: '用于申请新系统账号或权限变更',
    fields: [
      { id: 'f1', name: 'applicant', label: '申请人', type: 'user' as const, required: true, order: 1 },
      { id: 'f2', name: 'department', label: '所属部门', type: 'department' as const, required: true, order: 2 },
      { id: 'f3', name: 'system', label: '申请系统', type: 'select' as const, required: true, options: [
        { label: 'OA系统', value: 'oa' },
        { label: 'ERP系统', value: 'erp' },
        { label: '财务系统', value: 'finance' },
        { label: '人事系统', value: 'hr' },
      ], order: 3 },
      { id: 'f4', name: 'accountType', label: '账号类型', type: 'radio' as const, required: true, options: [
        { label: '新增账号', value: 'new' },
        { label: '权限变更', value: 'change' },
        { label: '账号注销', value: 'delete' },
      ], order: 4 },
      { id: 'f5', name: 'reason', label: '申请原因', type: 'textarea' as const, required: true, placeholder: '请详细说明申请原因', order: 5 },
      { id: 'f6', name: 'urgentLevel', label: '紧急程度', type: 'select' as const, required: true, options: [
        { label: '普通', value: 'normal' },
        { label: '紧急', value: 'urgent' },
        { label: '非常紧急', value: 'very_urgent' },
      ], order: 6 },
      { id: 'f7', name: 'expectedDate', label: '期望完成日期', type: 'date' as const, required: false, order: 7 },
      { id: 'f8', name: 'attachment', label: '附件', type: 'file' as const, required: false, order: 8 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '设备采购申请表单',
    catalog_id: 2,
    catalog_name: '硬件服务',
    description: '用于申请采购硬件设备',
    fields: [
      { id: 'f1', name: 'applicant', label: '申请人', type: 'user' as const, required: true, order: 1 },
      { id: 'f2', name: 'department', label: '所属部门', type: 'department' as const, required: true, order: 2 },
      { id: 'f3', name: 'deviceType', label: '设备类型', type: 'select' as const, required: true, options: [
        { label: '台式电脑', value: 'desktop' },
        { label: '笔记本电脑', value: 'laptop' },
        { label: '服务器', value: 'server' },
        { label: '打印机', value: 'printer' },
        { label: '其他', value: 'other' },
      ], order: 3 },
      { id: 'f4', name: 'deviceName', label: '设备名称', type: 'text' as const, required: true, placeholder: '请输入设备名称', order: 4 },
      { id: 'f5', name: 'quantity', label: '数量', type: 'number' as const, required: true, validation: { min: 1 }, order: 5 },
      { id: 'f6', name: 'budget', label: '预算金额', type: 'number' as const, required: true, validation: { min: 0 }, order: 6 },
      { id: 'f7', name: 'reason', label: '申请原因', type: 'textarea' as const, required: true, placeholder: '请详细说明采购原因', order: 7 },
      { id: 'f8', name: 'specification', label: '规格要求', type: 'textarea' as const, required: false, placeholder: '请描述设备规格要求', order: 8 },
      { id: 'f9', name: 'expectedDate', label: '期望交付日期', type: 'date' as const, required: false, order: 9 },
      { id: 'f10', name: 'attachment', label: '附件', type: 'file' as const, required: false, order: 10 },
      { id: 'f11', name: 'supplier', label: '推荐供应商', type: 'text' as const, required: false, order: 11 },
      { id: 'f12', name: 'remarks', label: '备注', type: 'textarea' as const, required: false, order: 12 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '软件安装申请表单',
    catalog_id: 3,
    catalog_name: '软件服务',
    description: '用于申请安装软件或开通软件权限',
    fields: [
      { id: 'f1', name: 'applicant', label: '申请人', type: 'user' as const, required: true, order: 1 },
      { id: 'f2', name: 'department', label: '所属部门', type: 'department' as const, required: true, order: 2 },
      { id: 'f3', name: 'softwareName', label: '软件名称', type: 'text' as const, required: true, placeholder: '请输入软件名称', order: 3 },
      { id: 'f4', name: 'softwareVersion', label: '软件版本', type: 'text' as const, required: false, placeholder: '如：Office 2021', order: 4 },
      { id: 'f5', name: 'installType', label: '安装类型', type: 'radio' as const, required: true, options: [
        { label: '新安装', value: 'new' },
        { label: '升级安装', value: 'upgrade' },
        { label: '卸载重装', value: 'reinstall' },
      ], order: 5 },
      { id: 'f6', name: 'reason', label: '申请原因', type: 'textarea' as const, required: true, placeholder: '请说明安装原因', order: 6 },
      { id: 'f7', name: 'license', label: '是否有授权', type: 'radio' as const, required: true, options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ], order: 7 },
      { id: 'f8', name: 'device', label: '安装设备', type: 'text' as const, required: true, placeholder: '请输入设备编号或IP', order: 8 },
      { id: 'f9', name: 'expectedDate', label: '期望完成日期', type: 'date' as const, required: false, order: 9 },
      { id: 'f10', name: 'attachment', label: '附件', type: 'file' as const, required: false, order: 10 },
    ],
    is_active: true,
    version: 1,
  },
  {
    name: '网络接入申请表单',
    catalog_id: 4,
    catalog_name: '网络服务',
    description: '用于申请网络接入或网络配置变更',
    fields: [
      { id: 'f1', name: 'applicant', label: '申请人', type: 'user' as const, required: true, order: 1 },
      { id: 'f2', name: 'department', label: '所属部门', type: 'department' as const, required: true, order: 2 },
      { id: 'f3', name: 'requestType', label: '申请类型', type: 'radio' as const, required: true, options: [
        { label: '新开通网络', value: 'new' },
        { label: '网络变更', value: 'change' },
        { label: '网络故障报修', value: 'repair' },
      ], order: 3 },
      { id: 'f4', name: 'deviceIp', label: '设备IP', type: 'text' as const, required: false, placeholder: '如有固定IP请填写', order: 4 },
      { id: 'f5', name: 'macAddress', label: 'MAC地址', type: 'text' as const, required: false, placeholder: '请填写设备MAC地址', order: 5 },
      { id: 'f6', name: 'location', label: '设备位置', type: 'text' as const, required: true, placeholder: '请填写设备安装位置', order: 6 },
      { id: 'f7', name: 'bandwidth', label: '带宽需求', type: 'select' as const, required: false, options: [
        { label: '100Mbps', value: '100' },
        { label: '1Gbps', value: '1000' },
        { label: '10Gbps', value: '10000' },
      ], order: 7 },
      { id: 'f8', name: 'reason', label: '申请原因', type: 'textarea' as const, required: true, placeholder: '请详细说明申请原因', order: 8 },
      { id: 'f9', name: 'expectedDate', label: '期望完成日期', type: 'date' as const, required: false, order: 9 },
    ],
    is_active: true,
    version: 1,
  },
];

// GET: 获取表单模板列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const catalogId = searchParams.get('catalogId');
  const isActive = searchParams.get('isActive');

  try {
    const client = getSupabaseClient();

    let query = client
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (catalogId) {
      query = query.eq('catalog_id', parseInt(catalogId));
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
      .from('form_templates')
      .select('is_active');

    const stats = {
      total: statsData?.length || 0,
      active: statsData?.filter((r) => r.is_active).length || 0,
      fieldTypes: 11, // 固定字段类型数量：text, textarea, number, select, radio, checkbox, date, datetime, file, user, department
    };

    return NextResponse.json({
      success: true,
      data: {
        templates: (data || []).map(formatFormTemplate),
        stats,
        catalogs: catalogOptions,
      },
    });
  } catch (error) {
    console.error('Failed to fetch form templates:', error);
    return NextResponse.json(
      { success: false, error: '获取表单模板失败' },
      { status: 500 }
    );
  }
}

// POST: 创建表单模板或初始化数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 初始化种子数据
    if (body.action === 'seed') {
      const { data, error } = await client
        .from('form_templates')
        .insert(seedTemplates)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `成功插入 ${data?.length || 0} 个表单模板`,
        data: data?.map(formatFormTemplate),
      });
    }

    // 创建新模板
    const { name, catalogId, catalogName, description, fields, isActive } = body;

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: '表单名称和字段为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('form_templates')
      .insert({
        name,
        catalog_id: catalogId || null,
        catalog_name: catalogName || null,
        description: description || null,
        fields,
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
      data: formatFormTemplate(data),
      message: '表单模板创建成功',
    });
  } catch (error) {
    console.error('Failed to create form template:', error);
    return NextResponse.json(
      { success: false, error: '创建表单模板失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新表单模板
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, catalogId, catalogName, description, fields, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少表单模板ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取当前版本
    const { data: current } = await client
      .from('form_templates')
      .select('version')
      .eq('id', id)
      .single();

    const currentVersion = (current as Record<string, unknown>)?.version as number | undefined;
    const { data, error } = await client
      .from('form_templates')
      .update({
        name,
        catalog_id: catalogId || null,
        catalog_name: catalogName || null,
        description: description || null,
        fields,
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
      data: formatFormTemplate(data),
      message: '表单模板更新成功',
    });
  } catch (error) {
    console.error('Failed to update form template:', error);
    return NextResponse.json(
      { success: false, error: '更新表单模板失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除表单模板
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: '缺少表单模板ID' },
      { status: 400 }
    );
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('form_templates')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '表单模板删除成功',
    });
  } catch (error) {
    console.error('Failed to delete form template:', error);
    return NextResponse.json(
      { success: false, error: '删除表单模板失败' },
      { status: 500 }
    );
  }
}
