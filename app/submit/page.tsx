"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "../lib/supabaseClient";

export default function SubmitPage() {
  const searchParams = useSearchParams();

  const [role, setRole] = useState("retail");
  const [stateCode, setStateCode] = useState("MD");
  const [years, setYears] = useState("");
  const [payType, setPayType] = useState<"hourly" | "salary">("hourly");
  const [hourlyRate, setHourlyRate] = useState("");
  const [annualSalary, setAnnualSalary] = useState("");
  const [employer, setEmployer] = useState("");
  const [loading, setLoading] = useState(false);

  // Autofill from URL: /submit?state=MD&role=retail
  useEffect(() => {
    const s = searchParams.get("state");
    const r = searchParams.get("role");

    if (s) setStateCode(s.toUpperCase());
    if (r) setRole(r.toLowerCase());
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!years) return alert("Please enter years of experience.");
    if (payType === "hourly" && !hourlyRate)
      return alert("Please enter hourly rate.");
    if (payType === "salary" && !annualSalary)
      return alert("Please enter annual salary.");

    setLoading(true);

    try {
      const supabase = supabaseClient();

      const payload: any = {
        role,
        state: stateCode,
        years_experience: Number(years),
        pay_type: payType,
        employer: employer.trim() || null,
        hourly_rate:
          payType === "hourly" ? Number(hourlyRate) : null,
        annual_salary:
          payType === "salary" ? Number(annualSalary) : null,
      };

      const { error } = await supabase
        .from("salary_submissions")
        .insert(payload);

      if (error) {
        alert(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      alert("Submitted successfully 🎉");

      setYears("");
      setHourlyRate("");
      setAnnualSalary("");
      setEmployer("");
    } catch (err: any) {
      alert("Submission failed. Check configuration.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Submit Salary
      </h1>
      <p className="mt-2 text-slate-600">
        Anonymous. Employer is optional and only shown when
        5+ submissions exist.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
          >
            <option value="retail">Retail</option>
            <option value="hospital">Hospital</option>
            <option value="industry">Industry</option>
            <option value="managed_care">Managed Care</option>
            <option value="ambulatory">Ambulatory</option>
            <option value="academia">Academia</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            State
          </label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
          >
            <option value="MD">MD</option>
            <option value="DC">DC</option>
            <option value="VA">VA</option>
            <option value="CA">CA</option>
            <option value="TX">TX</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Years of Experience
          </label>
          <input
            value={years}
            onChange={(e) => setYears(e.target.value)}
            inputMode="numeric"
            placeholder="e.g., 3"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Pay Type
          </label>
          <select
            value={payType}
            onChange={(e) =>
              setPayType(e.target.value as "hourly" | "salary")
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
          >
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
          </select>
        </div>

        {payType === "hourly" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Hourly Rate
            </label>
            <input
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 70"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Annual Salary
            </label>
            <input
              value={annualSalary}
              onChange={(e) => setAnnualSalary(e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 135000"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Employer (optional)
          </label>
          <input
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="e.g., Safeway"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Anonymously"}
        </button>
      </form>
    </main>
  );
}