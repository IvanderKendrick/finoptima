import { z } from "zod";
import {
  assets,
  portfolioMetrics,
  portfolioHistory,
  efficientFrontierPoints,
  optimizationHistory,
  users,
  insertAssetSchema,
  insertUserSchema,
} from "./schema";

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
      responses: {
        200: z.object({
          user: z.custom<Omit<typeof users.$inferSelect, "password">>(),
          token: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: insertUserSchema
        .extend({
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
      responses: {
        201: z.object({
          user: z.custom<Omit<typeof users.$inferSelect, "password">>(),
          token: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  dashboard: {
    get: {
      method: "GET" as const,
      path: "/api/dashboard",
      responses: {
        200: z.object({
          metrics: z.array(z.custom<typeof portfolioMetrics.$inferSelect>()),
          assets: z.array(z.custom<typeof assets.$inferSelect>()),
          history: z.array(z.custom<typeof portfolioHistory.$inferSelect>()),
          frontier: z.array(
            z.custom<typeof efficientFrontierPoints.$inferSelect>(),
          ),
        }),
      },
    },
  },
  assets: {
    list: {
      method: "GET" as const,
      path: "/api/assets",
      responses: {
        200: z.array(z.custom<typeof assets.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/assets",
      input: insertAssetSchema,
      responses: {
        201: z.custom<typeof assets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/assets/:id",
      input: insertAssetSchema.partial(),
      responses: {
        200: z.custom<typeof assets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/assets/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  portfolio: {
    recordHistory: {
      method: "POST" as const,
      path: "/api/portfolio/history",
      responses: {
        201: z.object({
          date: z.string(),
          value: z.number(),
        }),
      },
    },
    history: {
      method: "GET" as const,
      path: "/api/portfolio/history",
      responses: {
        200: z.array(z.custom<typeof portfolioHistory.$inferSelect>()),
      },
    },
    deleteHistory: {
      method: "DELETE" as const,
      path: "/api/portfolio/history/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  optimization: {
    run: {
      method: "POST" as const,
      path: "/api/optimization/run",
      input: z.object({
        assetIds: z.array(z.number()),
        riskTolerance: z.number().optional(),
      }),
      responses: {
        200: z.object({
          expectedReturn: z.number(),
          risk: z.number(),
          sharpeRatio: z.number(),
          weights: z.record(z.string(), z.number()), // symbol -> weight
          frontier: z.array(
            z.object({
              risk: z.number(),
              return: z.number(),
              sharpeRatio: z.number(),
              isOptimal: z.boolean(),
            }),
          ),
        }),
      },
    },
    history: {
      method: "GET" as const,
      path: "/api/optimization/history",
      responses: {
        200: z.array(z.custom<typeof optimizationHistory.$inferSelect>()),
      },
    },
    deleteHistory: {
      method: "DELETE" as const,
      path: "/api/optimization/history/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  profile: {
    updatePassword: {
      method: "PUT" as const,
      path: "/api/profile/password",
      input: z
        .object({
          oldPassword: z.string(),
          newPassword: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "New passwords don't match",
          path: ["confirmPassword"],
        }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// TYPE HELPERS
// ============================================
export type DashboardData = z.infer<(typeof api.dashboard.get.responses)[200]>;
export type OptimizationResult = z.infer<
  (typeof api.optimization.run.responses)[200]
>;

// ============================================
// URL BUILDER HELPER
// ============================================
export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
) {
  let url = path;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  return url;
}
