import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          RxPay
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/submit" className="text-slate-700 hover:text-slate-900">
            Submit
          </Link>
          <Link
            href="/salaries?state=MD"
            className="text-slate-700 hover:text-slate-900"
          >
            Salaries
          </Link>
        </nav>
      </div>
    </header>
  );
}