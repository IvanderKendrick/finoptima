import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type OptimizationResult } from "@shared/routes";
import { useAuth } from "./use-auth-provider";
import { useToast } from "./use-toast";

export function useOptimizationHistory() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: [api.optimization.history.path],
    queryFn: async () => {
      const res = await fetch(api.optimization.history.path, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch optimization history");
      return api.optimization.history.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useRunOptimization() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { assetIds: number[]; riskTolerance?: number }) => {
      const res = await fetch(api.optimization.run.path, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Optimization failed");
      return api.optimization.run.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.optimization.history.path] });
      toast({ title: "Optimization Complete", description: "New portfolio weights calculated." });
    },
    onError: (err) => {
      toast({ title: "Optimization Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteHistory() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.optimization.deleteHistory.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete history item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.optimization.history.path] });
      toast({ title: "Deleted", description: "History item removed." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
