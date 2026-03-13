// 重新导出新的数据库客户端，保持向后兼容
export { getSupabaseClient, dbClient as getDbClient, isUsingMemoryStore, seedTable } from './db-client';
