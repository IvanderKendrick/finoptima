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
    api.assets.returns.create.path,
    authenticateToken,
    async (req: any, res) => {
      try {
        const { assetId } = req.params;
        const input = api.assets.returns.create.input.parse(req.body);

        // Mengambil data returns langsung dari input
        const returns = input.returns.map((r: { value: number }) => r.value);

        // Cek jika data returns ada minimal 12 bulan
        if (returns.length < 12) {
          return res.status(400).json({ message: "Insufficient returns data" });
        }

        // Hitung expectedReturn (mean) dan risk (stdDev)
        const expectedReturn = mean(returns) * 12; // Rata-rata pengembalian
        const risk = stdDev(returns) * Math.sqrt(12); // Standar deviasi

        // Batasi angka desimal menjadi 1 angka di belakang koma
        const expectedReturnRounded = parseFloat(expectedReturn.toFixed(2));
        const riskRounded = parseFloat(risk.toFixed(2));

        // Simpan hasil perhitungan expectedReturn dan risk ke database
        await storage.updateAssetRiskAndReturn(
          Number(assetId),
          expectedReturnRounded,
          riskRounded,
        );

        await storage.createAssetReturns({
          assetId: Number(assetId),
          userId: req.user.id,
          returns: input.returns,
        });

        return res.sendStatus(204);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    api.assets.returns.get.path,
    authenticateToken,
    async (req: any, res) => {
      const assetId = Number(req.params.assetId);

      // verify ownership via asset
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== req.user.id) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const returns = await storage.getAssetReturns(assetId);

      return res.json({ returns });
    },
  );

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

        const allocations: Record<string, number> = {};
        if (totalValue > 0) {
          for (const a of assets) {
            const w = (a.value / totalValue) * 100;
            allocations[a.symbol] = Number(w.toFixed(2));
          }
        } else {
          // kalau total 0, tetap kembalikan 0% agar tidak NaN
          for (const a of assets) allocations[a.symbol] = 0;
        }

        const history = await storage.createOrUpdatePortfolioHistory({
          userId: req.user.id,
          date: today,
          value: totalValue,
          allocations: JSON.stringify(allocations),
        });

        res.status(201).json({
          date: today,
          value: totalValue,
          allocations,
        });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    api.portfolio.historyDetail.path,
    authenticateToken,
    async (req: any, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const row = await storage.getPortfolioHistoryById(req.user.id, id);
      if (!row) {
        return res.status(404).json({ message: "Portfolio history not found" });
      }

      return res.json(row);
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
      const RISK_FREE_RATE = 0.03; // 3% annual

      try {
        const input = api.optimization.run.input.parse(req.body);
        const userAssets = await storage.getAssets(req.user.id);
        const selectedAssets = userAssets.filter((a) =>
          input.assetIds.includes(a.id),
        );

        if (selectedAssets.length === 0) {
          return res.status(400).json({ message: "No assets selected" });
        }

        const assetIds = selectedAssets.map((a) => a.id);

        // 1. Load historical monthly returns
        const rows = await storage.getAssetMonthlyReturns(assetIds);
        const grouped = groupByAsset(rows);

        // 2. Asset-level stats
        const stats = selectedAssets.map((asset) => {
          const monthly = grouped.get(asset.id);

          if (!monthly || monthly.length === 0) {
            const err = new Error(
              `Historical price data for asset ${asset.symbol} not found`,
            );
            (err as any).statusCode = 404;
            throw err;
          }

          if (monthly.length < 12) {
            const err = new Error(
              `Insufficient historical data for asset ${asset.symbol}`,
            );
            (err as any).statusCode = 400;
            throw err;
          }

          const muMonthly = mean(monthly);
          const sigmaMonthly = stdDev(monthly);

          return {
            asset,
            monthly,
            expectedReturn: muMonthly * 12,
            risk: sigmaMonthly * Math.sqrt(12),
          };
        });

        // 3. Covariance matrix (monthly)
        const covMatrix = covarianceMatrix(
          stats.map((s) => s.asset.id),
          new Map(stats.map((s) => [s.asset.id, s.monthly])),
        );

        // 4. Generate weight combinations
        const mu = stats.map((s) => s.expectedReturn);
        const weightVectors = generateWeights(stats.length, 0.1);

        // 5–6. Efficient frontier
        const eps = 1e-12;
        const MAX_SHARPE = 999;

        const frontier = weightVectors.map((w) => {
          const ret = portfolioReturn(w, mu); // sudah annual karena mu annual
          const riskMonthly = portfolioRisk(w, covMatrix); // masih monthly karena cov bulanan
          const riskAnnual = riskMonthly * Math.sqrt(12); // ✅ annualisasi risk

          let sharpeRatio: number;
          if (riskAnnual < eps) {
            sharpeRatio = ret > RISK_FREE_RATE ? MAX_SHARPE : -MAX_SHARPE;
          } else {
            sharpeRatio = (ret - RISK_FREE_RATE) / riskAnnual;
          }

          return {
            weights: w,
            expectedReturn: ret,
            risk: riskAnnual, // ✅ pakai annual risk
            sharpeRatio,
          };
        });

        // Efficient Frontier
        const efficientFrontier = buildEfficientFrontier(frontier);

        // 7. Pick optimal portfolio (max Sharpe)
        // const optimal = frontier.reduce((best, p) =>
        const optimal = efficientFrontier.reduce((best, p) =>
          p.sharpeRatio > best.sharpeRatio ? p : best,
        );

        // 8. Map weights to asset symbols
        const optimalWeights: Record<string, number> = {};
        stats.forEach((s, i) => {
          optimalWeights[s.asset.symbol] = Number(
            (optimal.weights[i] * 100).toFixed(2),
          );
        });

        // ✅ Save optimization result to DB
        const expectedReturn = Number(optimal.expectedReturn.toFixed(2));
        const risk = Number(optimal.risk.toFixed(2));
        const sharpeRatio = Number(optimal.sharpeRatio.toFixed(2));

        await storage.createOptimizationHistory(req.user.id, {
          parameters: JSON.stringify(input),
          return: expectedReturn,
          risk,
          sharpeRatio,
          results: JSON.stringify(optimalWeights),
        });

        // 9. Respond ONCE
        return res.json({
          expectedReturn,
          risk,
          sharpeRatio,
          riskFreeRate: RISK_FREE_RATE,

          weights: optimalWeights,

          efficientFrontier: efficientFrontier.map((p) => ({
            expectedReturn: Number(p.expectedReturn.toFixed(2)),
            risk: Number(p.risk.toFixed(2)),
          })),

          frontier: frontier.map((p) => ({
            expectedReturn: Number(p.expectedReturn.toFixed(2)),
            risk: Number(p.risk.toFixed(2)),
          })),

          assets: stats.map((s) => ({
            symbol: s.asset.symbol,
            expectedReturn: Number(s.expectedReturn.toFixed(2)),
            risk: Number(s.risk.toFixed(2)),
          })),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }

        if (err.statusCode) {
          return res.status(err.statusCode).json({ message: err.message });
        }

        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
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
    api.optimization.historyDetail.path,
    authenticateToken,
    async (req: any, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const row = await storage.getOptimizationHistoryById(req.user.id, id);
      if (!row) {
        return res
          .status(404)
          .json({ message: "Optimization history not found" });
      }

      return res.json(row);
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

  app.delete(
    api.portfolio.deleteHistory.path,
    authenticateToken,
    async (req: any, res) => {
      const id = parseInt(req.params.id);
      await storage.deletePortfolioHistory(id);
      res.status(204).send();
    },
  );

  return httpServer;
}

function groupByAsset(rows: { assetId: number; value: number }[]) {
  const map = new Map<number, number[]>();

  for (const r of rows) {
    if (!map.has(r.assetId)) map.set(r.assetId, []);
    map.get(r.assetId)!.push(r.value);
  }

  return map;
}

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]) {
  const m = mean(arr);
  const variance =
    arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function covariance(a: number[], b: number[]) {
  const meanA = mean(a);
  const meanB = mean(b);

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - meanA) * (b[i] - meanB);
  }

  return sum / a.length;
}

