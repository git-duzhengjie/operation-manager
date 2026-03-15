/**
 * Zabbix API 配置
 * 
 * 配置说明：
 * - ZABBIX_URL: Zabbix 服务器地址（不带 /api_jsonrpc.php，代码会自动添加）
 * - ZABBIX_USER: Zabbix 登录用户名
 * - ZABBIX_PASSWORD: Zabbix 登录密码
 * 
 * 环境变量配置：
 * - NEXT_PUBLIC_ZABBIX_URL: 前端可访问的 Zabbix 地址（例如: http://192.168.1.100/zabbix）
 * - ZABBIX_API_URL: 后端 API 访问的 Zabbix 地址（可选，默认与前端相同）
 * - ZABBIX_API_ENDPOINT: 完整的 API 端点（可选，如 http://192.168.1.100/zabbix/api_jsonrpc.php）
 * - ZABBIX_USER: Zabbix 用户名
 * - ZABBIX_PASSWORD: Zabbix 密码
 * 
 * 注意：
 * - URL 不要包含 /api_jsonrpc.php，代码会自动拼接
 * - 如果 Zabbix 部署在子目录，URL 应为 http://host/subdir（如 http://192.168.1.100/zabbix）
 * - 如果 Zabbix 部署在根路径，URL 应为 http://host（如 http://192.168.1.100）
 */

export interface ZabbixConfig {
  url: string;
  apiUrl: string;
  apiEndpoint?: string; // 完整的 API 端点（可选）
  user: string;
  password: string;
  enabled: boolean;
  errors: string[]; // 配置错误信息
}

// 从环境变量获取配置
export function getZabbixConfig(): ZabbixConfig {
  const url = process.env.NEXT_PUBLIC_ZABBIX_URL || process.env.ZABBIX_URL || '';
  const apiUrl = process.env.ZABBIX_API_URL || url;
  const apiEndpoint = process.env.ZABBIX_API_ENDPOINT || '';
  const user = process.env.ZABBIX_USER || '';
  const password = process.env.ZABBIX_PASSWORD || '';
  
  const errors: string[] = [];
  
  // 验证配置
  if (!url) {
    errors.push('NEXT_PUBLIC_ZABBIX_URL 或 ZABBIX_URL 未设置');
  } else {
    // 检查 URL 是否已经包含 api_jsonrpc.php
    if (url.includes('/api_jsonrpc.php')) {
      errors.push('URL 不应包含 /api_jsonrpc.php，请使用基础地址（如 http://192.168.1.100/zabbix）');
    }
    // 检查 URL 格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      errors.push('URL 应以 http:// 或 https:// 开头');
    }
  }
  
  if (!user) {
    errors.push('ZABBIX_USER 未设置');
  }
  
  if (!password) {
    errors.push('ZABBIX_PASSWORD 未设置');
  }
  
  return {
    url,
    apiUrl,
    apiEndpoint: apiEndpoint || undefined,
    user,
    password,
    enabled: !!(url && user && password) && errors.length === 0,
    errors,
  };
}

// Zabbix API 端点
export function getZabbixApiEndpoint(config: ZabbixConfig): string {
  // 如果直接指定了 API 端点，直接使用
  if (config.apiEndpoint) {
    return config.apiEndpoint;
  }
  // 否则自动拼接
  return `${config.apiUrl}/api_jsonrpc.php`;
}

// Zabbix 前端地址（用于跳转）
export function getZabbixFrontendUrl(config: ZabbixConfig): string {
  return config.url;
}
