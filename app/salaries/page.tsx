export default async function SalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const stateCode = (state || "MD").toUpperCase();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Salary Insights</h1>
      <p className="mt-2 text-slate-600">Showing results for: {stateCode}</p>

      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-600">Median Pay</p>
        <h2 className="text-4xl font-bold text-slate-900 mt-2">$128,000</h2>
        <p className="mt-2 text-sm text-slate-500">
          25th–75th percentile: $118,000 – $140,000
        </p>
        <p className="mt-1 text-xs text-slate-400">Based on 27 submissions</p>
      </div>
    </main>
  );
}