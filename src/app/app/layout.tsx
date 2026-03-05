"use client";

import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/app/new" className="font-semibold">
            AuctionIQ
          </Link>

          <nav className="flex gap-3 text-sm">
            <Link href="/app/new">New Evaluation</Link>
            <Link href="/app/evaluations">Evaluations</Link>
            <Link href="/app/settings">Settings</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}