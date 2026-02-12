import { Metric } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const iconMap: Record<string, any> = {
  "Total Portfolio Value": DollarSign,
  "Expected Return": TrendingUp,
  "Portfolio Risk": Activity,
  "Number of Assets": Layers,
};

export function MetricsCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.label] || Activity;

        // Conditional class for Portfolio Risk
        const isRiskMetric = metric.label === "Portfolio Risk";

        // Apply different logic for Portfolio Risk
        const trendClass = isRiskMetric
          ? metric.trend >= 0
            ? "bg-red-50 text-red-600" // Red for increase in Portfolio Risk
            : "bg-emerald-50 text-emerald-700" // Green for decrease in Portfolio Risk
          : metric.trend >= 0
            ? "bg-emerald-50 text-emerald-700" // Green for positive trend
            : "bg-red-50 text-red-600"; // Red for negative trend

        return (
          <Card
            key={metric.id}
            className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    {metric.label}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {metric.value}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-400">{metric.subValue}</p>
                    {typeof metric.trend === "number" && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-0.5 ${trendClass}`}
                      >
                        {metric.trend >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(metric.trend).toFixed(2)}%</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
