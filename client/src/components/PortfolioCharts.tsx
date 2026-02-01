import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  type Asset,
  type HistoryPoint,
  type FrontierPoint,
} from "@shared/schema";

// Green palette for charts
const COLORS = [
  "#10B981",
  "#34D399",
  "#6EE7B7",
  "#059669",
  "#047857",
  "#065F46",
  "#064E3B",
];

interface AllocationChartProps {
  assets: Asset[];
}

export function AllocationChart({ assets }: AllocationChartProps) {
  // const data = assets.map((a) => ({ name: a.name, value: a.allocation }));
  const data = assets.map((a) => ({
    name: a.name,
    value: a.value, // nilai investasi sebenarnya
  }));

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>Current distribution of holdings</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`${value}%`, "Allocation"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface HistoryChartProps {
  history: HistoryPoint[];
}

export function HistoryChart({ history }: HistoryChartProps) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>Performance over time</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [
                `Rp ${value.toLocaleString()}`,
                "Value",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface FrontierChartProps {
  points: FrontierPoint[];
}

export function FrontierChart({ points }: FrontierChartProps) {
  const optimalPoint = points.find((p) => p.isOptimal);
  const otherPoints = points.filter((p) => !p.isOptimal);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Efficient Frontier</CardTitle>
        <CardDescription>Risk vs. Return Optimization</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              type="number"
              dataKey="risk"
              name="Risk"
              unit="%"
              tickLine={false}
              axisLine={false}
              label={{
                value: "Risk (Standard Deviation)",
                position: "bottom",
                offset: 0,
                fill: "#64748B",
                fontSize: 12,
              }}
              tick={{ fontSize: 12, fill: "#64748B" }}
            />
            <YAxis
              type="number"
              dataKey="return"
              name="Return"
              unit="%"
              tickLine={false}
              axisLine={false}
              label={{
                value: "Expected Return",
                angle: -90,
                position: "left",
                fill: "#64748B",
                fontSize: 12,
              }}
              tick={{ fontSize: 12, fill: "#64748B" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Scatter
              name="Efficient Frontier"
              data={otherPoints}
              fill="#94A3B8"
              line
              shape="circle"
            />
            {optimalPoint && (
              <Scatter
                name="Optimal Portfolio"
                data={[optimalPoint]}
                fill="#10B981"
                shape="star"
                r={200}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
