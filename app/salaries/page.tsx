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

export default async function SalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const stateCode = (state || "MD").toUpperCase();

  const { data, error } = await supabase
    .from("salary_submissions")
    .select("*")
    .eq("state", stateCode);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
        <p className="mt-3 text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  const annualized = (data || [])
    .map(toAnnual)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const count = annualized.length;

  // ✅ K-anonymity threshold
  const MIN_COUNT = 5;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
      <p className="mt-2 text-slate-600">Showing results for: {stateCode}</p>

      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {count < MIN_COUNT ? (
          <>
            <p className="text-slate-600">Not enough data yet</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Need {MIN_COUNT}+ submissions to show salary stats
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Current submissions: <span className="font-semibold">{count}</span>
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Help unlock insights by submitting your salary.
            </p>
          </>
        ) : (
          (() => {
            const sorted = [...annualized].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];

            return (
              <>
                <p className="text-slate-600">Median Annualized Pay</p>
                <h2 className="text-4xl font-bold text-slate-900 mt-2">
                  ${median.toLocaleString()}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  Based on {count} submissions
                </p>
              </>
            );
          })()
        )}
      </div>
    </main>
  );
}