import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrontierChart } from "@/components/PortfolioCharts";
import { useDashboardData } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Info } from "lucide-react";

export default function Optimization() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Layout>
         <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portfolio Optimization</h1>
          <p className="text-slate-500 mt-1">Efficient Frontier analysis to maximize returns for a given level of risk.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-sm border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Efficient Frontier Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <FrontierChart points={data.frontier} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-white">Optimal Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Target Return</div>
                  <div className="text-2xl font-bold">12.5%</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Expected Risk</div>
                  <div className="text-2xl font-bold">8.1%</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-emerald-400">1.54</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-emerald-50 border-emerald-100">
              <CardHeader>
                <CardTitle className="text-emerald-900 flex items-center gap-2 text-base">
                  <Info className="w-4 h-4" /> Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Based on the efficient frontier, your current portfolio is near optimal. 
                  Consider slightly increasing exposure to high-growth assets to capture the peak of the curve.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
