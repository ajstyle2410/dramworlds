'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, formatDate } from "@/lib/api";
import {
  persistSharedState,
  readSharedState,
  subscribeToSharedState,
} from "@/lib/sharedState";
import { ChatPanel } from "@/components/ChatPanel";
import {
  DashboardSidebar,
  type DashboardSidebarItem,
} from "@/components/DashboardSidebar";
import {
  ChatMessage,
  Project,
  ProjectTask,
  ServiceOffering,
  TaskBoard,
  TaskStatus,
} from "@/types";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  PenSquare,
  Rocket,
  Users2,
  Workflow,
  X,
} from "lucide-react";

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

const emptyTaskBoard: TaskBoard = {
  todo: [],
  inProgress: [],
  review: [],
  blocked: [],
  done: [],
};

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-200 text-slate-600",
  IN_PROGRESS: "bg-indigo-100 text-indigo-600",
  REVIEW: "bg-amber-100 text-amber-600",
  BLOCKED: "bg-rose-100 text-rose-600",
  DONE: "bg-emerald-100 text-emerald-600",
};

type ProductKey = "MOCK_INTERVIEWS" | "PROJECT_MENTORSHIP" | "SOFTWARE_CONSULTING";

const productCatalog: Array<{
  key: ProductKey;
  name: string;
  description: string;
  route: string;
  requiresApproval: boolean;
  badge: string;
}> = [
  {
    key: "MOCK_INTERVIEWS",
    name: "Mock Interviews & Placement Guidance",
    description:
      "Session calendar, placement checklist, mock topics, interview feedback loops, and offer tracking.",
    route: "/dashboard/mock-interviews",
    requiresApproval: true,
    badge: "Career accelerator",
  },
  {
    key: "PROJECT_MENTORSHIP",
    name: "Project Mentorship",
    description:
      "Roadmap, milestone tracker, submission reviews, skill matrix, and mentor roster.",
    route: "/dashboard/project-mentorship",
    requiresApproval: true,
    badge: "Mentor curated",
  },
  {
    key: "SOFTWARE_CONSULTING",
    name: "Software Consulting",
    description:
      "Consulting engagements, statements of work, billing snapshot, and communication logs.",
    route: "/dashboard/software-consulting",
    requiresApproval: false,
    badge: "Always available",
  },
];

const defaultActiveDashboardKeys: ProductKey[] = productCatalog
  .filter((product) => !product.requiresApproval)
  .map((product) => product.key);

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface DashboardAccessRequest {
  id: number;
  userId: number;
  userName: string;
  productKey: ProductKey;
  status: RequestStatus;
  note?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
  decidedBy?: number | null;
  decidedByName?: string | null;
}

type ProgramNoteAuthor = "USER" | "INTERVIEW_SUB_ADMIN" | "MENTORSHIP_SUB_ADMIN";
type ProgramNoteKind = "QUESTION" | "SUGGESTION";

interface ProgramNoteEntry {
  id: number;
  product: ProductKey;
  author: ProgramNoteAuthor;
  kind: ProgramNoteKind;
  content: string;
  participantId: number;
  createdAt: string;
  updatedAt?: string | null;
}

interface ProgramChatMessage {
  id: number;
  product: ProductKey;
  from: "USER" | "SUB_ADMIN";
  content: string;
  participantId: number;
  createdAt: string;
}

type ProgramMeetStatus = "SCHEDULED" | "LIVE" | "ENDED";

interface ProgramMeetSession {
  id: number;
  product: ProductKey;
  title: string;
  agenda: string;
  hostId: number;
  hostName: string;
  startAt: string;
  createdAt: string;
  updatedAt: string;
  status: ProgramMeetStatus;
  meetingLink: string;
}

const PROGRAM_NOTES_KEY = "arc-program-notes";
const PROGRAM_CHAT_KEY = "arc-program-chat";

function createEmptyNotesStore(): Record<ProductKey, ProgramNoteEntry[]> {
  return {
    MOCK_INTERVIEWS: [],
    PROJECT_MENTORSHIP: [],
    SOFTWARE_CONSULTING: [],
  };
}

function createEmptyChatStore(): Record<ProductKey, ProgramChatMessage[]> {
  return {
    MOCK_INTERVIEWS: [],
    PROJECT_MENTORSHIP: [],
    SOFTWARE_CONSULTING: [],
  };
}

