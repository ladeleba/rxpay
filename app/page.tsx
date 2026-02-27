export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900">RxPay</h1>
        <p className="mt-2 text-slate-600">
          View pharmacist salary insights by state and role.
        </p>

        <label className="block mt-8 text-sm font-medium text-slate-700">
          Select your state
        </label>

        <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
          <option value="MD">Maryland</option>
          <option value="DC">District of Columbia</option>
          <option value="VA">Virginia</option>
          <option value="CA">California</option>
          <option value="TX">Texas</option>
        </select>

        <button className="mt-5 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold">
          View Insights
        </button>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Data shown only when 5+ submissions exist.
        </p>
      </div>
    </main>
  );
}