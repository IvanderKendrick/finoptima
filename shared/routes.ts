import { z } from 'zod';
import { assets, portfolioMetrics, portfolioHistory, efficientFrontierPoints } from './schema';

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
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  dashboard: {
    get: {
      method: 'GET' as const,
      path: '/api/dashboard',
      responses: {
        200: z.object({
          metrics: z.array(z.custom<typeof portfolioMetrics.$inferSelect>()),
          assets: z.array(z.custom<typeof assets.$inferSelect>()),
          history: z.array(z.custom<typeof portfolioHistory.$inferSelect>()),
          frontier: z.array(z.custom<typeof efficientFrontierPoints.$inferSelect>()),
        }),
      },
    },
  },
};

// ============================================
// TYPE HELPERS
// ============================================
export type DashboardData = z.infer<typeof api.dashboard.get.responses[200]>;