function normalizeNoteEntry(entry: any): ProgramNoteEntry {
  return {
    id: entry?.id ?? Date.now(),
    product: entry?.product ?? "PROJECT_MENTORSHIP",
    author: entry?.author ?? "USER",
    kind: entry?.kind ?? "QUESTION",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.targetUserId === "number"
        ? entry.targetUserId
        : 0,
    createdAt: entry?.createdAt ?? new Date().toISOString(),
    updatedAt: entry?.updatedAt ?? null,
  };
}

function normalizeChatEntry(entry: any): ProgramChatMessage {
  return {
    id: entry?.id ?? Date.now(),
    product: entry?.product ?? "PROJECT_MENTORSHIP",
    from: entry?.from === "SUB_ADMIN" ? "SUB_ADMIN" : "USER",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.targetUserId === "number"
        ? entry.targetUserId
        : 0,
    createdAt: entry?.createdAt ?? new Date().toISOString(),
  };
}

function normalizeNoteStore(
  value: unknown,
): Record<ProductKey, ProgramNoteEntry[]> {
  if (!value || typeof value !== "object") {
    return createEmptyNotesStore();
  }
  const payload = value as Record<string, unknown>;
  return {
    MOCK_INTERVIEWS: Array.isArray(payload.MOCK_INTERVIEWS)
      ? payload.MOCK_INTERVIEWS.map(normalizeNoteEntry)
      : [],
    PROJECT_MENTORSHIP: Array.isArray(payload.PROJECT_MENTORSHIP)
      ? payload.PROJECT_MENTORSHIP.map(normalizeNoteEntry)
      : [],
    SOFTWARE_CONSULTING: Array.isArray(payload.SOFTWARE_CONSULTING)
      ? payload.SOFTWARE_CONSULTING.map(normalizeNoteEntry)
      : [],
  };
}

function normalizeChatStore(
  value: unknown,
): Record<ProductKey, ProgramChatMessage[]> {
  if (!value || typeof value !== "object") {
    return createEmptyChatStore();
  }
  const payload = value as Record<string, unknown>;
  return {
    MOCK_INTERVIEWS: Array.isArray(payload.MOCK_INTERVIEWS)
      ? payload.MOCK_INTERVIEWS.map(normalizeChatEntry)
      : [],
    PROJECT_MENTORSHIP: Array.isArray(payload.PROJECT_MENTORSHIP)
      ? payload.PROJECT_MENTORSHIP.map(normalizeChatEntry)
      : [],
    SOFTWARE_CONSULTING: Array.isArray(payload.SOFTWARE_CONSULTING)
      ? payload.SOFTWARE_CONSULTING.map(normalizeChatEntry)
      : [],
  };
}

const indiaDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const indiaDateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const indiaTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

