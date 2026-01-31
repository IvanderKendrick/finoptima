import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
          <h1 className="text-sm font-medium text-slate-500">
            Portfolio Management & Optimization
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Avatar className="h-9 w-9 border-2 border-slate-100">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
