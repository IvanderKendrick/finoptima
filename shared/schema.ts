import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  doublePrecision,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // Hashed password
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(), // Assets belong to user
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  value: doublePrecision("value").notNull(), // Current value held
  expectedReturn: doublePrecision("expected_return").notNull(), // %
  risk: doublePrecision("risk").notNull(), // Standard Deviation %
  color: text("color"), // For charts
});

export const assetReturns = pgTable(
  "asset_returns",
  {
    id: serial("id").primaryKey(),

    assetId: integer("asset_id")
      .references(() => assets.id, { onDelete: "cascade" })
      .notNull(),

    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),

    month: date("month").notNull(), // e.g. 2024-01-01 (represent month)

    returnPct: doublePrecision("return_pct").notNull(),
  },
  (table) => ({
    uniqueAssetMonth: uniqueIndex("asset_returns_asset_month_idx").on(
      table.assetId,
      table.month,
    ),
  }),
);

export const optimizationHistory = pgTable("optimization_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: timestamp("date").defaultNow(),
  parameters: text("parameters").notNull(), // JSON string of inputs
  return: doublePrecision("return").notNull(),
  risk: doublePrecision("risk").notNull(),
  sharpeRatio: doublePrecision("sharpe_ratio").notNull(),
  results: text("results").notNull(), // JSON string of asset weights
});

// Keep existing tables for dashboard demo data (metrics, history, frontier)
// but associate them with users if needed, or keep global for demo.
// For now, let's keep them as generic system data or per-user.
// To support the prompt's request for "History Page" distinct from "Optimization History",
// we'll assume "optimizationHistory" is what is needed.

export const portfolioHistory = pgTable(
  "portfolio_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    date: date("date").notNull(),
    value: doublePrecision("value").notNull(),
    allocations: text("allocations").notNull().default("{}"),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex("portfolio_history_user_date_idx").on(
      table.userId,
      table.date,
    ),
  }),
);

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  userId: true,
});
export const insertOptimizationSchema = createInsertSchema(
  optimizationHistory,
).omit({ id: true, userId: true, date: true });
export const insertHistorySchema = createInsertSchema(portfolioHistory).omit({
  id: true,
});

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Optimization = typeof optimizationHistory.$inferSelect;
export type HistoryPoint = typeof portfolioHistory.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

// Auth types
export type LoginRequest = Pick<InsertUser, "email" | "password">;
export type RegisterRequest = InsertUser;
export type AuthResponse = { user: Omit<User, "password">; token: string };
