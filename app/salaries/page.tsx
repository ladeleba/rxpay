import { createClient } from "@supabase/supabase-js";

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
    return <div>Error loading data</div>;
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
    if (!annual || !row.years_experience) return;

    const bucket = getBucket(Number(row.years_experience));
    bucketMap[bucket].push(annual);
  });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
      <p className="mt-2 text-slate-600">
        {stateCode} • {roleType.replace("_", " ")}
      </p>

      <div className="mt-8 space-y-6">
        {Object.entries(bucketMap).map(([bucketName, salaries]) => {
          const count = salaries.length;

          if (count < MIN_COUNT) {
            return (
              <div
                key={bucketName}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
              >
                <h2 className="text-xl font-semibold">{bucketName}</h2>
                <p className="mt-3 text-slate-600">
                  Need {MIN_COUNT}+ submissions
                </p>
                <p className="text-sm text-slate-500">
                  Current: {count}
                </p>
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
                  ${Math.round(p25).toLocaleString()} – $
                  {Math.round(p75).toLocaleString()}
                </span>
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Based on {count} submissions
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}