import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  trend?: number; // percentage
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, subValue, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("border-l-4 border-l-primary shadow-sm transition-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-primary opacity-70" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">{subValue}</p>
          {trend !== undefined && (
            <span
              className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                trend >= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
