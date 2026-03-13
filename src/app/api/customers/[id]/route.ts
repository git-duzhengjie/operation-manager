import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取单个客户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的客户ID' },
        { status: 400 }
      );
    }
    
    const client = getDbClient();

    const { data, error } = await client
      .from('customers')
      .select('id, name, code, contact, phone, email, address, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 获取项目数
    const { count: projectCount } = await client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    // 获取关联项目列表
    const { data: projects } = await client
      .from('projects')
      .select('id, name, code, status, start_date, end_date')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        projectCount: projectCount || 0,
        projects: projects || [],
      },
    });
  } catch (error) {
    console.error('获取客户详情异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新客户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的客户ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, code, contact, phone, email, address, status } = body;

    const client = getDbClient();

    // 检查客户是否存在
    const { data: existing } = await client
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 如果修改了代码，检查是否重复
    if (code) {
      const { data: duplicateCode } = await client
        .from('customers')
        .select('id')
        .eq('code', code)
        .neq('id', id)
        .limit(1);

      if (duplicateCode && duplicateCode.length > 0) {
        return NextResponse.json(
          { success: false, error: '客户代码已存在' },
          { status: 400 }
        );
      }
    }

    // 如果修改了名称，检查是否重复
    if (name) {
      const { data: duplicateName } = await client
        .from('customers')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .limit(1);

      if (duplicateName && duplicateName.length > 0) {
        return NextResponse.json(
          { success: false, error: '客户名称已存在' },
          { status: 400 }
        );
      }
    }

    // 更新客户
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code || null;
    if (contact !== undefined) updateData.contact = contact || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (address !== undefined) updateData.address = address || null;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await client
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新客户失败:', error);
      return NextResponse.json(
        { success: false, error: '更新客户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '客户更新成功',
    });
  } catch (error) {
    console.error('更新客户异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除客户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的客户ID' },
        { status: 400 }
      );
    }
    
    const client = getDbClient();

    // 检查客户是否存在
    const { data: existing } = await client
      .from('customers')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联项目
    const { count: projectCount } = await client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (projectCount && projectCount > 0) {
      return NextResponse.json(
        { success: false, error: `该客户下有 ${projectCount} 个项目，无法删除` },
        { status: 400 }
      );
    }

    // 检查是否有关联资产
    const { count: assetCount } = await client
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (assetCount && assetCount > 0) {
      return NextResponse.json(
        { success: false, error: `该客户下有 ${assetCount} 个资产，无法删除` },
        { status: 400 }
      );
    }

    // 删除客户
    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除客户失败:', error);
      return NextResponse.json(
        { success: false, error: '删除客户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '客户删除成功',
    });
  } catch (error) {
    console.error('删除客户异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
