import { Pool } from 'pg';
import { execSync } from 'child_process';

let envLoaded = false;
let pool: Pool | null = null;

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

// 获取数据库连接池
function getPool(): Pool {
  if (!pool) {
    loadEnv();
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
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

// 查询结果类型
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

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): QueryBuilder<T> {
    this.selectColumns = columns.split(',').map(c => c.trim());
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  or(conditions: string): QueryBuilder<T> {
    // 解析条件如 "column.eq.value,column.eq.value"
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
    return this;
  }

  and(conditions: string): QueryBuilder<T> {
    this.whereClauses.push(`(${conditions})`);
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} >= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} <= $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} > $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`${column} < $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  like(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} LIKE $${this.whereParams.length + 1}`);
    this.whereParams.push(pattern);
    return this;
  }

  ilike(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} ILIKE $${this.whereParams.length + 1}`);
    this.whereParams.push(pattern);
    return this;
  }

  is(column: string, value: null | boolean): QueryBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
    }
    return this;
  }

  isNull(column: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} IS NULL`);
    return this;
  }

  isNotNull(column: string): QueryBuilder<T> {
    this.whereClauses.push(`${column} IS NOT NULL`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    const asc = options?.ascending !== false;
    this.orderByClauses.push(`${column} ${asc ? 'ASC' : 'DESC'}`);
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

  async execute(): Promise<QueryResultData<T>> {
    const client = getPool();
    
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
      
      return {
        data: result.rows as T[],
        error: null,
        count: result.rowCount,
      };
    } catch (error) {
      console.error('Database query error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
        count: null,
      };
    }
  }

  async then(resolve: (result: QueryResultData<T>) => void): Promise<void> {
    const result = await this.execute();
    resolve(result);
  }

  async single(): Promise<SingleQueryResultData<T>> {
    this.limitCount = 1;
    const result = await this.execute();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }

  async maybeSingle(): Promise<SingleQueryResultData<T>> {
    return this.single();
  }
}

// ==========================================
// 插入构建器
// ==========================================
class InsertBuilder<T = Record<string, unknown>> {
  private table: string;
  private data: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private returning: string[] = ['*'];

  constructor(table: string, data?: Record<string, unknown> | Record<string, unknown>[]) {
    this.table = table;
    this.data = data ?? null;
  }

  select(columns: string = '*'): InsertBuilder<T> {
    this.returning = columns.split(',').map(c => c.trim());
    return this;
  }

  async execute(): Promise<QueryResultData<T>> {
    const client = getPool();
    
    try {
      // 如果没有数据，返回空结果
      if (!this.data) {
        return {
          data: [],
          error: null,
          count: 0,
        };
      }
      
      const rows = Array.isArray(this.data) ? this.data : [this.data];
      const results: T[] = [];
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${this.returning.join(', ')}`;
        
        const result = await client.query(sql, values);
        results.push(result.rows[0] as T);
      }
      
      return {
        data: results,
        error: null,
        count: results.length,
      };
    } catch (error) {
      console.error('Database insert error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
        count: null,
      };
    }
  }

  async single(): Promise<SingleQueryResultData<T>> {
    const result = await this.execute();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }

  async then(resolve: (result: QueryResultData<T>) => void): Promise<void> {
    const result = await this.execute();
    resolve(result);
  }
}

// ==========================================
// 更新构建器
// ==========================================
class UpdateBuilder<T = Record<string, unknown>> {
  private table: string;
  private data: Record<string, unknown>;
  private whereClauses: string[] = [];
  private whereParams: unknown[] = [];
  private returning: string[] = ['*'];

  constructor(table: string, data: Record<string, unknown>) {
    this.table = table;
    this.data = data;
  }

  eq(column: string, value: unknown): UpdateBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  neq(column: string, value: unknown): UpdateBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  in(column: string, values: unknown[]): UpdateBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  is(column: string, value: null | boolean): UpdateBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
    }
    return this;
  }

  select(columns: string = '*'): UpdateBuilder<T> {
    this.returning = columns.split(',').map(c => c.trim());
    return this;
  }

  async execute(): Promise<QueryResultData<T>> {
    const client = getPool();
    
    try {
      const setColumns = Object.keys(this.data);
      const setValues = Object.values(this.data);
      const setClause = setColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      
      let sql = `UPDATE ${this.table} SET ${setClause}`;
      
      if (this.whereClauses.length > 0) {
        const adjustedWhere = this.whereClauses.map(w => {
          return w.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + setValues.length}`);
        });
        sql += ` WHERE ${adjustedWhere.join(' AND ')}`;
      }
      
      sql += ` RETURNING ${this.returning.join(', ')}`;
      
      const result = await client.query(sql, [...setValues, ...this.whereParams]);
      
      return {
        data: result.rows as T[],
        error: null,
        count: result.rowCount,
      };
    } catch (error) {
      console.error('Database update error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
        count: null,
      };
    }
  }

  async single(): Promise<SingleQueryResultData<T>> {
    const result = await this.execute();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }

  async then(resolve: (result: QueryResultData<T>) => void): Promise<void> {
    const result = await this.execute();
    resolve(result);
  }
}

