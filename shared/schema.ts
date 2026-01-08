import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  value: doublePrecision("value").notNull(), // Current value held
  allocation: doublePrecision("allocation").notNull(), // Percentage 0-100
  color: text("color").notNull(), // For charts
});

export const portfolioMetrics = pgTable("portfolio_metrics", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(), // e.g. "Total Value", "Expected Return"
  value: text("value").notNull(), // Formatted string for display
  subValue: text("sub_value").notNull(), // Description/Subtitle
  trend: doublePrecision("trend"), // Optional trend percentage
});

export const portfolioHistory = pgTable("portfolio_history", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  value: doublePrecision("value").notNull(),
});

export const efficientFrontierPoints = pgTable("efficient_frontier_points", {
  id: serial("id").primaryKey(),
  risk: doublePrecision("risk").notNull(), // X-axis
  return: doublePrecision("return").notNull(), // Y-axis
  sharpeRatio: doublePrecision("sharpe_ratio").notNull(),
  isOptimal: boolean("is_optimal").default(false),
});

// === BASE SCHEMAS ===
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export const insertMetricSchema = createInsertSchema(portfolioMetrics).omit({ id: true });
export const insertHistorySchema = createInsertSchema(portfolioHistory).omit({ id: true });
export const insertPointSchema = createInsertSchema(efficientFrontierPoints).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Metric = typeof portfolioMetrics.$inferSelect;
export type HistoryPoint = typeof portfolioHistory.$inferSelect;
export type FrontierPoint = typeof efficientFrontierPoints.$inferSelect;

export type PortfolioSummaryResponse = {
  metrics: Metric[];
  assets: Asset[];
  history: HistoryPoint[];
  frontier: FrontierPoint[];
};
