import { NextRequest, NextResponse } from 'next/server';
import { ZabbixClient, ZABBIX_PRIORITY_MAP } from '@/lib/zabbix';
import { getZabbixConfig, getZabbixApiEndpoint } from '@/config/zabbix';

// 创建 Zabbix 客户端
const getZabbixClient = () => new ZabbixClient();

// GET - 获取 Zabbix 监控数据
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'problems';

  const config = getZabbixConfig();

  // debug 接口不需要检查配置
  if (action === 'debug') {
    return await getDebugInfo();
  }

  // 检查是否配置了 Zabbix
  if (!config.enabled) {
    return NextResponse.json({
      success: false,
      error: 'Zabbix 未配置',
      hint: '请设置环境变量 NEXT_PUBLIC_ZABBIX_URL, ZABBIX_USER, ZABBIX_PASSWORD',
    });
  }

  const client = getZabbixClient();

  try {
    // 登录
    await client.ensureAuthenticated();

    switch (action) {
      case 'problems':
        return await getProblems(client, searchParams);
      case 'hosts':
        return await getHosts(client, searchParams);
      case 'triggers':
        return await getTriggers(client, searchParams);
      case 'items':
        return await getItems(client, searchParams);
      case 'stats':
        return await getStats(client);
      case 'version':
        return await getVersion(client);
      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作类型',
        });
    }
  } catch (error) {
    console.error('Zabbix API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Zabbix API 调用失败',
    });
  } finally {
    await client.logout();
  }
}

// POST - 执行操作（如确认告警）
export async function POST(request: NextRequest) {
  const config = getZabbixConfig();

  if (!config.enabled) {
    return NextResponse.json({
      success: false,
      error: 'Zabbix 未配置',
    });
  }

  try {
    const body = await request.json();
    const { action, eventids, message } = body;

    const client = getZabbixClient();
    await client.ensureAuthenticated();

    switch (action) {
      case 'acknowledge': {
        if (!eventids || !Array.isArray(eventids) || eventids.length === 0) {
          return NextResponse.json({
            success: false,
            error: '请提供要确认的事件ID',
          });
        }

        const result = await client.acknowledgeEvent(eventids, message || '已确认');
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作类型',
        });
    }
  } catch (error) {
    console.error('Zabbix action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '操作失败',
    });
  }
}

