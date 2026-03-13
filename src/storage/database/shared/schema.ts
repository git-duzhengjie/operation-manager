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

// TypeScript 类型
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;
