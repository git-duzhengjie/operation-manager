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
    client.release();
    
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
    { id: 1, title: '工单已分配', message: '工单 WO20240101001 已分配给您处理，请及时查看并处理。', type: 'info', category: 'workorder', is_read: false, related_id: 'WO20240101001', created_at: now },
    { id: 2, title: '告警通知', message: '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。', type: 'warning', category: 'alert', is_read: false, related_id: 'AST001', created_at: now },
    { id: 3, title: '工单已完成', message: '工单 WO20240101003 已被标记为已完成，感谢您的处理。', type: 'success', category: 'workorder', is_read: true, related_id: 'WO20240101003', created_at: now },
  ];
  
  const notificationsStore = getTableStore('notifications');
  defaultNotifications.forEach(notif => {
    notificationsStore.set(String(notif.id), notif as unknown as Record<string, unknown>);
  });
  
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
    this.memoryFilters.push(row => row[column] === value);
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
    this.memoryFilters.push(row => row[column] === value);
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
        updatedRecord = updated;
        break;
      }
    }

    if (!updatedRecord) {
      return { data: null, error: { message: 'No rows updated' } };
    }

    return { data: updatedRecord as T, error: null };
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
    this.memoryFilters.push(row => row[column] === value);
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

    for (const [id, record] of store.entries()) {
      if (this.memoryFilters.every(filter => filter(record))) {
        if (this.returnDeleted) {
          this.deletedData = { ...record };
        }
        store.delete(id);
        break; // 只删除第一条匹配记录
      }
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

// 兼容旧代码的导出
export function getSupabaseClient(): DatabaseClient {
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
