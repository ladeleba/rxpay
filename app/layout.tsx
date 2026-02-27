import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "RxPay",
  description: "Salary transparency and career intelligence for pharmacists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}