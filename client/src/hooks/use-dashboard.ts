import { useQuery } from "@tanstack/react-query";
import { api, type DashboardData } from "@shared/routes";
import { useAuth } from "./use-auth-provider";

export function useDashboard() {
  const { token } = useAuth();

  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.get.path, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return api.dashboard.get.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}