function formatIndiaDate(input: string | number | Date | null | undefined) {
  if (input === null || input === undefined) {
    return "";
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return indiaDateFormatter.format(date);
}

function formatIndiaDateTime(input: string | number | Date | null | undefined) {
  if (input === null || input === undefined) {
    return "";
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return indiaDateTimeFormatter.format(date);
}

function formatIndiaTime(input: string | number | Date | null | undefined) {
  if (input === null || input === undefined) {
    return "";
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return indiaTimeFormatter.format(date);
}
const USER_SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  {
    href: "#overview",
    label: "Overview",
    description: "Summary & active workstreams",
    icon: <LayoutDashboard className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#program-access",
    label: "Program access",
    description: "Manage interview & mentorship requests",
    icon: <ClipboardList className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#program-guidance",
    label: "Program rooms",
    description: "Meet invites, notes, and chat threads",
    icon: <Users2 className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#insights",
    label: "Delivery pulse",
    description: "Key metrics across your portfolio",
    icon: <BarChart3 className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#projects",
    label: "Project pipeline",
    description: "Shipments, timelines, and progress",
    icon: <Workflow className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#requests",
    label: "Submit request",
    description: "Kick off the next build phase",
    icon: <PenSquare className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#communications",
    label: "Collaboration hub",
    description: "Chat with teams and track milestones",
    icon: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  },
];
const PROGRAM_MEETS_KEY = "arc-program-meets";

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
  const [taskBoards, setTaskBoards] = useState<Record<number, TaskBoard>>({});
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductKey[]>([]);
  const [accessRequests, setAccessRequests] = useState<DashboardAccessRequest[]>([]);
  const [programNotes, setProgramNotes] = useState<
    Record<ProductKey, ProgramNoteEntry[]>
  >(() =>
    normalizeNoteStore(
      readSharedState<Record<ProductKey, ProgramNoteEntry[]>>(
        PROGRAM_NOTES_KEY,
        createEmptyNotesStore(),
      ),
    ),
  );
  const [programChat, setProgramChat] = useState<Record<ProductKey, ProgramChatMessage[]>>(
    () =>
      normalizeChatStore(
        readSharedState<Record<ProductKey, ProgramChatMessage[]>>(
          PROGRAM_CHAT_KEY,
          createEmptyChatStore(),
        ),
      ),
  );
  const [chatDrafts, setChatDrafts] = useState<Record<ProductKey, string>>({
    MOCK_INTERVIEWS: "",
    PROJECT_MENTORSHIP: "",
    SOFTWARE_CONSULTING: "",
  });

  const loadAccessRequests = useCallback(async () => {
    if (!token) {
      setAccessRequests([]);
      return;
    }
    try {
      const response = await apiFetch<DashboardAccessRequest[]>("/api/dashboard/access", {
        token,
      });
      setAccessRequests(response.data);
    } catch (error) {
      console.error("Failed to load dashboard access requests", error);
      setAccessRequests([]);
    }
  }, [token]);
  const [programMeets, setProgramMeets] = useState<
    Record<ProductKey, ProgramMeetSession | null>
  >(() => {
    const stored = readSharedState<Record<ProductKey, ProgramMeetSession | null>>(
      PROGRAM_MEETS_KEY,
      {
        MOCK_INTERVIEWS: null,
        PROJECT_MENTORSHIP: null,
        SOFTWARE_CONSULTING: null,
      },
    );
    return {
      MOCK_INTERVIEWS: stored.MOCK_INTERVIEWS ?? null,
      PROJECT_MENTORSHIP: stored.PROJECT_MENTORSHIP ?? null,
      SOFTWARE_CONSULTING: stored.SOFTWARE_CONSULTING ?? null,
    };
  });
  const activeDashboards = useMemo(() => {
    const approved = accessRequests
      .filter((request) => request.status === "APPROVED")
      .map((request) => request.productKey);
    return Array.from(new Set([...defaultActiveDashboardKeys, ...approved]));
  }, [accessRequests]);
  const approvedProgramDashboards = useMemo(
    () =>
      activeDashboards.filter(
        (product) => product === "MOCK_INTERVIEWS" || product === "PROJECT_MENTORSHIP",
      ),
    [activeDashboards],
  );
  const hasProgramAccess = approvedProgramDashboards.length > 0;

  const formatAuthorLabel = (author: ProgramNoteAuthor) =>
    author
      .split("_")
      .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
      .join(" ");

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_NOTES_KEY, programNotes);
  }, [programNotes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_CHAT_KEY, programChat);
  }, [programChat]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_MEETS_KEY, programMeets);
  }, [programMeets]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROGRAM_NOTES_KEY) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as unknown;
            setProgramNotes(normalizeNoteStore(parsed));
          } catch {
            /* noop */
          }
        } else {
          setProgramNotes(createEmptyNotesStore());
        }
      }
      if (event.key === PROGRAM_CHAT_KEY) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as unknown;
            setProgramChat(normalizeChatStore(parsed));
          } catch {
            /* noop */
          }
        } else {
          setProgramChat(createEmptyChatStore());
        }
      }
      if (event.key === PROGRAM_MEETS_KEY) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as Record<ProductKey, ProgramMeetSession | null>;
            setProgramMeets({
              MOCK_INTERVIEWS: parsed.MOCK_INTERVIEWS ?? null,
              PROJECT_MENTORSHIP: parsed.PROJECT_MENTORSHIP ?? null,
              SOFTWARE_CONSULTING: parsed.SOFTWARE_CONSULTING ?? null,
            });
          } catch {
            /* noop */
          }
        } else {
          setProgramMeets({
            MOCK_INTERVIEWS: null,
            PROJECT_MENTORSHIP: null,
            SOFTWARE_CONSULTING: null,
          });
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    const unsubscribeNotes = subscribeToSharedState<unknown>(PROGRAM_NOTES_KEY, (payload) => {
      setProgramNotes(normalizeNoteStore(payload));
    });
    const unsubscribeChat = subscribeToSharedState<unknown>(PROGRAM_CHAT_KEY, (payload) => {
      setProgramChat(normalizeChatStore(payload));
    });
    const unsubscribeMeets = subscribeToSharedState<
      Record<ProductKey, ProgramMeetSession | null>
    >(PROGRAM_MEETS_KEY, (payload) => {
      setProgramMeets({
        MOCK_INTERVIEWS: payload.MOCK_INTERVIEWS ?? null,
        PROJECT_MENTORSHIP: payload.PROJECT_MENTORSHIP ?? null,
        SOFTWARE_CONSULTING: payload.SOFTWARE_CONSULTING ?? null,
      });
    });
    return () => {
      window.removeEventListener("storage", handleStorage);
      unsubscribeNotes();
      unsubscribeChat();
      unsubscribeMeets();
    };
  }, []);

  const loadTaskSummaries = useCallback(async (projectList: Project[]) => {
    if (!token) {
      return;
    }
    if (projectList.length === 0) {
      setTaskSummaries({});
      setTaskBoards({});
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
            const board = response.data;
            return [
              project.id,
              {
                summary: summarizeBoard(board),
                board,
              },
            ] as const;
          } catch (error) {
            console.error(`Failed to load tasks for project ${project.id}`, error);
            const fallbackBoard: TaskBoard = {
              todo: [],
              inProgress: [],
              review: [],
              blocked: [],
              done: [],
            };
            return [
              project.id,
              {
                summary: { ...emptyTaskSummary },
                board: fallbackBoard,
              },
            ] as const;
          }
        }),
      );
      setTaskSummaries(
        Object.fromEntries(entries.map(([projectId, payload]) => [projectId, payload.summary])),
      );
      setTaskBoards(
        Object.fromEntries(entries.map(([projectId, payload]) => [projectId, payload.board])),
      );
    } catch (error) {
      console.error("Failed to process task summaries", error);
    }
  }, [token]);

  const handleToggleProductSelection = (product: ProductKey) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((key) => key !== product)
        : [...prev, product],
    );
  };

  const handleSubmitProductRequests = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    const targets = selectedProducts.filter((key) => {
      const product = productCatalog.find((item) => item.key === key);
      if (!product) {
        return false;
      }
      if (!product.requiresApproval) {
        return false;
      }
      const existing = accessRequests.find(
        (request) => request.productKey === key,
      );
      if (!existing) {
        return true;
      }
      if (existing.status === "REJECTED") {
        return true;
      }
      return false;
    });

    if (targets.length === 0) {
      setSelectedProducts([]);
      return;
    }

    try {
      await Promise.all(
        targets.map((productKey) =>
          apiFetch<DashboardAccessRequest>("/api/dashboard/access", {
            method: "POST",
            token,
            body: JSON.stringify({ productKey }),
          }),
        ),
      );
      await loadAccessRequests();
    } catch (error) {
      console.error("Failed to submit dashboard access request", error);
    } finally {
      setSelectedProducts([]);
    }
  };

  const handleSendProgramChat = (product: ProductKey) => {
    const draft = chatDrafts[product]?.trim();
    if (!draft) {
      return;
    }
    const participantId = user?.id ?? 0;
    const message: ProgramChatMessage = {
      id: Date.now(),
      product,
      from: "USER",
      content: draft,
      participantId,
      createdAt: new Date().toISOString(),
    };
    setProgramChat((prev) => {
      const existing = prev[product] ?? [];
      return {
        ...prev,
        [product]: [...existing, message],
      };
    });
    setChatDrafts((prev) => ({
      ...prev,
      [product]: "",
    }));
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    void loadAccessRequests();
  }, [loadAccessRequests]);

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
      await loadAccessRequests();
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [token, loadTaskSummaries, loadAccessRequests]);

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
      {manualOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-manual-title"
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2
                  id="dashboard-manual-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Dashboard manual
                </h2>
                <p className="text-xs text-slate-500">
                  A quick guide to every panel available in your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close manual"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 text-sm text-slate-600">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  1. Getting oriented
                </h3>
                <p>
                  The welcome banner highlights who you are and why you&apos;re here.
                  Scroll down to review stats, recent launches, timelines, and task
                  boards tailored to your active projects.
                </p>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  2. Status tiles
                </h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Projects in flight</strong>: Snapshot count of initiatives.
                  </li>
                  <li>
                    <strong>Recently shipped</strong>: Latest deployments with delivery highlights.
                  </li>
                  <li>
                    <strong>Discovery queue</strong>: (Where supported) outlines requests awaiting kickoff.
                  </li>
                </ul>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  3. Delivery timeline
                </h3>
                <p>
                  Every project card shows summary copy, completion percentage, target dates,
                  task counts, feature notes, and a prioritized task list. Track progress without
                  leaving the dashboard.
                </p>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  4. Requesting new work
                </h3>
                <p>
                  Use the <strong>Request a new build</strong> form to submit briefs. Provide a
                  clear problem statement, optional detail paragraphs, and a launch target to
                  help the Arc-i-Tech squad respond quickly.
                </p>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  5. Featured capabilities & milestones
                </h3>
                <p>
                  Featured services highlight popular bundles. The milestones lane calls out
                  upcoming deliverables, progress percentages, and open task counts.
                </p>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  6. Collaboration tools
                </h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Delivery desk</strong>: Chat in real time with the squad.
                  </li>
                  <li>
                    <strong>Notifications</strong>: Use the navbar bell to review launch notices,
                    task updates, and other alerts.
                  </li>
                </ul>
              </section>
              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  7. Tips
                </h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Expand project details to see the latest feature highlights and delivery notes.
                  </li>
                  <li>
                    Task lists show the top priorities; follow up on blocked items from here.
                  </li>
                  <li>
                    After submitting a new brief, watch for status badges to move from planning to development.
                  </li>
                </ul>
              </section>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Back to dashboard
              </button>
            </footer>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 lg:flex-row lg:items-start">
        <DashboardSidebar
          title="Dashboard menu"
          subtitle="Navigate your Arc-i-Tech workspaces"
          items={USER_SIDEBAR_ITEMS}
        />
        <div className="flex-1 space-y-8">
          <header
            id="overview"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hey {user.fullName.split(" ")[0]}, let&apos;s build something remarkable.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track delivery status, request new modules, and chat with the Arc-i-Tech squad.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <CircleHelp className="h-4 w-4" />
            View dashboard manual
          </button>
          </header>

          <section
            id="program-access"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Choose your dashboards
              </h2>
              <p className="text-sm text-slate-500">
                Toggle advanced workspaces. Career products need sub-admin approval; consulting workspace is available instantly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeDashboards.map((key) => {
                const product = productCatalog.find((item) => item.key === key);
                if (!product) return null;
                return (
                  <Link
                    key={key}
                    href={product.route}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-white"
                  >
                    {product.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                );
              })}
            </div>
          </div>
          <form onSubmit={handleSubmitProductRequests} className="mt-4 grid gap-4 md:grid-cols-3">
            {productCatalog.map((product) => {
              const request = accessRequests.find(
                (entry) => entry.productKey === product.key,
              );
              const status = request?.status ?? null;
              const isActive = activeDashboards.includes(product.key);
              const isPending = status === "PENDING";
              const isRejected = status === "REJECTED";
              const disabled = isActive || isPending;
              const checked =
                selectedProducts.includes(product.key) || isActive || isPending;
              return (
                <label
                  key={product.key}
                  className={`relative flex h-full cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition ${
                    disabled
                      ? "border-slate-200 bg-slate-50 text-slate-400"
                      : checked
                      ? "border-indigo-300 bg-indigo-50 text-slate-800"
                      : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {product.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {product.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {product.requiresApproval ? "Approval required" : "Enabled instantly"}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleProductSelection(product.key)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  {isPending ? (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                      Pending approval
                    </span>
                  ) : status === "APPROVED" ? (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      Approved{request?.decidedAt ? ` on ${formatIndiaDate(request.decidedAt)}` : ""}
                    </span>
                  ) : isRejected ? (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                      Rejected{request?.decidedAt ? ` on ${formatIndiaDate(request.decidedAt)}` : ""}
                    </span>
                  ) : null}
                  {isActive && !product.requiresApproval ? (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      Active
                    </span>
                  ) : null}
                </label>
              );
            })}
            <div className="md:col-span-3 flex flex-col gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Selected products will create individual dashboard access requests.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectedProducts.length === 0}
                >
                  Submit {selectedProducts.length || 0} request
                  {selectedProducts.length === 1 ? "" : "s"}
                </button>
              </div>
              {accessRequests.length > 0 ? (
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-slate-700">Recent requests</p>
                  {accessRequests.map((request) => {
                    const product = productCatalog.find((item) => item.key === request.productKey);
                    if (!product) return null;
                    const statusBadge =
                      request.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-600"
                        : request.status === "REJECTED"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-600";
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Submitted {formatIndiaDateTime(request.submittedAt)}
                            {request.decidedAt
                              ? ` | ${request.status.toLowerCase()} on ${formatIndiaDateTime(
                                  request.decidedAt,
                                )}`
                              : ""}
                          </p>
                          {request.note ? (
                            <p className="mt-1 text-[11px] text-indigo-500">
                              Note: {request.note}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge}`}
                        >
                          {request.status.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No pending requests. Select a dashboard above to get started.
                </p>
              )}
            </div>
          </form>
        </section>

        <section
          id="program-guidance"
          className={hasProgramAccess ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}
        >
          {hasProgramAccess ? (
            approvedProgramDashboards.map((product) => {
              const meta = productCatalog.find((item) => item.key === product);
              const notes = [...(programNotes[product] ?? [])].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );
              const messages = [...(programChat[product] ?? [])].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
              const meetSession = programMeets[product] ?? null;
              return (
                <div
                  key={`program-${product}`}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {meta?.name ?? product.replace("_", " ")}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Latest suggestions, questions, and chat from your program team.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {product === "MOCK_INTERVIEWS" ? (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                          <h3 className="text-sm font-semibold text-indigo-900">
                            Google Meet session
                          </h3>
                          {meetSession ? (
                            <div className="mt-3 space-y-2 text-xs text-indigo-900/80">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                                <span className="rounded-full bg-white px-3 py-1 text-indigo-700">
                                  {meetSession.status === "LIVE"
                                    ? "Live now"
                                    : meetSession.status === "SCHEDULED"
                                    ? "Scheduled"
                                    : "Ended"}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-indigo-700">
                                  Host - {meetSession.hostName}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-indigo-700">
                                  Starts {formatIndiaDateTime(meetSession.startAt)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-indigo-950">{meetSession.title}</p>
                              {meetSession.agenda ? (
                                <p className="text-xs text-indigo-900/70 whitespace-pre-line">
                                  {meetSession.agenda}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={meetSession.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                                >
                                  {meetSession.status === "LIVE" ? "Join live Meet" : "Preview Meet link"}
                                </a>
                                <span className="text-[11px] text-indigo-900/60">
                                  Updated {formatIndiaDateTime(meetSession.updatedAt)}
                                </span>
                              </div>
                              {meetSession.status === "ENDED" && (
                                <p className="text-[11px] text-indigo-900/60">
                                  This session has ended. Await the next invite from your sub-admin.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-indigo-900/70">
                              Your sub-admin will drop a Google Meet link here when a live mock interview is scheduled.
                            </p>
                          )}
                        </div>
                      ) : null}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Notes & suggestions</h3>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          {notes.length === 0 ? (
                            <p>No updates yet. Your sub-admin will drop guidance here.</p>
                          ) : (
                            notes.slice(0, 6).map((entry) => (
                              <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="font-semibold text-slate-800">
                                  {entry.kind === "QUESTION" ? "Question" : "Suggestion"} from{" "}
                                  {formatAuthorLabel(entry.author)}
                                </p>
                                <p className="mt-1 whitespace-pre-line text-slate-600">
                                  {entry.content}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  Created {formatIndiaDateTime(entry.createdAt)}
                                  {entry.updatedAt
                                    ? ` | Updated ${formatIndiaDateTime(entry.updatedAt)}`
                                    : ""}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Chat with your sub-admin</h3>
                        <div className="mt-3 flex h-48 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                          {messages.length === 0 ? (
                            <p className="text-slate-400">No messages yet. Say hi!</p>
                          ) : (
                            messages.slice(-12).map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.from === "USER" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                    message.from === "USER"
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="mt-1 text-[10px] opacity-70">
                                    {formatIndiaTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleSendProgramChat(product);
                          }}
                          className="mt-3 flex items-center gap-2"
                        >
                          <input
                            value={chatDrafts[product]}
                            onChange={(event) =>
                              setChatDrafts((prev) => ({
                                ...prev,
                                [product]: event.target.value,
                              }))
                            }
                            placeholder="Type a message..."
                            className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          <button
                            type="submit"
                            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900">Choose your dashboards</h2>
              <p className="mt-2 text-sm text-slate-600">
                Once your request for Project Mentorship or Mock Interviews &amp; Placement Guidance is
                approved, guidance, chat, and session tools will appear here automatically.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Use the request form above to activate these dashboards. Approved programs sync instantly.
              </p>
            </div>
          )}
        </section>

        <section
          id="insights"
          className="grid gap-4 md:grid-cols-3"
        >
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

        <section
          id="projects"
          className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]"
        >
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
              <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Once a project reaches deployment, it will appear here with delivery highlights.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {completedProjects.map((project) => {
                  const featureLines = extractFeatureLines(project.details);
                  return (
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
                      <p className="mt-2 text-xs font-semibold text-emerald-600">
                        Project delivery is complete.
                      </p>
                      {featureLines.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-slate-500">
                          {featureLines.slice(0, 4).map((line, index) => (
                            <li key={`${project.id}-completed-feature-${index}`}>{line}</li>
                          ))}
                        </ul>
                      ) : project.details ? (
                        <p className="mt-2 text-[11px] text-slate-500">{project.details}</p>
                      ) : null}
                    </li>
                  );
                })}
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
                const featureLines = extractFeatureLines(project.details);
                const taskSummary = taskSummaries[project.id] ?? emptyTaskSummary;
                const pendingTasksCount =
                  taskSummary.todo + taskSummary.inProgress + taskSummary.review + taskSummary.blocked;
                const completedTasksCount = taskSummary.done;
                const isComplete =
                  project.status === "DEPLOYED" || (project.progressPercentage ?? 0) >= 100;
                const board = taskBoards[project.id] ?? emptyTaskBoard;
                const prioritizedTasks: ProjectTask[] = [
                  ...board.inProgress,
                  ...board.todo,
                  ...board.review,
                  ...board.blocked,
                  ...board.done,
                ];
                const visibleTasks = prioritizedTasks.slice(0, 4);
                const progressValue = Math.min(Math.max(project.progressPercentage ?? 0, 0), 100);

                return (
                  <div
                    key={project.id}
                    className="min-h-[220px] rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
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
                        <span>{progressValue}% complete</span>
                        <span>Target {formatDate(project.targetDate)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                    {isComplete && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600">
                        Project marked as done. We&apos;re tracking post-launch success.
                      </p>
                    )}
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
                      <div className="mt-2 text-xs text-slate-500">
                        <p className="mb-1 font-semibold text-slate-600">Feature highlights</p>
                        <ul className="list-disc space-y-1 pl-5">
                          {featureLines.slice(0, 5).map((feature, index) => (
                            <li key={`${project.id}-feature-${index}`}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    ) : project.details ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {project.details}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        Share feature notes with the Arc-i-Tech team to populate this rundown.
                      </p>
                    )}
                    {visibleTasks.length > 0 ? (
                      <div className="mt-2 rounded-xl bg-white/80 p-3">
                        <p className="text-xs font-semibold text-slate-600">Task list</p>
                        <ul className="mt-2 space-y-2 text-xs text-slate-500">
                          {visibleTasks.map((task) => (
                            <li
                              key={`project-${project.id}-task-${task.id}`}
                              className="flex items-start justify-between gap-3"
                            >
                              <div className="max-w-[70%]">
                                <p className="font-semibold text-slate-700">{task.title}</p>
                                {task.description && (
                                  <p className="text-[11px] text-slate-400">{task.description}</p>
                                )}
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TASK_STATUS_STYLES[task.status]}`}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        Task assignments will appear here as soon as the delivery squad picks them up.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="requests"
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
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

        <section
          id="communications"
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
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

function extractFeatureLines(details: string | null | undefined): string[] {
  if (!details) {
    return [];
  }
  return details
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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





