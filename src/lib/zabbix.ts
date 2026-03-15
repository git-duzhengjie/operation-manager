/**
 * Zabbix API 客户端
 * 
 * 基于 Zabbix JSON-RPC API 实现
 * 文档: https://www.zabbix.com/documentation/current/en/manual/api
 */

import { getZabbixConfig, getZabbixApiEndpoint, ZabbixConfig } from '@/config/zabbix';

// Zabbix API 响应类型
interface ZabbixResponse<T> {
  jsonrpc: string;
  result: T;
  id: number;
  error?: {
    code: number;
    message: string;
    data: string;
  };
}

// Zabbix 主机类型
export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
  available: string;
  error: string;
  interfaces?: Array<{
    interfaceid: string;
    ip: string;
    dns: string;
    port: string;
    type: string;
    main: string;
  }>;
  groups?: Array<{
    groupid: string;
    name: string;
  }>;
}

// Zabbix 告警类型
export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string; // 0-5, 0=not classified, 5=disaster
  status: string;
  value: string; // 0=OK, 1=PROBLEM
  lastchange: string; // Unix timestamp
  comments: string;
  url: string;
  hosts?: Array<{
    hostid: string;
    host: string;
    name: string;
  }>;
  items?: Array<{
    itemid: string;
    name: string;
    key_: string;
    lastvalue: string;
  }>;
}

// Zabbix 问题类型
export interface ZabbixProblem {
  problemid: string;
  eventid: string;
  objectid: string; // triggerid
  clock: string; // Unix timestamp
  ns: string;
  source: string;
  object: string;
  severity: string;
  name: string;
  acknowledged: string;
  suppressed: string;
  opdata: string;
  hosts?: Array<{
    hostid: string;
    host: string;
    name: string;
  }>;
}

// Zabbix 告警事件
export interface ZabbixAlert {
  alertid: string;
  actionid: string;
  eventid: string;
  userid: string;
  clock: string;
  mediatypeid: string;
  sendto: string;
  subject: string;
  message: string;
  status: string;
  retries: string;
  error: string;
}

// Zabbix 图表数据
export interface ZabbixHistory {
  itemid: string;
  clock: string;
  value: string;
  ns: string;
}

// Zabbix 监控项
export interface ZabbixItem {
  itemid: string;
  hostid: string;
  name: string;
  key_: string;
  lastvalue: string;
  lastclock: string;
  units: string;
  status: string;
  value_type: string;
}

// 告警级别映射
export const ZABBIX_PRIORITY_MAP: Record<string, { level: string; label: string; color: string }> = {
  '0': { level: 'info', label: '未分类', color: 'gray' },
  '1': { level: 'info', label: '信息', color: 'blue' },
  '2': { level: 'warning', label: '警告', color: 'yellow' },
  '3': { level: 'warning', label: '一般严重', color: 'orange' },
  '4': { level: 'critical', label: '严重', color: 'red' },
  '5': { level: 'critical', label: '灾难', color: 'darkred' },
};

export class ZabbixClient {
  private config: ZabbixConfig;
  private authToken: string | null = null;
  private requestId = 0;

  constructor(config?: ZabbixConfig) {
    this.config = config || getZabbixConfig();
  }

  /**
   * 检查 Zabbix 是否已配置
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 获取 Zabbix 前端 URL
   */
  getFrontendUrl(): string {
    return this.config.url;
  }

