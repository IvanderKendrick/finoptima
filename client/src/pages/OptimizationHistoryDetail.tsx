import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation, useRoute } from "wouter";
import { useOptimizationHistoryDetail } from "@/hooks/use-optimization";

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export default function OptimizationHistoryDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/history/optimization/:id");
  const id = params?.id ? Number(params.id) : NaN;

  const { data, isLoading, error } = useOptimizationHistoryDetail(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="py-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/history/optimization")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="mt-6 text-center text-red-500">
            Failed to load optimization detail.
          </div>
        </div>
      </Layout>
    );
  }

  const results = safeJsonParse<Record<string, number>>(data.results);

  const weights = results
    ? Object.entries(results)
        .map(([symbol, weight]) => ({ symbol, weight }))
        .sort((a, b) => b.weight - a.weight)
    : [];

  const dateLabel = data.date
    ? format(new Date(data.date), "MMM dd, yyyy HH:mm")
    : "-";

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Optimization Detail
          </h2>
          <p className="text-slate-500">Result snapshot from {dateLabel}.</p>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate("/history/optimization")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">{dateLabel}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expected Return</span>
              <span className="font-medium text-emerald-700">
                {data.return.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Risk</span>
              <span className="font-medium text-slate-900">
                {data.risk.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sharpe Ratio</span>
              <span className="font-medium text-slate-900">
                {data.sharpeRatio.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weights */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Weights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weights.length === 0 ? (
              <div className="text-slate-500 text-sm">No weights found.</div>
            ) : (
              <div className="space-y-3">
                {weights.map((w) => (
                  <div
                    key={w.symbol}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="font-medium text-slate-900">{w.symbol}</div>

                    <div className="w-full max-w-[420px]">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, w.weight))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-16 text-right font-medium text-slate-900">
                      {w.weight.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
