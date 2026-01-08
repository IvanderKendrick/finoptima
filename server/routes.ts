import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed data on startup
  await storage.seedData();

  app.get(api.dashboard.get.path, async (_req, res) => {
    const data = await storage.getDashboardData();
    res.json(data);
  });

  return httpServer;
}
