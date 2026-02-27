import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 tracking-tight"
        >
          RxPay
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/submit"
            className="text-slate-700 hover:text-slate-900 transition"
          >
            Submit
          </Link>

          <Link
            href="/salaries?state=MD&role=retail"
            className="text-slate-700 hover:text-slate-900 transition"
          >
            Insights
          </Link>

          <Link
            href="/compare?role=retail"
            className="text-slate-700 hover:text-slate-900 transition"
          >
            Compare (DMV)
          </Link>
        </nav>
      </div>
    </header>
  );
}