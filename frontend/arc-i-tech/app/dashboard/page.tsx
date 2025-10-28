'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, formatDate } from "@/lib/api";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatMessage, Project, ServiceOffering, TaskBoard } from "@/types";
import { Calendar, PenSquare, Rocket, Workflow } from "lucide-react";

type ProjectForm = {
  name: string;
  summary: string;
  details: string;
  targetDate: string;
};

const emptyProjectForm: ProjectForm = {
  name: "",
  summary: "",
  details: "",
  targetDate: "",
};

type TaskSummary = {
  todo: number;
  inProgress: number;
  review: number;
  blocked: number;
  done: number;
};

const emptyTaskSummary: TaskSummary = {
  todo: 0,
  inProgress: 0,
  review: 0,
  blocked: 0,
  done: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProjectForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [taskSummaries, setTaskSummaries] = useState<Record<number, TaskSummary>>({});

  const loadTaskSummaries = useCallback(async (projectList: Project[]) => {
    if (!token) {
      return;
    }
    if (projectList.length === 0) {
      setTaskSummaries({});
      return;
    }
    try {
      const entries = await Promise.all(
        projectList.map(async (project) => {
          try {
            const response = await apiFetch<TaskBoard>(
              `/api/dashboard/projects/${project.id}/tasks`,
              { token },
            );
            return [project.id, summarizeBoard(response.data)] as const;
          } catch (error) {
            console.error(`Failed to load tasks for project ${project.id}`, error);
            return [project.id, { ...emptyTaskSummary }] as const;
          }
        }),
      );
      setTaskSummaries(Object.fromEntries(entries));
    } catch (error) {
      console.error("Failed to process task summaries", error);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, router]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [projectResponse, serviceResponse, chatResponse] = await Promise.all([
        apiFetch<Project[]>("/api/projects", { token }),
        apiFetch<ServiceOffering[]>("/api/services/featured"),
        apiFetch<ChatMessage[]>("/api/chat/messages", { token }),
      ]);
      setProjects(projectResponse.data);
      await loadTaskSummaries(projectResponse.data);
      setServices(serviceResponse.data);
      setMessages(chatResponse.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [token, loadTaskSummaries]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleProjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setFormSubmitting(true);
    setFormFeedback(null);
    try {
      const response = await apiFetch<Project>("/api/projects", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...projectForm,
          targetDate: projectForm.targetDate || null,
        }),
      });
      setFormFeedback(response.message ?? "Project request submitted.");
      setProjectForm(emptyProjectForm);
      setProjects((prev) => [response.data, ...prev]);
      setTaskSummaries((prev) => ({
        ...prev,
        [response.data.id]: { ...emptyTaskSummary },
      }));
    } catch (error: unknown) {
      setFormFeedback(
        error instanceof Error ? error.message : "Unable to submit project."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleChatSend = async (message: string) => {
    if (!token) return;
    const response = await apiFetch<ChatMessage>("/api/chat/messages", {
      method: "POST",
      token,
      body: JSON.stringify({ message }),
    });
    setMessages((prev) => [...prev, response.data]);
  };

  const stats = useMemo(() => {
    const active = projects.filter(
      (project) => project.status !== "DEPLOYED" && project.status !== "ON_HOLD"
    ).length;
    const shipped = projects.filter((project) => project.status === "DEPLOYED")
      .length;
    const averageProgress =
      projects.length === 0
        ? 0
        : Math.round(
            projects.reduce(
              (total, project) => total + (project.progressPercentage ?? 0),
              0,
            ) / projects.length,
          );
    return [
      {
        label: "Active engagements",
        value: active,
        icon: <Workflow className="h-5 w-5 text-indigo-500" />,
      },
      {
        label: "Shipped releases",
        value: shipped,
        icon: <Rocket className="h-5 w-5 text-emerald-500" />,
      },
      {
        label: "Average progress",
        value: `${averageProgress}%`,
        icon: <PenSquare className="h-5 w-5 text-slate-500" />,
      },
      {
        label: "Latest update",
        value:
          projects.length > 0
            ? formatDate(projects[0].updatedAt ?? projects[0].startDate)
            : "TBD",
        icon: <Calendar className="h-5 w-5 text-amber-500" />,
      },
    ];
  }, [projects]);

  const completedProjects = useMemo(
    () =>
      projects
        .filter((project) => project.status === "DEPLOYED" || project.progressPercentage === 100)
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.targetDate ?? "").getTime() -
            new Date(a.updatedAt ?? a.targetDate ?? "").getTime(),
        )
        .slice(0, 4),
    [projects],
  );

  const upcomingProjects = useMemo(() => {
    const asTime = (input: string | null | undefined) => {
      if (!input) {
        return Number.MAX_SAFE_INTEGER;
      }
      const time = new Date(input).getTime();
      return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
    };

    return projects
      .filter((project) => project.targetDate)
      .slice()
      .sort((a, b) => asTime(a.targetDate) - asTime(b.targetDate))
      .slice(0, 4);
  }, [projects]);

  if (!user) {
    return null;
  }

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <section>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hey {user.fullName.split(" ")[0]}, let&apos;s build something remarkable.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track delivery status, request new modules, and chat with the Arc-i-Tech squad.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="rounded-full bg-indigo-50 p-3">{stat.icon}</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Recently shipped
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                {completedProjects.length} launches
              </span>
            </div>
            {completedProjects.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Once a project reaches deployment, it will appear here with delivery highlights.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {completedProjects.map((project) => (
                  <li
                    key={`completed-${project.id}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        {project.name}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-emerald-500">
                        Deployed {formatDate(project.updatedAt ?? project.targetDate)}
                      </span>
                    </div>
                    {project.details && (
                      <p className="mt-2 text-xs text-slate-500">
                        {project.details}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Delivery timeline
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {projects.length} projects
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {loading && (
                <p className="text-sm text-slate-500">Loading projects...</p>
              )}
              {!loading && projects.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No projects yet. Submit your first brief and we will spin up a delivery pod.
                </p>
              )}
              {projects.map((project) => {
                const featureLines =
                  project.details
                    ?.split(/\r?\n+/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0) ?? [];
                const taskSummary = taskSummaries[project.id] ?? emptyTaskSummary;
                const pendingTasksCount =
                  taskSummary.todo + taskSummary.inProgress + taskSummary.review + taskSummary.blocked;
                const completedTasksCount = taskSummary.done;

                return (
                  <div
                    key={project.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500">{project.summary}</p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{project.progressPercentage}% complete</span>
                        <span>Target {formatDate(project.targetDate)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(project.progressPercentage ?? 0, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <span className="rounded-lg bg-white px-3 py-2">
                        Completed tasks
                        <span className="ml-1 font-semibold text-slate-700">
                          {completedTasksCount}
                        </span>
                      </span>
                      <span className="rounded-lg bg-white px-3 py-2">
                        Pending tasks
                        <span className="ml-1 font-semibold text-slate-700">
                          {pendingTasksCount}
                        </span>
                      </span>
                    </div>
                    {featureLines.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                        {featureLines.slice(0, 5).map((feature, index) => (
                          <li key={`${project.id}-feature-${index}`}>{feature}</li>
                        ))}
                      </ul>
                    ) : project.details ? (
                      <p className="mt-3 text-xs text-slate-500">
                        {project.details}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">
                        Share feature notes with the Arc-i-Tech team to populate this rundown.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Request a new build
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                Customer workspace
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Outline the next phase you want the Arc-i-Tech team to unlock. The delivery pod will follow up with scope confirmation.
            </p>
            <form onSubmit={handleProjectSubmit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Project name
                <input
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                  placeholder="Example: Partner onboarding portal"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Problem statement
                <input
                  value={projectForm.summary}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                  required
                  placeholder="What outcome are we targeting?"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Additional details
                <textarea
                  value={projectForm.details}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, details: event.target.value }))
                  }
                  rows={4}
                  placeholder="Success criteria, integrations, or reference journeys..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Target launch
                <input
                  type="date"
                  value={projectForm.targetDate}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, targetDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              {formFeedback && (
                <p className="text-sm font-semibold text-indigo-600">{formFeedback}</p>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formSubmitting ? "Submitting..." : "Submit request"}
                </button>
                {formSubmitting && (
                  <span className="text-xs text-slate-400">
                    Sending details to the delivery squad...
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Featured capabilities</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {services.length} offerings
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Explore our most requested delivery bundles. We tailor the scope to match your roadmap.
            </p>
            <div className="mt-4 space-y-3">
              {services.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Services will appear here once the catalogue is published.
                </p>
              ) : (
                services.slice(0, 6).map((service) => (
                  <article
                    key={service.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{service.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {service.category}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">{service.shortDescription}</p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                        {formatCurrency(service.startingPrice)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ChatPanel
            title="Delivery desk"
            messages={messages}
            onSend={handleChatSend}
            disabled={!token || loading}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Next milestones</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {projects.length > 0 ? "Prioritised" : "Awaiting briefs"}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingProjects.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Share estimated timelines inside each project brief to track milestones here.
                </p>
              ) : (
                upcomingProjects.map((project) => {
                  const taskSummary = taskSummaries[project.id] ?? emptyTaskSummary;
                  const openTasks =
                    taskSummary.todo + taskSummary.inProgress + taskSummary.review + taskSummary.blocked;
                  return (
                    <article
                      key={`milestone-${project.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                          <p className="text-xs text-slate-500">
                            Target {formatDate(project.targetDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-indigo-600">
                            {Math.round(project.progressPercentage ?? 0)}%
                          </p>
                          <p className="text-[11px] text-slate-400">{openTasks} open task(s)</p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function summarizeBoard(board: TaskBoard): TaskSummary {
  return {
    todo: board.todo.length,
    inProgress: board.inProgress.length,
    review: board.review.length,
    blocked: board.blocked.length,
    done: board.done.length,
  };
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Custom quote";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `INR ${value}`;
  }
}
