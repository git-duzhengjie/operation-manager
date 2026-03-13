// 数据库客户端导出
// getDbClient: 获取数据库客户端实例（PostgreSQL 或内存存储）
// dbClient: 数据库客户端实例（可直接使用）
export { 
  dbClient,
  getDbClient,
  isUsingMemoryStore, 
  seedTable 
} from './db-client';
