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
        headers: { Authorization: `Bearer ${token}` },
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
    mutationFn: async (data: { assetIds: number[] }) => {
      const res = await fetch(api.optimization.run.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let message = "Optimization failed";

        try {
          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const errBody = await res.json();
            if (
              typeof errBody?.message === "string" &&
              errBody.message.trim()
            ) {
              message = errBody.message;
            }
          } else {
            const text = await res.text();
            if (text.trim()) message = text;
          }
        } catch {
          // ignore parse errors, pakai default message
        }

        const err = new Error(message);
        (err as any).statusCode = res.status;
        throw err;
      }

      return api.optimization.run.responses[200].parse(await res.json());
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.optimization.history.path],
      });
      toast({
        title: "Optimization Complete",
        description: "New portfolio weights calculated.",
      });
    },

    onError: (err: any) => {
      toast({
        title: "Optimization Failed",
        description: err?.message ?? "Optimization failed",
        variant: "destructive",
      });

      // (opsional) kalau mau beda wording berdasar status
      // if (err?.statusCode === 404) { ... }
    },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete history item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.optimization.history.path],
      });
      toast({ title: "Deleted", description: "History item removed." });
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

export function useOptimizationHistoryDetail(id: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: [api.optimization.historyDetail.path, id],
    enabled: !!token && Number.isFinite(id),
    queryFn: async () => {
      const path = api.optimization.historyDetail.path.replace(
        ":id",
        String(id),
      );
      const res = await fetch(path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error("Failed to fetch optimization history detail");
      return api.optimization.historyDetail.responses[200].parse(
        await res.json(),
      );
    },
  });
}
