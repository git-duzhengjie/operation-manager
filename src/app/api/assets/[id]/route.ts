import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 内存数据回退（与 route.ts 共享）
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

// 格式化资产数据
function formatAsset(asset: typeof memoryAssets[0]) {
  return {
    id: asset.assetCode,
    name: asset.name,
    type: asset.type,
    typeName: typeNames[asset.type] || asset.type,
    model: asset.model,
    ip: asset.ip,
    customerId: asset.customerId,
    customer: asset.customerId ? customerNames[asset.customerId] || null : null,
    projectId: asset.projectId,
    project: asset.projectId ? projectNames[asset.projectId] || null : null,
    status: asset.status,
    statusName: statusMap[asset.status] || asset.status,
    location: asset.location,
    specifications: asset.specifications,
    description: asset.description,
    createdAt: asset.createdAt,
  };
}

// GET: 获取单个资产详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    try {
      // 尝试从数据库获取
      const asset = await db
        .select()
        .from(assets)
        .where(eq(assets.assetCode, id))
        .limit(1);

      if (asset.length === 0) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      const a = asset[0];
      return NextResponse.json({
        success: true,
        data: {
          id: a.assetCode,
          name: a.name,
          type: a.type,
          typeName: typeNames[a.type || ''] || a.type,
          model: a.model,
          ip: a.ip,
          customerId: a.customerId,
          customer: a.customerId ? customerNames[a.customerId] || null : null,
          projectId: a.projectId,
          project: a.projectId ? projectNames[a.projectId] || null : null,
          status: a.status,
          statusName: statusMap[a.status || ''] || a.status,
          location: a.location,
          specifications: a.specifications,
          description: a.description,
          createdAt: a.createdAt,
        },
      });
    } catch {
      // 内存回退
      const asset = memoryAssets.find(a => a.assetCode === id);
      
      if (!asset) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: formatAsset(asset),
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json({
      success: false,
      error: '获取资产详情失败',
    }, { status: 500 });
  }
}

// PUT: 更新资产
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
      // 尝试更新数据库
      const [updatedAsset] = await db
        .update(assets)
        .set({
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
          updatedAt: new Date(),
        })
        .where(eq(assets.assetCode, id))
        .returning();

      if (!updatedAsset) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: updatedAsset.assetCode,
          name: updatedAsset.name,
          type: updatedAsset.type,
          typeName: typeNames[updatedAsset.type || ''] || updatedAsset.type,
          model: updatedAsset.model,
          ip: updatedAsset.ip,
          customerId: updatedAsset.customerId,
          customer: updatedAsset.customerId ? customerNames[updatedAsset.customerId] || null : null,
          projectId: updatedAsset.projectId,
          project: updatedAsset.projectId ? projectNames[updatedAsset.projectId] || null : null,
          status: updatedAsset.status,
          statusName: statusMap[updatedAsset.status || ''] || updatedAsset.status,
          location: updatedAsset.location,
        },
        message: '资产更新成功',
      });
    } catch {
      // 内存回退
      const assetIndex = memoryAssets.findIndex(a => a.assetCode === id);
      
      if (assetIndex === -1) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      // 更新内存数据
      memoryAssets[assetIndex] = {
        ...memoryAssets[assetIndex],
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
      };

      return NextResponse.json({
        success: true,
        data: formatAsset(memoryAssets[assetIndex]),
        message: '资产更新成功',
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({
      success: false,
      error: '更新资产失败',
    }, { status: 500 });
  }
}

// DELETE: 删除资产
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    try {
      // 尝试从数据库删除
      const [deletedAsset] = await db
        .delete(assets)
        .where(eq(assets.assetCode, id))
        .returning();

      if (!deletedAsset) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: '资产删除成功',
      });
    } catch {
      // 内存回退
      const assetIndex = memoryAssets.findIndex(a => a.assetCode === id);
      
      if (assetIndex === -1) {
        return NextResponse.json({
          success: false,
          error: '资产不存在',
        }, { status: 404 });
      }

      // 从内存中删除
      memoryAssets.splice(assetIndex, 1);

      return NextResponse.json({
        success: true,
        message: '资产删除成功',
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json({
      success: false,
      error: '删除资产失败',
    }, { status: 500 });
  }
}
