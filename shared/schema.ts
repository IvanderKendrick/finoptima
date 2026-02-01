import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
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

export const portfolioMetrics = pgTable("portfolio_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Optional: user specific
  label: text("label").notNull(),
  value: text("value").notNull(),
  subValue: text("sub_value").notNull(),
  trend: doublePrecision("trend"),
});

export const portfolioHistory = pgTable(
  "portfolio_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    date: date("date").notNull(),
    value: doublePrecision("value").notNull(),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex("portfolio_history_user_date_idx").on(
      table.userId,
      table.date,
    ),
  }),
);

export const efficientFrontierPoints = pgTable("efficient_frontier_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Optional: user specific
  risk: doublePrecision("risk").notNull(),
  return: doublePrecision("return").notNull(),
  sharpeRatio: doublePrecision("sharpe_ratio").notNull(),
  isOptimal: boolean("is_optimal").default(false),
});

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
export const insertMetricSchema = createInsertSchema(portfolioMetrics).omit({
  id: true,
});
export const insertHistorySchema = createInsertSchema(portfolioHistory).omit({
  id: true,
});
export const insertPointSchema = createInsertSchema(
  efficientFrontierPoints,
).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Optimization = typeof optimizationHistory.$inferSelect;
export type Metric = typeof portfolioMetrics.$inferSelect;
export type HistoryPoint = typeof portfolioHistory.$inferSelect;
export type FrontierPoint = typeof efficientFrontierPoints.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

// Auth types
export type LoginRequest = Pick<InsertUser, "email" | "password">;
export type RegisterRequest = InsertUser;
export type AuthResponse = { user: Omit<User, "password">; token: string };

// Optimization types
export type OptimizationRequest = {
  assetIds: number[];
  weights?: Record<string, number>; // Optional manual weights
  riskTolerance?: number;
};
