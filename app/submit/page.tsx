import { Suspense } from "react";
import SubmitClient from "./SubmitClient";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8">
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-600">Loading submit form…</p>
          </div>
        </main>
      }
    >
      <SubmitClient />
    </Suspense>
  );
}