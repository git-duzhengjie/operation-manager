import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const client = getDbClient();

    // 构建查询
    let query = client
      .from('projects')
      .select('id, name, code, customer_id, manager, start_date, end_date, status, description, created_at, updated_at', { count: 'exact' });

    // 关键词搜索
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%,manager.ilike.%${keyword}%`);
    }

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 客户筛选
    if (customerId) {
      query = query.eq('customer_id', parseInt(customerId, 10));
    }

    // 排序和分页
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('查询项目列表失败:', error);
      return NextResponse.json(
        { success: false, error: '查询项目列表失败' },
        { status: 500 }
      );
    }

    // 获取客户名称
    const customerIds = [...new Set((data || []).map((p: Record<string, unknown>) => p.customer_id).filter(Boolean))];
    let customersMap: Record<number, string> = {};
    
    if (customerIds.length > 0) {
      const { data: customers } = await client
        .from('customers')
        .select('id, name')
        .in('id', customerIds);
      
      (customers || []).forEach((c: Record<string, unknown>) => {
        customersMap[c.id as number] = c.name as string;
      });
    }

    // 组装数据
    const projectsWithCustomer = (data || []).map((project: Record<string, unknown>) => ({
      ...project,
      customerName: project.customer_id ? customersMap[project.customer_id as number] || null : null,
    }));

    // 统计各状态数量
    const { data: allProjects } = await client
      .from('projects')
      .select('status');

    const statusCounts = (allProjects || []).reduce((acc: Record<string, number>, p: Record<string, unknown>) => {
      const s = (p.status as string) || 'active';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: projectsWithCustomer,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      stats: {
        total: count || 0,
        active: statusCounts['active'] || 0,
        completed: statusCounts['completed'] || 0,
        suspended: statusCounts['suspended'] || 0,
      },
    });
  } catch (error) {
    console.error('获取项目列表异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST - 创建项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, customerId, manager, startDate, endDate, status, description } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, error: '项目名称不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 检查代码是否重复
    if (code) {
      const { data: existing } = await client
        .from('projects')
        .select('id')
        .eq('code', code)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { success: false, error: '项目代码已存在' },
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

    // 创建项目
    const { data, error } = await client
      .from('projects')
      .insert({
        name,
        code: code || null,
        customer_id: customerId || null,
        manager: manager || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: status || 'active',
        description: description || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('创建项目失败:', error);
      return NextResponse.json(
        { success: false, error: '创建项目失败' },
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
      message: '项目创建成功',
    });
  } catch (error) {
    console.error('创建项目异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
