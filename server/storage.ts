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
import { eq, inArray, desc, and } from "drizzle-orm";

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
  getOptimizationHistoryById(userId: number, id: number): Promise<Optimization>;
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
    // Check if user has assets
    const userAssets = await this.getAssets(userId);

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

    // Metric 1: Total Portfolio Value
    const portfolioHistoryData = historyData;
    const latestPortfolio =
      portfolioHistoryData[portfolioHistoryData.length - 1]; // Latest portfolio value
    const earliestPortfolio = portfolioHistoryData[0]; // Earliest portfolio value

    const totalValue = latestPortfolio.value;
    const initialValue = earliestPortfolio.value;

    // Calculate subValue (total change since the earliest record)
    const subValue = totalValue - initialValue;

    // Calculate trend (percentage change from earliest to latest)
    const trend = ((totalValue - initialValue) / initialValue) * 100;

    // Add new metric for Total Portfolio Value
    const totalPortfolioValueMetric = {
      id: 1, // Make sure the ID is unique for each metric
      userId: userId,
      label: "Total Portfolio Value",
      value: totalValue.toLocaleString(), // Format as currency or number
      subValue:
        subValue >= 0
          ? `+${subValue.toLocaleString()}`
          : `${subValue.toLocaleString()}`,
      trend: trend, // Format trend as percentage with two decimals
    };

    // Add Metric 2: Expected Return
    const latestOptimization = frontierData[0]; // Latest optimization data
    const earliestOptimization = frontierData[frontierData.length - 1]; // Earliest optimization data

    const expectedReturn = latestOptimization.return;
    const initialReturn = earliestOptimization.return;

    // Calculate subValue (total change in return)
    const returnSubValue = expectedReturn - initialReturn;

    // Calculate trend (percentage change in return)
    const returnTrend =
      ((expectedReturn - initialReturn) / initialReturn) * 100;

    const expectedReturnMetric = {
      id: 2,
      userId: userId,
      label: "Expected Return",
      value: expectedReturn.toFixed(2) + "%", // Display as percentage
      subValue:
        returnSubValue >= 0
          ? `+${returnSubValue.toFixed(2)}%`
          : `${returnSubValue.toFixed(2)}%`, // Format subValue as percentage
      trend: returnTrend, // Store trend as number
    };

    // Add Metric 3: Portfolio Risk
    const latestRisk = latestOptimization.risk;
    const earliestRisk = earliestOptimization.risk;

    // Calculate subValue (total change in risk)
    const riskSubValue = latestRisk - earliestRisk;

    // Calculate trend (percentage change in risk)
    const riskTrend = ((latestRisk - earliestRisk) / earliestRisk) * 100;

    const portfolioRiskMetric = {
      id: 3,
      userId: userId,
      label: "Portfolio Risk",
      value: latestRisk.toFixed(2), // Display as number
      subValue:
        riskSubValue >= 0
          ? `+${riskSubValue.toFixed(2)}`
          : `${riskSubValue.toFixed(2)}`, // Format subValue
      trend: riskTrend, // Store trend as number
    };

    // Add metrics to the data
    metricsData.push(totalPortfolioValueMetric);
    metricsData.push(expectedReturnMetric);
    metricsData.push(portfolioRiskMetric);

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
