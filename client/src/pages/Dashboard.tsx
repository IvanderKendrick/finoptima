import { useDashboardData } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { AllocationChart, HistoryChart, FrontierChart } from "@/components/PortfolioCharts";
import { DollarSign, TrendingUp, Activity, PieChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[400px] rounded-xl" />
        <Skeleton className="col-span-3 h-[400px] rounded-xl" />
      </div>

      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboardData();

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <div className="bg-red-50 p-4 rounded-full">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Failed to load dashboard data</h2>
          <p className="text-slate-500 max-w-md">There was a problem connecting to the server. Please check your connection and try again.</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  // Helper to find specific metrics by label or fallback
  const getMetric = (label: string) => data.metrics.find(m => m.label.includes(label));
  
  const totalValue = getMetric("Total Value");
  const expectedReturn = getMetric("Expected Return");
  const risk = getMetric("Risk");
  const assetsCount = getMetric("Assets");

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of your portfolio performance and metrics.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              Download Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={totalValue?.label || "Total Value"}
            value={totalValue?.value || "Rp 0"}
            subValue={totalValue?.subValue || "Total Asset Value"}
            trend={totalValue?.trend || 2.5}
            icon={DollarSign}
          />
          <StatCard
            title={expectedReturn?.label || "Expected Return"}
            value={expectedReturn?.value || "0%"}
            subValue={expectedReturn?.subValue || "Annualized"}
            trend={expectedReturn?.trend || 0.5}
            icon={TrendingUp}
          />
          <StatCard
            title={risk?.label || "Portfolio Risk"}
            value={risk?.value || "0%"}
            subValue={risk?.subValue || "Standard Deviation"}
            trend={risk?.trend || -0.2}
            icon={Activity}
          />
          <StatCard
            title={assetsCount?.label || "Holdings"}
            value={assetsCount?.value || "0"}
            subValue={assetsCount?.subValue || " diversified assets"}
            icon={PieChart}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[400px]">
          <div className="col-span-2 lg:col-span-4 h-full">
            <HistoryChart history={data.history} />
          </div>
          <div className="col-span-2 lg:col-span-3 h-full">
            <AllocationChart assets={data.assets} />
          </div>
        </div>

        {/* Efficient Frontier */}
        <div className="h-[450px]">
          <FrontierChart points={data.frontier} />
        </div>
      </div>
    </Layout>
  );
}
