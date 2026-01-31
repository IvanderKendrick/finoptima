import { Metric } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, Layers } from "lucide-react";

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
        return (
          <Card key={metric.id} className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
                  <p className="text-xs text-slate-400 mt-1">{metric.subValue}</p>
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
