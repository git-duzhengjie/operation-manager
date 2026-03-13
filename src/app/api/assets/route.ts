import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, sql, and, or, like, desc } from 'drizzle-orm';

// 内存数据回退
const memoryAssets = [
  {
    id: 1,
    assetCode: 'AST001',
    name: '应用服务器-01',
    type: 'server',
    model: 'Dell PowerEdge R740',
    ip: '192.168.1.101',
    customerId: 1,
    projectId: 1,
    status: 'normal',
    location: '机房A区-机柜01',
    specifications: { cpu: '32核', memory: '128GB', disk: '2TB SSD' },
    description: '预算管理系统主应用服务器',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    assetCode: 'AST002',
    name: '核心交换机-01',
    type: 'network',
    model: 'Cisco Catalyst 9300',
    ip: '192.168.1.1',
    customerId: 1,
    projectId: 1,
    status: 'normal',
    location: '机房A区-机柜02',
    specifications: { ports: '48口', speed: '10G' },
    description: '核心网络交换机',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 3,
    assetCode: 'AST003',
    name: '数据库服务器-01',
    type: 'server',
    model: 'Huawei RH2288H V5',
    ip: '192.168.1.102',
    customerId: 2,
    projectId: 2,
    status: 'warning',
    location: '机房B区-机柜01',
    specifications: { cpu: '64核', memory: '256GB', disk: '4TB NVMe' },
    description: '人事管理系统数据库服务器',
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 4,
    assetCode: 'AST004',
    name: '应用服务器-02',
    type: 'server',
    model: 'Lenovo SR650',
    ip: '192.168.1.103',
    customerId: 3,
    projectId: 3,
    status: 'normal',
    location: '机房B区-机柜02',
    specifications: { cpu: '32核', memory: '64GB', disk: '1TB SSD' },
    description: '医院信息系统应用服务器',
    createdAt: new Date('2024-01-04'),
  },
  {
    id: 5,
    assetCode: 'AST005',
    name: '存储阵列-01',
    type: 'storage',
    model: 'NetApp AFF A250',
    ip: '192.168.1.200',
    customerId: 1,
    projectId: 1,
    status: 'normal',
    location: '机房A区-机柜03',
    specifications: { capacity: '100TB', raid: 'RAID-6' },
    description: '主存储阵列',
    createdAt: new Date('2024-01-05'),
  },
  {
    id: 6,
    assetCode: 'AST006',
    name: '备份服务器-01',
    type: 'server',
    model: 'Dell PowerEdge R640',
    ip: '192.168.1.104',
    customerId: null,
    projectId: null,
    status: 'normal',
    location: '机房C区-机柜01',
    specifications: { cpu: '16核', memory: '64GB', disk: '20TB HDD' },
    description: '集中备份服务器',
    createdAt: new Date('2024-01-06'),
  },
  {
    id: 7,
    assetCode: 'AST007',
    name: '防火墙-01',
    type: 'network',
    model: 'Huawei USG6550',
    ip: '192.168.1.254',
    customerId: null,
    projectId: null,
    status: 'normal',
    location: '机房A区-机柜01',
    specifications: { throughput: '10Gbps', ports: '8口' },
    description: '边界防火墙',
    createdAt: new Date('2024-01-07'),
  },
  {
    id: 8,
    assetCode: 'AST008',
    name: '负载均衡器-01',
    type: 'network',
    model: 'F5 BIG-IP i4800',
    ip: '192.168.1.10',
    customerId: 1,
    projectId: 1,
    status: 'normal',
    location: '机房A区-机柜02',
    specifications: { throughput: '40Gbps' },
    description: '应用负载均衡',
    createdAt: new Date('2024-01-08'),
  },
  {
    id: 9,
    assetCode: 'AST009',
    name: '应用服务器-03',
    type: 'server',
    model: 'Dell PowerEdge R750',
    ip: '192.168.1.105',
    customerId: 2,
    projectId: 2,
    status: 'fault',
    location: '机房B区-机柜03',
    specifications: { cpu: '48核', memory: '128GB', disk: '2TB SSD' },
    description: '人事管理系统应用服务器',
    createdAt: new Date('2024-01-09'),
  },
  {
    id: 10,
    assetCode: 'AST010',
    name: 'NAS存储-01',
    type: 'storage',
    model: 'Synology RS1221+',
    ip: '192.168.1.201',
    customerId: null,
    projectId: null,
    status: 'offline',
    location: '机房C区-机柜02',
    specifications: { capacity: '50TB', raid: 'RAID-5' },
    description: '文件共享存储',
    createdAt: new Date('2024-01-10'),
  },
];

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

