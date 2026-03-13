import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取客户列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const client = getDbClient();

    // 构建查询
    let query = client
      .from('customers')
      .select('id, name, code, contact, phone, email, address, status, created_at, updated_at', { count: 'exact' });

    // 关键词搜索
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,contact.ilike.%${keyword}%,code.ilike.%${keyword}%`);
    }

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 排序和分页
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('查询客户列表失败:', error);
      return NextResponse.json(
        { success: false, error: '查询客户列表失败' },
        { status: 500 }
      );
    }

    // 获取每个客户的项目数
    const customersWithProjectCount = await Promise.all(
      (data || []).map(async (customer: Record<string, unknown>) => {
        const { count: projectCount } = await client
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id);
        
        return {
          ...customer,
          projectCount: projectCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customersWithProjectCount,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('获取客户列表异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST - 创建客户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, contact, phone, email, address, status } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, error: '客户名称不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 检查代码是否重复
    if (code) {
      const { data: existing } = await client
        .from('customers')
        .select('id')
        .eq('code', code)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { success: false, error: '客户代码已存在' },
          { status: 400 }
        );
      }
    }

    // 检查名称是否重复
    const { data: existingName } = await client
      .from('customers')
      .select('id')
      .eq('name', name)
      .limit(1);

    if (existingName && existingName.length > 0) {
      return NextResponse.json(
        { success: false, error: '客户名称已存在' },
        { status: 400 }
      );
    }

    // 创建客户
    const { data, error } = await client
      .from('customers')
      .insert({
        name,
        code: code || null,
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('创建客户失败:', error);
      return NextResponse.json(
        { success: false, error: '创建客户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...data, projectCount: 0 },
      message: '客户创建成功',
    });
  } catch (error) {
    console.error('创建客户异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
