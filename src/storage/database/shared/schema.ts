import { pgTable, serial, timestamp, varchar, integer, text, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 系统表 - 必须保留
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 资产表
export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id"),
    projectId: integer("project_id"),
    name: varchar("name", { length: 100 }).notNull(),
    assetCode: varchar("asset_code", { length: 50 }).unique(),
    type: varchar("type", { length: 50 }),
    model: varchar("model", { length: 100 }),
    ip: varchar("ip", { length: 50 }),
    location: varchar("location", { length: 200 }),
    status: varchar("status", { length: 20 }).default('normal'),
    specifications: jsonb("specifications"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("assets_type_idx").on(table.type),
    index("assets_status_idx").on(table.status),
    index("assets_customer_idx").on(table.customerId),
  ]
);

// 通知表
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 20 }).default('info').notNull(),
    category: varchar("category", { length: 20 }).default('system').notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    userId: integer("user_id"),
    relatedId: varchar("related_id", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
    index("notifications_category_idx").on(table.category),
  ]
);

// 表单模板表
export const formTemplates = pgTable(
  "form_templates",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    catalogId: integer("catalog_id"),
    catalogName: varchar("catalog_name", { length: 100 }),
    description: text("description"),
    fields: jsonb("fields").notNull().$type<FormTemplateField[]>(),
    isActive: boolean("is_active").default(true).notNull(),
    version: integer("version").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("form_templates_catalog_idx").on(table.catalogId),
    index("form_templates_active_idx").on(table.isActive),
  ]
);

// 表单字段类型定义
export interface FormTemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'file' | 'user' | 'department';
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

// 流程步骤定义
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'processing' | 'notification' | 'condition' | 'end';
  order: number;
  assignee?: {
    type: 'user' | 'role' | 'department' | 'script';
    value: string;
  };
  timeout?: number; // 超时时间（小时）
  actions?: {
    name: string;
    targetStep?: string;
  }[];
  conditions?: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
    value: string;
    targetStep: string;
  }[];
}

// 流程表
export const workflows = pgTable(
  "workflows",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // incident, change, request, problem
    catalogId: integer("catalog_id"),
    catalogName: varchar("catalog_name", { length: 100 }),
    description: text("description"),
    steps: jsonb("steps").notNull().$type<WorkflowStep[]>(),
    isActive: boolean("is_active").default(true).notNull(),
    version: integer("version").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("workflows_type_idx").on(table.type),
    index("workflows_catalog_idx").on(table.catalogId),
    index("workflows_active_idx").on(table.isActive),
  ]
);

// 服务目录表（一级分类）
export const serviceCatalogs = pgTable(
  "service_catalogs",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    icon: varchar("icon", { length: 10 }),
    description: text("description"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("service_catalogs_active_idx").on(table.isActive),
  ]
);

// 服务项目表（二级分类）
export const serviceItems = pgTable(
  "service_items",
  {
    id: serial("id").primaryKey(),
    catalogId: integer("catalog_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    workflowId: integer("workflow_id"),
    formTemplateId: integer("form_template_id"),
    slaTime: integer("sla_time"), // SLA时间（小时）
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("service_items_catalog_idx").on(table.catalogId),
    index("service_items_workflow_idx").on(table.workflowId),
    index("service_items_active_idx").on(table.isActive),
  ]
);

// 告警表
export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    alertId: varchar("alert_id", { length: 50 }).notNull(), // 外部告警ID
    source: varchar("source", { length: 50 }).notNull(), // Zabbix, Prometheus, etc.
    level: varchar("level", { length: 20 }).notNull(), // critical, warning, info
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    assetId: integer("asset_id"),
    assetName: varchar("asset_name", { length: 100 }),
    customerId: integer("customer_id"),
    customerName: varchar("customer_name", { length: 100 }),
    status: varchar("status", { length: 20 }).default('pending').notNull(), // pending, processing, resolved, ignored
    ticketId: integer("ticket_id"),
    ticketCode: varchar("ticket_code", { length: 50 }),
    rawData: jsonb("raw_data"), // 原始告警数据
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("alerts_alert_id_idx").on(table.alertId),
    index("alerts_level_idx").on(table.level),
    index("alerts_status_idx").on(table.status),
    index("alerts_source_idx").on(table.source),
    index("alerts_asset_idx").on(table.assetId),
    index("alerts_created_idx").on(table.createdAt),
  ]
);

// 系统日志表
export const systemLogs = pgTable(
  "system_logs",
  {
    id: serial("id").primaryKey(),
    user: varchar("user", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 100 }),
    ip: varchar("ip", { length: 50 }),
    status: varchar("status", { length: 20 }).notNull(), // success, failed
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("system_logs_user_idx").on(table.user),
    index("system_logs_action_idx").on(table.action),
    index("system_logs_status_idx").on(table.status),
    index("system_logs_created_idx").on(table.createdAt),
  ]
);

// TypeScript 类型
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export type ServiceCatalog = typeof serviceCatalogs.$inferSelect;
export type InsertServiceCatalog = typeof serviceCatalogs.$inferInsert;
export type ServiceItem = typeof serviceItems.$inferSelect;
export type InsertServiceItem = typeof serviceItems.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;
