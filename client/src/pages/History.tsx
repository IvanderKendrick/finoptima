import { Layout } from "@/components/Layout";
import { HistoryChart } from "@/components/PortfolioCharts";
import { useDashboardData } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Performance History</h1>
          <p className="text-slate-500 mt-1">Historical tracking of total portfolio value.</p>
        </div>

        <div className="h-[500px]">
          {data && <HistoryChart history={data.history} />}
        </div>
      </div>
    </Layout>
  );
}
