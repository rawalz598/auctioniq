"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, loginUser } from "@/lib/authLocal";

export default function LoginPage() {
  const router = useRouter();

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Modal
  const [open, setOpen] = useState(false);
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suPassword2, setSuPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canLogin = useMemo(() => email.trim() && password.trim(), [email, password]);

  async function onLogin() {
    setMsg(null);
    setLoading(true);
    try {
      await loginUser(email, password);
      router.push("/app/new");
    } catch (e: any) {
      setMsg(e?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onSignup() {
    setMsg(null);

    if (suPassword !== suPassword2) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await createUser(suEmail, suPassword);
      setOpen(false);
      router.push("/app/new");
    } catch (e: any) {
      setMsg(e?.message ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border shadow-sm p-6">
        <h1 className="text-2xl font-semibold">AuctionIQ</h1>
        <p className="text-sm text-slate-600 mb-4">Dealer Login</p>

        {msg ? (
          <div className="mb-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 p-3 text-sm">
            {msg}
          </div>
        ) : null}

        <label className="block mb-3">
          <span className="text-sm font-medium">Email</span>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@dealer.com"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button
          disabled={!canLogin || loading}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 disabled:opacity-40"
          onClick={onLogin}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="mt-3 flex items-center justify-between">
          <button
            className="text-sm underline text-slate-700 hover:text-slate-900"
            onClick={() => {
              setMsg(null);
              setOpen(true);
              setSuEmail(email);
              setSuPassword("");
              setSuPassword2("");
            }}
          >
            Create an account
          </button>

          <button
            className="text-sm text-slate-600 hover:text-slate-900"
            onClick={() => {
              // quick demo shortcut
              setEmail("demo@auctioniq.com");
              setPassword("demo123");
              setMsg("Tip: Click Create an account and use demo@auctioniq.com / demo123 to create a demo user.");
            }}
          >
            Demo tip
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          MVP note: accounts are stored locally in your browser for now. Later we’ll enable real cloud accounts.
        </p>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border shadow-sm p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Create Account</h2>
                <p className="text-sm text-slate-600">Password must match twice.</p>
              </div>
              <button
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                X
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Email</span>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  placeholder="you@dealer.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Password</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Confirm password</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={suPassword2}
                  onChange={(e) => setSuPassword2(e.target.value)}
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 disabled:opacity-40"
                onClick={onSignup}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>

              <button
                className="w-full rounded-xl border py-2.5 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}