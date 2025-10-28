'use client';

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-800 px-4 py-1 text-sm font-medium text-indigo-300">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />
            Full-stack Delivery Partner
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Design. Develop. Deploy. <br /> Faster with Arc-
            <span className="text-red-500 italic">i</span>-Tech.
          </h1>
          <p className="text-lg text-slate-300">
            We team up with ambitious founders and enterprises to deliver
            scalable web, mobile, and desktop applications. From idea to
            production, we stay on the journey with you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-400"
            >
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Explore services
              <Play className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
          <div className="grid gap-6">
            <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-6">
              <p className="text-sm uppercase tracking-wide text-indigo-200">
                Product Pulse
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                Single dashboard for code, deployments, and client feedback.
              </h3>
              <p className="mt-3 text-sm text-indigo-100">
                Give your stakeholders transparency with sprint burn-down,
                release notes, and live progress indicators.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold text-white">
                Delivery Playbook
              </h4>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
                <li>• Discovery workshops & architecture blueprints</li>
                <li>• Agile sprints with QA automation baked in</li>
                <li>• Cloud-native deployments & observability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-900" />
    </section>
  );
}
