// 系统日志记录工具

interface LogData {
  user?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  status?: 'success' | 'failed';
  details?: Record<string, unknown>;
}

// 记录系统日志
export async function logAction(data: LogData): Promise<void> {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('记录日志失败:', error);
  }
}

// 常用日志记录方法
export const logger = {
  // 登录日志
  login: (user: string, ip: string, success: boolean) => 
    logAction({
      user,
      action: success ? '用户登录' : '登录失败',
      resource: '用户管理',
      ip,
      status: success ? 'success' : 'failed',
      details: success ? undefined : { reason: '用户名或密码错误' },
    }),

  // 登出日志
  logout: (user: string, ip: string) => 
    logAction({
      user,
      action: '用户登出',
      resource: '用户管理',
      ip,
      status: 'success',
    }),

  // 创建操作日志
  create: (user: string, resource: string, resourceId: string, ip?: string) => 
    logAction({
      user,
      action: '创建',
      resource,
      resourceId,
      ip,
      status: 'success',
    }),

  // 更新操作日志
  update: (user: string, resource: string, resourceId: string, ip?: string, details?: Record<string, unknown>) => 
    logAction({
      user,
      action: '更新',
      resource,
      resourceId,
      ip,
      status: 'success',
      details,
    }),

  // 删除操作日志
  delete: (user: string, resource: string, resourceId: string, ip?: string) => 
    logAction({
      user,
      action: '删除',
      resource,
      resourceId,
      ip,
      status: 'success',
    }),

  // 导出操作日志
  export: (user: string, resource: string, ip?: string) => 
    logAction({
      user,
      action: '导出数据',
      resource,
      ip,
      status: 'success',
    }),

  // 导入操作日志
  import: (user: string, resource: string, success: boolean, ip?: string, details?: Record<string, unknown>) => 
    logAction({
      user,
      action: '导入数据',
      resource,
      ip,
      status: success ? 'success' : 'failed',
      details,
    }),

  // 查看操作日志
  view: (user: string, resource: string, resourceId: string, ip?: string) => 
    logAction({
      user,
      action: '查看',
      resource,
      resourceId,
      ip,
      status: 'success',
    }),

  // 系统配置日志
  config: (user: string, action: string, ip?: string, details?: Record<string, unknown>) => 
    logAction({
      user,
      action,
      resource: '系统管理',
      ip,
      status: 'success',
      details,
    }),
};

export default logger;
