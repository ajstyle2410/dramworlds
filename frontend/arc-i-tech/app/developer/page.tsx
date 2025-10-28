'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatDate, formatRelative } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  AdminDiscussion,
  DeveloperProjectSummary,
  DeveloperWorkspace,
  Project,
  ProjectTask,
  TaskBoard,
  TaskStatus,
} from "@/types";
import {
  BarChart3,
  Bell,
  CalendarRange,
  Kanban,
  ListTodo,
  Loader2,
  PlusCircle,
  Target,
  User,
  Workflow,
} from "lucide-react";

type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
};

const taskBoardColumns = [
  { key: "todo", label: "To do" },
  { key: "inProgress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
] as const;

const taskStatusOptions: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "BLOCKED",
  "DONE",
];

const emptyTaskForm: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
};

export default function DeveloperPage() {
  const { token, isAuthenticated, isDeveloper } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspace, setWorkspace] = useState<DeveloperWorkspace | null>(null);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<
    DeveloperProjectSummary[]
  >([]);
  const [activeBoardProjectId, setActiveBoardProjectId] = useState<number | null>(null);
  const [projectBoards, setProjectBoards] = useState<Record<number, TaskBoard>>({});
  const [boardLoadingProject, setBoardLoadingProject] = useState<number | null>(null);
  const [taskForms, setTaskForms] = useState<Record<number, TaskFormState>>({});
  const [boardErrors, setBoardErrors] = useState<Record<number, string>>({});
  const boardModalRef = useRef<HTMLDivElement | null>(null);
  const activeBoard = activeBoardProjectId !== null ? projectBoards[activeBoardProjectId] ?? null : null;
  const activeTaskForm =
    activeBoardProjectId !== null ? taskForms[activeBoardProjectId] ?? emptyTaskForm : emptyTaskForm;
  const activeBoardError =
    activeBoardProjectId !== null ? boardErrors[activeBoardProjectId] ?? null : null;
  const completedTasks = workspace?.taskBoard?.done ?? [];

  const loadWorkspace = useCallback(async () => {
    if (!token) return null;
    const workspaceRes = await apiFetch<DeveloperWorkspace>(
      "/api/developer/workspace",
      { token },
    );
    const data = workspaceRes.data;
    setWorkspace(data);
    setProjects(data?.assignedProjects ?? []);
    setProjectSummaries(data?.projectSummaries ?? []);
    return data;
  }, [token]);

  const loadBoard = useCallback(
    async (projectId: number) => {
      if (!token) return null;
      try {
        setBoardLoadingProject(projectId);
        setBoardErrors((prev) => {
          if (!prev[projectId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
        const response = await apiFetch<TaskBoard>(
          `/api/developer/projects/${projectId}/tasks`,
          { token },
        );
        setProjectBoards((prev) => ({
          ...prev,
          [projectId]: response.data,
        }));
        return response.data;
      } catch (error) {
        console.error(`Failed to load task board for project ${projectId}`, error);
        setBoardErrors((prev) => ({
          ...prev,
          [projectId]: "Unable to load task board right now.",
        }));
        throw error;
      } finally {
        setBoardLoadingProject((current) =>
          current === projectId ? null : current,
        );
      }
    },
    [token],
  );

  const handleOpenBoard = useCallback(
    async (projectId: number) => {
      try {
        if (!projectBoards[projectId]) {
          await loadBoard(projectId);
        }
        setActiveBoardProjectId(projectId);
      } catch {
        // handled in loadBoard
      }
    },
    [projectBoards, loadBoard],
  );

  const handleCloseBoard = useCallback(() => {
    setActiveBoardProjectId(null);
  }, []);

  useEffect(() => {
    if (activeBoardProjectId === null) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseBoard();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        boardModalRef.current &&
        !boardModalRef.current.contains(event.target as Node)
      ) {
        handleCloseBoard();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeBoardProjectId, handleCloseBoard]);

  const handleTaskFormChange = useCallback(
    (projectId: number, field: keyof TaskFormState, value: string) => {
      setTaskForms((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] ?? emptyTaskForm),
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleCreateTask = useCallback(
    async (projectId: number) => {
      if (!token) return;
      const form = taskForms[projectId] ?? emptyTaskForm;
      if (!form.title.trim()) {
        setBoardErrors((prev) => ({
          ...prev,
          [projectId]: "Please provide a task title.",
        }));
        return;
      }

      try {
        setBoardErrors((prev) => {
          if (!prev[projectId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
        await apiFetch<ProjectTask>(
          `/api/developer/projects/${projectId}/tasks`,
          {
            method: "POST",
            token,
            body: JSON.stringify({
              projectId,
              title: form.title.trim(),
              description: form.description.trim() || null,
              status: "TODO",
              priority: "MEDIUM",
              dueDate: form.dueDate ? form.dueDate : null,
              clearDueDate: false,
            }),
          },
        );
        setTaskForms((prev) => ({
          ...prev,
          [projectId]: { ...emptyTaskForm },
        }));
        await Promise.all([loadBoard(projectId), loadWorkspace()]);
      } catch (error) {
        console.error(`Failed to create task for project ${projectId}`, error);
        setBoardErrors((prev) => ({
          ...prev,
          [projectId]: "Unable to add task. Try again.",
        }));
      }
    },
    [token, taskForms, loadBoard, loadWorkspace],
  );

  const handleUpdateTaskStatus = useCallback(
    async (projectId: number, task: ProjectTask, status: TaskStatus) => {
      if (!token || task.status === status) return;
      try {
        await apiFetch<ProjectTask>(`/api/developer/tasks/${task.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            projectId,
            status,
          }),
        });
        await Promise.all([loadBoard(projectId), loadWorkspace()]);
      } catch (error) {
        console.error(`Failed to update task ${task.id}`, error);
        setBoardErrors((prev) => ({
          ...prev,
          [projectId]: "Unable to update task status. Try again.",
        }));
      }
    },
    [token, loadBoard, loadWorkspace],
  );

  const bootstrap = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [, discussionsRes] = await Promise.all([
        loadWorkspace(),
        apiFetch<AdminDiscussion[]>("/api/admin/discussions/context/PROJECT", {
          token,
        }),
      ]);
      setDiscussions(discussionsRes.data.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [token, loadWorkspace]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isDeveloper || !token) {
      router.replace("/login");
      return;
    }
    void bootstrap();
  }, [isAuthenticated, isDeveloper, token, router, bootstrap]);

  useEffect(() => {
    if (
      activeBoardProjectId !== null &&
      !projectBoards[activeBoardProjectId] &&
      !boardLoadingProject
    ) {
      void loadBoard(activeBoardProjectId);
    }
  }, [activeBoardProjectId, projectBoards, boardLoadingProject, loadBoard]);

  const stats = useMemo(() => {
    const active = projects.filter(
      (project) => project.status !== "DEPLOYED" && project.status !== "ON_HOLD",
    ).length;
    const completed = projects.filter(
      (project) => project.status === "DEPLOYED",
    ).length;
    const pendingTasks = projectSummaries.reduce(
      (total, summary) =>
        total +
        summary.todoTasks +
        summary.inProgressTasks +
        summary.blockedTasks,
      0,
    );
    const overallProgress =
      projectSummaries.length === 0
        ? 0
        : Math.round(
            projectSummaries.reduce(
              (total, summary) =>
                total + summary.computedProgressPercentage,
              0,
            ) / projectSummaries.length,
          );
    const unreadSignals = workspace?.unreadNotifications ?? 0;
    const nextMilestone = projects
      .filter((project) => project.targetDate)
      .sort(
        (a, b) =>
          new Date(a.targetDate ?? 0).getTime() -
          new Date(b.targetDate ?? 0).getTime(),
      )[0];
    return [
      {
        label: "Active builds",
        value: active,
        icon: <Workflow className="h-5 w-5 text-indigo-500" />,
      },
      {
        label: "Overall progress",
        value: `${overallProgress}%`,
        icon: <BarChart3 className="h-5 w-5 text-emerald-500" />,
      },
      {
        label: "Open engineering tasks",
        value: pendingTasks,
        icon: <ListTodo className="h-5 w-5 text-amber-500" />,
      },
      {
        label: "Shipped releases",
        value: completed,
        icon: <Target className="h-5 w-5 text-emerald-500" />,
      },
      {
        label: "Next milestone",
        value: nextMilestone
          ? formatDate(nextMilestone.targetDate)
          : "Awaiting plan",
        icon: <CalendarRange className="h-5 w-5 text-amber-500" />,
      },
      {
        label: "Signals waiting",
        value: unreadSignals,
        icon: <Bell className="h-5 w-5 text-rose-500" />,
      },
    ];
  }, [projects, workspace, projectSummaries]);

  if (!mounted || !isAuthenticated || !isDeveloper) {
    return null;
  }

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Developer Console
          </h1>
          <p className="text-sm text-slate-500">
            Stay on top of delivery commitments, deadlines, and partner updates.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Completed deliverables
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                {completedTasks.length} done
              </span>
            </div>
            {completedTasks.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                You haven&apos;t closed any tasks yet this cycle. Finish a card to
                celebrate progress here.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {completedTasks.slice(0, 6).map((task) => (
                  <li
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {task.title}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-emerald-500">
                        Done {formatRelative(task.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>Project {task.projectName ?? "N/A"}</span>
                      {task.assignee && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <User className="h-3 w-3" />
                          {task.assignee.fullName}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        {task.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Project feature digest
            </h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {projectSummaries.map((summary) => {
                const project = summary.project;
                const featureLines =
                  project.details
                    ?.split(/\r?\n+/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0) ?? [];
                return (
                  <div
                    key={project.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Feature stream
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {project.name}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-500">
                        {summary.computedProgressPercentage}% complete
                      </span>
                    </div>
                    {featureLines.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No rich description just yet. Sync with the delivery
                        squad to capture highlights.
                      </p>
                    ) : (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                        {featureLines.slice(0, 5).map((feature, index) => (
                          <li key={`${project.id}-feature-${index}`}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Assigned projects
            </h2>
            <button
              type="button"
              onClick={() => bootstrap()}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
            >
              <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Syncing delivery data...
            </div>
          ) : projectSummaries.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No projects assigned yet. The super admin will tag you once a
              project requires your expertise.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {projectSummaries.map((summary) => {
                const project = summary.project;
                const hasBoardLoaded = Boolean(projectBoards[project.id]);
                const contributors = summary.contributors ?? [];
                const upcomingTasks = summary.upcomingTasks ?? [];
                return (
                  <article
                    key={project.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {project.summary}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                        <Kanban className="h-3 w-3" />
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-700">
                          {summary.computedProgressPercentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(summary.computedProgressPercentage, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs text-slate-600 md:grid-cols-4">
                      <p className="rounded-lg bg-white px-3 py-2">
                        Total tasks{" "}
                        <span className="font-semibold text-slate-800">
                          {summary.totalTasks}
                        </span>
                      </p>
                      <p className="rounded-lg bg-white px-3 py-2">
                        In flight{" "}
                        <span className="font-semibold text-slate-800">
                          {summary.inProgressTasks + summary.todoTasks}
                        </span>
                      </p>
                      <p className="rounded-lg bg-white px-3 py-2">
                        Blocked{" "}
                        <span className="font-semibold text-amber-600">
                          {summary.blockedTasks}
                        </span>
                      </p>
                      <p className="rounded-lg bg-white px-3 py-2">
                        Completed{" "}
                        <span className="font-semibold text-emerald-600">
                          {summary.completedTasks}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-4">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Contributors
                        </h4>
                        {contributors.length === 0 ? (
                          <p className="mt-2 text-[11px] text-slate-400">
                            You are the primary owner for now.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                            {contributors.map((member) => (
                              <li key={member.id}>
                                <span className="font-semibold text-slate-700">
                                  {member.fullName}
                                </span>{" "}
                                <span className="uppercase tracking-wide text-slate-400">
                                  {member.role.replace("_", " ")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="rounded-lg bg-white p-4">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Upcoming focus
                        </h4>
                        {upcomingTasks.length === 0 ? (
                          <p className="mt-2 text-[11px] text-slate-400">
                            All tasks are delivered. Keep an eye on new assignments.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-2 text-[11px] text-slate-600">
                            {upcomingTasks.slice(0, 3).map((task) => (
                              <li
                                key={task.id}
                                className="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800">
                                    {task.title}
                                  </span>
                                  <span className="uppercase tracking-wide text-indigo-500">
                                    {task.status.replace("_", " ")}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-400">
                                  <span>Due {formatDate(task.dueDate ?? null)}</span>
                                  {task.assignee && (
                                    <span className="inline-flex items-center gap-1 text-slate-500">
                                      <User className="h-3 w-3" />
                                      {task.assignee.fullName}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Sprint board
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            void handleOpenBoard(project.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:border-indigo-400 hover:text-indigo-700"
                        >
                          {hasBoardLoaded ? "Open scrum board" : "Load scrum board"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                      <p>
                        Target date{" "}
                        <span className="font-semibold text-slate-800">
                          {formatDate(project.targetDate)}
                        </span>
                      </p>
                      <p>
                        Last update {formatRelative(project.updatedAt)}
                      </p>
                      <p>
                        Client{" "}
                        <span className="font-semibold text-slate-800">
                          {project.clientName ?? "Unassigned"}
                        </span>
                      </p>
                    </div>

                    {project.details && (
                      <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-500">
                        {project.details}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Leadership updates
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {discussions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                No admin updates yet. Check back after the next delivery sync.
              </p>
            ) : (
              discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {discussion.subject}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatRelative(discussion.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-indigo-500">
                    {discussion.projectName
                      ? `${discussion.context} - ${discussion.projectName}`
                      : discussion.context}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {discussion.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {discussion.senderName} -{" "}
                    {discussion.senderRole.replace("_", " ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {activeBoardProjectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div
            ref={boardModalRef}
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Sprint board
                </p>
                <h3 className="text-sm font-semibold text-slate-800">
                  {projectSummaries.find((item) => item.project.id === activeBoardProjectId)?.project
                    .name ?? "Project"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadBoard(activeBoardProjectId)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                >
                  <Loader2
                    className={`h-3 w-3 ${boardLoadingProject === activeBoardProjectId ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleCloseBoard}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {activeBoardError && (
                <p className="m-4 rounded-lg border border-dashed border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-600">
                  {activeBoardError}
                </p>
              )}

              {boardLoadingProject === activeBoardProjectId ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing board state...
                </div>
              ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4 md:grid-cols-5">
                      {taskBoardColumns.map(({ key, label }) => {
                        const tasks = activeBoard?.[key] ?? [];
                        return (
                          <div
                            key={key}
                            className="flex max-h-full flex-col rounded-lg border border-slate-200 bg-slate-50"
                          >
                          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {label}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {tasks.length}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-xs text-slate-600">
                            {tasks.length === 0 ? (
                              <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-[11px] text-slate-400">
                                No entries yet.
                              </p>
                            ) : (
                              tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-800">
                                      {task.title}
                                    </span>
                                    <select
                                      value={task.status}
                                      onChange={(event) =>
                                        void handleUpdateTaskStatus(
                                          activeBoardProjectId,
                                          task,
                                          event.target.value as TaskStatus,
                                        )
                                      }
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    >
                                      {taskStatusOptions.map((statusOption) => (
                                        <option key={statusOption} value={statusOption}>
                                          {statusOption.replace("_", " ")}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {task.description && (
                                    <p className="text-[11px] text-slate-500">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span>
                                      Due {formatDate(task.dueDate ?? null)}
                                    </span>
                                    {task.assignee && (
                                      <span className="inline-flex items-center gap-1 text-slate-500">
                                        <User className="h-3 w-3" />
                                        {task.assignee.fullName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleCreateTask(activeBoardProjectId);
                    }}
                    className="border-t border-slate-200 bg-white px-6 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row">
                      <label className="flex-1 text-xs font-semibold text-slate-600">
                        Task title
                        <input
                          value={activeTaskForm.title}
                          onChange={(event) =>
                            handleTaskFormChange(
                              activeBoardProjectId,
                              "title",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          placeholder="Add engineering task"
                          required
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600 md:w-48">
                        Due date
                        <input
                          type="date"
                          value={activeTaskForm.dueDate}
                          onChange={(event) =>
                            handleTaskFormChange(
                              activeBoardProjectId,
                              "dueDate",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-semibold text-slate-600">
                      Notes
                      <textarea
                        value={activeTaskForm.description}
                        onChange={(event) =>
                          handleTaskFormChange(
                            activeBoardProjectId,
                            "description",
                            event.target.value,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        rows={2}
                        placeholder="Add optional implementation details"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400">
                        Tasks are auto-assigned to you. Reassignment coming soon.
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={boardLoadingProject === activeBoardProjectId}
                      >
                        <PlusCircle className="h-3 w-3" />
                        Add task
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
