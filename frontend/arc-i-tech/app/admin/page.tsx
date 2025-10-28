'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatDate, formatRelative } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  AdminDiscussion,
  ChatMessage,
  Inquiry,
  Project,
  ProjectAssignment,
  ProjectTask,
  TaskBoard,
  TaskStatus,
  UserProfile,
} from "@/types";
import { ChatPanel } from "@/components/ChatPanel";
import {
  Calendar,
  ClipboardList,
  Loader2,
  Kanban,
  PlusCircle,
  RefreshCw,
  Trash2,
  Target,
  User,
  Users,
} from "lucide-react";

type DiscussionContext = "PROJECT" | "SERVICE" | "OPERATIONS";

type DiscussionFormState = {
  context: DiscussionContext;
  projectId: string;
  serviceCategory: string;
  subject: string;
  message: string;
  progressRatio: string;
};

const initialDiscussionForm: DiscussionFormState = {
  context: "PROJECT",
  projectId: "",
  serviceCategory: "",
  subject: "",
  message: "",
  progressRatio: "",
};

type ProjectTaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
};

const emptyTaskForm: ProjectTaskFormState = {
  title: "",
  description: "",
  dueDate: "",
  assigneeId: "",
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

const projectStatuses: Project["status"][] = [
  "PLANNING",
  "DISCOVERY",
  "IN_DEVELOPMENT",
  "TESTING",
  "DEPLOYED",
  "ON_HOLD",
];

export default function AdminPage() {
  const { token, isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [taskBoard, setTaskBoard] = useState<TaskBoard | null>(null);
  const [taskBoardLoading, setTaskBoardLoading] = useState(false);
  const [taskBoardError, setTaskBoardError] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<ProjectTaskFormState>(emptyTaskForm);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [discussionForm, setDiscussionForm] = useState(initialDiscussionForm);
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [updatingInquiry, setUpdatingInquiry] = useState<number | null>(null);

  const refreshTaskBoard = useCallback(
    async (projectId: number | null) => {
      if (!token || !projectId) {
        setTaskBoard(null);
        return;
      }
      try {
        setTaskBoardLoading(true);
        setTaskBoardError(null);
        const response = await apiFetch<TaskBoard>(
          `/api/admin/projects/${projectId}/tasks`,
          { token },
        );
        setTaskBoard(response.data);
      } catch (error) {
        console.error(`Failed to load task board for project ${projectId}`, error);
        setTaskBoardError("Unable to load project tasks right now.");
        setTaskBoard(null);
      } finally {
        setTaskBoardLoading(false);
      }
    },
    [token],
  );

  const refreshAssignments = useCallback(
    async (projectId: number | null) => {
      if (!token || !projectId) {
        setAssignments([]);
        setTaskBoard(null);
        return;
      }
      const response = await apiFetch<ProjectAssignment[]>(
        `/api/admin/projects/${projectId}/assignments`,
        { token },
      );
      setAssignments(response.data);
      await refreshTaskBoard(projectId);
    },
    [token, refreshTaskBoard],
  );

  const refreshChat = useCallback(
    async (customerId: number | null) => {
      if (!token || !customerId) {
        setChatMessages([]);
        return;
      }
      const response = await apiFetch<ChatMessage[]>(
        `/api/admin/chat/${customerId}/messages`,
        { token },
      );
      setChatMessages(response.data);
    },
    [token],
  );

  const handleTaskFormChange = (
    field: keyof ProjectTaskFormState,
    value: string,
  ) => {
    setTaskForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTask = useCallback(async () => {
    if (!token || !selectedProjectId) return;
    if (!taskForm.title.trim()) {
      setTaskBoardError("Task title is required.");
      return;
    }
    try {
      setTaskBoardError(null);
      await apiFetch<ProjectTask>(
        `/api/admin/projects/${selectedProjectId}/tasks`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            projectId: selectedProjectId,
            title: taskForm.title.trim(),
            description: taskForm.description.trim() || null,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: taskForm.dueDate ? taskForm.dueDate : null,
            assigneeId: taskForm.assigneeId
              ? Number(taskForm.assigneeId)
              : null,
            clearDueDate: false,
          }),
        },
      );
      setTaskForm(emptyTaskForm);
      await refreshTaskBoard(selectedProjectId);
    } catch (error) {
      console.error("Failed to create task", error);
      setTaskBoardError("Unable to create task. Please try again.");
    }
  }, [token, selectedProjectId, taskForm, refreshTaskBoard]);

  const handleAdminTaskStatusChange = useCallback(
    async (task: ProjectTask, status: TaskStatus) => {
      if (!token || !selectedProjectId || task.status === status) {
        return;
      }
      try {
        await apiFetch<ProjectTask>(`/api/admin/tasks/${task.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            projectId: selectedProjectId,
            status,
          }),
        });
        await refreshTaskBoard(selectedProjectId);
      } catch (error) {
        console.error("Failed to update task status", error);
        setTaskBoardError("Unable to update task status.");
      }
    },
    [token, selectedProjectId, refreshTaskBoard],
  );

  const handleAdminTaskAssigneeChange = useCallback(
    async (task: ProjectTask, assigneeValue: string) => {
      if (!token || !selectedProjectId) return;
      const assigneeId = assigneeValue ? Number(assigneeValue) : null;
      if (task.assignee?.id === assigneeId) {
        return;
      }
      try {
        await apiFetch<ProjectTask>(`/api/admin/tasks/${task.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            projectId: selectedProjectId,
            assigneeId,
            clearAssignee: assigneeValue === "",
          }),
        });
        await refreshTaskBoard(selectedProjectId);
      } catch (error) {
        console.error("Failed to reassign task", error);
        setTaskBoardError("Unable to update assignee.");
      }
    },
    [token, selectedProjectId, refreshTaskBoard],
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      if (!token || !selectedProjectId) return;
      try {
        await apiFetch<null>(`/api/admin/tasks/${taskId}`, {
          method: "DELETE",
          token,
          parseJson: false,
        });
        await refreshTaskBoard(selectedProjectId);
      } catch (error) {
        console.error("Failed to delete task", error);
        setTaskBoardError("Unable to delete task.");
      }
    },
    [token, selectedProjectId, refreshTaskBoard],
  );

  const bootstrap = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [projectRes, inquiryRes, customerRes, discussionRes] =
          await Promise.all([
            apiFetch<Project[]>("/api/admin/projects", { token }),
            apiFetch<Inquiry[]>("/api/admin/inquiries", { token }),
            apiFetch<UserProfile[]>("/api/admin/users", { token }),
            apiFetch<AdminDiscussion[]>(
                "/api/admin/discussions/context/PROJECT",
                { token },
            ),
          ]);

      setProjects(projectRes.data);
      setInquiries(inquiryRes.data);
      setCustomers(customerRes.data);
      setDiscussions(discussionRes.data);

      if (projectRes.data.length > 0) {
        const firstProject = projectRes.data[0];
        setSelectedProjectId(firstProject.id);
        setDiscussionForm((prev) => ({
          ...prev,
          projectId: firstProject.id.toString(),
        }));
        await refreshAssignments(firstProject.id);
      }

      if (customerRes.data.length > 0) {
        const firstCustomer = customerRes.data[0];
        setSelectedCustomerId(firstCustomer.id);
        await refreshChat(firstCustomer.id);
      }
    } catch (error) {
      console.error("Failed to bootstrap admin console", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout, refreshAssignments, refreshChat]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isAuthenticated || !token || !(isAdmin || isSuperAdmin)) {
      router.replace("/login");
      return;
    }
    void bootstrap();
  }, [mounted, isAuthenticated, token, isAdmin, isSuperAdmin, router, bootstrap]);

  const handleProjectUpdate = async (
    projectId: number,
    updates: Partial<
      Pick<Project, "status" | "progressPercentage" | "targetDate">
    >,
  ) => {
    if (!token) return;
    const response = await apiFetch<Project>(
      `/api/admin/projects/${projectId}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: updates.status ?? undefined,
          progressPercentage: updates.progressPercentage ?? undefined,
          targetDate:
            updates.targetDate === "" ? null : updates.targetDate ?? undefined,
        }),
      },
    );
    setProjects((prev) =>
      prev.map((project) => (project.id === projectId ? response.data : project)),
    );
  };

  const handleInquiryUpdate = async (
    inquiryId: number,
    updates: { status: Inquiry["status"]; assignedTo: string },
  ) => {
    if (!token) return;
    setUpdatingInquiry(inquiryId);
    try {
      const response = await apiFetch<Inquiry>(
        `/api/admin/inquiries/${inquiryId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify(updates),
        },
      );
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId ? response.data : inquiry,
        ),
      );
    } finally {
      setUpdatingInquiry(null);
    }
  };

  const handleSendChat = async (message: string) => {
    if (!token || !selectedCustomerId) return;
    const response = await apiFetch<ChatMessage>(
      `/api/admin/chat/${selectedCustomerId}/messages`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ message }),
      },
    );
    setChatMessages((prev) => [...prev, response.data]);
  };

  const handleDiscussionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setPostingDiscussion(true);
    try {
      const payload: Record<string, unknown> = {
        context: discussionForm.context,
        subject: discussionForm.subject,
        message: discussionForm.message,
      };
      if (discussionForm.context === "PROJECT") {
        payload.projectId = discussionForm.projectId
          ? Number(discussionForm.projectId)
          : null;
      } else if (discussionForm.context === "SERVICE") {
        payload.serviceCategory = discussionForm.serviceCategory;
      }
      if (discussionForm.progressRatio) {
        payload.progressRatio = Number(discussionForm.progressRatio);
      }
      const response = await apiFetch<AdminDiscussion>(
        "/api/admin/discussions",
        {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        },
      );
      setDiscussions((prev) => [response.data, ...prev]);
      setDiscussionForm(initialDiscussionForm);
    } finally {
      setPostingDiscussion(false);
    }
  };

  const stats = useMemo(() => {
    const activeProjects = projects.filter(
      (project) => project.status !== "DEPLOYED",
    ).length;
    const closedDeals = inquiries.filter(
      (inquiry) => inquiry.status === "WON",
    ).length;
    const latestDiscussion = discussions[0];
    return [
      {
        label: "Active projects",
        value: activeProjects,
        icon: <ClipboardList className="h-5 w-5 text-indigo-500" />,
      },
      {
        label: "Won opportunities",
        value: closedDeals,
        icon: <Target className="h-5 w-5 text-emerald-500" />,
      },
      {
        label: "Latest update",
        value: latestDiscussion
          ? formatRelative(latestDiscussion.createdAt)
          : "Pending",
        icon: <Calendar className="h-5 w-5 text-amber-500" />,
      },
    ];
  }, [projects, inquiries, discussions]);

  if (!isAuthenticated || !(isAdmin || isSuperAdmin)) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Mission Control
          </h1>
          <p className="text-sm text-slate-500">
            Coordinate delivery, triage leads, and collaborate with the Arc-i-Tech
            crew.
          </p>
          {isSuperAdmin && (
            <p className="text-xs font-semibold uppercase text-indigo-500">
              Super admin access detected &mdash; hop over to the dedicated console
              for staffing, services, and reporting needs.
            </p>
          )}
        </header>

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

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Delivery pipeline
              </h2>
              <button
                type="button"
                onClick={() => bootstrap()}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                No live projects yet. Customer requests will appear here once
                approved.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {projects.map((project) => {
                  const isActive = selectedProjectId === project.id;
                  return (
                    <article
                      key={project.id}
                      className={`rounded-xl border p-4 transition ${
                        isActive
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">
                            {project.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {project.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="text-xs font-semibold text-slate-600">
                          Status
                          <select
                            value={project.status}
                            onChange={(event) =>
                              handleProjectUpdate(project.id, {
                                status: event.target.value as Project["status"],
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          >
                            {projectStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Progress %
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={project.progressPercentage}
                            onChange={(event) =>
                              handleProjectUpdate(project.id, {
                                progressPercentage: Number(event.target.value),
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Target date
                          <input
                            type="date"
                            value={project.targetDate ?? ""}
                            onChange={(event) =>
                              handleProjectUpdate(project.id, {
                                targetDate: event.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Client: {project.clientName ?? "Unassigned"}</span>
                        <span>Last update: {formatDate(project.updatedAt)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            void refreshAssignments(project.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                          <Users className="h-3 w-3" /> View squad
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Assigned squad
              </h2>
              <div className="mt-4 space-y-3">
                {assignments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No sub-admins or developers have been assigned to this project yet.
                  </p>
                ) : (
                  assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                    >
                      <p className="font-semibold text-slate-800">
                        {assignment.memberName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {assignment.memberEmail}
                      </p>
                      <p className="mt-1 text-xs text-indigo-600">
                        {assignment.assignmentRole.replace("_", " ")} ·{" "}
                        {formatRelative(assignment.assignedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Delivery task board
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    selectedProjectId
                      ? void refreshTaskBoard(selectedProjectId)
                      : undefined
                  }
                  disabled={!selectedProjectId || taskBoardLoading}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${taskBoardLoading ? "animate-spin" : ""}`}
                  />
                  Sync board
                </button>
              </div>
              {selectedProjectId === null ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  Select a project from the list to review its engineering board.
                </p>
              ) : taskBoardLoading ? (
                <div className="mt-6 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading task board...
                </div>
              ) : (
                <>
                  {taskBoardError && (
                    <p className="mt-4 rounded-lg border border-dashed border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                      {taskBoardError}
                    </p>
                  )}
                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    {taskBoardColumns.map(({ key, label }) => {
                      const tasks = taskBoard?.[key] ?? [];
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <Kanban className="h-3 w-3 text-indigo-500" />
                              {label}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {tasks.length}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {tasks.length === 0 ? (
                              <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-[11px] text-slate-400">
                                No tasks in this lane yet.
                              </p>
                            ) : (
                              tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-800">
                                      {task.title}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="rounded-md border border-transparent bg-rose-50 p-1 text-rose-500 hover:border-rose-200 hover:text-rose-600"
                                        title="Delete task"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  {task.description && (
                                    <p className="text-[11px] text-slate-500">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                      Status
                                      <select
                                        value={task.status}
                                        onChange={(event) =>
                                          handleAdminTaskStatusChange(
                                            task,
                                            event.target.value as TaskStatus,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                      >
                                        {taskStatusOptions.map((statusOption) => (
                                          <option key={statusOption} value={statusOption}>
                                            {statusOption.replace("_", " ")}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                      Assignee
                                      <select
                                        value={task.assignee ? String(task.assignee.id) : ""}
                                        onChange={(event) =>
                                          handleAdminTaskAssigneeChange(
                                            task,
                                            event.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                      >
                                        <option value="">Unassigned</option>
                                        {assignments.map((assignment) => (
                                          <option
                                            key={assignment.id}
                                            value={assignment.memberId}
                                          >
                                            {assignment.memberName} (
                                            {assignment.assignmentRole.replace("_", " ")})
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
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
                      void handleCreateTask();
                    }}
                    className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row">
                      <label className="flex-1 text-xs font-semibold text-slate-600">
                        Task title
                        <input
                          value={taskForm.title}
                          onChange={(event) =>
                            handleTaskFormChange("title", event.target.value)
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
                          value={taskForm.dueDate}
                          onChange={(event) =>
                            handleTaskFormChange("dueDate", event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600 md:w-56">
                        Assign to
                        <select
                          value={taskForm.assigneeId}
                          onChange={(event) =>
                            handleTaskFormChange("assigneeId", event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Unassigned</option>
                          {assignments.map((assignment) => (
                            <option key={assignment.id} value={assignment.memberId}>
                              {assignment.memberName} (
                              {assignment.assignmentRole.replace("_", " ")})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-semibold text-slate-600">
                      Notes
                      <textarea
                        value={taskForm.description}
                        onChange={(event) =>
                          handleTaskFormChange("description", event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        rows={2}
                        placeholder="Add implementation details or acceptance criteria"
                      />
                    </label>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">
                        Notify the assigned teammate instantly after saving.
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={taskBoardLoading}
                      >
                        <PlusCircle className="h-3 w-3" />
                        Add task
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Admin discussion board
              </h2>
              <form
                onSubmit={handleDiscussionSubmit}
                className="mt-3 space-y-3"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Topic
                    <select
                      value={discussionForm.context}
                      onChange={(event) =>
                        setDiscussionForm((prev) => ({
                          ...prev,
                          context: event.target.value as DiscussionContext,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="PROJECT">Project</option>
                      <option value="SERVICE">Service</option>
                      <option value="OPERATIONS">Operations</option>
                    </select>
                  </label>
                  {discussionForm.context === "PROJECT" ? (
                    <label className="text-xs font-semibold text-slate-600">
                      Project
                      <select
                        value={discussionForm.projectId}
                        onChange={(event) =>
                          setDiscussionForm((prev) => ({
                            ...prev,
                            projectId: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Select project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="text-xs font-semibold text-slate-600">
                      Service category
                      <input
                        value={discussionForm.serviceCategory}
                        onChange={(event) =>
                          setDiscussionForm((prev) => ({
                            ...prev,
                            serviceCategory: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </label>
                  )}
                </div>
                <label className="text-xs font-semibold text-slate-600">
                  Subject
                  <input
                    value={discussionForm.subject}
                    onChange={(event) =>
                      setDiscussionForm((prev) => ({
                        ...prev,
                        subject: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Message
                  <textarea
                    value={discussionForm.message}
                    onChange={(event) =>
                      setDiscussionForm((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    required
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Progress ratio (0-1)
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={discussionForm.progressRatio}
                    onChange={(event) =>
                      setDiscussionForm((prev) => ({
                        ...prev,
                        progressRatio: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={postingDiscussion}
                  className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {postingDiscussion ? "Posting..." : "Share update"}
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Inbound inquiries
              </h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {inquiries.length} requests
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {inquiries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No new inquiries. Leads captured from the website will appear here
                  for follow-up.
                </p>
              ) : (
                inquiries.map((inquiry) => (
                  <article
                    key={inquiry.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {inquiry.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {inquiry.email} · {inquiry.company ?? "Independent"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {inquiry.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {inquiry.message}
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Status
                        <select
                          value={inquiry.status}
                          onChange={(event) =>
                            handleInquiryUpdate(inquiry.id, {
                              status: event.target.value as Inquiry["status"],
                              assignedTo: inquiry.assignedTo ?? "",
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="NEW">NEW</option>
                          <option value="IN_DISCUSSION">IN DISCUSSION</option>
                          <option value="QUOTED">QUOTED</option>
                          <option value="WON">WON</option>
                          <option value="LOST">LOST</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Owner
                        <input
                          value={inquiry.assignedTo ?? ""}
                          onChange={(event) =>
                            handleInquiryUpdate(inquiry.id, {
                              status: inquiry.status,
                              assignedTo: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Received on {formatDate(inquiry.createdAt)}
                    </p>
                    {updatingInquiry === inquiry.id && (
                      <p className="mt-2 text-xs text-indigo-500">
                        Saving changes...
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Customer collaboration
              </h2>
              <label className="mt-3 block text-xs font-semibold text-slate-600">
                Select customer
                <select
                  value={selectedCustomerId ?? ""}
                  onChange={(event) => {
                    const id = event.target.value
                      ? Number(event.target.value)
                      : null;
                    setSelectedCustomerId(id);
                    void refreshChat(id);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Choose customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4">
                <ChatPanel
                  title="Project chat"
                  messages={chatMessages}
                  onSend={handleSendChat}
                  disabled={!selectedCustomerId}
                  compact
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Conversation feed
                </h2>
              </div>
              <div className="mt-3 space-y-3">
                {discussions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
                    No admin discussions yet. Log decisions or blockers via the
                    board above.
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
                        {discussion.context}
                        {discussion.projectName ? ` · ${discussion.projectName}` : ""}
                        {discussion.serviceCategory
                          ? ` · ${discussion.serviceCategory}`
                          : ""}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm">
                        {discussion.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Posted by {discussion.senderName} ·{" "}
                        {discussion.senderRole.replace("_", " ")}
                        {discussion.progressRatio !== null
                          ? ` · Progress ${Math.round(
                              discussion.progressRatio * 100,
                            )}%`
                          : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