function covarianceMatrix(assets: number[], data: Map<number, number[]>) {
  const matrix: number[][] = [];

  for (let i = 0; i < assets.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < assets.length; j++) {
      const cov = covariance(data.get(assets[i])!, data.get(assets[j])!);
      matrix[i][j] = cov;
    }
  }

  return matrix;
}

function generateWeights(n: number, step = 0.1): number[][] {
  const results: number[][] = [];
  const ticks = Math.round(1 / step); // step 0.1 => 10

  function backtrack(remainingTicks: number, depth: number, current: number[]) {
    if (depth === n - 1) {
      results.push([...current, remainingTicks / ticks]);
      return;
    }

    for (let t = 0; t <= remainingTicks; t++) {
      current.push(t / ticks);
      backtrack(remainingTicks - t, depth + 1, current);
      current.pop();
    }
  }

  backtrack(ticks, 0, []);
  return results;
}

function portfolioReturn(weights: number[], mu: number[]) {
  return weights.reduce((sum, w, i) => sum + w * mu[i], 0);
}

function portfolioRisk(weights: number[], cov: number[][]) {
  let variance = 0;

  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i] * cov[i][j] * weights[j];
    }
  }

  return Math.sqrt(variance);
}

function buildEfficientFrontier(
  portfolios: {
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
    weights: number[];
  }[],
) {
  return portfolios.filter(
    (p) =>
      !portfolios.some(
        (q) =>
          q.risk <= p.risk &&
          q.expectedReturn > p.expectedReturn &&
          (q.risk < p.risk || q.expectedReturn > p.expectedReturn),
      ),
  );
}
