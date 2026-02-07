import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useAuth } from "./use-auth-provider";
import { useToast } from "./use-toast";

export function usePortfolioHistory() {
  const { token } = useAuth();

  return useQuery({
    queryKey: [api.portfolio.history.path],
    queryFn: async () => {
      const res = await fetch(api.portfolio.history.path, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch portfolio history");
      }

      return api.portfolio.history.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useDeletePortfolioHistory() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.portfolio.deleteHistory.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete portfolio history item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.portfolio.history.path],
      });

      toast({
        title: "Deleted",
        description: "Portfolio history item removed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
