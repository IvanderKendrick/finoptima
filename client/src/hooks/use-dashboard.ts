import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardData() {
  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.get.path);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return api.dashboard.get.responses[200].parse(await res.json());
    },
  });
}
