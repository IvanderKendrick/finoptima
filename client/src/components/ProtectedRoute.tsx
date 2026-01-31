import { useAuth } from "@/hooks/use-auth-provider";
import { useLocation } from "wouter";
import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && !token) {
      setLocation("/login");
    }
  }, [user, isLoading, token, setLocation]);

  if (isLoading || (!user && token)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
