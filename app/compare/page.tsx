import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MIN_COUNT = 5;
const STATES = ["MD", "DC", "VA"] as const;
const BUCKETS = ["0–2 years", "3–5 years", "6–10 years", "10+ years"] as const;

type BucketName = (typeof BUCKETS)[number];

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

function getBucket(years: number): BucketName {
  if (years <= 2) return "0–2 years";
  if (years <= 5) return "3–5 years";
  if (years <= 10) return "6–10 years";
  return "10+ years";
}

function fmtMoney(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

type BucketStat =
  | { status: "locked"; count: number; needed: number }
  | {
      status: "unlocked";
      count: number;
      p25: number;
      median: number;
      p75: number;
    };

type StateStats = Record<BucketName, BucketStat>;

async function fetchStateStats(state: string, roleType: string): Promise<StateStats> {
  const { data, error } = await supabase
    .from("salary_submissions")
    .select("*")
    .eq("state", state)
    .eq("role", roleType);

  if (error) {
    // If fetch fails, treat as all locked with 0 to keep UI stable.
    return {
      "0–2 years": { status: "locked", count: 0, needed: MIN_COUNT },
      "3–5 years": { status: "locked", count: 0, needed: MIN_COUNT },
      "6–10 years": { status: "locked", count: 0, needed: MIN_COUNT },
      "10+ years": { status: "locked", count: 0, needed: MIN_COUNT },
    };
  }

  const bucketVals: Record<BucketName, number[]> = {
    "0–2 years": [],
    "3–5 years": [],
    "6–10 years": [],
    "10+ years": [],
  };

  (data || []).forEach((row: any) => {
    const yrs = Number(row?.years_experience);
    const annual = toAnnual(row);

    if (!Number.isFinite(yrs)) return;
    if (annual == null || !Number.isFinite(annual)) return;

    const bucket = getBucket(yrs);
    bucketVals[bucket].push(annual);
  });

  const stats: Partial<StateStats> = {};

  BUCKETS.forEach((b) => {
    const arr = bucketVals[b];
    const count = arr.length;

    if (count < MIN_COUNT) {
      stats[b] = { status: "locked", count, needed: MIN_COUNT };
    } else {
      const sorted = [...arr].sort((a, b) => a - b);
      const p25 = percentile(sorted, 0.25);
      const med = percentile(sorted, 0.5);
      const p75 = percentile(sorted, 0.75);
      stats[b] = { status: "unlocked", count, p25, median: med, p75 };
    }
  });

  return stats as StateStats;
}

function RolePill({ role }: { role: string }) {
  const label = role.replaceAll("_", " ");
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
      {label}
    </span>
  );
}

function LockedCell({
  stateCode,
  roleType,
  count,
}: {
  stateCode: string;
  roleType: string;
  count: number;
}) {
  const pct = Math.min(100, (count / MIN_COUNT) * 100);

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-600">
        Locked • <span className="font-semibold">{count}/{MIN_COUNT}</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-2 bg-slate-900" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/submit?state=${stateCode}&role=${roleType}`}
          className="inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        >
          Submit to unlock
        </Link>

        {/* Simple copy via query param – uses your existing CopyLinkButton style later if you want */}
        <a
          href={`#copy-${stateCode}-${roleType}`}
          onClick={(e) => {
            e.preventDefault();
            const url = `http://localhost:3000/submit?state=${stateCode}&role=${roleType}`;
            navigator.clipboard
              .writeText(url)
              .then(() => alert("Copied submit link ✅"))
              .catch(() => alert("Could not copy. Link:\n" + url));
          }}
          className="inline-block rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
        >
          Copy submit link
        </a>
      </div>
    </div>
  );
}

function UnlockedCell({ stat }: { stat: Extract<BucketStat, { status: "unlocked" }> }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500">Median</div>
      <div className="text-lg font-bold text-slate-900">{fmtMoney(stat.median)}</div>
      <div className="text-xs text-slate-600">
        {fmtMoney(stat.p25)} – {fmtMoney(stat.p75)}
      </div>
      <div className="text-[11px] text-slate-400">n={stat.count}</div>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const roleType = (role || "retail").toLowerCase();

  // Fetch MD/DC/VA in parallel
  const [md, dc, va] = await Promise.all([
    fetchStateStats("MD", roleType),
    fetchStateStats("DC", roleType),
    fetchStateStats("VA", roleType),
  ]);

  const byState: Record<(typeof STATES)[number], StateStats> = {
    MD: md,
    DC: dc,
    VA: va,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compare (DMV)</h1>
          <p className="mt-2 text-slate-600">
            Side-by-side salary stats by experience bucket. Each cell unlocks at{" "}
            <span className="font-semibold">{MIN_COUNT}+</span> submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RolePill role={roleType} />
          <Link
            href={`/salaries?state=MD&role=${roleType}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          >
            View Insights
          </Link>
          <Link
            href={`/submit?state=MD&role=${roleType}`}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Submit Salary
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                State
              </th>
              {BUCKETS.map((b) => (
                <th
                  key={b}
                  className="p-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200"
                >
                  {b}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {STATES.map((s) => (
              <tr key={s} className="align-top">
                <td className="p-4 border-b border-slate-200">
                  <div className="text-lg font-bold text-slate-900">{s}</div>
                  <div className="mt-2">
                    <Link
                      href={`/salaries?state=${s}&role=${roleType}`}
                      className="text-sm font-semibold text-slate-700 underline"
                    >
                      Open insights →
                    </Link>
                  </div>
                </td>

                {BUCKETS.map((b) => {
                  const stat = byState[s][b];

                  return (
                    <td key={b} className="p-4 border-b border-slate-200">
                      {stat.status === "locked" ? (
                        <LockedCell
                          stateCode={s}
                          roleType={roleType}
                          count={stat.count}
                        />
                      ) : (
                        <UnlockedCell stat={stat} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Tip: Share the “Copy submit link” in group chats to unlock buckets faster.
      </div>
    </main>
  );
}