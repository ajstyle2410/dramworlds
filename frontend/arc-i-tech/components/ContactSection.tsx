'use client';

import { apiFetch } from "@/lib/api";
import { useState } from "react";

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source: string;
};

const initialState: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  source: "Website",
};

export function ContactSection() {
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleChange = (field: keyof ContactFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await apiFetch("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setFeedback(response.message ?? "We will get back to you shortly.");
      setForm(initialState);
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-white py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Get in touch
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Let&apos;s co-create your next big release
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Share a few details and one of our consultants will schedule a
            discovery workshop. We cover project goals, success metrics, and the
            best roadmap for your timeline.
          </p>
          {feedback && (
            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {feedback}
            </p>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
        >
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Full name
              </label>
              <input
                required
                value={form.fullName}
                onChange={handleChange("fullName")}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Organisation
                </label>
                <input
                  value={form.company}
                  onChange={handleChange("company")}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tell us about your project
              </label>
              <textarea
                required
                value={form.message}
                onChange={handleChange("message")}
                rows={5}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Submit inquiry"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
