import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  History,
  User,
  LogOut,
  WalletMinimal,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// const navItems = [
//   { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { href: "/assets", label: "Assets", icon: WalletMinimal },
//   { href: "/optimization", label: "Optimization", icon: TrendingUp },
//   { href: "/history", label: "History", icon: History },
//   { href: "/profile", label: "Profile", icon: User },
// ];

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: WalletMinimal },
  { href: "/optimization", label: "Optimization", icon: TrendingUp },
  {
    label: "History",
    icon: History,
    children: [
      {
        href: "/history/optimization",
        label: "Optimization History",
      },
      {
        href: "/history/portfolio",
        label: "Portfolio History",
      },
    ],
  },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (location.startsWith("/history")) {
      setIsHistoryOpen(true);
    }
  }, [location]);

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <PieChart className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold tracking-tight">FinOptima</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // === MENU DENGAN SUBMENU (HISTORY) ===
          if ("children" in item) {
            const isParentActive = location.startsWith("/history");

            return (
              <div key={item.label}>
                <button
                  onClick={() => setIsHistoryOpen((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isParentActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isParentActive ? "text-emerald-500" : "text-slate-400",
                    )}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isHistoryOpen && "rotate-180",
                    )}
                  />
                </button>

                {isHistoryOpen && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((child) => {
                      const isActive = location === child.href;
                      return (
                        <Link key={child.href} href={child.href}>
                          <div
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-slate-400 hover:text-white hover:bg-slate-800",
                            )}
                          >
                            {child.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // === MENU BIASA ===
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-medium shadow-sm border border-emerald-500/20"
                    : "hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-emerald-500"
                      : "text-slate-400 group-hover:text-white",
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-3"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
