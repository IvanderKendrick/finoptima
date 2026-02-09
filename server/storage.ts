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
import { eq, and, inArray } from "drizzle-orm";

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
    frontier: FrontierPoint[];
  }>;

  // Optimization operations
  createOptimizationHistory(
    userId: number,
    optimization: Omit<Optimization, "id" | "userId" | "date">,
  ): Promise<Optimization>;
  getOptimizationHistory(userId: number): Promise<Optimization[]>;
  deleteOptimizationHistory(id: number): Promise<void>;

  // Seed data for new users
  seedUserData(userId: number): Promise<void>;
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

  async createOrUpdatePortfolioHistory(data: {
    userId: number;
    date: string;
    value: number;
  }): Promise<PortfolioHistory> {
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
      db.select().from(portfolioMetrics), // Returns all (demo data)
      db.select().from(portfolioHistory).orderBy(portfolioHistory.date), // Returns all (demo data)
      db.select().from(efficientFrontierPoints), // Returns all (demo data)
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

  async seedUserData(userId: number) {
    // Check if user already has assets
    const existing = await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId))
      .limit(1);
    if (existing.length > 0) return;

    // Seed Default Assets for new user
    await db.insert(assets).values([
      {
        userId,
        symbol: "BBCA",
        name: "Bank Central Asia",
        value: 45000000,
        expectedReturn: 12.5,
        risk: 8.5,
        color: "#059669",
      },
      {
        userId,
        symbol: "BBRI",
        name: "Bank Rakyat Indonesia",
        value: 30000000,
        expectedReturn: 14.2,
        risk: 10.1,
        color: "#10B981",
      },
      {
        userId,
        symbol: "TLKM",
        name: "Telkom Indonesia",
        value: 20000000,
        expectedReturn: 8.5,
        risk: 6.2,
        color: "#34D399",
      },
      {
        userId,
        symbol: "BMRI",
        name: "Bank Mandiri",
        value: 15000000,
        expectedReturn: 13.8,
        risk: 9.8,
        color: "#6EE7B7",
      },
      {
        userId,
        symbol: "ASII",
        name: "Astra International",
        value: 10000000,
        expectedReturn: 10.5,
        risk: 7.5,
        color: "#A7F3D0",
      },
      {
        userId,
        symbol: "UNVR",
        name: "Unilever",
        value: 5000000,
        expectedReturn: 7.2,
        risk: 5.5,
        color: "#D1FAE5",
      },
    ]);
  }
}

export const storage = new DatabaseStorage();
