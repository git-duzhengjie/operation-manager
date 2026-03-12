import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';

// 枚举定义
export const userRoleEnum = pgEnum('user_role', ['admin', 'internal', 'external']);
export const ticketStatusEnum = pgEnum('ticket_status', ['pending', 'assigned', 'processing', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const serviceTypeEnum = pgEnum('service_type', ['change', 'incident', 'request', 'problem']);
export const scheduleFreqEnum = pgEnum('schedule_freq', ['once', 'daily', 'weekly', 'monthly']);
export const articleTypeEnum = pgEnum('article_type', ['change', 'request', 'incident', 'service', 'problem']);

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  realName: varchar('real_name', { length: 50 }),
  role: userRoleEnum('role').default('external').notNull(),
  department: varchar('department', { length: 100 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 客户表
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  contact: varchar('contact', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: text('address'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 项目表
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  manager: varchar('manager', { length: 50 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 20 }).default('active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 资产表
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  projectId: integer('project_id').references(() => projects.id),
  name: varchar('name', { length: 100 }).notNull(),
  assetCode: varchar('asset_code', { length: 50 }).unique(),
  type: varchar('type', { length: 50 }), // 服务器、网络设备、应用系统等
  model: varchar('model', { length: 100 }),
  ip: varchar('ip', { length: 50 }),
  location: varchar('location', { length: 200 }),
  status: varchar('status', { length: 20 }).default('normal'),
  specifications: json('specifications'), // 规格配置
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 服务目录
export const serviceCatalog = pgTable('service_catalog', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }),
  icon: varchar('icon', { length: 50 }),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 工单表
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  ticketNo: varchar('ticket_no', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  type: serviceTypeEnum('type').notNull(),
  catalogId: integer('catalog_id').references(() => serviceCatalog.id),
  customerId: integer('customer_id').references(() => customers.id),
  projectId: integer('project_id').references(() => projects.id),
  assetId: integer('asset_id').references(() => assets.id),
  priority: ticketPriorityEnum('priority').default('medium'),
  status: ticketStatusEnum('status').default('pending'),
  description: text('description'),
  formData: json('form_data'), // 自定义表单数据
  creatorId: integer('creator_id').references(() => users.id),
  assigneeId: integer('assignee_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 工单流转历史
export const ticketHistory = pgTable('ticket_history', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => tickets.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, assigned, processed, resolved, closed
  fromStatus: ticketStatusEnum('from_status'),
  toStatus: ticketStatusEnum('to_status'),
  fromAssignee: integer('from_assignee'),
  toAssignee: integer('to_assignee'),
  comment: text('comment'),
  operatorId: integer('operator_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 工单附件
export const ticketAttachments = pgTable('ticket_attachments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => tickets.id).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 知识库文章
export const knowledgeArticles = pgTable('knowledge_articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  type: articleTypeEnum('type').notNull(),
  catalogId: integer('catalog_id'),
  tags: json('tags'), // 标签数组
  content: text('content').notNull(),
  format: varchar('format', { length: 20 }).default('markdown'), // txt, markdown, html
  version: integer('version').default(1),
  authorId: integer('author_id').references(() => users.id),
  viewCount: integer('view_count').default(0),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 文章版本历史
export const articleVersions = pgTable('article_versions', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').references(() => knowledgeArticles.id).notNull(),
  version: integer('version').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 流程定义
export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: serviceTypeEnum('type').notNull(),
  catalogId: integer('catalog_id').references(() => serviceCatalog.id),
  nodes: json('nodes'), // 流程节点定义
  edges: json('edges'), // 流程边定义
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 表单模板
export const formTemplates = pgTable('form_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  catalogId: integer('catalog_id').references(() => serviceCatalog.id),
  fields: json('fields'), // 字段定义数组
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 例行任务
export const scheduledTasks = pgTable('scheduled_tasks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  catalogId: integer('catalog_id').references(() => serviceCatalog.id),
  frequency: scheduleFreqEnum('frequency').notNull(),
  cronExpression: varchar('cron_expression', { length: 100 }),
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  formData: json('form_data'), // 预设表单数据
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 监控告警记录
export const monitorAlerts = pgTable('monitor_alerts', {
  id: serial('id').primaryKey(),
  alertId: varchar('alert_id', { length: 100 }).notNull().unique(),
  source: varchar('source', { length: 50 }), // 来源系统
  level: varchar('level', { length: 20 }), // critical, warning, info
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  assetId: integer('asset_id').references(() => assets.id),
  ticketId: integer('ticket_id').references(() => tickets.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, processing, resolved
  receivedAt: timestamp('received_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// 操作日志
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: integer('resource_id'),
  details: json('details'),
  ip: varchar('ip', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketHistory = typeof ticketHistory.$inferSelect;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type MonitorAlert = typeof monitorAlerts.$inferSelect;
