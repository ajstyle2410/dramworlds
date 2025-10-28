'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const demoAccounts = [
  {
    role: "Super Admin",
    email: "admin@arcitech.com",
    password: "ChangeMe123!",
    description: "Provision staff, update services, export reports.",
  },
  {
    role: "Sub-admin",
    email: "ops.lead@arcitech.com",
    password: "OpsLead123!",
    description: "Manage delivery pipeline, inquiries, and customer chat.",
  },
  {
    role: "Developer",
    email: "dev.lead@arcitech.com",
    password: "DevLead123!",
    description: "Track assigned builds and milestones.",
  },
  {
    role: "Customer",
    email: "client@arcitech.com",
    password: "Client123!",
    description: "Review project status and request new modules.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      const role = result.data.user.role;
      const destination =
        role === "SUPER_ADMIN"
          ? "/super-admin"
          : role === "SUB_ADMIN"
            ? "/admin"
            : role === "DEVELOPER"
              ? "/developer"
              : "/dashboard";
      router.push(destination);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">
          Access your Arc-i-Tech workspace to track deliveries and collaborate
          with the team.
        </p>
        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New to Arc-i-Tech?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Demo credentials
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Use the seeded accounts below to explore each dashboard.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {demoAccounts.map((account) => (
              <li
                key={account.email}
                className="rounded-lg bg-white p-3 shadow-sm"
              >
                <p className="font-semibold text-slate-800">
                  {account.role}
                </p>
                <p>
                  {account.email} · <span className="font-mono">{account.password}</span>
                </p>
                <p className="mt-1 text-slate-500">{account.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
