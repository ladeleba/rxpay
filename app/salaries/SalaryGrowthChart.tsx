"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = {
  bucket: string;
  median: number;
  count: number;
};

function formatMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SalaryGrowthChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Salary growth curve</h2>
      <p className="mt-1 text-sm text-slate-600">
        Median annualized pay by experience bucket (only buckets with 5+ submissions)
      </p>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis tickFormatter={(v) => formatMoney(v)} width={90} />
            <Tooltip
              formatter={(value: any, _name: any, props: any) => {
                const p = props?.payload as Point | undefined;
                const label = p ? `Median (n=${p.count})` : "Median";
                return [formatMoney(value), label];
              }}
            />
            <Line
              type="monotone"
              dataKey="median"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}