import { db } from "./db";
import {
  assets,
  portfolioMetrics,
  portfolioHistory,
  efficientFrontierPoints,
  type Metric,
  type Asset,
  type HistoryPoint,
  type FrontierPoint
} from "@shared/schema";

export interface IStorage {
  getDashboardData(): Promise<{
    metrics: Metric[];
    assets: Asset[];
    history: HistoryPoint[];
    frontier: FrontierPoint[];
  }>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getDashboardData() {
    const [metricsData, assetsData, historyData, frontierData] = await Promise.all([
      db.select().from(portfolioMetrics),
      db.select().from(assets),
      db.select().from(portfolioHistory).orderBy(portfolioHistory.date),
      db.select().from(efficientFrontierPoints)
    ]);

    return {
      metrics: metricsData,
      assets: assetsData,
      history: historyData,
      frontier: frontierData
    };
  }

  async seedData() {
    const existing = await db.select().from(assets).limit(1);
    if (existing.length > 0) return;

    // Seed Metrics
    await db.insert(portfolioMetrics).values([
      { label: "Total Portfolio Value", value: "Rp 125,000,000", subValue: "Total Asset Value" },
      { label: "Expected Return", value: "12.5% / year", subValue: "Optimized Portfolio Return" },
      { label: "Portfolio Risk", value: "8.1%", subValue: "Standard Deviation" },
      { label: "Number of Assets", value: "7 Assets", subValue: "Diversified Holdings" }
    ]);

    // Seed Assets for Allocation
    await db.insert(assets).values([
      { symbol: "BBCA", name: "Bank Central Asia", value: 45000000, allocation: 36, color: "#059669" }, // Emerald 600
      { symbol: "BBRI", name: "Bank Rakyat Indonesia", value: 30000000, allocation: 24, color: "#10B981" }, // Emerald 500
      { symbol: "TLKM", name: "Telkom Indonesia", value: 20000000, allocation: 16, color: "#34D399" }, // Emerald 400
      { symbol: "BMRI", name: "Bank Mandiri", value: 15000000, allocation: 12, color: "#6EE7B7" }, // Emerald 300
      { symbol: "ASII", name: "Astra International", value: 10000000, allocation: 8, color: "#A7F3D0" }, // Emerald 200
      { symbol: "UNVR", name: "Unilever", value: 5000000, allocation: 4, color: "#D1FAE5" }, // Emerald 100
    ]);

    // Seed History
    const history = [];
    let value = 100000000;
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Random walk
      value = value * (1 + (Math.random() * 0.04 - 0.015)); 
      history.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }
    await db.insert(portfolioHistory).values(history);

    // Seed Efficient Frontier Points
    const points = [];
    for (let i = 0; i < 50; i++) {
      const risk = 5 + Math.random() * 15; // 5% to 20%
      // Simple curve approximation for frontier: Return ~ log(risk)
      const expectedReturn = 4 + Math.log(risk - 4) * 5 + (Math.random() * 2 - 1);
      
      points.push({
        risk: Number(risk.toFixed(2)),
        return: Number(expectedReturn.toFixed(2)),
        sharpeRatio: Number((expectedReturn / risk).toFixed(2)),
        isOptimal: false
      });
    }
    // Add optimal point
    points.push({
      risk: 8.1,
      return: 12.5,
      sharpeRatio: 1.54,
      isOptimal: true
    });
    
    await db.insert(efficientFrontierPoints).values(points);
  }
}

export const storage = new DatabaseStorage();
