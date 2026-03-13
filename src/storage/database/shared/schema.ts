import { pgTable, serial, timestamp, varchar, integer, text, jsonb, index } from "drizzle-orm/pg-core";
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

// TypeScript 类型
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
