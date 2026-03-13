// 数据库客户端导出
// getDbClient: 获取数据库客户端（PostgreSQL 或内存存储）
// getSupabaseClient: 别名，保持向后兼容
export { 
  dbClient as getDbClient, 
  dbClient as getSupabaseClient, 
  isUsingMemoryStore, 
  seedTable 
} from './db-client';
