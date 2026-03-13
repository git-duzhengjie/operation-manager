import { Pool } from 'pg';
import { execSync } from 'child_process';

let envLoaded = false;
let pool: Pool | null = null;
let useMemoryStore = false;
let connectionTested = false;

// ==========================================
// 内存存储
// ==========================================
const memoryStore: Map<string, Map<string, Record<string, unknown>>> = new Map();
let idCounter = 1;

function getTableStore(table: string): Map<string, Record<string, unknown>> {
  if (!memoryStore.has(table)) {
    memoryStore.set(table, new Map());
  }
  return memoryStore.get(table)!;
}

function generateId(): number {
  return idCounter++;
}

// 加载环境变量
function loadEnv(): void {
  if (envLoaded || process.env.DATABASE_URL) {
    return;
  }

  try {
    try {
      require('dotenv').config();
      if (process.env.DATABASE_URL) {
        envLoaded = true;
        return;
      }
    } catch {
      // dotenv not available
    }

    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

// 测试数据库连接
async function testConnection(): Promise<boolean> {
  if (connectionTested) {
    return !useMemoryStore;
  }

  loadEnv();
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[DB] No DATABASE_URL found, using memory store');
    useMemoryStore = true;
    connectionTested = true;
    // 初始化默认数据
    initializeDefaultData();
    return false;
  }

  try {
    if (!pool) {
      pool = new Pool({
        connectionString: databaseUrl,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });
    }

    // 测试连接
    const client = await pool.connect();
    await client.query('SELECT 1');
    
    // 检查必要的表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'knowledge_articles'
      );
    `);
    
    client.release();
    
    if (!tableCheck.rows[0]?.exists) {
      console.log('[DB] Required tables do not exist, falling back to memory store');
      useMemoryStore = true;
      connectionTested = true;
      
      // 关闭连接池
      try {
        await pool.end();
      } catch {
        // Ignore
      }
      pool = null;
      
      // 初始化默认数据
      initializeDefaultData();
      return false;
    }
    
    console.log('[DB] Database connection successful');
    connectionTested = true;
    return true;
  } catch (error) {
    console.log('[DB] Database connection failed, falling back to memory store:', error instanceof Error ? error.message : String(error));
    useMemoryStore = true;
    connectionTested = true;
    
    // 关闭连接池
    if (pool) {
      try {
        await pool.end();
      } catch {
        // Ignore
      }
      pool = null;
    }
    
    // 初始化默认数据
    initializeDefaultData();
    return false;
  }
}

// 初始化默认数据（内存存储模式）
function initializeDefaultData(): void {
  // 检查是否已经有数据，避免重复初始化
  const existingArticles = memoryStore.get('knowledge_articles');
  if (existingArticles && existingArticles.size > 0) {
    console.log('[DB] Memory store already has data, skipping initialization');
    return;
  }
  
  const now = new Date().toISOString();
  
  // 初始化默认管理员用户
  // 密码: admin123 (实际项目中应使用 bcrypt 加密)
  const defaultUsers = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      real_name: '系统管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      role: 'admin',
      department: '信息技术部',
      position: '系统管理员',
      avatar: null,
      two_factor_enabled: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      username: 'zhangsan',
      password: '123456',
      real_name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138001',
      role: 'internal',
      department: '运维部',
      position: '运维工程师',
      avatar: null,
      two_factor_enabled: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 3,
      username: 'lisi',
      password: '123456',
      real_name: '李四',
      email: 'lisi@example.com',
      phone: '13800138002',
      role: 'internal',
      department: '运维部',
      position: '运维工程师',
      avatar: null,
      two_factor_enabled: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];
  
  const usersStore = getTableStore('users');
  defaultUsers.forEach(user => {
    usersStore.set(String(user.id), user as unknown as Record<string, unknown>);
  });
  idCounter = 4;
  
  // 初始化默认角色
  const defaultRoles = [
    { id: 1, name: '管理员', code: 'admin', description: '系统管理员，拥有所有权限', is_system: true, created_at: now },
    { id: 2, name: '内部人员', code: 'internal', description: '内部工作人员，拥有常规操作权限', is_system: true, created_at: now },
    { id: 3, name: '外部人员', code: 'external', description: '外部用户，拥有基本查看权限', is_system: true, created_at: now },
  ];
  
  const rolesStore = getTableStore('roles');
  defaultRoles.forEach(role => {
    rolesStore.set(String(role.id), role as unknown as Record<string, unknown>);
  });
  
  // 初始化默认权限
  const defaultPermissions = [
    { id: 1, name: '查看工单', code: 'ticket_view', category: '工单管理' },
    { id: 2, name: '创建工单', code: 'ticket_create', category: '工单管理' },
    { id: 3, name: '编辑工单', code: 'ticket_edit', category: '工单管理' },
    { id: 4, name: '删除工单', code: 'ticket_delete', category: '工单管理' },
    { id: 5, name: '处理工单', code: 'ticket_process', category: '工单管理' },
    { id: 6, name: '查看资产', code: 'asset_view', category: '资产管理' },
    { id: 7, name: '创建资产', code: 'asset_create', category: '资产管理' },
    { id: 8, name: '编辑资产', code: 'asset_edit', category: '资产管理' },
    { id: 9, name: '删除资产', code: 'asset_delete', category: '资产管理' },
    { id: 10, name: '查看知识库', code: 'knowledge_view', category: '知识库管理' },
    { id: 11, name: '创建文章', code: 'knowledge_create', category: '知识库管理' },
    { id: 12, name: '编辑文章', code: 'knowledge_edit', category: '知识库管理' },
    { id: 13, name: '删除文章', code: 'knowledge_delete', category: '知识库管理' },
    { id: 14, name: '查看监控', code: 'monitor_view', category: '监控管理' },
    { id: 15, name: '配置监控', code: 'monitor_config', category: '监控管理' },
    { id: 16, name: '处理告警', code: 'alert_handle', category: '监控管理' },
    { id: 17, name: '查看用户', code: 'user_view', category: '用户管理' },
    { id: 18, name: '创建用户', code: 'user_create', category: '用户管理' },
    { id: 19, name: '编辑用户', code: 'user_edit', category: '用户管理' },
    { id: 20, name: '删除用户', code: 'user_delete', category: '用户管理' },
    { id: 21, name: '系统配置', code: 'system_config', category: '系统管理' },
    { id: 22, name: '查看日志', code: 'log_view', category: '系统管理' },
    { id: 23, name: '查看角色', code: 'role_view', category: '角色管理' },
    { id: 24, name: '编辑角色', code: 'role_edit', category: '角色管理' },
  ];
  
  const permissionsStore = getTableStore('permissions');
  defaultPermissions.forEach(perm => {
    permissionsStore.set(String(perm.id), perm as unknown as Record<string, unknown>);
  });
  
  // 初始化角色权限关联（管理员拥有所有权限）
  const rolePermsStore = getTableStore('role_permissions');
  defaultPermissions.forEach((perm, index) => {
    rolePermsStore.set(String(index + 1), {
      id: index + 1,
      role_id: 1,
      permission_id: perm.id,
      created_at: now,
    } as unknown as Record<string, unknown>);
  });
  
  // 初始化默认通知
  const defaultNotifications = [
    { id: 1, title: '工单已分配', message: '工单 WO20240101001 已分配给您处理，请及时查看并处理。该工单为服务器磁盘空间不足告警，优先级为高。', type: 'info', category: 'workorder', is_read: false, related_id: 'WO20240101001', created_at: now },
    { id: 2, title: '告警通知', message: '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。', type: 'warning', category: 'alert', is_read: false, related_id: 'AST001', created_at: now },
    { id: 3, title: '工单已完成', message: '工单 WO20240101003 已被标记为已完成，感谢您的处理。', type: 'success', category: 'workorder', is_read: true, related_id: 'WO20240101003', created_at: now },
    { id: 4, title: '系统升级通知', message: '系统将于今晚22:00进行升级维护，预计维护时长1小时，届时系统将暂停服务。', type: 'info', category: 'system', is_read: true, related_id: null, created_at: now },
    { id: 5, title: '知识库更新', message: '有3篇新文章被添加到知识库：《服务器安全加固指南》、《常见网络问题解决方案》、《系统监控配置手册》。', type: 'success', category: 'knowledge', is_read: true, related_id: null, created_at: now },
    { id: 6, title: '资产到期提醒', message: '资产 AST001（应用服务器-01）的维保合同将于7天后到期，请及时续保。', type: 'warning', category: 'asset', is_read: false, related_id: 'AST001', created_at: now },
    { id: 7, title: '巡检任务完成', message: '本周例行巡检任务已完成，共检查设备45台，发现异常3项，已生成巡检报告。', type: 'success', category: 'routine', is_read: true, related_id: null, created_at: now },
    { id: 8, title: '新工单待审批', message: '您有2个变更申请等待审批，请及时处理。', type: 'info', category: 'workorder', is_read: true, related_id: null, created_at: now },
    { id: 9, title: '告警已恢复', message: '服务器 AST002 内存使用率已恢复正常，当前使用率为75%。', type: 'success', category: 'alert', is_read: false, related_id: 'AST002', created_at: now },
    { id: 10, title: '资产入库通知', message: '新资产「数据库服务器-03」已入库，资产编号：AST-2024-0056，请及时进行资产登记。', type: 'info', category: 'asset', is_read: false, related_id: 'AST-2024-0056', created_at: now },
    { id: 11, title: '工单超时提醒', message: '工单 WO20240101005 已超过处理时限，请尽快处理或申请延期。', type: 'warning', category: 'workorder', is_read: false, related_id: 'WO20240101005', created_at: now },
    { id: 12, title: '密码即将过期', message: '您的账户密码将于3天后过期，请及时修改密码。', type: 'warning', category: 'system', is_read: true, related_id: null, created_at: now },
    { id: 13, title: '月度报告已生成', message: '2024年1月运维月度报告已生成，请前往「例行工作」模块查看。', type: 'info', category: 'routine', is_read: true, related_id: null, created_at: now },
    { id: 14, title: '知识库审批通过', message: '您提交的文章《Nginx性能优化实践》已审核通过并发布。', type: 'success', category: 'knowledge', is_read: true, related_id: null, created_at: now },
    { id: 15, title: '服务目录更新', message: '服务目录「基础运维服务」已更新，新增了2个服务项目，请查看。', type: 'info', category: 'system', is_read: false, related_id: null, created_at: now },
  ];
  
  const notificationsStore = getTableStore('notifications');
  defaultNotifications.forEach(notif => {
    notificationsStore.set(String(notif.id), notif as unknown as Record<string, unknown>);
  });
  
  // 初始化默认客户
  const defaultCustomers = [
    { id: 1, name: '市财政局', code: 'FIN', contact: '李主任', phone: '138****1234', email: 'finance@gov.cn', address: '市政府大楼A座5楼', status: 'active', created_at: now, updated_at: now },
    { id: 2, name: '市人社局', code: 'HR', contact: '王科长', phone: '139****5678', email: 'hr@gov.cn', address: '市政府大楼B座3楼', status: 'active', created_at: now, updated_at: now },
    { id: 3, name: '市卫健委', code: 'HEALTH', contact: '张主任', phone: '137****9012', email: 'health@gov.cn', address: '市政府大楼C座8楼', status: 'active', created_at: now, updated_at: now },
    { id: 4, name: '市教育局', code: 'EDU', contact: '赵处长', phone: '136****3456', email: 'edu@gov.cn', address: '市政府大楼A座2楼', status: 'active', created_at: now, updated_at: now },
    { id: 5, name: '市住建局', code: 'HOUSING', contact: '刘主任', phone: '135****7890', email: 'housing@gov.cn', address: '市政府大楼D座6楼', status: 'active', created_at: now, updated_at: now },
  ];
  
  const customersStore = getTableStore('customers');
  defaultCustomers.forEach(customer => {
    customersStore.set(String(customer.id), customer as unknown as Record<string, unknown>);
  });
  
  // 初始化默认项目
  const defaultProjects = [
    { id: 1, name: '预算管理系统', code: 'BMS', customer_id: 1, manager: '张工', status: 'active', description: '财政局预算编制与执行管理系统', created_at: now, updated_at: now },
    { id: 2, name: '人事管理系统', code: 'HRS', customer_id: 2, manager: '李工', status: 'active', description: '人社局人事档案管理系统', created_at: now, updated_at: now },
    { id: 3, name: '医院信息系统', code: 'HIS', customer_id: 3, manager: '王工', status: 'active', description: '卫健委医院信息管理系统', created_at: now, updated_at: now },
    { id: 4, name: '学籍管理系统', code: 'SMS', customer_id: 4, manager: '赵工', status: 'active', description: '教育学籍信息管理系统', created_at: now, updated_at: now },
    { id: 5, name: '房产管理系统', code: 'RMS', customer_id: 5, manager: '刘工', status: 'active', description: '住建局房产信息管理系统', created_at: now, updated_at: now },
  ];
  
  const projectsStore = getTableStore('projects');
  defaultProjects.forEach(project => {
    projectsStore.set(String(project.id), project as unknown as Record<string, unknown>);
  });
  
  // 初始化默认例行任务
  const defaultScheduledTasks = [
    { id: 1, name: '每日系统巡检', description: '每日自动执行系统巡检，检查服务器状态、资源使用情况等', cron_expression: '0 8 * * *', task_type: 'inspection', task_config: { checkItems: ['cpu', 'memory', 'disk', 'network'] }, status: 'active', last_run_at: new Date(Date.now() - 86400000).toISOString(), next_run_at: new Date(Date.now() + 86400000).toISOString(), created_by: 1, created_at: now, updated_at: now },
    { id: 2, name: '每周数据库备份检查', description: '每周自动检查数据库备份是否正常完成', cron_expression: '0 2 * * 0', task_type: 'backup', task_config: { target: 'database', retentionDays: 30 }, status: 'active', last_run_at: new Date(Date.now() - 604800000).toISOString(), next_run_at: new Date(Date.now() + 604800000).toISOString(), created_by: 1, created_at: now, updated_at: now },
    { id: 3, name: '每月安全漏洞扫描', description: '每月执行安全漏洞扫描，检测系统安全隐患', cron_expression: '0 3 1 * *', task_type: 'security', task_config: { scanType: 'full', report: true }, status: 'active', last_run_at: new Date(Date.now() - 2592000000).toISOString(), next_run_at: new Date(Date.now() + 2592000000).toISOString(), created_by: 1, created_at: now, updated_at: now },
    { id: 4, name: '每周日志归档', description: '每周归档历史日志，释放存储空间', cron_expression: '0 4 * * 0', task_type: 'archive', task_config: { logTypes: ['system', 'application', 'audit'], compress: true }, status: 'paused', last_run_at: new Date(Date.now() - 604800000).toISOString(), next_run_at: new Date(Date.now() + 604800000).toISOString(), created_by: 1, created_at: now, updated_at: now },
    { id: 5, name: '每日告警统计报告', description: '每日生成告警统计报告并发送邮件', cron_expression: '0 9 * * *', task_type: 'report', task_config: { type: 'alert_summary', recipients: ['admin@example.com'] }, status: 'active', last_run_at: new Date(Date.now() - 86400000).toISOString(), next_run_at: new Date(Date.now() + 86400000).toISOString(), created_by: 1, created_at: now, updated_at: now },
    { id: 6, name: '每周资产盘点检查', description: '每周检查资产状态，更新资产信息', cron_expression: '0 5 * * 1', task_type: 'asset', task_config: { checkExpired: true, updateStatus: true }, status: 'active', last_run_at: new Date(Date.now() - 604800000).toISOString(), next_run_at: new Date(Date.now() + 604800000).toISOString(), created_by: 1, created_at: now, updated_at: now },
  ];
  
  const scheduledTasksStore = getTableStore('scheduled_tasks');
  defaultScheduledTasks.forEach(task => {
    scheduledTasksStore.set(String(task.id), task as unknown as Record<string, unknown>);
  });
  
  // 初始化默认资产
  const defaultAssets = [
    { id: 1, asset_code: 'AST-001', name: '应用服务器-01', type: 'server', brand: 'Dell', model: 'PowerEdge R740', serial_number: 'SN001', ip: '192.168.1.10', location: '机房A-机柜01-U1-U10', customer_id: 1, project_id: 1, status: 'normal', description: '财政局预算管理系统应用服务器', purchase_date: '2022-03-15', warranty_end_date: '2025-03-14', specifications: { cpu: 'Intel Xeon Gold 6248R', memory: '128GB', disk: '2TB SSD RAID' }, created_at: now, updated_at: now },
    { id: 2, asset_code: 'AST-002', name: '数据库服务器-01', type: 'server', brand: 'Dell', model: 'PowerEdge R750', serial_number: 'SN002', ip: '192.168.1.11', location: '机房A-机柜01-U11-U20', customer_id: 1, project_id: 1, status: 'normal', description: '财政局预算管理系统数据库服务器', purchase_date: '2022-03-15', warranty_end_date: '2025-03-14', specifications: { cpu: 'Intel Xeon Platinum 8380', memory: '256GB', disk: '4TB SSD RAID 10' }, created_at: now, updated_at: now },
    { id: 3, asset_code: 'AST-003', name: '核心交换机-01', type: 'network', brand: 'Huawei', model: 'CloudEngine S7706', serial_number: 'SN003', ip: '192.168.1.1', location: '机房A-网络机柜', customer_id: 1, project_id: null, status: 'normal', description: '核心网络交换机', purchase_date: '2021-06-20', warranty_end_date: '2024-06-19', specifications: { ports: '48x10GE+6x40GE', throughput: '1.44Tbps' }, created_at: now, updated_at: now },
    { id: 4, asset_code: 'AST-004', name: '应用服务器-02', type: 'server', brand: 'Lenovo', model: 'ThinkSystem SR650', serial_number: 'SN004', ip: '192.168.1.20', location: '机房B-机柜02-U1-U10', customer_id: 2, project_id: 2, status: 'warning', description: '人社局人事管理系统应用服务器', purchase_date: '2023-01-10', warranty_end_date: '2026-01-09', specifications: { cpu: 'Intel Xeon Silver 4314', memory: '64GB', disk: '1TB SSD' }, created_at: now, updated_at: now },
    { id: 5, asset_code: 'AST-005', name: '存储设备-01', type: 'storage', brand: 'NetApp', model: 'AFF A250', serial_number: 'SN005', ip: '192.168.1.30', location: '机房A-存储机柜', customer_id: 3, project_id: 3, status: 'normal', description: '卫健委医院信息系统存储', purchase_date: '2022-08-01', warranty_end_date: '2025-07-31', specifications: { capacity: '100TB', type: 'All-Flash Array' }, created_at: now, updated_at: now },
    { id: 6, asset_code: 'AST-006', name: '防火墙-01', type: 'security', brand: 'Fortinet', model: 'FortiGate 600F', serial_number: 'SN006', ip: '192.168.1.254', location: '机房A-网络机柜', customer_id: null, project_id: null, status: 'normal', description: '核心边界防火墙', purchase_date: '2022-04-01', warranty_end_date: '2025-03-31', specifications: { throughput: '36Gbps', interfaces: '10x10GE SFP+' }, created_at: now, updated_at: now },
    { id: 7, asset_code: 'AST-007', name: '应用服务器-03', type: 'server', brand: 'HP', model: 'ProLiant DL380 Gen10', serial_number: 'SN007', ip: '192.168.1.40', location: '机房C-机柜01-U1-U10', customer_id: 4, project_id: 4, status: 'normal', description: '教育学籍管理系统应用服务器', purchase_date: '2023-05-15', warranty_end_date: '2026-05-14', specifications: { cpu: 'Intel Xeon Gold 6330', memory: '128GB', disk: '1.6TB NVMe' }, created_at: now, updated_at: now },
    { id: 8, asset_code: 'AST-008', name: '备份服务器-01', type: 'server', brand: 'Dell', model: 'PowerEdge R650xs', serial_number: 'SN008', ip: '192.168.1.50', location: '机房A-机柜02-U1-U10', customer_id: null, project_id: null, status: 'normal', description: '集中备份服务器', purchase_date: '2023-07-01', warranty_end_date: '2026-06-30', specifications: { cpu: 'Intel Xeon Silver 4410Y', memory: '64GB', disk: '48TB RAID 6' }, created_at: now, updated_at: now },
  ];
  
  const assetsStore = getTableStore('assets');
  defaultAssets.forEach(asset => {
    assetsStore.set(String(asset.id), asset as unknown as Record<string, unknown>);
  });
  
  // 初始化默认工单
  const defaultTickets = [
    { id: 1, ticket_no: 'WO20240101001', title: '服务器磁盘空间不足告警', type: 'incident', status: 'processing', priority: 'high', customer_id: 1, customer_name: '市财政局', project_id: 1, project_name: '预算管理系统', asset_id: 1, reporter_id: 2, assignee_id: 2, assignee_name: '张工', description: '应用服务器-01磁盘空间使用率达到90%，需要及时处理', resolution: null, due_date: new Date(Date.now() + 86400000).toISOString(), resolved_at: null, closed_at: null, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: now },
    { id: 2, ticket_no: 'WO20240101002', title: '数据库备份失败', type: 'incident', status: 'pending', priority: 'critical', customer_id: 1, customer_name: '市财政局', project_id: 1, project_name: '预算管理系统', asset_id: 2, reporter_id: 3, assignee_id: null, assignee_name: null, description: '数据库服务器-01每日备份任务失败，错误代码：E001', resolution: null, due_date: new Date(Date.now() + 43200000).toISOString(), resolved_at: null, closed_at: null, created_at: now, updated_at: now },
    { id: 3, ticket_no: 'WO20240101003', title: '网络设备配置变更申请', type: 'change', status: 'resolved', priority: 'medium', customer_id: 1, customer_name: '市财政局', project_id: null, project_name: null, asset_id: 3, reporter_id: 2, assignee_id: 2, assignee_name: '张工', description: '核心交换机需要新增VLAN配置', resolution: '已完成VLAN配置，测试通过', due_date: new Date(Date.now() - 172800000).toISOString(), resolved_at: new Date(Date.now() - 86400000).toISOString(), closed_at: now, created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: now },
    { id: 4, ticket_no: 'WO20240101004', title: '人事系统登录缓慢', type: 'incident', status: 'processing', priority: 'medium', customer_id: 2, customer_name: '市人社局', project_id: 2, project_name: '人事管理系统', asset_id: 4, reporter_id: 4, assignee_id: 2, assignee_name: '张工', description: '用户反馈人事管理系统登录响应时间超过10秒', resolution: null, due_date: new Date(Date.now() + 172800000).toISOString(), resolved_at: null, closed_at: null, created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: now },
    { id: 5, ticket_no: 'WO20240101005', title: '新系统上线支持申请', type: 'request', status: 'pending', priority: 'low', customer_id: 5, customer_name: '市住建局', project_id: 5, project_name: '房产管理系统', asset_id: null, reporter_id: 5, assignee_id: null, assignee_name: null, description: '房产管理系统即将上线，需要运维支持', resolution: null, due_date: new Date(Date.now() + 604800000).toISOString(), resolved_at: null, closed_at: null, created_at: now, updated_at: now },
  ];
  
  const ticketsStore = getTableStore('tickets');
  defaultTickets.forEach(ticket => {
    ticketsStore.set(String(ticket.id), ticket as unknown as Record<string, unknown>);
  });
  
  // 初始化默认知识库文章
  const defaultArticles = [
    { id: 1, title: '服务器安全加固指南', content: '# 服务器安全加固指南\n\n## 1. 操作系统安全\n\n### 1.1 账户安全\n- 禁用不必要的默认账户\n- 设置强密码策略\n- 配置账户锁定策略\n\n### 1.2 服务安全\n- 关闭不必要的服务\n- 配置防火墙规则\n- 定期更新补丁\n\n## 2. 网络安全\n\n### 2.1 防火墙配置\n- 只开放必要端口\n- 配置访问控制列表\n- 启用日志审计\n\n### 2.2 入侵检测\n- 部署IDS系统\n- 配置告警规则\n- 定期检查日志', type: 'article', category: '安全管理', tags: ['安全', '服务器', '加固'], author_id: 1, status: 'published', view_count: 156, is_public: true, published_at: new Date(Date.now() - 2592000000).toISOString(), created_at: new Date(Date.now() - 2592000000).toISOString(), updated_at: now },
    { id: 2, title: '常见网络问题解决方案', content: '# 常见网络问题解决方案\n\n## 1. 网络连接问题\n\n### 1.1 无法访问网络\n1. 检查网线连接\n2. 检查IP配置\n3. 检查DNS设置\n4. 检查防火墙规则\n\n### 1.2 网络速度慢\n1. 检查带宽使用\n2. 检查网络设备负载\n3. 排查广播风暴\n4. 检查链路质量\n\n## 2. DNS问题\n\n### 2.1 DNS解析失败\n1. 检查DNS服务器状态\n2. 清除DNS缓存\n3. 检查DNS配置', type: 'article', category: '网络管理', tags: ['网络', '故障排查'], author_id: 2, status: 'published', view_count: 234, is_public: true, published_at: new Date(Date.now() - 1728000000).toISOString(), created_at: new Date(Date.now() - 1728000000).toISOString(), updated_at: now },
    { id: 3, title: '系统监控配置手册', content: '# 系统监控配置手册\n\n## 1. CPU监控\n\n### 1.1 监控指标\n- CPU使用率\n- CPU负载\n- CPU上下文切换\n\n### 1.2 告警阈值\n- 警告：70%\n- 严重：85%\n- 紧急：95%\n\n## 2. 内存监控\n\n### 2.1 监控指标\n- 内存使用率\n- 交换分区使用\n- 缓存使用\n\n## 3. 磁盘监控\n\n### 3.1 监控指标\n- 磁盘使用率\n- 磁盘IO\n- 磁盘队列', type: 'article', category: '监控管理', tags: ['监控', '配置'], author_id: 1, status: 'published', view_count: 189, is_public: true, published_at: new Date(Date.now() - 1296000000).toISOString(), created_at: new Date(Date.now() - 1296000000).toISOString(), updated_at: now },
    { id: 4, title: '数据库备份恢复操作指南', content: '# 数据库备份恢复操作指南\n\n## 1. 备份策略\n\n### 1.1 全量备份\n- 每周日凌晨2点执行\n- 保留周期：30天\n\n### 1.2 增量备份\n- 每日凌晨2点执行\n- 保留周期：7天\n\n## 2. 恢复操作\n\n### 2.1 全量恢复\n```bash\npg_restore -d dbname backup_file\n```\n\n### 2.2 时间点恢复\n需要配合WAL日志进行恢复', type: 'article', category: '数据库管理', tags: ['数据库', '备份', '恢复'], author_id: 2, status: 'published', view_count: 98, is_public: true, published_at: new Date(Date.now() - 864000000).toISOString(), created_at: new Date(Date.now() - 864000000).toISOString(), updated_at: now },
    { id: 5, title: 'Nginx性能优化实践', content: '# Nginx性能优化实践\n\n## 1. 基础优化\n\n### 1.1 worker进程配置\n```nginx\nworker_processes auto;\nworker_connections 4096;\n```\n\n### 1.2 连接优化\n```nginx\nkeepalive_timeout 65;\nkeepalive_requests 100;\n```\n\n## 2. 缓存配置\n\n### 2.1 静态文件缓存\n```nginx\nlocation ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {\n    expires 30d;\n    add_header Cache-Control "public, immutable";\n}\n```\n\n## 3. 负载均衡\n\n### 3.1 upstream配置\n```nginx\nupstream backend {\n    least_conn;\n    server 192.168.1.10:8080;\n    server 192.168.1.11:8080;\n}\n```', type: 'article', category: '中间件管理', tags: ['Nginx', '性能优化'], author_id: 1, status: 'draft', view_count: 0, is_public: false, published_at: null, created_at: now, updated_at: now },
  ];
  
  const articlesStore = getTableStore('knowledge_articles');
  defaultArticles.forEach(article => {
    articlesStore.set(String(article.id), article as unknown as Record<string, unknown>);
  });
  
  // 初始化默认服务目录
  const defaultServiceCatalogs = [
    { id: 1, name: '基础运维服务', description: '提供基础设施运维支持服务', icon: 'Server', sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 2, name: '应用运维服务', description: '提供应用系统运维支持服务', icon: 'AppWindow', sort_order: 2, is_active: true, created_at: now, updated_at: now },
    { id: 3, name: '安全运维服务', description: '提供安全运维支持服务', icon: 'Shield', sort_order: 3, is_active: true, created_at: now, updated_at: now },
    { id: 4, name: '数据运维服务', description: '提供数据库及存储运维支持服务', icon: 'Database', sort_order: 4, is_active: true, created_at: now, updated_at: now },
  ];
  
  const catalogsStore = getTableStore('service_catalogs');
  defaultServiceCatalogs.forEach(catalog => {
    catalogsStore.set(String(catalog.id), catalog as unknown as Record<string, unknown>);
  });
  
  // 初始化默认服务项目
  const defaultServiceItems = [
    { id: 1, catalog_id: 1, name: '服务器故障处理', description: '处理服务器硬件及系统故障', workflow_id: 1, form_template_id: 1, sla_time: 4, sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 2, catalog_id: 1, name: '网络故障处理', description: '处理网络设备及连接故障', workflow_id: 1, form_template_id: 1, sla_time: 2, sort_order: 2, is_active: true, created_at: now, updated_at: now },
    { id: 3, catalog_id: 2, name: '应用问题处理', description: '处理应用系统运行问题', workflow_id: 1, form_template_id: 2, sla_time: 8, sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 4, catalog_id: 2, name: '系统变更申请', description: '应用系统配置变更申请', workflow_id: 2, form_template_id: 3, sla_time: 24, sort_order: 2, is_active: true, created_at: now, updated_at: now },
    { id: 5, catalog_id: 3, name: '安全事件处理', description: '处理安全告警和安全事件', workflow_id: 3, form_template_id: 1, sla_time: 1, sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 6, catalog_id: 4, name: '数据库问题处理', description: '处理数据库运行问题', workflow_id: 1, form_template_id: 1, sla_time: 4, sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 7, catalog_id: 4, name: '数据恢复申请', description: '申请数据备份恢复服务', workflow_id: 4, form_template_id: 4, sla_time: 8, sort_order: 2, is_active: true, created_at: now, updated_at: now },
  ];
  
  const serviceItemsStore = getTableStore('service_items');
  defaultServiceItems.forEach(item => {
    serviceItemsStore.set(String(item.id), item as unknown as Record<string, unknown>);
  });
  
  // 初始化默认工作流
  const defaultWorkflows = [
    { id: 1, name: '故障处理流程', type: 'incident', catalog_id: 1, catalog_name: '基础运维服务', description: '标准故障处理流程', steps: [{ name: '提交', 'assignee': 'reporter' }, { name: '分派', 'assignee': 'dispatcher' }, { name: '处理', 'assignee': 'handler' }, { name: '确认', 'assignee': 'reporter' }, { name: '关闭', 'assignee': 'handler' }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 2, name: '变更审批流程', type: 'change', catalog_id: 2, catalog_name: '应用运维服务', description: '标准变更审批流程', steps: [{ name: '提交', 'assignee': 'reporter' }, { name: '初审', 'assignee': 'reviewer' }, { name: '审批', 'assignee': 'approver' }, { name: '实施', 'assignee': 'handler' }, { name: '验收', 'assignee': 'reporter' }, { name: '关闭', 'assignee': 'handler' }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 3, name: '安全事件处理流程', type: 'security', catalog_id: 3, catalog_name: '安全运维服务', description: '安全事件处理流程', steps: [{ name: '发现', 'assignee': 'system' }, { name: '确认', 'assignee': 'security' }, { name: '处置', 'assignee': 'security' }, { name: '复盘', 'assignee': 'security' }, { name: '关闭', 'assignee': 'security' }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 4, name: '数据恢复流程', type: 'recovery', catalog_id: 4, catalog_name: '数据运维服务', description: '数据恢复申请处理流程', steps: [{ name: '申请', 'assignee': 'reporter' }, { name: '审批', 'assignee': 'approver' }, { name: '执行', 'assignee': 'dba' }, { name: '验证', 'assignee': 'reporter' }, { name: '关闭', 'assignee': 'dba' }], is_active: true, version: 1, created_at: now, updated_at: now },
  ];
  
  const workflowsStore = getTableStore('workflows');
  defaultWorkflows.forEach(workflow => {
    workflowsStore.set(String(workflow.id), workflow as unknown as Record<string, unknown>);
  });
  
  // 初始化默认表单模板
  const defaultFormTemplates = [
    { id: 1, name: '故障报告表单', catalog_id: 1, catalog_name: '基础运维服务', description: '用于报告系统故障的表单', fields: [{ name: 'title', label: '故障标题', type: 'text', required: true }, { name: 'description', label: '故障描述', type: 'textarea', required: true }, { name: 'priority', label: '优先级', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true }, { name: 'asset_id', label: '相关资产', type: 'select', required: false }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 2, name: '应用问题报告表单', catalog_id: 2, catalog_name: '应用运维服务', description: '用于报告应用系统问题的表单', fields: [{ name: 'title', label: '问题标题', type: 'text', required: true }, { name: 'description', label: '问题描述', type: 'textarea', required: true }, { name: 'priority', label: '优先级', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true }, { name: 'impact', label: '影响范围', type: 'select', options: ['个人', '部门', '全局'], required: true }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 3, name: '变更申请表单', catalog_id: 2, catalog_name: '应用运维服务', description: '用于提交变更申请的表单', fields: [{ name: 'title', label: '变更标题', type: 'text', required: true }, { name: 'reason', label: '变更原因', type: 'textarea', required: true }, { name: 'plan', label: '变更方案', type: 'textarea', required: true }, { name: 'risk', label: '风险评估', type: 'textarea', required: true }, { name: 'rollback', label: '回滚方案', type: 'textarea', required: true }], is_active: true, version: 1, created_at: now, updated_at: now },
    { id: 4, name: '数据恢复申请表单', catalog_id: 4, catalog_name: '数据运维服务', description: '用于申请数据恢复的表单', fields: [{ name: 'database', label: '数据库名称', type: 'text', required: true }, { name: 'restore_time', label: '恢复时间点', type: 'datetime', required: true }, { name: 'reason', label: '恢复原因', type: 'textarea', required: true }, { name: 'approval', label: '审批人', type: 'text', required: true }], is_active: true, version: 1, created_at: now, updated_at: now },
  ];
  
  const formTemplatesStore = getTableStore('form_templates');
  defaultFormTemplates.forEach(template => {
    formTemplatesStore.set(String(template.id), template as unknown as Record<string, unknown>);
  });
  
  // 初始化默认告警
  const defaultAlerts = [
    { id: 1, alert_id: 'ALT001', source: 'Zabbix', level: 'warning', title: 'CPU使用率过高', description: '服务器AST001 CPU使用率超过80%，当前值：85%', asset_id: 1, asset_name: '应用服务器-01', customer_id: 1, customer_name: '市财政局', status: 'pending', ticket_id: null, ticket_code: null, raw_data: { cpu_usage: 85, threshold: 80 }, resolved_at: null, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: now },
    { id: 2, alert_id: 'ALT002', source: 'Zabbix', level: 'critical', title: '磁盘空间不足', description: '服务器AST001 磁盘空间不足，剩余空间：5%', asset_id: 1, asset_name: '应用服务器-01', customer_id: 1, customer_name: '市财政局', status: 'processing', ticket_id: 1, ticket_code: 'WO20240101001', raw_data: { disk_usage: 95, free_space: '50GB' }, resolved_at: null, created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: now },
    { id: 3, alert_id: 'ALT003', source: 'Zabbix', level: 'warning', title: '内存使用率过高', description: '服务器AST002 内存使用率超过85%，当前值：90%', asset_id: 4, asset_name: '应用服务器-02', customer_id: 2, customer_name: '市人社局', status: 'pending', ticket_id: null, ticket_code: null, raw_data: { memory_usage: 90, threshold: 85 }, resolved_at: null, created_at: new Date(Date.now() - 1800000).toISOString(), updated_at: now },
    { id: 4, alert_id: 'ALT004', source: 'Zabbix', level: 'info', title: '服务端口异常', description: '检测到异常端口扫描活动', asset_id: 6, asset_name: '防火墙-01', customer_id: null, customer_name: null, status: 'resolved', ticket_id: null, ticket_code: null, raw_data: { source_ip: '192.168.100.50', ports: [22, 3389, 445] }, resolved_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: now },
    { id: 5, alert_id: 'ALT005', source: 'Zabbix', level: 'high', title: '数据库连接数过高', description: '数据库服务器-01 连接数超过阈值，当前：450', asset_id: 2, asset_name: '数据库服务器-01', customer_id: 1, customer_name: '市财政局', status: 'pending', ticket_id: null, ticket_code: null, raw_data: { connections: 450, threshold: 400 }, resolved_at: null, created_at: now, updated_at: now },
  ];
  
  const alertsStore = getTableStore('alerts');
  defaultAlerts.forEach(alert => {
    alertsStore.set(String(alert.id), alert as unknown as Record<string, unknown>);
  });
  
  // 初始化默认审计日志
  const defaultAuditLogs = [
    { id: 1, user_id: 1, action: '用户登录', resource_type: 'auth', resource_id: '1', details: { method: 'password', ip: '192.168.1.100' }, ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, user_id: 1, action: '创建工单', resource_type: 'ticket', resource_id: 'WO20240101001', details: { title: '服务器磁盘空间不足告警' }, ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, user_id: 2, action: '更新工单状态', resource_type: 'ticket', resource_id: 'WO20240101001', details: { from_status: 'pending', to_status: 'processing' }, ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 5400000).toISOString() },
    { id: 4, user_id: 1, action: '创建资产', resource_type: 'asset', resource_id: 'AST-001', details: { name: '应用服务器-01' }, ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 5, user_id: 1, action: '创建用户', resource_type: 'user', resource_id: '2', details: { username: 'zhangsan' }, ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 6, user_id: 1, action: '修改系统配置', resource_type: 'system', resource_id: 'notification', details: { key: 'email_enabled', value: true }, ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120.0', created_at: new Date(Date.now() - 259200000).toISOString() },
  ];
  
  const auditLogsStore = getTableStore('audit_logs');
  defaultAuditLogs.forEach(log => {
    auditLogsStore.set(String(log.id), log as unknown as Record<string, unknown>);
  });
  
  // 初始化默认知识库标签
  const defaultKnowledgeTags = [
    { id: 1, name: '服务器', description: '服务器相关配置与管理', color: 'blue', sort_order: 1, created_at: now, updated_at: now },
    { id: 2, name: '网络', description: '网络设备与网络问题排查', color: 'green', sort_order: 2, created_at: now, updated_at: now },
    { id: 3, name: '数据库', description: '数据库管理与优化', color: 'purple', sort_order: 3, created_at: now, updated_at: now },
    { id: 4, name: '安全', description: '安全加固与安全事件处理', color: 'red', sort_order: 4, created_at: now, updated_at: now },
    { id: 5, name: '备份', description: '数据备份与恢复', color: 'orange', sort_order: 5, created_at: now, updated_at: now },
    { id: 6, name: '监控', description: '系统监控与告警配置', color: 'cyan', sort_order: 6, created_at: now, updated_at: now },
    { id: 7, name: 'Nginx', description: 'Nginx配置与优化', color: 'indigo', sort_order: 7, created_at: now, updated_at: now },
    { id: 8, name: '性能优化', description: '系统与应用性能优化', color: 'pink', sort_order: 8, created_at: now, updated_at: now },
  ];
  
  const knowledgeTagsStore = getTableStore('knowledge_tags');
  defaultKnowledgeTags.forEach(tag => {
    knowledgeTagsStore.set(String(tag.id), tag as unknown as Record<string, unknown>);
  });
  
  // 更新 idCounter 为足够大的值，避免与初始数据冲突
  idCounter = 1000;
  
  console.log('[DB] Default data initialized for memory store');
}

// 获取数据库连接池
function getPool(): Pool | null {
  if (useMemoryStore) {
    return null;
  }
  
  if (!pool) {
    loadEnv();
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return null;
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// 导出检查函数
export function isUsingMemoryStore(): boolean {
  return useMemoryStore;
}

// ==========================================
// 查询结果类型
// ==========================================
interface QueryResultData<T> {
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}

interface SingleQueryResultData<T> {
  data: T | null;
  error: { message: string } | null;
}

// ==========================================
// 查询构建器
// ==========================================
class QueryBuilder<T = Record<string, unknown>> {
  protected table: string;
  protected selectColumns: string[] = ['*'];
  protected whereClauses: string[] = [];
  protected whereParams: unknown[] = [];
  protected orderByClauses: string[] = [];
  protected limitCount?: number;
  protected offsetCount?: number;
  protected countMode = false;
  protected headMode = false;
  protected singleMode = false;

  // 内存存储相关
  protected memoryFilters: Array<(row: Record<string, unknown>) => boolean> = [];
  protected memoryOrderBy: { column: string; ascending: boolean }[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: { count?: 'exact'; head?: boolean }): QueryBuilder<T> {
    this.selectColumns = columns.split(',').map(c => c.trim());
    if (options?.count === 'exact') {
      this.countMode = true;
    }
    if (options?.head) {
      this.headMode = true;
    }
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    // 使用宽松比较，支持数字和字符串 id 的比较
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (rowVal == value) return true;
      return String(rowVal) === String(value);
    });
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    this.memoryFilters.push(row => values.includes(row[column]));
    return this;
  }

  or(conditions: string): QueryBuilder<T> {
    const parts = conditions.split(',').map(c => {
      const [col, op, val] = c.split('.');
      if (op === 'eq') {
        this.whereParams.push(val);
        return `${col} = $${this.whereParams.length}`;
      } else if (op === 'ilike') {
        this.whereParams.push(`%${val}%`);
        return `${col} ILIKE $${this.whereParams.length}`;
      }
      return c;
    });
    this.whereClauses.push(`(${parts.join(' OR ')})`);
    
    // 内存过滤
    const parsedParts = conditions.split(',').map(c => {
      const [col, op, val] = c.split('.');
      return { col, op, val };
    });
    this.memoryFilters.push(row => 
      parsedParts.some(({ col, op, val }) => {
        if (op === 'eq') return row[col] === val;
        if (op === 'ilike') return String(row[col] || '').toLowerCase().includes(val.toLowerCase());
        return false;
      })
    );
    return this;
  }

  and(conditions: string): QueryBuilder<T> {
    this.whereClauses.push(`(${conditions})`);
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} >= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') return rowVal >= value;
      return false;
    });
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} <= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') return rowVal <= value;
      return false;
    });
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} > $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') return rowVal > value;
      return false;
    });
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} < $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') return rowVal < value;
      return false;
    });
    return this;
  }

  like(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} LIKE $${this.whereParams.length + 1}`);
    this.whereParams.push(pattern);
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.memoryFilters.push(row => regex.test(String(row[column] || '')));
    return this;
  }

  ilike(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} ILIKE $${this.whereParams.length + 1}`);
    this.whereParams.push(pattern);
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.memoryFilters.push(row => regex.test(String(row[column] || '')));
    return this;
  }

  is(column: string, value: null | boolean): QueryBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
      this.memoryFilters.push(row => row[column] === null || row[column] === undefined);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
      this.memoryFilters.push(row => row[column] === value);
    }
    return this;
  }

  isNull(column: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} IS NULL`);
    this.memoryFilters.push(row => row[column] === null || row[column] === undefined);
    return this;
  }

  isNotNull(column: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} IS NOT NULL`);
    this.memoryFilters.push(row => row[column] !== null && row[column] !== undefined);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    const asc = options?.ascending !== false;
    this.orderByClauses.push(`${column} ${asc ? 'ASC' : 'DESC'}`);
    this.memoryOrderBy.push({ column, ascending: asc });
    return this;
  }

  range(from: number, to: number): QueryBuilder<T> {
    this.limitCount = to - from + 1;
    this.offsetCount = from;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  offset(count: number): QueryBuilder<T> {
    this.offsetCount = count;
    return this;
  }

  // 内存查询执行
  protected executeMemoryQuery(): QueryResultData<T> {
    const store = getTableStore(this.table);
    let results = Array.from(store.values());

    // 应用过滤条件
    for (const filter of this.memoryFilters) {
      results = results.filter(filter);
    }

    // 应用排序
    for (const { column, ascending } of this.memoryOrderBy) {
      results.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return ascending ? -1 : 1;
        if (bVal === null || bVal === undefined) return ascending ? 1 : -1;
        if (aVal < bVal) return ascending ? -1 : 1;
        return ascending ? 1 : -1;
      });
    }

    const totalCount = results.length;

    // 应用分页
    if (this.offsetCount !== undefined) {
      results = results.slice(this.offsetCount);
    }
    if (this.limitCount !== undefined) {
      results = results.slice(0, this.limitCount);
    }

    // 投影列
    const data = results.map(row => {
      if (this.selectColumns.includes('*')) {
        return { ...row };
      }
      const projected: Record<string, unknown> = {};
      for (const col of this.selectColumns) {
        projected[col] = row[col];
      }
      return projected;
    }) as T[];

    if (this.countMode) {
      return { data, error: null, count: totalCount };
    }

    return { data, error: null, count: null };
  }

  async execute(): Promise<QueryResultData<T>> {
    // 确保连接已测试
    await testConnection();

    if (useMemoryStore) {
      return this.executeMemoryQuery();
    }

    const client = getPool();
    if (!client) {
      return this.executeMemoryQuery();
    }
    
    try {
      let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.table}`;
      
      if (this.whereClauses.length > 0) {
        sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
      }
      
      if (this.orderByClauses.length > 0) {
        sql += ` ORDER BY ${this.orderByClauses.join(', ')}`;
      }
      
      if (this.limitCount !== undefined) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      if (this.offsetCount !== undefined) {
        sql += ` OFFSET ${this.offsetCount}`;
      }
      
      const result = await client.query(sql, this.whereParams);
      
      if (this.countMode) {
        return { data: result.rows as T[], error: null, count: result.rowCount };
      }
      
      return { data: result.rows as T[], error: null, count: null };
    } catch (error) {
      console.error('Database query error:', error);
      // 回退到内存存储
      return this.executeMemoryQuery();
    }
  }

  async single(): Promise<SingleQueryResultData<T>> {
    // 确保连接已测试
    await testConnection();

    if (useMemoryStore) {
      const { data, error } = this.executeMemoryQuery();
      if (error) return { data: null, error };
      if (!data || data.length === 0) {
        return { data: null, error: { message: 'No rows found' } };
      }
      return { data: data[0], error: null };
    }

    const client = getPool();
    if (!client) {
      const { data, error } = this.executeMemoryQuery();
      if (error) return { data: null, error };
      if (!data || data.length === 0) {
        return { data: null, error: { message: 'No rows found' } };
      }
      return { data: data[0], error: null };
    }

    try {
      let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.table}`;
      
      if (this.whereClauses.length > 0) {
        sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
      }
      
      if (this.orderByClauses.length > 0) {
        sql += ` ORDER BY ${this.orderByClauses.join(', ')}`;
      }
      
      sql += ' LIMIT 1';
      
      const result = await client.query(sql, this.whereParams);
      
      if (result.rows.length === 0) {
        return { data: null, error: { message: 'No rows found' } };
      }
      
      return { data: result.rows[0] as T, error: null };
    } catch (error) {
      console.error('Database query error:', error);
      // 回退到内存存储
      const { data, error: memError } = this.executeMemoryQuery();
      if (memError) return { data: null, error: memError };
      if (!data || data.length === 0) {
        return { data: null, error: { message: 'No rows found' } };
      }
      return { data: data[0], error: null };
    }
  }

  // 添加链式操作的 insert/update/delete 方法
  insert(records: Record<string, unknown> | Record<string, unknown>[]): InsertBuilder<T> {
    return new InsertBuilder<T>(this.table, records);
  }

  update(updates: Record<string, unknown>): UpdateBuilder<T> {
    return new UpdateBuilder<T>(this.table, updates);
  }

  delete(): DeleteBuilder<T> {
    return new DeleteBuilder<T>(this.table);
  }

  // 使 QueryBuilder 可被 await
  then<TResult1 = QueryResultData<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResultData<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ==========================================
// 插入构建器
// ==========================================
class InsertBuilder<T = Record<string, unknown>> {
  private table: string;
  private records: Record<string, unknown>[];
  private returnInserted = false;

  constructor(table: string, records: Record<string, unknown> | Record<string, unknown>[]) {
    this.table = table;
    this.records = Array.isArray(records) ? records : [records];
  }

  select(_columns?: string): InsertBuilder<T> {
    this.returnInserted = true;
    return this;
  }

  single(): InsertBuilder<T> {
    return this;
  }

  private executeMemoryInsert(): SingleQueryResultData<T> {
    const store = getTableStore(this.table);
    const now = new Date().toISOString();

    const insertedRecords = this.records.map(record => {
      const id = (record as Record<string, unknown>).id || generateId();
      const newRecord: Record<string, unknown> = {
        ...record,
        id,
        created_at: (record as Record<string, unknown>).created_at || now,
        updated_at: (record as Record<string, unknown>).updated_at || now,
      };
      store.set(String(id), newRecord);
      return newRecord;
    });

    if (insertedRecords.length === 1) {
      return { data: insertedRecords[0] as T, error: null };
    }

    return { data: insertedRecords[0] as T, error: null };
  }

  async execute(): Promise<SingleQueryResultData<T>> {
    // 确保连接已测试
    await testConnection();

    if (useMemoryStore) {
      return this.executeMemoryInsert();
    }

    const client = getPool();
    if (!client) {
      return this.executeMemoryInsert();
    }

    try {
      const columns = [...new Set(this.records.flatMap(r => Object.keys(r)))];
      const values: unknown[] = [];
      const placeholders: string[] = [];
      
      let paramIndex = 1;
      for (const record of this.records) {
        const recordPlaceholders: string[] = [];
        for (const col of columns) {
          values.push(record[col]);
          recordPlaceholders.push(`$${paramIndex++}`);
        }
        placeholders.push(`(${recordPlaceholders.join(', ')})`);
      }
      
      const returning = this.returnInserted ? ' RETURNING *' : '';
      const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}${returning}`;
      
      const result = await client.query(sql, values);
      
      if (this.returnInserted && result.rows.length > 0) {
        return { data: result.rows[0] as T, error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Database insert error:', error);
      // 回退到内存存储
      return this.executeMemoryInsert();
    }
  }

  // 使 InsertBuilder 可被 await
  then<TResult1 = SingleQueryResultData<T>, TResult2 = never>(
    onfulfilled?: ((value: SingleQueryResultData<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ==========================================
// 更新构建器
// ==========================================
class UpdateBuilder<T = Record<string, unknown>> {
  private table: string;
  private updates: Record<string, unknown>;
  private whereClauses: string[] = [];
  private whereParams: unknown[] = [];
  private memoryFilters: Array<(row: Record<string, unknown>) => boolean> = [];
  private returnUpdated = false;

  constructor(table: string, updates: Record<string, unknown>) {
    this.table = table;
    this.updates = updates;
  }

  eq(column: string, value: unknown): UpdateBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    // 使用宽松比较，支持数字和字符串 id 的比较
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (rowVal == value) return true; // 使用 == 而非 ===
      return String(rowVal) === String(value);
    });
    return this;
  }

  neq(column: string, value: unknown): UpdateBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): UpdateBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    this.memoryFilters.push(row => values.includes(row[column]));
    return this;
  }

  is(column: string, value: null | boolean): UpdateBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
      this.memoryFilters.push(row => row[column] === null || row[column] === undefined);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
      this.memoryFilters.push(row => row[column] === value);
    }
    return this;
  }

  select(): UpdateBuilder<T> {
    this.returnUpdated = true;
    return this;
  }

  single(): UpdateBuilder<T> {
    return this;
  }

  private executeMemoryUpdate(): SingleQueryResultData<T> {
    const store = getTableStore(this.table);
    const now = new Date().toISOString();
    let updatedRecord: Record<string, unknown> | null = null;

    for (const [id, record] of store.entries()) {
      if (this.memoryFilters.every(filter => filter(record))) {
        const updated = {
          ...record,
          ...this.updates,
          updated_at: now,
        };
        store.set(id, updated);
        
        // 如果需要返回数据，记录最后一条更新的记录
        if (this.returnUpdated) {
          updatedRecord = updated;
        }
      }
    }

    return { data: updatedRecord as T | null, error: null };
  }

  async execute(): Promise<SingleQueryResultData<T>> {
    // 确保连接已测试
    await testConnection();

    if (useMemoryStore) {
      return this.executeMemoryUpdate();
    }

    const client = getPool();
    if (!client) {
      return this.executeMemoryUpdate();
    }

    try {
      const setClauses: string[] = [];
      const values: unknown[] = [];
      
      let paramIndex = 1;
      for (const [key, value] of Object.entries(this.updates)) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
      
      const returning = this.returnUpdated ? ' RETURNING *' : '';
      let sql = `UPDATE ${this.table} SET ${setClauses.join(', ')}`;
      
      if (this.whereClauses.length > 0) {
        sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
        values.push(...this.whereParams);
      }
      
      sql += returning;
      
      const result = await client.query(sql, values);
      
      if (this.returnUpdated && result.rows.length > 0) {
        return { data: result.rows[0] as T, error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Database update error:', error);
      // 回退到内存存储
      return this.executeMemoryUpdate();
    }
  }

  // 使 UpdateBuilder 可被 await
  then<TResult1 = SingleQueryResultData<T>, TResult2 = never>(
    onfulfilled?: ((value: SingleQueryResultData<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ==========================================
// 删除构建器
// ==========================================
class DeleteBuilder<T = Record<string, unknown>> {
  private table: string;
  private whereClauses: string[] = [];
  private whereParams: unknown[] = [];
  private memoryFilters: Array<(row: Record<string, unknown>) => boolean> = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): DeleteBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    // 使用宽松比较，支持数字和字符串 id 的比较
    this.memoryFilters.push(row => {
      const rowVal = row[column];
      if (rowVal == value) return true;
      return String(rowVal) === String(value);
    });
    return this;
  }

  neq(column: string, value: unknown): DeleteBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    this.memoryFilters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): DeleteBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    this.memoryFilters.push(row => values.includes(row[column]));
    return this;
  }

  is(column: string, value: null | boolean): DeleteBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
      this.memoryFilters.push(row => row[column] === null || row[column] === undefined);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
      this.memoryFilters.push(row => row[column] === value);
    }
    return this;
  }

  private returnDeleted = false;
  private deletedData: Record<string, unknown> | null = null;

  select(_columns?: string): DeleteBuilder<T> {
    this.returnDeleted = true;
    return this;
  }

  single(): DeleteBuilder<T> {
    return this;
  }

  private executeMemoryDelete(): { data: Record<string, unknown> | null; error: { message: string } | null } {
    const store = getTableStore(this.table);
    const toDelete: string[] = [];

    // 先收集要删除的记录
    for (const [id, record] of store.entries()) {
      if (this.memoryFilters.every(filter => filter(record))) {
        toDelete.push(id);
        if (this.returnDeleted && !this.deletedData) {
          this.deletedData = { ...record };
        }
      }
    }

    // 批量删除
    for (const id of toDelete) {
      store.delete(id);
    }

    return { data: this.deletedData, error: null };
  }

  async execute(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> {
    // 确保连接已测试
    await testConnection();

    if (useMemoryStore) {
      return this.executeMemoryDelete();
    }

    const client = getPool();
    if (!client) {
      return this.executeMemoryDelete();
    }

    try {
      const returning = this.returnDeleted ? ' RETURNING *' : '';
      let sql = `DELETE FROM ${this.table}`;
      
      if (this.whereClauses.length > 0) {
        sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
      }
      
      sql += returning;
      
      const result = await client.query(sql, this.whereParams);
      
      if (this.returnDeleted && result.rows.length > 0) {
        return { data: result.rows[0], error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Database delete error:', error);
      // 回退到内存存储
      return this.executeMemoryDelete();
    }
  }

  // 使 DeleteBuilder 可被 await
  then<TResult1 = { data: Record<string, unknown> | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Record<string, unknown> | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ==========================================
// 数据库客户端
// ==========================================
class DatabaseClient {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  }

  insert<T = Record<string, unknown>>(table: string, records: Record<string, unknown> | Record<string, unknown>[]): InsertBuilder<T> {
    return new InsertBuilder<T>(table, records);
  }

  update<T = Record<string, unknown>>(table: string, updates: Record<string, unknown>): UpdateBuilder<T> {
    return new UpdateBuilder<T>(table, updates);
  }

  delete<T = Record<string, unknown>>(table: string): DeleteBuilder<T> {
    return new DeleteBuilder<T>(table);
  }
}

// 导出单例
export const dbClient = new DatabaseClient();

// 获取数据库客户端实例
export function getDbClient(): DatabaseClient {
  return dbClient;
}

// 初始化种子数据（用于内存存储）
export function seedTable(table: string, data: Record<string, unknown>[]): void {
  const store = getTableStore(table);
  store.clear();
  data.forEach((item, index) => {
    const id = (item as Record<string, unknown>).id || index + 1;
    store.set(String(id), {
      ...item,
      id,
      created_at: (item as Record<string, unknown>).created_at || new Date().toISOString(),
      updated_at: (item as Record<string, unknown>).updated_at || new Date().toISOString(),
    });
  });
}
