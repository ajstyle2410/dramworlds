'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await register(fullName, email, password);
      const role = response.data.user.role;
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
        err instanceof Error ? err.message : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          Join Arc-i-Tech
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track projects, chat with the delivery pod, and keep stakeholders in
          the loop—all in one place.
        </p>
        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
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
              minLength={8}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already onboard?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
