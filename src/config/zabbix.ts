/**
 * Zabbix API 配置
 * 
 * 配置说明：
 * - ZABBIX_URL: Zabbix 服务器地址（不带 /api_jsonrpc.php）
 * - ZABBIX_USER: Zabbix 登录用户名
 * - ZABBIX_PASSWORD: Zabbix 登录密码
 * 
 * 环境变量配置：
 * - NEXT_PUBLIC_ZABBIX_URL: 前端可访问的 Zabbix 地址
 * - ZABBIX_API_URL: 后端 API 访问的 Zabbix 地址（可选，默认与前端相同）
 * - ZABBIX_USER: Zabbix 用户名
 * - ZABBIX_PASSWORD: Zabbix 密码
 */

export interface ZabbixConfig {
  url: string;
  apiUrl: string;
  user: string;
  password: string;
  enabled: boolean;
}

// 从环境变量获取配置
export function getZabbixConfig(): ZabbixConfig {
  const url = process.env.NEXT_PUBLIC_ZABBIX_URL || process.env.ZABBIX_URL || '';
  const apiUrl = process.env.ZABBIX_API_URL || url;
  const user = process.env.ZABBIX_USER || '';
  const password = process.env.ZABBIX_PASSWORD || '';
  
  return {
    url,
    apiUrl,
    user,
    password,
    enabled: !!(url && user && password),
  };
}

// Zabbix API 端点
export function getZabbixApiEndpoint(config: ZabbixConfig): string {
  return `${config.apiUrl}/api_jsonrpc.php`;
}

// Zabbix 前端地址（用于跳转）
export function getZabbixFrontendUrl(config: ZabbixConfig): string {
  return config.url;
}
