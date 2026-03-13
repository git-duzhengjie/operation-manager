import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { FormTemplateField } from '@/storage/database/shared/schema';

// 格式化时间
function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 格式化表单模板数据
function formatFormTemplate(row: Record<string, unknown> | null) {
  if (!row) {
    return null;
  }
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

// GET: 获取单个表单模板详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('form_templates')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '表单模板不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatFormTemplate(data),
    });
  } catch (error) {
    console.error('Failed to fetch form template:', error);
    return NextResponse.json(
      { success: false, error: '获取表单模板详情失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新表单模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, catalogId, catalogName, description, fields, isActive } = body;
    const client = getSupabaseClient();

    // 获取当前版本
    const { data: current } = await client
      .from('form_templates')
      .select('version')
      .eq('id', parseInt(id))
      .single();

    const { data, error } = await client
      .from('form_templates')
      .update({
        name,
        catalog_id: catalogId || null,
        catalog_name: catalogName || null,
        description: description || null,
        fields,
        is_active: isActive,
        version: ((current?.version as number) || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
