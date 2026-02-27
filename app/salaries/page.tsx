import { createClient } from "@supabase/supabase-js";
import SalaryGrowthChart from "./SalaryGrowthChart";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toAnnual(row: any) {
  if (row.pay_type === "hourly" && row.hourly_rate != null) {
    return Number(row.hourly_rate) * 40 * 52;
  }
  if (row.pay_type === "salary" && row.annual_salary != null) {
    return Number(row.annual_salary);
  }
  return null;
}

function percentile(sorted: number[], p: number) {
  const n = sorted.length;
  if (n === 0) return 0;
  const idx = (n - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function getBucket(years: number) {
  if (years <= 2) return "0–2 years";
  if (years <= 5) return "3–5 years";
  if (years <= 10) return "6–10 years";
  return "10+ years";
}

const BUCKET_ORDER = ["0–2 years", "3–5 years", "6–10 years", "10+ years"] as const;

export default async function SalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; role?: string }>;
}) {
  const { state, role } = await searchParams;
  const stateCode = (state || "MD").toUpperCase();
  const roleType = (role || "retail").toLowerCase();

  const { data, error } = await supabase
    .from("salary_submissions")
    .select("*")
    .eq("state", stateCode)
    .eq("role", roleType);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
        <p className="mt-3 text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  const MIN_COUNT = 5;

  const bucketMap: Record<string, number[]> = {
    "0–2 years": [],
    "3–5 years": [],
    "6–10 years": [],
    "10+ years": [],
  };

  (data || []).forEach((row: any) => {
    const annual = toAnnual(row);
    const yrs = Number(row?.years_experience);

    if (!Number.isFinite(yrs)) return;
    if (annual == null || !Number.isFinite(annual)) return;

    const bucket = getBucket(yrs);
    bucketMap[bucket].push(annual);
  });

  // Build chart points (only buckets with 5+ submissions)
  const chartData = BUCKET_ORDER.map((bucket) => {
    const arr = bucketMap[bucket] || [];
    if (arr.length < MIN_COUNT) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const med = percentile(sorted, 0.5);
    return { bucket, median: Math.round(med), count: arr.length };
  }).filter(Boolean) as { bucket: string; median: number; count: number }[];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
      <p className="mt-2 text-slate-600">
        {stateCode} • {roleType.replace("_", " ")}
      </p>

      {/* Chart first */}
      <div className="mt-8">
        {chartData.length > 0 ? (
          <SalaryGrowthChart data={chartData} />
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Salary growth curve</h2>
            <p className="mt-2 text-slate-600">
              Not enough bucket-level data yet. Each experience bucket needs {MIN_COUNT}+ submissions.
            </p>
            <a
              href={`/submit?state=${stateCode}&role=${roleType}`}
              className="inline-block mt-5 rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold"
            >
              Submit your salary to unlock the chart
            </a>
          </div>
        )}
      </div>

      {/* Bucket cards */}
      <div className="mt-8 space-y-6">
        {BUCKET_ORDER.map((bucketName) => {
          const salaries = bucketMap[bucketName] || [];
          const count = salaries.length;

          if (count < MIN_COUNT) {
            return (
              <div
                key={bucketName}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
              >
                <h2 className="text-xl font-semibold">{bucketName}</h2>
                <p className="mt-3 text-slate-600">Need {MIN_COUNT}+ submissions</p>
                <p className="text-sm text-slate-500">Current: {count}</p>

                <a
                  href={`/submit?state=${stateCode}&role=${roleType}`}
                  className="inline-block mt-5 rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold"
                >
                  Submit your salary for this bucket
                </a>
              </div>
            );
          }

          const sorted = [...salaries].sort((a, b) => a - b);
          const p25 = percentile(sorted, 0.25);
          const med = percentile(sorted, 0.5);
          const p75 = percentile(sorted, 0.75);

          return (
            <div
              key={bucketName}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-semibold">{bucketName}</h2>

              <p className="mt-3 text-slate-600">Median</p>
              <h3 className="text-3xl font-bold mt-1">
                ${Math.round(med).toLocaleString()}
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                25th–75th percentile:{" "}
                <span className="font-semibold">
                  ${Math.round(p25).toLocaleString()} – ${Math.round(p75).toLocaleString()}
                </span>
              </p>

              <p className="mt-2 text-xs text-slate-400">Based on {count} submissions</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}