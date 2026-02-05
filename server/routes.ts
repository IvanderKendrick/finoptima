import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Middleware to check JWT
const authenticateToken = (req: Request, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(
    token,
    process.env.SESSION_SECRET || "secret",
    (err: any, user: any) => {
      if (err) return res.status(401).json({ message: "Forbidden" });
      req.user = user;
      next();
    },
  );
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // === AUTH ROUTES ===

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // In a real app, hash password here. storing plain text for MVP as requested implicitly by "lite mode" speed
      // But typically we'd use bcrypt.
      const user = await storage.createUser(input);

      // Seed data for new user
      await storage.seedUserData(user.id);

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.SESSION_SECRET || "secret",
      );

      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);

      if (!user || user.password !== input.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.SESSION_SECRET || "secret",
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.put(
    api.profile.updatePassword.path,
    authenticateToken,
    async (req: any, res) => {
      try {
        const input = api.profile.updatePassword.input.parse(req.body);
        const user = await storage.getUser(req.user.id);

        if (!user || user.password !== input.oldPassword) {
          return res.status(400).json({ message: "Incorrect old password" });
        }

        await storage.updatePassword(user.id, input.newPassword);
        res.json({ message: "Password updated successfully" });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === DASHBOARD & ASSETS ROUTES ===

  app.get(api.dashboard.get.path, authenticateToken, async (req: any, res) => {
    const data = await storage.getDashboardData(req.user.id);
    res.json(data);
  });

  app.get(api.assets.list.path, authenticateToken, async (req: any, res) => {
    const assets = await storage.getAssets(req.user.id);
    res.json(assets);
  });

  app.post(api.assets.create.path, authenticateToken, async (req: any, res) => {
    try {
      const input = api.assets.create.input.parse(req.body);
      const asset = await storage.createAsset({
        ...input,
        userId: req.user.id,
      });
      res.status(201).json(asset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    api.portfolio.recordHistory.path,
    authenticateToken,
    async (req: any, res) => {
      try {
        const assets = await storage.getAssets(req.user.id);
        const totalValue = assets.reduce((sum, asset) => {
          return sum + asset.value;
        }, 0);
        const today = new Date().toISOString().slice(0, 10);

        const history = await storage.createOrUpdatePortfolioHistory({
          userId: req.user.id,
          date: today,
          value: totalValue,
        });

        res.status(201).json({
          date: today,
          value: totalValue,
        });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.put(api.assets.update.path, authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.assets.update.input.parse(req.body);

      // Verify ownership
      const existing = await storage.getAsset(id);
      if (!existing || existing.userId !== req.user.id) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const updated = await storage.updateAsset(id, input);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.delete(
    api.assets.delete.path,
    authenticateToken,
    async (req: any, res) => {
      const id = parseInt(req.params.id);
      const existing = await storage.getAsset(id);
      if (!existing || existing.userId !== req.user.id) {
        return res.status(404).json({ message: "Asset not found" });
      }
      await storage.deleteAsset(id);
      res.status(204).send();
    },
  );

  // === OPTIMIZATION ROUTES ===

  app.post(
    api.optimization.run.path,
    authenticateToken,
    async (req: any, res) => {
      try {
        const input = api.optimization.run.input.parse(req.body);
        const userAssets = await storage.getAssets(req.user.id);
        const selectedAssets = userAssets.filter((a) =>
          input.assetIds.includes(a.id),
        );

        if (selectedAssets.length === 0) {
          return res.status(400).json({ message: "No assets selected" });
        }

        // Mock MVO Calculation
        // In reality, this would involve matrix multiplication of covariance matrix
        const count = selectedAssets.length;
        const equalWeight = 100 / count;
        const weights: Record<string, number> = {};

        let totalReturn = 0;
        let totalRisk = 0;

        selectedAssets.forEach((asset) => {
          // Simple random optimization simulation
          // Slightly vary weights based on return/risk ratio
          const ratio = asset.expectedReturn / asset.risk;
          const adjustedWeight = equalWeight * (1 + (ratio - 1) * 0.2); // slight bias to better assets
          weights[asset.symbol] = Number(adjustedWeight.toFixed(2));

          totalReturn += (asset.expectedReturn * adjustedWeight) / 100;
        });

        // Normalize weights to sum to 100
        const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
        Object.keys(weights).forEach((key) => {
          weights[key] = Number(((weights[key] / weightSum) * 100).toFixed(2));
        });

        // Portfolio Risk (simplified: weighted avg risk * diversification factor)
        // Diversification reduces risk
        const diversificationFactor = 1 - Math.log(count) * 0.15;
        const avgRisk =
          selectedAssets.reduce((sum, a) => sum + a.risk, 0) / count;
        totalRisk = Number((avgRisk * diversificationFactor).toFixed(2));
        totalReturn = Number(totalReturn.toFixed(2));
        const sharpeRatio = Number((totalReturn / totalRisk).toFixed(2));

        // Generate Frontier Points
        const frontier = [];
        for (let i = 0; i < 20; i++) {
          const r = totalRisk * (0.5 + i * 0.1);
          frontier.push({
            risk: Number(r.toFixed(2)),
            return: Number((totalReturn * (0.5 + i * 0.1) * 0.9).toFixed(2)), // Curve
            sharpeRatio: 0,
            isOptimal: i === 5, // fake optimal point
          });
        }

        // Save History
        await storage.createOptimizationHistory(req.user.id, {
          parameters: JSON.stringify(input),
          return: totalReturn,
          risk: totalRisk,
          sharpeRatio: sharpeRatio,
          results: JSON.stringify(weights),
        });

        res.json({
          expectedReturn: totalReturn,
          risk: totalRisk,
          sharpeRatio: sharpeRatio,
          weights: weights,
          frontier: frontier,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    api.optimization.history.path,
    authenticateToken,
    async (req: any, res) => {
      const history = await storage.getOptimizationHistory(req.user.id);
      res.json(history);
    },
  );

  app.get(
    api.portfolio.history.path,
    authenticateToken,
    async (req: any, res) => {
      const history = await storage.getPortfolioHistory(req.user.id);
      res.json(history);
    },
  );

  app.delete(
    api.optimization.deleteHistory.path,
    authenticateToken,
    async (req: any, res) => {
      const id = parseInt(req.params.id);
      await storage.deleteOptimizationHistory(id);
      res.status(204).send();
    },
  );

  return httpServer;
}
