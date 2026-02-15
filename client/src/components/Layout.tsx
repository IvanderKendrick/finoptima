import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

      {/* ✅ mobile: no padding-left, desktop: pl-64 */}
      <div className="pl-0 md:pl-64">
        <header className="h-16 border-b bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
          <div className="flex items-center gap-3">
            {/* ✅ hamburger only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <h1 className="text-sm font-medium text-slate-500">
              Portfolio Management & Optimization
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* ✅ hide email on very small screens */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <Avatar className="h-9 w-9 border-2 border-slate-100">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* ✅ padding lebih kecil di mobile */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
