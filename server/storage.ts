import { db } from "./db";
import {
  users,
  assets,
  assetReturns,
  optimizationHistory,
  portfolioHistory,
  portfolioMetrics,
  efficientFrontierPoints,
  type User,
  type InsertUser,
  type Asset,
  type InsertAsset,
  type Optimization,
  type Metric,
  type HistoryPoint,
  type FrontierPoint,
} from "@shared/schema";
import { eq, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;

  // Asset operations
  getAssets(userId: number): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset & { userId: number }): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: number): Promise<void>;

  // Dashboard operations
  getDashboardData(userId: number): Promise<{
    metrics: Metric[];
    assets: Asset[];
    history: HistoryPoint[];
    frontier: Optimization[];
  }>;

  // Optimization operations
  createOptimizationHistory(
    userId: number,
    optimization: Omit<Optimization, "id" | "userId" | "date">,
  ): Promise<Optimization>;
  getOptimizationHistory(userId: number): Promise<Optimization[]>;
  deleteOptimizationHistory(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async getAssets(userId: number): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.userId, userId));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset & { userId: number }): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async createAssetReturns(input: {
    assetId: number;
    userId: number;
    returns: { month: string; value: number }[];
  }): Promise<void> {
    // optional: hapus data lama dulu
    await db
      .delete(assetReturns)
      .where(eq(assetReturns.assetId, input.assetId));

    // insert batch
    await db.insert(assetReturns).values(
      input.returns.map((r) => ({
        assetId: input.assetId,
        userId: input.userId,
        month: `${r.month}-01`, // <-- STRING, bukan Date
        returnPct: r.value,
      })),
    );
  }

  async getAssetReturns(
    assetId: number,
  ): Promise<{ month: string; value: number }[]> {
    const rows = await db
      .select({
        month: assetReturns.month,
        value: assetReturns.returnPct,
      })
      .from(assetReturns)
      .where(eq(assetReturns.assetId, assetId))
      .orderBy(assetReturns.month);

    return rows.map((r) => ({
      month: r.month, // sudah string YYYY-MM-DD
      value: r.value,
    }));
  }

  async getAssetMonthlyReturns(assetIds: number[]) {
    const rows = await db
      .select({
        assetId: assetReturns.assetId,
        month: assetReturns.month,
        value: assetReturns.returnPct,
      })
      .from(assetReturns)
      .where(inArray(assetReturns.assetId, assetIds))
      .orderBy(assetReturns.month);

    return rows;
  }

  async updateAssetRiskAndReturn(
    assetId: number,
    expectedReturn: number,
    risk: number,
  ): Promise<void> {
    await db
      .update(assets)
      .set({
        expectedReturn,
        risk,
      })
      .where(eq(assets.id, assetId));
  }

  async createOrUpdatePortfolioHistory(data: {
    userId: number;
    date: string;
    value: number;
  }): Promise<HistoryPoint> {
    const [history] = await db
      .insert(portfolioHistory)
      .values(data)
      .onConflictDoUpdate({
        target: [portfolioHistory.userId, portfolioHistory.date],
        set: { value: data.value },
      })
      .returning();

    return history;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
    const [updatedAsset] = await db
      .update(assets)
      .set(asset)
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  async getDashboardData(userId: number) {
    // For MVP, we'll return seeded/mock data structure but scoped if possible.
    // Since metrics/history/frontier tables are not strictly user-scoped in schema yet (optional),
    // we will fetch all or mock if empty.

    // Check if user has assets
    const userAssets = await this.getAssets(userId);

    // NOTE: In a real app, metrics would be calculated from assets.
    // Here we return mock metrics or user specific metrics if we implemented that fully.
    // For now, let's return some default metrics if none exist for user, or empty.

    // We will use the seeded data tables for demo purposes on the dashboard
    // but filtered by userId if columns exist.
    // In schema.ts, I made userId optional for metrics/history/frontier.

    const [metricsData, historyData, frontierData] = await Promise.all([
      db.select().from(portfolioMetrics),
      db
        .select()
        .from(portfolioHistory)
        .where(eq(portfolioHistory.userId, userId))
        .orderBy(portfolioHistory.date),
      db
        .select()
        .from(optimizationHistory)
        .where(eq(optimizationHistory.userId, userId)) // Scope jika userId ada di schema optimizationHistory
        .orderBy(desc(optimizationHistory.date)), // Urutkan berdasarkan tanggal terbaru (descending)
    ]);

    return {
      metrics: metricsData,
      assets: userAssets,
      history: historyData,
      frontier: frontierData,
    };
  }

  async createOptimizationHistory(
    userId: number,
    optimization: Omit<Optimization, "id" | "userId" | "date">,
  ): Promise<Optimization> {
    const [opt] = await db
      .insert(optimizationHistory)
      .values({
        ...optimization,
        userId,
      })
      .returning();
    return opt;
  }

  async getOptimizationHistory(userId: number): Promise<Optimization[]> {
    return db
      .select()
      .from(optimizationHistory)
      .where(eq(optimizationHistory.userId, userId));
  }

  async getPortfolioHistory(userId: number): Promise<HistoryPoint[]> {
    return db
      .select()
      .from(portfolioHistory)
      .where(eq(portfolioHistory.userId, userId));
  }

  async deleteOptimizationHistory(id: number): Promise<void> {
    await db.delete(optimizationHistory).where(eq(optimizationHistory.id, id));
  }

  async deletePortfolioHistory(id: number): Promise<void> {
    await db.delete(portfolioHistory).where(eq(portfolioHistory.id, id));
  }
}

export const storage = new DatabaseStorage();
