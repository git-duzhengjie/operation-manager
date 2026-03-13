import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的项目ID' },
        { status: 400 }
      );
    }
    
    const client = getDbClient();

    const { data, error } = await client
      .from('projects')
      .select('id, name, code, customer_id, manager, start_date, end_date, status, description, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    // 获取客户名称
    let customerName = null;
    if (data.customer_id) {
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', data.customer_id)
        .single();
      customerName = customer?.name || null;
    }

    // 获取关联资产数量
    const { count: assetCount } = await client
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id);

    // 获取关联资产列表
    const { data: assets } = await client
      .from('assets')
      .select('id, name, asset_code, type, ip, status')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        customerName,
        assetCount: assetCount || 0,
        assets: assets || [],
      },
    });
  } catch (error) {
    console.error('获取项目详情异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的项目ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, code, customerId, manager, startDate, endDate, status, description } = body;

    const client = getDbClient();

    // 检查项目是否存在
    const { data: existing } = await client
      .from('projects')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    // 如果修改了代码，检查是否重复
    if (code) {
      const { data: duplicateCode } = await client
        .from('projects')
        .select('id')
        .eq('code', code)
        .neq('id', id)
        .limit(1);

      if (duplicateCode && duplicateCode.length > 0) {
        return NextResponse.json(
          { success: false, error: '项目代码已存在' },
          { status: 400 }
        );
      }
    }

    // 如果修改了名称，检查是否重复
    if (name) {
      const { data: duplicateName } = await client
        .from('projects')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .limit(1);

      if (duplicateName && duplicateName.length > 0) {
        return NextResponse.json(
          { success: false, error: '项目名称已存在' },
          { status: 400 }
        );
      }
    }

    // 检查客户是否存在
    if (customerId) {
      const { data: customer } = await client
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { success: false, error: '客户不存在' },
          { status: 400 }
        );
      }
    }

    // 更新项目
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code || null;
    if (customerId !== undefined) updateData.customer_id = customerId || null;
    if (manager !== undefined) updateData.manager = manager || null;
    if (startDate !== undefined) updateData.start_date = startDate || null;
    if (endDate !== undefined) updateData.end_date = endDate || null;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description || null;

    const { data, error } = await client
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('更新项目失败:', error);
      return NextResponse.json(
        { success: false, error: '更新项目失败' },
        { status: 500 }
      );
    }

    // 获取客户名称
    let customerName = null;
    if (data.customer_id) {
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', data.customer_id)
        .single();
      customerName = customer?.name || null;
    }

    return NextResponse.json({
      success: true,
      data: { ...data, customerName },
      message: '项目更新成功',
    });
  } catch (error) {
    console.error('更新项目异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的项目ID' },
        { status: 400 }
      );
    }
    
    const client = getDbClient();

    // 检查项目是否存在
    const { data: existing } = await client
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联资产
    const { count: assetCount } = await client
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id);

    if (assetCount && assetCount > 0) {
      return NextResponse.json(
        { success: false, error: `该项目下有 ${assetCount} 个资产，无法删除` },
        { status: 400 }
      );
    }

    // 删除项目
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除项目失败:', error);
      return NextResponse.json(
        { success: false, error: '删除项目失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '项目删除成功',
    });
  } catch (error) {
    console.error('删除项目异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
