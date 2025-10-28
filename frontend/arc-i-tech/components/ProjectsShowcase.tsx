'use client';

import Image from "next/image";
import { Project } from "@/types";
import { formatDate } from "@/lib/api";
import { Kanban, Target, Users } from "lucide-react";

interface ProjectsShowcaseProps {
  projects: Project[];
}

const statusBadges: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-600",
  DISCOVERY: "bg-blue-100 text-blue-600",
  IN_DEVELOPMENT: "bg-indigo-100 text-indigo-600",
  TESTING: "bg-amber-100 text-amber-600",
  DEPLOYED: "bg-emerald-100 text-emerald-600",
  ON_HOLD: "bg-rose-100 text-rose-600",
};

export function ProjectsShowcase({ projects }: ProjectsShowcaseProps) {
  return (
    <section id="process" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <Image
              src="/Arc-i-Tech-logo.png"
              alt="Arc-i-Tech logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-contain"
            />
            <span className="text-xl font-semibold text-slate-800">
              Arc-<span className="text-red-500 italic">i</span>-Tech
            </span>
          </div>
          <span className="mx-auto w-fit rounded-full bg-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Case files
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Shipping mission-critical products
          </h2>
          <p className="mx-auto max-w-3xl text-base text-slate-600">
            Insights into how Arc-<span className="text-red-500 italic">i</span>-Tech translates domain knowledge into
            product experiences designed for scale, resilience, and delight.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Once your backend is ready, highlight customer success stories
              here to build credibility.
            </div>
          )}
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {project.summary}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadges[project.status] ?? "bg-slate-200 text-slate-700"}`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Kanban className="h-4 w-4 text-indigo-500" />
                  <span>
                    Progress:{" "}
                    <span className="font-semibold text-slate-700">
                      {project.progressPercentage}%
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <span>
                    Target launch:{" "}
                    <span className="font-semibold text-slate-700">
                      {formatDate(project.targetDate)}
                    </span>
                  </span>
                </div>
                {project.clientName && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>
                      Partnering with{" "}
                      <span className="font-semibold text-slate-700">
                        {project.clientName}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              {project.details && (
                <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                  {project.details}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
