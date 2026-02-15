import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, PieChart } from "lucide-react";
import { format } from "date-fns";
import { useLocation, useRoute } from "wouter";
import { usePortfolioHistoryDetail } from "@/hooks/use-portfolio";

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const formatIDR = (n: number) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: 0 });

export default function PortfolioHistoryDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/history/portfolio/:id");
  const id = params?.id ? Number(params.id) : NaN;

  const { data, isLoading, error } = usePortfolioHistoryDetail(id);

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
            onClick={() => navigate("/history/portfolio")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="mt-6 text-center text-red-500">
            Failed to load portfolio history detail.
          </div>
        </div>
      </Layout>
    );
  }

  // allocations disimpan sebagai JSON string di kolom allocations
  const allocations = safeJsonParse<Record<string, number>>(
    (data as any).allocations,
  );

  const totalValue = data.value;

  const weights = allocations
    ? Object.entries(allocations)
        .map(([symbol, weight]) => ({
          symbol,
          weight,
          amount: (weight / 100) * totalValue,
        }))
        .sort((a, b) => b.weight - a.weight)
    : [];

  const dateLabel = data.date
    ? format(new Date(data.date), "MMM dd, yyyy")
    : "-";

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Portfolio Snapshot Detail
          </h2>
          <p className="text-slate-500">Snapshot from {dateLabel}.</p>
        </div>

        <Button variant="ghost" onClick={() => navigate("/history/portfolio")}>
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
              <span className="text-slate-500">Portfolio Value</span>
              <span className="font-medium text-emerald-700">
                Rp{" "}
                {data.value.toLocaleString("id-ID", {
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Allocations */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weights.length === 0 ? (
              <div className="text-slate-500 text-sm">
                No allocation data found for this snapshot.
              </div>
            ) : (
              <div className="space-y-3">
                {weights.map((w) => (
                  <div
                    key={w.symbol}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-[72px] font-medium text-slate-900">
                      {w.symbol}
                    </div>

                    <div className="w-full max-w-[420px]">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, w.weight))}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{w.weight.toFixed(2)}%</span>
                        <span>Rp {formatIDR(w.amount)}</span>
                      </div>
                    </div>

                    <div className="w-24 text-right font-medium text-slate-900">
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
