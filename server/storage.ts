import { db } from "./db";
import {
  users,
  assets,
  assetReturns,
  optimizationHistory,
  portfolioHistory,
  type User,
  type InsertUser,
  type Asset,
  type InsertAsset,
  type Optimization,
  type HistoryPoint,
} from "@shared/schema";
import { eq, inArray, desc, and } from "drizzle-orm";

type DashboardMetric = {
  id: number;
  userId: number;
  label: string;
  value: string;
  subValue: string;
  trend: number | null;
};

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
    metrics: DashboardMetric[];
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
  getOptimizationHistoryById(userId: number, id: number): Promise<Optimization>;

  // Portfolio history operations
  getPortfolioHistoryById(
    userId: number,
    id: number,
  ): Promise<typeof portfolioHistory.$inferSelect | null>;
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
    allocations: string;
  }): Promise<HistoryPoint> {
    const [history] = await db
      .insert(portfolioHistory)
      .values(data)
      .onConflictDoUpdate({
        target: [portfolioHistory.userId, portfolioHistory.date],
        set: { value: data.value, allocations: data.allocations },
      })
      .returning();

    return history;
  }

  async getPortfolioHistoryById(userId: number, id: number) {
    const rows = await db
      .select()
      .from(portfolioHistory)
      .where(
        and(eq(portfolioHistory.userId, userId), eq(portfolioHistory.id, id)),
      )
      .limit(1);

    return rows[0] ?? null;
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
    const userAssets = await this.getAssets(userId);

    const [historyData, frontierData] = await Promise.all([
      db
        .select()
        .from(portfolioHistory)
        .where(eq(portfolioHistory.userId, userId))
        .orderBy(portfolioHistory.date),
      db
        .select()
        .from(optimizationHistory)
        .where(eq(optimizationHistory.userId, userId))
        .orderBy(desc(optimizationHistory.date)),
    ]);

    const metrics: DashboardMetric[] = [];

    // ===== Metric 1: Total Portfolio Value =====
    if (historyData.length >= 1) {
      const latest = historyData[historyData.length - 1];
      const earliest = historyData[0];

      const totalValue = latest.value;
      const initialValue = earliest.value;

      const subValue = totalValue - initialValue;
      const trend =
        initialValue !== 0
          ? ((totalValue - initialValue) / initialValue) * 100
          : 0;

      metrics.push({
        id: 1,
        userId,
        label: "Total Portfolio Value",
        value: totalValue.toLocaleString("id-ID"),
        subValue:
          subValue >= 0
            ? `+${subValue.toLocaleString("id-ID")}`
            : `${subValue.toLocaleString("id-ID")}`,
        trend,
      });
    }

    // ===== Metric 2 & 3: dari optimizationHistory =====
    if (frontierData.length >= 1) {
      const latestOpt = frontierData[0];
      const earliestOpt = frontierData[frontierData.length - 1];

      // Expected Return
      const expectedReturn = latestOpt.return;
      const initialReturn = earliestOpt.return;
      const returnSubValue = expectedReturn - initialReturn;
      const returnTrend =
        initialReturn !== 0
          ? ((expectedReturn - initialReturn) / initialReturn) * 100
          : 0;

      metrics.push({
        id: 2,
        userId,
        label: "Expected Return",
        value: `${expectedReturn.toFixed(2)}%`,
        subValue:
          returnSubValue >= 0
            ? `+${returnSubValue.toFixed(2)}%`
            : `${returnSubValue.toFixed(2)}%`,
        trend: returnTrend,
      });

      // Portfolio Risk
      const latestRisk = latestOpt.risk;
      const earliestRisk = earliestOpt.risk;
      const riskSubValue = latestRisk - earliestRisk;
      const riskTrend =
        earliestRisk !== 0
          ? ((latestRisk - earliestRisk) / earliestRisk) * 100
          : 0;

      metrics.push({
        id: 3,
        userId,
        label: "Portfolio Risk",
        value: latestRisk.toFixed(2),
        subValue:
          riskSubValue >= 0
            ? `+${riskSubValue.toFixed(2)}`
            : `${riskSubValue.toFixed(2)}`,
        trend: riskTrend,
      });
    }

    return {
      metrics,
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

  async getOptimizationHistoryById(userId: number, id: number) {
    const rows = await db
      .select()
      .from(optimizationHistory)
      .where(
        and(
          eq(optimizationHistory.userId, userId),
          eq(optimizationHistory.id, id),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
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