// 获取问题列表
async function getProblems(client: ZabbixClient, searchParams: URLSearchParams) {
  const severity = searchParams.get('severity');
  const acknowledged = searchParams.get('acknowledged');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const timeFrom = searchParams.get('time_from');
  const timeTill = searchParams.get('time_till');

  const options: Parameters<typeof client.getProblems>[0] = {
    selectHosts: ['hostid', 'host', 'name'],
    sortfield: 'clock',
    sortorder: 'DESC',
    limit,
  };

  // 严重级别过滤
  if (severity && severity !== 'all') {
    options.severities = severity.split(',');
  }

  // 确认状态过滤
  if (acknowledged === 'true') {
    options.acknowledged = true;
  } else if (acknowledged === 'false') {
    options.acknowledged = false;
  }

  // 时间范围
  if (timeFrom) {
    options.time_from = parseInt(timeFrom, 10);
  }
  if (timeTill) {
    options.time_till = parseInt(timeTill, 10);
  }

  const problems = await client.getProblems(options);

  // 格式化返回数据
  const formattedProblems = problems.map((problem) => {
    const severityInfo = ZABBIX_PRIORITY_MAP[problem.severity] || ZABBIX_PRIORITY_MAP['0'];
    const hosts = problem.hosts || [];

    return {
      id: problem.problemid,
      eventId: problem.eventid,
      triggerId: problem.objectid,
      name: problem.name,
      severity: problem.severity,
      level: severityInfo.level,
      levelLabel: severityInfo.label,
      color: severityInfo.color,
      acknowledged: problem.acknowledged === '1',
      clock: problem.clock,
      time: new Date(parseInt(problem.clock, 10) * 1000).toISOString(),
      opdata: problem.opdata,
      hosts: hosts.map((h) => ({
        hostid: h.hostid,
        host: h.host,
        name: h.name,
      })),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      problems: formattedProblems,
      total: formattedProblems.length,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取主机列表
async function getHosts(client: ZabbixClient, searchParams: URLSearchParams) {
  const monitored = searchParams.get('monitored');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const options: Parameters<typeof client.getHosts>[0] = {
    selectInterfaces: ['interfaceid', 'ip', 'dns', 'port', 'type', 'main'],
    selectGroups: ['groupid', 'name'],
    limit,
  };

  if (monitored === 'true') {
    options.monitored = true;
  }

  if (limit) {
    options.limit = limit;
  }

  const hosts = await client.getHosts(options);

  // 格式化返回数据
  const formattedHosts = hosts.map((host) => ({
    hostid: host.hostid,
    host: host.host,
    name: host.name,
    status: host.status, // 0=monitored, 1=not monitored
    available: host.available, // 0=unknown, 1=available, 2=unavailable
    error: host.error,
    interfaces: host.interfaces || [],
    groups: host.groups || [],
  }));

  return NextResponse.json({
    success: true,
    data: {
      hosts: formattedHosts,
      total: formattedHosts.length,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取触发器列表
async function getTriggers(client: ZabbixClient, searchParams: URLSearchParams) {
  const active = searchParams.get('active');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const options: Parameters<typeof client.getTriggers>[0] = {
    selectHosts: ['hostid', 'host', 'name'],
    selectItems: ['itemid', 'name', 'key_', 'lastvalue'],
    sortfield: 'lastchange',
    sortorder: 'DESC',
    limit,
  };

  if (active === 'true') {
    options.active = true;
    options.monitored = true;
  }

  const triggers = await client.getTriggers(options);

  // 格式化返回数据
  const formattedTriggers = triggers.map((trigger) => {
    const priorityInfo = ZABBIX_PRIORITY_MAP[trigger.priority] || ZABBIX_PRIORITY_MAP['0'];
    const hosts = trigger.hosts || [];
    const items = trigger.items || [];

    return {
      triggerid: trigger.triggerid,
      description: trigger.description,
      priority: trigger.priority,
      level: priorityInfo.level,
      levelLabel: priorityInfo.label,
      color: priorityInfo.color,
      status: trigger.status, // 0=enabled, 1=disabled
      value: trigger.value, // 0=OK, 1=PROBLEM
      lastchange: trigger.lastchange,
      time: new Date(parseInt(trigger.lastchange, 10) * 1000).toISOString(),
      comments: trigger.comments,
      url: trigger.url,
      hosts: hosts.map((h) => ({
        hostid: h.hostid,
        host: h.host,
        name: h.name,
      })),
      items: items.map((i) => ({
        itemid: i.itemid,
        name: i.name,
        key: i.key_,
        lastvalue: i.lastvalue,
      })),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      triggers: formattedTriggers,
      total: formattedTriggers.length,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取监控项数据
async function getItems(client: ZabbixClient, searchParams: URLSearchParams) {
  const hostids = searchParams.get('hostids');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const options: Parameters<typeof client.getItems>[0] = {
    monitored: true,
    sortfield: 'name',
    sortorder: 'ASC',
    limit,
  };

  if (hostids) {
    options.hostids = hostids.split(',');
  }

  const items = await client.getItems(options);

  return NextResponse.json({
    success: true,
    data: {
      items,
      total: items.length,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取统计信息
async function getStats(client: ZabbixClient) {
  // 获取今日时间范围
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeFrom = Math.floor(todayStart.getTime() / 1000);

  // 并行获取数据
  const [allProblems, todayProblems, hosts, criticalTriggers] = await Promise.all([
    // 所有问题
    client.getProblems({
      selectHosts: ['hostid'],
    }),
    // 今日问题
    client.getProblems({
      time_from: timeFrom,
      selectHosts: ['hostid'],
    }),
    // 主机
    client.getHosts({
      monitored: true,
    }),
    // 严重触发器
    client.getTriggers({
      active: true,
      monitored: true,
      filter: { value: 1 }, // PROBLEM 状态
    }),
  ]);

  // 统计各级别问题数量
  const severityCount: Record<string, number> = {
    disaster: 0, // 灾难
    high: 0,     // 严重
    average: 0,  // 一般严重
    warning: 0,  // 警告
    info: 0,     // 信息
  };

  allProblems.forEach((p) => {
    const sev = p.severity;
    if (sev === '5') severityCount.disaster++;
    else if (sev === '4') severityCount.high++;
    else if (sev === '3') severityCount.average++;
    else if (sev === '2') severityCount.warning++;
    else severityCount.info++;
  });

  // 统计确认和未确认
  const acknowledged = allProblems.filter((p) => p.acknowledged === '1').length;
  const unacknowledged = allProblems.length - acknowledged;

  return NextResponse.json({
    success: true,
    data: {
      totalProblems: allProblems.length,
      todayProblems: todayProblems.length,
      totalHosts: hosts.length,
      activeTriggers: criticalTriggers.length,
      severityCount,
      acknowledged,
      unacknowledged,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取 API 版本
async function getVersion(client: ZabbixClient) {
  const version = await client.getApiVersion();
  return NextResponse.json({
    success: true,
    data: {
      version,
      zabbixUrl: client.getFrontendUrl(),
    },
  });
}

// 获取调试信息（用于排查配置问题）
async function getDebugInfo() {
  const config = getZabbixConfig();
  
  // 构建环境变量检测信息
  const envVars = {
    NEXT_PUBLIC_ZABBIX_URL: process.env.NEXT_PUBLIC_ZABBIX_URL ? '已设置' : '未设置',
    ZABBIX_URL: process.env.ZABBIX_URL ? '已设置' : '未设置',
    ZABBIX_API_URL: process.env.ZABBIX_API_URL ? '已设置' : '未设置',
    ZABBIX_API_ENDPOINT: process.env.ZABBIX_API_ENDPOINT ? '已设置' : '未设置',
    ZABBIX_USER: process.env.ZABBIX_USER ? '已设置' : '未设置',
    ZABBIX_PASSWORD: process.env.ZABBIX_PASSWORD ? '已设置' : '未设置',
  };
  
  // 网络连接测试
  let connectionTest = null;
  let apiTest = null;
  let endpointDiscovery = null;
  
  if (config.enabled) {
    const apiEndpoint = getZabbixApiEndpoint(config);
    
    // 测试 1: 检查配置的 API 端点是否可访问
    try {
      const testResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json-rpc' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'apiinfo.version',
          params: {},
          id: 1,
        }),
        signal: AbortSignal.timeout(10000),
      });
      
      const contentType = testResponse.headers.get('content-type') || '';
      const responseText = await testResponse.text();
      
      if (contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(responseText);
          apiTest = {
            success: true,
            status: testResponse.status,
            contentType,
            apiVersion: jsonData.result || null,
            endpoint: apiEndpoint,
            hint: '✅ API 端点可访问，返回 JSON 格式',
          };
        } catch {
          apiTest = {
            success: false,
            status: testResponse.status,
            contentType,
            responsePreview: responseText.substring(0, 200),
            hint: 'API 返回 JSON 解析失败',
          };
        }
      } else {
        // 返回非 JSON（通常是 HTML）
        apiTest = {
          success: false,
          status: testResponse.status,
          contentType,
          responsePreview: responseText.substring(0, 200),
          endpoint: apiEndpoint,
          hint: '❌ API 返回非 JSON 格式，可能是 URL 配置错误',
          possibleCauses: [
            'URL 路径错误：请检查 Zabbix 实际部署位置',
            'Zabbix 可能部署在根路径而非 /zabbix 子目录',
            'Zabbix 可能部署在不同的子目录',
          ],
        };
        
        // 自动探测正确的 API 端点
        endpointDiscovery = await discoverZabbixEndpoint(config.apiUrl);
      }
    } catch (error) {
      apiTest = {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
        endpoint: apiEndpoint,
        hint: '❌ 无法连接到 Zabbix API 端点',
        possibleCauses: [
          '网络不通：检查 Zabbix 服务器是否可达',
          '防火墙阻止了连接',
          'URL 格式错误',
          'DNS 解析失败',
        ],
      };
      
      // 尝试探测
      endpointDiscovery = await discoverZabbixEndpoint(config.apiUrl);
    }
    
    // 测试 2: 检查 Zabbix 前端是否可访问
    try {
      const frontendResponse = await fetch(config.url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const frontendContentType = frontendResponse.headers.get('content-type') || '';
      
      connectionTest = {
        success: frontendResponse.ok,
        status: frontendResponse.status,
        contentType: frontendContentType,
        hint: frontendResponse.ok 
          ? '✅ Zabbix 前端可访问' 
          : `前端返回状态码 ${frontendResponse.status}`,
      };
    } catch (error) {
      connectionTest = {
        success: false,
        error: error instanceof Error ? error.message : '连接失败',
        hint: '❌ 无法连接到 Zabbix 前端',
      };
    }
  }
  
  return NextResponse.json({
    success: true,
    data: {
      enabled: config.enabled,
      errors: config.errors,
      envVars,
      configStatus: {
        url: config.url || null,
        apiUrl: config.apiUrl || null,
        apiEndpoint: config.apiEndpoint || null,
        user: config.user ? '已设置' : '未设置',
        password: config.password ? '已设置' : '未设置',
      },
      // 连接测试结果
      connectionTest,
      apiTest,
      // 端点探测结果
      endpointDiscovery,
      // 配置指南
      setupGuide: {
        requiredVars: [
          { name: 'NEXT_PUBLIC_ZABBIX_URL', example: 'http://192.168.1.100/zabbix', note: 'Zabbix 前端地址，不要包含 /api_jsonrpc.php' },
          { name: 'ZABBIX_USER', example: 'Admin', note: 'Zabbix 登录用户名' },
          { name: 'ZABBIX_PASSWORD', example: 'zabbix', note: 'Zabbix 登录密码' },
        ],
        optionalVars: [
          { name: 'ZABBIX_API_URL', example: 'http://host.docker.internal/zabbix', note: '后端访问地址（Docker 内部网络）' },
          { name: 'ZABBIX_API_ENDPOINT', example: 'http://192.168.1.100/zabbix/api_jsonrpc.php', note: '完整 API 端点（直接指定）' },
        ],
      },
      hint: config.enabled 
        ? 'Zabbix 配置完整，可以正常使用'
        : '请确保所有必需的环境变量都已正确设置',
    },
  });
}

// 探测 Zabbix API 端点
async function discoverZabbixEndpoint(baseUrl: string): Promise<{
  tested: string[];
  found: string | null;
  suggestion: string | null;
}> {
  // 提取基础 URL（去掉可能的子路径）
  const urlObj = new URL(baseUrl);
  const host = urlObj.origin;
  
  // 可能的 API 端点路径
  const possiblePaths = [
    `${baseUrl}/api_jsonrpc.php`,           // 配置的路径 + /api_jsonrpc.php
    `${host}/api_jsonrpc.php`,              // 根路径 + /api_jsonrpc.php
    `${host}/zabbix/api_jsonrpc.php`,       // /zabbix 子目录
    `${host}/zabbix/api_jsonrpc.php`,       // 不同端口
  ];
  
  // 去重
  const uniquePaths = [...new Set(possiblePaths)];
  const tested: string[] = [];
  let found: string | null = null;
  
  for (const endpoint of uniquePaths) {
    tested.push(endpoint);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json-rpc' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'apiinfo.version',
          params: {},
          id: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });
      
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.result) {
            found = endpoint;
            break;
          }
        } catch {
          // 不是有效的 JSON
        }
      }
    } catch {
      // 忽略错误，继续测试下一个
    }
  }
  
  let suggestion: string | null = null;
  if (found) {
    // 从找到的端点推断正确的配置
    if (found.includes('/zabbix/api_jsonrpc.php')) {
      suggestion = `请在 .env 中设置:\nZABBIX_API_URL=${host}/zabbix`;
    } else if (found === `${host}/api_jsonrpc.php`) {
      suggestion = `Zabbix 部署在根路径，请在 .env 中设置:\nZABBIX_API_URL=${host}`;
    }
  }
  
  return { tested, found, suggestion };
}
