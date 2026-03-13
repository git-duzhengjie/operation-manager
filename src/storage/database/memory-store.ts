/**
 * 内存存储适配器
 * 当数据库不可用时，自动回退到内存存储
 */

// 内存数据存储
const memoryStore: Map<string, Map<string, Record<string, unknown>>> = new Map();

// ID 生成器
let idCounter = 1;
function generateId(): number {
  return idCounter++;
}

// 初始化表的内存存储
function getTableStore(table: string): Map<string, Record<string, unknown>> {
  if (!memoryStore.has(table)) {
    memoryStore.set(table, new Map());
  }
  return memoryStore.get(table)!;
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
// 内存查询构建器
// ==========================================
class MemoryQueryBuilder<T = Record<string, unknown>> {
  private table: string;
  private selectColumns: string[] = ['*'];
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private countMode = false;
  private headMode = false;
  private singleMode = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): MemoryQueryBuilder<T> {
    this.selectColumns = columns.split(',').map(c => c.trim());
    return this;
  }

  eq(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): MemoryQueryBuilder<T> {
    this.filters.push(row => values.includes(row[column]));
    return this;
  }

  or(conditions: string): MemoryQueryBuilder<T> {
    // 简化实现：解析 "column.eq.value,column.eq.value" 格式
    const parts = conditions.split(',').map(c => {
      const [col, op, val] = c.split('.');
      return { col, op, val };
    });
    this.filters.push(row => 
      parts.some(({ col, op, val }) => {
        if (op === 'eq') return row[col] === val;
        if (op === 'ilike') return String(row[col] || '').toLowerCase().includes(val.toLowerCase());
        return false;
      })
    );
    return this;
  }

  gte(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') {
        return rowVal >= value;
      }
      return false;
    });
    return this;
  }

  lte(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') {
        return rowVal <= value;
      }
      return false;
    });
    return this;
  }

  gt(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') {
        return rowVal > value;
      }
      return false;
    });
    return this;
  }

  lt(column: string, value: unknown): MemoryQueryBuilder<T> {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'number' && typeof value === 'number') {
        return rowVal < value;
      }
      return false;
    });
    return this;
  }

  like(column: string, pattern: string): MemoryQueryBuilder<T> {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push(row => regex.test(String(row[column] || '')));
    return this;
  }

  ilike(column: string, pattern: string): MemoryQueryBuilder<T> {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push(row => regex.test(String(row[column] || '')));
    return this;
  }

  is(column: string, value: null | boolean): MemoryQueryBuilder<T> {
    if (value === null) {
      this.filters.push(row => row[column] === null || row[column] === undefined);
    } else {
      this.filters.push(row => row[column] === value);
    }
    return this;
  }

  isNull(column: string): MemoryQueryBuilder<T> {
    this.filters.push(row => row[column] === null || row[column] === undefined);
    return this;
  }

  isNotNull(column: string): MemoryQueryBuilder<T> {
    this.filters.push(row => row[column] !== null && row[column] !== undefined);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): MemoryQueryBuilder<T> {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  range(from: number, to: number): MemoryQueryBuilder<T> {
    this.limitCount = to - from + 1;
    this.offsetCount = from;
    return this;
  }

  limit(count: number): MemoryQueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  offset(count: number): MemoryQueryBuilder<T> {
    this.offsetCount = count;
    return this;
  }

  // 特殊方法
  countMode_enable(): MemoryQueryBuilder<T> {
    this.countMode = true;
    return this;
  }

  headMode_enable(): MemoryQueryBuilder<T> {
    this.headMode = true;
    return this;
  }

  singleMode_enable(): MemoryQueryBuilder<T> {
    this.singleMode = true;
    return this;
  }

  private projectRow(row: Record<string, unknown>): Record<string, unknown> {
    if (this.selectColumns.includes('*')) {
      return { ...row };
    }
    const projected: Record<string, unknown> = {};
    for (const col of this.selectColumns) {
      projected[col] = row[col];
    }
    return projected;
  }

  async execute(): Promise<QueryResultData<T>> {
    const store = getTableStore(this.table);
    let results = Array.from(store.values());

    // 应用过滤条件
    for (const filter of this.filters) {
      results = results.filter(filter);
    }

    // 应用排序
    for (const { column, ascending } of this.orderBy) {
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

    // 应用分页
    if (this.offsetCount !== undefined) {
      results = results.slice(this.offsetCount);
    }
    if (this.limitCount !== undefined) {
      results = results.slice(0, this.limitCount);
    }

    // 投影列
    const data = results.map(row => this.projectRow(row)) as T[];

    if (this.countMode) {
      return { data, error: null, count: results.length };
    }

    return { data, error: null, count: null };
  }

  async single(): Promise<SingleQueryResultData<T>> {
    const { data, error } = await this.execute();
    if (error) {
      return { data: null, error };
    }
    if (!data || data.length === 0) {
      return { data: null, error: { message: 'No rows found' } };
    }
    return { data: data[0], error: null };
  }
}

// ==========================================
// 插入构建器
// ==========================================
class MemoryInsertBuilder<T = Record<string, unknown>> {
  private table: string;
  private records: Record<string, unknown>[];

  constructor(table: string, records: Record<string, unknown> | Record<string, unknown>[]) {
    this.table = table;
    this.records = Array.isArray(records) ? records : [records];
  }

  select(): MemoryInsertBuilder<T> {
    return this;
  }

  async execute(): Promise<SingleQueryResultData<T>> {
    const store = getTableStore(this.table);
    const now = new Date().toISOString();

    const insertedRecords = this.records.map(record => {
      const id = generateId();
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
}

// ==========================================
// 更新构建器
// ==========================================
class MemoryUpdateBuilder<T = Record<string, unknown>> {
  private table: string;
  private updates: Record<string, unknown>;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];

  constructor(table: string, updates: Record<string, unknown>) {
    this.table = table;
    this.updates = updates;
  }

  eq(column: string, value: unknown): MemoryUpdateBuilder<T> {
    this.filters.push(row => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown): MemoryUpdateBuilder<T> {
    this.filters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): MemoryUpdateBuilder<T> {
    this.filters.push(row => values.includes(row[column]));
    return this;
  }

  select(): MemoryUpdateBuilder<T> {
    return this;
  }

  async execute(): Promise<SingleQueryResultData<T>> {
    const store = getTableStore(this.table);
    const now = new Date().toISOString();
    let updatedRecord: Record<string, unknown> | null = null;

    for (const [id, record] of store.entries()) {
      if (this.filters.every(filter => filter(record))) {
        const updated = {
          ...record,
          ...this.updates,
          updated_at: now,
        };
        store.set(id, updated);
        updatedRecord = updated;
        break; // 只更新第一条匹配记录
      }
    }

    if (!updatedRecord) {
      return { data: null, error: { message: 'No rows updated' } };
    }

    return { data: updatedRecord as T, error: null };
  }
}

// ==========================================
// 删除构建器
// ==========================================
class MemoryDeleteBuilder<T = Record<string, unknown>> {
  private table: string;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): MemoryDeleteBuilder<T> {
    this.filters.push(row => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown): MemoryDeleteBuilder<T> {
    this.filters.push(row => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): MemoryDeleteBuilder<T> {
    this.filters.push(row => values.includes(row[column]));
    return this;
  }

  async execute(): Promise<{ error: { message: string } | null }> {
    const store = getTableStore(this.table);

    for (const [id, record] of store.entries()) {
      if (this.filters.every(filter => filter(record))) {
        store.delete(id);
      }
    }

    return { error: null };
  }
}

// ==========================================
// 内存客户端
// ==========================================
class MemoryClient {
  from<T = Record<string, unknown>>(table: string): MemoryQueryBuilder<T> {
    return new MemoryQueryBuilder<T>(table);
  }

  insert<T = Record<string, unknown>>(table: string, records: Record<string, unknown> | Record<string, unknown>[]): MemoryInsertBuilder<T> {
    return new MemoryInsertBuilder<T>(table, records);
  }

  update<T = Record<string, unknown>>(table: string, updates: Record<string, unknown>): MemoryUpdateBuilder<T> {
    return new MemoryUpdateBuilder<T>(table, updates);
  }

  delete<T = Record<string, unknown>>(table: string): MemoryDeleteBuilder<T> {
    return new MemoryDeleteBuilder<T>(table);
  }
}

// 导出单例
export const memoryClient = new MemoryClient();

// 检查是否使用内存存储
let useMemoryStore = false;

export function setUseMemoryStore(value: boolean): void {
  useMemoryStore = value;
}

export function isUsingMemoryStore(): boolean {
  return useMemoryStore;
}

// 初始化种子数据
export function seedMemoryData(table: string, data: Record<string, unknown>[]): void {
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
