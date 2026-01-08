import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, TrendingUp, History, User, Menu, X, Coins } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: PieChart },
  { href: "/optimization", label: "Optimization", icon: TrendingUp },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Coins className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">FinTech</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
              isActive 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">John Investor</p>
            <p className="text-xs text-slate-500 truncate">Premium Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r fixed inset-y-0 z-50">
        <SidebarContent pathname={location} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="bg-white border-slate-200">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-0 bg-transparent">
          <SidebarContent pathname={location} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 md:p-8 pt-20 lg:pt-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
