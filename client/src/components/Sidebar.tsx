// Sidebar.tsx
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
  LineChart,
  BarChart3,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: WalletMinimal },
  { href: "/optimization", label: "Optimization", icon: TrendingUp },
  {
    label: "History",
    icon: History,
    children: [
      { href: "/history/optimization", label: "Optimization", icon: LineChart },
      { href: "/history/portfolio", label: "Portfolio", icon: BarChart3 },
    ],
  },
  { href: "/profile", label: "Profile", icon: User },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function Sidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (location.startsWith("/history")) setIsHistoryOpen(true);
    // tutup drawer mobile ketika pindah page
    onMobileOpenChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const closeMobile = () => onMobileOpenChange?.(false);

  const SidebarContent = (
    <div className="h-full w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <PieChart className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold tracking-tight">FinOptima</span>
        </div>

        {/* tombol close hanya mobile */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={closeMobile}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isHistoryOpen ? "200px" : "0px" }}
                >
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((child) => {
                      const isActive =
                        location === child.href ||
                        location.startsWith(child.href + "/");
                      return (
                        <Link key={child.href} href={child.href}>
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer",
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-slate-400 hover:text-white hover:bg-slate-800",
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          const isActive =
            location === item.href || location.startsWith(item.href + "/");

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
          onClick={() => {
            closeMobile();
            logout();
          }}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-screen">
        {SidebarContent}
      </div>

      {/* Mobile drawer + overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeMobile}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-64 transform transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {SidebarContent}
        </div>
      </div>
    </>
  );
}
