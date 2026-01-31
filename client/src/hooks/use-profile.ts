import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth-provider";
import { useToast } from "./use-toast";
import { z } from "zod";

type UpdatePasswordData = z.infer<typeof api.profile.updatePassword.input>;

export function useUpdatePassword() {
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdatePasswordData) => {
      const res = await fetch(api.profile.updatePassword.path, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update password");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password updated successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
