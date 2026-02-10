import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAssets } from "@/hooks/use-assets";
import { useRunOptimization } from "@/hooks/use-optimization";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, TrendingUp, Zap } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#10B981",
  "#34D399",
  "#6EE7B7",
  "#A7F3D0",
  "#D1FAE5",
  "#064E3B",
];

export default function Optimization() {
  const { data: assets, isLoading: isLoadingAssets } = useAssets();
  const { mutate: optimize, data: result, isPending } = useRunOptimization();

  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);

  const handleToggleAsset = (id: number) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleRun = () => {
    optimize({
      assetIds: selectedAssetIds,
    });
  };

  const pieData = result
    ? Object.entries(result.weights).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Optimization Engine
        </h2>
        <p className="text-slate-500">
          Run mean-variance analysis to find your optimal portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Select assets to include in analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingAssets ? (
                <div className="py-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">
                      Available Assets
                    </span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {selectedAssetIds.length} selected
                    </span>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
                    {assets?.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Checkbox
                          id={`asset-${asset.id}`}
                          checked={selectedAssetIds.includes(asset.id)}
                          onCheckedChange={() => handleToggleAsset(asset.id)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label
                            htmlFor={`asset-${asset.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {asset.symbol}
                          </label>
                          <span className="text-xs text-slate-500">
                            {asset.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                onClick={handleRun}
                disabled={selectedAssetIds.length < 2 || isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Run Optimization
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <TrendingUp className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Ready to Optimize
              </h3>
              <p className="text-slate-500 text-center max-w-sm mt-1">
                Select at least 2 assets and click run to generate an optimal
                portfolio strategy.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-emerald-600 text-white border-none shadow-lg shadow-emerald-600/20">
                  <CardContent className="p-6">
                    <p className="text-emerald-100 text-sm font-medium">
                      Expected Return
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {result.expectedReturn.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <p className="text-slate-500 text-sm font-medium">
                      Projected Risk
                    </p>
                    <p className="text-3xl font-bold mt-1 text-slate-900">
                      {result.risk.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <p className="text-slate-500 text-sm font-medium">
                      Sharpe Ratio
                    </p>
                    <p className="text-3xl font-bold mt-1 text-slate-900">
                      {result.sharpeRatio.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Efficient Frontier Chart */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Efficient Frontier
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            dataKey="risk"
                            name="Risk"
                            unit="%"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="expectedReturn"
                            name="Return"
                            unit="%"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} />

                          <Scatter
                            name="All Portfolios"
                            data={result.frontier}
                            fill="#E5E7EB"
                          />

                          <Scatter
                            name="Efficient Frontier"
                            data={result.efficientFrontier}
                            fill="#a1a2a1"
                          />

                          <Scatter
                            name="Optimal"
                            data={[
                              {
                                risk: result.risk,
                                expectedReturn: result.expectedReturn,
                              },
                            ]}
                            fill="#10B981"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Weights Pie */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Optimal Weights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: number) => `${val.toFixed(1)}%`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {pieData
                        .filter((d) => d.value > 0)
                        .map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-600">{d.name}</span>
                            <span className="font-medium">
                              {d.value.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