// GET: 获取资产列表和统计数据
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');

  try {
    let assetsData: Array<{
      id: string;
      name: string | null;
      type: string | null;
      typeName: string;
      model: string | null;
      ip: string | null;
      customer: string | null;
      project: string | null;
      status: string | null;
      statusName: string;
      location: string | null;
    }>;
    let statsData: {
      server: number;
      network: number;
      storage: number;
      application: number;
    };
    let useFallback = false;

    try {
      // 尝试从数据库获取
      // 构建查询条件
      const conditions = [];
      if (type && type !== 'all') {
        conditions.push(eq(assets.type, type));
      }
      if (status && status !== 'all') {
        conditions.push(eq(assets.status, status));
      }

      // 查询资产列表
      const assetList = await db
        .select()
        .from(assets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(assets.createdAt));

      // 关键词过滤
      let filteredAssets = assetList;
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredAssets = assetList.filter(a => 
          a.name?.toLowerCase().includes(lowerKeyword) ||
          a.assetCode?.toLowerCase().includes(lowerKeyword) ||
          a.ip?.toLowerCase().includes(lowerKeyword) ||
          a.model?.toLowerCase().includes(lowerKeyword)
        );
      }

      assetsData = filteredAssets.map(a => ({
        id: a.assetCode || `AST${a.id}`,
        name: a.name,
        type: a.type,
        typeName: typeNames[a.type || ''] || a.type || '未知',
        model: a.model,
        ip: a.ip,
        customer: a.customerId ? customerNames[a.customerId] || '未知' : null,
        project: a.projectId ? projectNames[a.projectId] || '未知' : null,
        status: a.status,
        statusName: statusMap[a.status || ''] || a.status || '未知',
        location: a.location,
      }));

      // 统计数据
      const typeStats = await db
        .select({
          type: assets.type,
          count: sql<number>`count(*)`,
        })
        .from(assets)
        .groupBy(assets.type);

      statsData = {
        server: 0,
        network: 0,
        storage: 0,
        application: 0,
      };

      typeStats.forEach(s => {
        if (s.type && s.type in statsData) {
          statsData[s.type as keyof typeof statsData] = s.count;
        }
      });

    } catch {
      // 使用内存数据
      console.log('Database not available, using memory data for assets');
      useFallback = true;

      // 过滤数据
      let filtered = [...memoryAssets];
      
      if (type && type !== 'all') {
        filtered = filtered.filter(a => a.type === type);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter(a => a.status === status);
      }
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filtered = filtered.filter(a => 
          a.name.toLowerCase().includes(lowerKeyword) ||
          a.assetCode.toLowerCase().includes(lowerKeyword) ||
          a.ip.toLowerCase().includes(lowerKeyword) ||
          a.model.toLowerCase().includes(lowerKeyword)
        );
      }

      assetsData = filtered.map(a => ({
        id: a.assetCode,
        name: a.name,
        type: a.type,
        typeName: typeNames[a.type] || a.type,
        model: a.model,
        ip: a.ip,
        customer: a.customerId ? customerNames[a.customerId] || null : null,
        project: a.projectId ? projectNames[a.projectId] || null : null,
        status: a.status,
        statusName: statusMap[a.status] || a.status,
        location: a.location,
      }));

      // 统计数据
      statsData = {
        server: memoryAssets.filter(a => a.type === 'server').length,
        network: memoryAssets.filter(a => a.type === 'network').length,
        storage: memoryAssets.filter(a => a.type === 'storage').length,
        application: memoryAssets.filter(a => a.type === 'application').length,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        assets: assetsData,
        stats: statsData,
      },
      fallback: useFallback,
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({
      success: false,
      error: '获取资产数据失败',
    }, { status: 500 });
  }
}

// POST: 新增资产
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, model, ip, customerId, projectId, status, location, specifications, description } = body;

    // 验证必填字段
    if (!name || !type) {
      return NextResponse.json({
        success: false,
        error: '资产名称和类型为必填项',
      }, { status: 400 });
    }

    try {
      // 尝试插入数据库
      const [newAsset] = await db
        .insert(assets)
        .values({
          name,
          type,
          model: model || null,
          ip: ip || null,
          customerId: customerId || null,
          projectId: projectId || null,
          status: status || 'normal',
          location: location || null,
          specifications: specifications || null,
          description: description || null,
        })
        .returning();

      // 生成资产编号
      const assetCode = `AST${String(newAsset.id).padStart(3, '0')}`;
      
      // 更新资产编号
      await db
        .update(assets)
        .set({ assetCode })
        .where(eq(assets.id, newAsset.id));

      return NextResponse.json({
        success: true,
        data: {
          id: assetCode,
          name: newAsset.name,
          type: newAsset.type,
          typeName: typeNames[newAsset.type || ''] || newAsset.type,
          model: newAsset.model,
          ip: newAsset.ip,
          customer: customerId ? customerNames[customerId] || null : null,
          project: projectId ? projectNames[projectId] || null : null,
          status: newAsset.status,
          statusName: statusMap[newAsset.status || ''] || newAsset.status,
          location: newAsset.location,
        },
        message: '资产创建成功',
      });
    } catch {
      // 内存回退
      console.log('Database not available, using memory storage for new asset');
      
      // 生成资产编号
      const newId = memoryAssets.length + 1;
      const assetCode = `AST${String(newId).padStart(3, '0')}`;
      
      const newAsset = {
        id: newId,
        assetCode,
        name,
        type,
        model: model || null,
        ip: ip || null,
        customerId: customerId || null,
        projectId: projectId || null,
        status: status || 'normal',
        location: location || null,
        specifications: specifications || null,
        description: description || null,
        createdAt: new Date(),
      };
      
      memoryAssets.push(newAsset);

      return NextResponse.json({
        success: true,
        data: {
          id: assetCode,
          name: newAsset.name,
          type: newAsset.type,
          typeName: typeNames[newAsset.type] || newAsset.type,
          model: newAsset.model,
          ip: newAsset.ip,
          customer: customerId ? customerNames[customerId] || null : null,
          project: projectId ? projectNames[projectId] || null : null,
          status: newAsset.status,
          statusName: statusMap[newAsset.status] || newAsset.status,
          location: newAsset.location,
        },
        message: '资产创建成功',
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({
      success: false,
      error: '创建资产失败',
    }, { status: 500 });
  }
}
