import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, ticketHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 生成工单号
function generateTicketNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `WO${year}${month}${day}${random}`;
}

// GET /api/tickets - 获取工单列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');

    // TODO: 实现数据库查询
    // const result = await db.select().from(tickets);

    // 模拟数据返回
    const mockTickets = [
      {
        id: 1,
        ticketNo: 'WO20240115001',
        title: '服务器磁盘空间不足告警',
        type: 'incident',
        status: 'processing',
        priority: 'high',
        customer: '市财政局',
        project: '预算管理系统',
        assignee: '张三',
        createdAt: '2024-01-15 10:30:00',
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockTickets,
      total: mockTickets.length,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, error: '获取工单列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - 创建新工单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.title || !body.type || !body.description) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const ticketNo = generateTicketNo();

    // TODO: 实现数据库插入
    // const newTicket = await db.insert(tickets).values({
    //   ticketNo,
    //   title: body.title,
    //   type: body.type,
    //   priority: body.priority || 'medium',
    //   status: 'pending',
    //   description: body.description,
    //   customerId: body.customerId,
    //   projectId: body.projectId,
    //   assetId: body.assetId,
    //   formData: body.formData,
    //   creatorId: 1, // TODO: 从session获取
    // });

    // 创建工单历史记录
    // await db.insert(ticketHistory).values({
    //   ticketId: newTicket[0].id,
    //   action: 'created',
    //   toStatus: 'pending',
    //   comment: '工单创建',
    //   operatorId: 1,
    // });

    // 模拟返回
    const newTicket = {
      id: Math.floor(Math.random() * 1000),
      ticketNo,
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newTicket,
      message: '工单创建成功',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, error: '创建工单失败' },
      { status: 500 }
    );
  }
}