  /**
   * 调用 Zabbix API
   */
  private async callApi<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.config.enabled) {
      throw new Error('Zabbix 未配置');
    }

    const endpoint = getZabbixApiEndpoint(this.config);
    this.requestId++;

    const body: Record<string, unknown> = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId,
    };

    // 如果有 auth token 且不是 login 方法，添加到请求中
    if (this.authToken && method !== 'user.login') {
      body.auth = this.authToken;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-rpc',
        },
        body: JSON.stringify(body),
      });

      // 先检查 Content-Type，避免 HTML 响应导致 JSON 解析错误
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      if (!contentType.includes('application/json')) {
        // 返回非 JSON 内容（通常是 HTML 错误页面）
        const preview = responseText.substring(0, 500);
        throw new Error(
          `Zabbix API 返回非 JSON 格式\n` +
          `端点: ${endpoint}\n` +
          `状态码: ${response.status}\n` +
          `Content-Type: ${contentType}\n` +
          `响应预览: ${preview}\n` +
          `可能原因:\n` +
          `1. URL 配置错误，请确认 Zabbix 地址是否正确\n` +
          `2. Zabbix API 端点应为: http://your-zabbix/zabbix/api_jsonrpc.php\n` +
          `3. Zabbix 服务未正常启动\n` +
          `4. 需要检查 Zabbix 前端是否能正常访问`
        );
      }

      // 解析 JSON
      let data: ZabbixResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Zabbix API JSON 解析失败: ${responseText.substring(0, 200)}`);
      }

      if (data.error) {
        throw new Error(`Zabbix API Error: ${data.error.message} - ${data.error.data}`);
      }

      return data.result;
    } catch (error) {
      console.error(`Zabbix API call failed [${method}]:`, error);
      throw error;
    }
  }

  /**
   * 登录获取 auth token
   */
  async login(): Promise<string> {
    if (!this.config.user || !this.config.password) {
      throw new Error('Zabbix 用户名或密码未配置');
    }

    const result = await this.callApi<string>('user.login', {
      username: this.config.user,
      password: this.config.password,
    });

    this.authToken = result;
    return result;
  }

  /**
   * 退出登录
   */
  async logout(): Promise<boolean> {
    if (!this.authToken) return true;

    try {
      await this.callApi<boolean>('user.logout', {});
      this.authToken = null;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取主机列表
   */
  async getHosts(options: {
    groupids?: string[];
    hostids?: string[];
    monitored?: boolean;
    output?: string[];
    selectInterfaces?: string | string[];
    selectGroups?: string | string[];
    limit?: number;
  } = {}): Promise<ZabbixHost[]> {
    const params: Record<string, unknown> = {
      output: options.output || ['hostid', 'host', 'name', 'status', 'available', 'error'],
    };

    if (options.groupids) params.groupids = options.groupids;
    if (options.hostids) params.hostids = options.hostids;
    if (options.monitored !== undefined) params.monitored_hosts = options.monitored;
    if (options.selectInterfaces) params.selectInterfaces = options.selectInterfaces;
    if (options.selectGroups) params.selectGroups = options.selectGroups;
    if (options.limit) params.limit = options.limit;

    return this.callApi<ZabbixHost[]>('host.get', params);
  }

  /**
   * 获取触发器列表
   */
  async getTriggers(options: {
    groupids?: string[];
    hostids?: string[];
    triggerids?: string[];
    active?: boolean;
    monitored?: boolean;
    skipDependent?: boolean;
    selectHosts?: string | string[];
    selectItems?: string | string[];
    output?: string[];
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    filter?: Record<string, unknown>;
  } = {}): Promise<ZabbixTrigger[]> {
    const params: Record<string, unknown> = {
      output: options.output || ['triggerid', 'description', 'priority', 'status', 'value', 'lastchange', 'comments', 'url'],
    };

    if (options.groupids) params.groupids = options.groupids;
    if (options.hostids) params.hostids = options.hostids;
    if (options.triggerids) params.triggerids = options.triggerids;
    if (options.active !== undefined) params.active = options.active;
    if (options.monitored !== undefined) params.monitored = options.monitored;
    if (options.skipDependent !== undefined) params.skipDependent = options.skipDependent;
    if (options.selectHosts) params.selectHosts = options.selectHosts;
    if (options.selectItems) params.selectItems = options.selectItems;
    if (options.sortfield) params.sortfield = options.sortfield;
    if (options.sortorder) params.sortorder = options.sortorder;
    if (options.limit) params.limit = options.limit;
    if (options.filter) params.filter = options.filter;

    return this.callApi<ZabbixTrigger[]>('trigger.get', params);
  }

  /**
   * 获取问题列表
   */
  async getProblems(options: {
    groupids?: string[];
    hostids?: string[];
    objectids?: string[];
    severities?: string[];
    acknowledged?: boolean;
    suppressed?: boolean;
    recent?: boolean;
    selectHosts?: string | string[];
    output?: string[];
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    time_from?: number;
    time_till?: number;
  } = {}): Promise<ZabbixProblem[]> {
    const params: Record<string, unknown> = {
      output: options.output || ['problemid', 'eventid', 'objectid', 'clock', 'severity', 'name', 'acknowledged', 'opdata'],
    };

    if (options.groupids) params.groupids = options.groupids;
    if (options.hostids) params.hostids = options.hostids;
    if (options.objectids) params.objectids = options.objectids;
    if (options.severities) params.severities = options.severities;
    if (options.acknowledged !== undefined) params.acknowledged = options.acknowledged;
    if (options.suppressed !== undefined) params.suppressed = options.suppressed;
    if (options.recent !== undefined) params.recent = options.recent;
    if (options.selectHosts) params.selectHosts = options.selectHosts;
    if (options.sortfield) params.sortfield = options.sortfield;
    if (options.sortorder) params.sortorder = options.sortorder;
    if (options.limit) params.limit = options.limit;
    if (options.time_from) params.time_from = options.time_from;
    if (options.time_till) params.time_till = options.time_till;

    return this.callApi<ZabbixProblem[]>('problem.get', params);
  }

  /**
   * 获取监控项数据
   */
  async getItems(options: {
    hostids?: string[];
    itemids?: string[];
    monitored?: boolean;
    output?: string[];
    sortfield?: string;
    sortorder?: string;
    limit?: number;
  } = {}): Promise<ZabbixItem[]> {
    const params: Record<string, unknown> = {
      output: options.output || ['itemid', 'hostid', 'name', 'key_', 'lastvalue', 'lastclock', 'units', 'status', 'value_type'],
    };

    if (options.hostids) params.hostids = options.hostids;
    if (options.itemids) params.itemids = options.itemids;
    if (options.monitored !== undefined) params.monitored = options.monitored;
    if (options.sortfield) params.sortfield = options.sortfield;
    if (options.sortorder) params.sortorder = options.sortorder;
    if (options.limit) params.limit = options.limit;

    return this.callApi<ZabbixItem[]>('item.get', params);
  }

  /**
   * 获取历史数据
   */
  async getHistory(options: {
    itemids: string[];
    history?: number; // 0=float, 1=char, 2=log, 3=uint, 4=text
    time_from?: number;
    time_till?: number;
    output?: string;
    sortfield?: string;
    sortorder?: string;
    limit?: number;
  }): Promise<ZabbixHistory[]> {
    const params: Record<string, unknown> = {
      itemids: options.itemids,
      output: options.output || 'extend',
    };

    if (options.history !== undefined) params.history = options.history;
    if (options.time_from) params.time_from = options.time_from;
    if (options.time_till) params.time_till = options.time_till;
    if (options.sortfield) params.sortfield = options.sortfield;
    if (options.sortorder) params.sortorder = options.sortorder;
    if (options.limit) params.limit = options.limit;

    return this.callApi<ZabbixHistory[]>('history.get', params);
  }

  /**
   * 确认事件
   */
  async acknowledgeEvent(eventids: string[], message: string): Promise<{ eventids: string[] }> {
    return this.callApi<{ eventids: string[] }>('event.acknowledge', {
      eventids,
      message,
      action: 1, // 1 = acknowledge
    });
  }

  /**
   * 获取 Zabbix API 版本
   */
  async getApiVersion(): Promise<string> {
    return this.callApi<string>('apiinfo.version', {});
  }

  /**
   * 确保已登录
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.authToken) {
      await this.login();
    }
  }
}

// 导出默认客户端实例
export const zabbixClient = new ZabbixClient();