// ==========================================
// 删除构建器
// ==========================================
class DeleteBuilder<T = Record<string, unknown>> {
  private table: string;
  private whereClauses: string[] = [];
  private whereParams: unknown[] = [];
  private returning: string[] = ['*'];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): DeleteBuilder<T> {
    this.whereClauses.push(`${column} = $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  neq(column: string, value: unknown): DeleteBuilder<T> {
    this.whereClauses.push(`${column} != $${this.whereParams.length + 1}`);
    this.whereParams.push(value);
    return this;
  }

  in(column: string, values: unknown[]): DeleteBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereClauses.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  is(column: string, value: null | boolean): DeleteBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
    } else {
      this.whereClauses.push(`${column} IS ${value}`);
    }
    return this;
  }

  select(columns: string = '*'): DeleteBuilder<T> {
    this.returning = columns.split(',').map(c => c.trim());
    return this;
  }

  async execute(): Promise<QueryResultData<T>> {
    const client = getPool();
    
    try {
      let sql = `DELETE FROM ${this.table}`;
      
      if (this.whereClauses.length > 0) {
        sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
      }
      
      sql += ` RETURNING ${this.returning.join(', ')}`;
      
      const result = await client.query(sql, this.whereParams);
      
      return {
        data: result.rows as T[],
        error: null,
        count: result.rowCount,
      };
    } catch (error) {
      console.error('Database delete error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
        count: null,
      };
    }
  }

  async then(resolve: (result: QueryResultData<T>) => void): Promise<void> {
    const result = await this.execute();
    resolve(result);
  }

  async single(): Promise<SingleQueryResultData<T>> {
    const result = await this.execute();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }
}

// ==========================================
// 表操作
// ==========================================
interface TableOperations<T> {
  select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => QueryBuilder<T>;
  insert: (data?: Record<string, unknown> | Record<string, unknown>[]) => InsertBuilder<T>;
  update: (data: Record<string, unknown>) => UpdateBuilder<T>;
  delete: () => DeleteBuilder<T>;
}

function createTableOperations<T>(table: string): TableOperations<T> {
  return {
    select: (columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
      const builder = new QueryBuilder<T>(table);
      builder.select(columns);
      return builder;
    },
    
    insert: (data?: Record<string, unknown> | Record<string, unknown>[]) => {
      return new InsertBuilder<T>(table, data);
    },
    
    update: (data: Record<string, unknown>) => {
      return new UpdateBuilder<T>(table, data);
    },
    
    delete: () => {
      return new DeleteBuilder<T>(table);
    },
  };
}

// ==========================================
// 数据库客户端
// ==========================================
interface DatabaseClient {
  from: <T = Record<string, unknown>>(table: string) => TableOperations<T>;
  rpc: <T = unknown>(fn: string, params?: Record<string, unknown>) => Promise<QueryResultData<T>>;
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<QueryResultData<T>>;
}

function getDbClient(): DatabaseClient {
  return {
    from: <T = Record<string, unknown>>(table: string) => createTableOperations<T>(table),
    
    rpc: async <T = unknown>(fn: string, params?: Record<string, unknown>) => {
      const client = getPool();
      try {
        const result = await client.query(`SELECT * FROM ${fn}($1)`, [params]);
        return {
          data: result.rows as T[],
          error: null,
          count: result.rowCount,
        };
      } catch (error) {
        return {
          data: null,
          error: { message: error instanceof Error ? error.message : 'Unknown error' },
          count: null,
        };
      }
    },
    
    query: async <T = unknown>(sql: string, params?: unknown[]) => {
      const client = getPool();
      try {
        const result = await client.query(sql, params);
        return {
          data: result.rows as T[],
          error: null,
          count: result.rowCount,
        };
      } catch (error) {
        return {
          data: null,
          error: { message: error instanceof Error ? error.message : 'Unknown error' },
          count: null,
        };
      }
    },
  };
}

// 兼容旧接口
function getSupabaseClient(): DatabaseClient {
  return getDbClient();
}

export { getPool, loadEnv, getSupabaseClient, getDbClient };
