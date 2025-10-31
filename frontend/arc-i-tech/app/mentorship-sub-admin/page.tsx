'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MentorshipMilestone,
  MentorshipSubmission,
  SkillProgress,
} from "@/types";
import {
  persistSharedState,
  readSharedState,
  subscribeToSharedState,
} from "@/lib/sharedState";
import {
  DashboardSidebar,
  type DashboardSidebarItem,
} from "@/components/DashboardSidebar";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  NotebookPen,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";

type ProductKey = "MOCK_INTERVIEWS" | "PROJECT_MENTORSHIP" | "SOFTWARE_CONSULTING";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface DashboardAccessRequest {
  id: number;
  product: ProductKey;
  status: RequestStatus;
  submittedAt: string;
  decidedAt?: string | null;
  note?: string | null;
}

type ProgramNoteAuthor = "USER" | "INTERVIEW_SUB_ADMIN" | "MENTORSHIP_SUB_ADMIN";
type ProgramNoteKind = "UPDATE" | "ACTION_ITEM" | "SUGGESTION";

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

interface MentorshipSession {
  id: number;
  title: string;
  mentor: string;
  focus: string;
  startAt: string;
  cadence: "WEEKLY" | "MONTHLY";
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
}

interface MenteeProfile {
  id: number;
  fullName: string;
  projectName: string;
  mentor: string;
  status: "ACTIVE" | "PAUSED";
  focusArea: string;
}

const ACCESS_REQUESTS_KEY = "arc-dashboard-access-requests";
const PROGRAM_NOTES_KEY = "arc-program-notes";
const PROGRAM_CHAT_KEY = "arc-program-chat";

const menteeRoster: MenteeProfile[] = [
  {
    id: 401,
    fullName: "Riya Desai",
    projectName: "Smart warehouse command centre",
    mentor: "Anita Rao",
    status: "ACTIVE",
    focusArea: "Architecture blueprint & resiliency",
  },
  {
    id: 402,
    fullName: "Manav Kulkarni",
    projectName: "Payments observability suite",
    mentor: "Rahul Menon",
    status: "ACTIVE",
    focusArea: "DevOps automation & alerting",
  },
  {
    id: 403,
    fullName: "Sara Thomas",
    projectName: "Customer onboarding analytics",
    mentor: "Sonia Patel",
    status: "PAUSED",
    focusArea: "Stakeholder storytelling & data viz",
  },
];

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
    author: entry?.author ?? "MENTORSHIP_SUB_ADMIN",
    kind: entry?.kind ?? "UPDATE",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.menteeId === "number"
        ? entry.menteeId
        : 0,
    createdAt: entry?.createdAt ?? new Date().toISOString(),
    updatedAt: entry?.updatedAt ?? null,
  };
}

function normalizeChatEntry(entry: any): ProgramChatMessage {
  return {
    id: entry?.id ?? Date.now(),
    product: entry?.product ?? "PROJECT_MENTORSHIP",
    from: entry?.from === "USER" ? "USER" : "SUB_ADMIN",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.menteeId === "number"
        ? entry.menteeId
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

const SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  {
    href: "#overview",
    label: "Programme overview",
    description: "Health, adoption, and approvals",
    icon: <LayoutDashboard className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#approvals",
    label: "Access approvals",
    description: "Pending requests & audit trail",
    icon: <ClipboardList className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#roadmap",
    label: "Roadmap",
    description: "Milestone tracker & mentor actions",
    icon: <Target className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#submissions",
    label: "Reviews",
    description: "Submission queue & feedback",
    icon: <NotebookPen className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#skills",
    label: "Skill matrix",
    description: "Competency growth & gaps",
    icon: <Brain className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#sessions",
    label: "Session calendar",
    description: "Weekly & monthly cadence",
    icon: <Calendar className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#guidance",
    label: "Guidance & chat",
    description: "Notes, nudges, and discussions",
    icon: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#maintenance",
    label: "Progress maintenance",
    description: "Data sync & reporting hooks",
    icon: <Layers className="h-4 w-4 text-indigo-500" />,
  },
];

const DEFAULT_MILESTONES: MentorshipMilestone[] = [
  {
    id: 1,
    title: "Discovery & goals alignment",
    description: "Capture ambitions, baseline the technical stack, and lock scope.",
    dueDate: "2024-11-01T10:00:00.000Z",
    status: "DONE",
    mentorFeedback: "All interview artefacts shared. Ready for build.",
  },
  {
    id: 2,
    title: "Architecture blueprint",
    description: "Document sequence diagrams, data storage, and failure recovery.",
    dueDate: "2024-11-15T09:00:00.000Z",
    status: "IN_PROGRESS",
    mentorFeedback: "Request deeper resiliency notes for payment gateway.",
  },
  {
    id: 3,
    title: "Implementation sprints",
    description: "Ship core modules, hold weekly demo, and track retrospectives.",
    dueDate: "2024-12-10T17:30:00.000Z",
    status: "REVIEW",
    mentorFeedback: null,
  },
  {
    id: 4,
    title: "Final showcase & handoff",
    description: "Dry-run production deploy and present stakeholder report.",
    dueDate: "2025-01-05T11:30:00.000Z",
    status: "NOT_STARTED",
    mentorFeedback: null,
  },
];

const DEFAULT_SUBMISSIONS: MentorshipSubmission[] = [
  {
    id: 101,
    milestoneId: 2,
    submittedAt: "2024-10-18T14:10:00.000Z",
    artifactUrl: "https://drive.google.com/file/architecture-blueprint",
    reviewStatus: "CHANGES_REQUESTED",
    score: 7,
    reviewerComments: "Add latency numbers for worst-case scenario.",
  },
  {
    id: 102,
    milestoneId: 3,
    submittedAt: "2024-10-24T09:35:00.000Z",
    artifactUrl: "https://demo.dramworlds.dev/sprint-01",
    reviewStatus: "PENDING",
    score: null,
    reviewerComments: null,
  },
  {
    id: 103,
    milestoneId: 1,
    submittedAt: "2024-10-04T12:00:00.000Z",
    artifactUrl: "https://docs.dramworlds.dev/discovery-report",
    reviewStatus: "APPROVED",
    score: 9,
    reviewerComments: "Great stakeholder clarity and risk matrix.",
  },
];

const DEFAULT_SKILL_MATRIX: SkillProgress[] = [
  {
    id: 201,
    competency: "Backend system design",
    currentLevel: 6,
    targetLevel: 8,
    evidence: "Designed idempotent order API & caching strategy.",
    lastUpdated: "2024-10-20T08:00:00.000Z",
  },
  {
    id: 202,
    competency: "DevOps automation",
    currentLevel: 4,
    targetLevel: 7,
    evidence: "CI/CD pipeline set up with automated smoke checks.",
    lastUpdated: "2024-10-18T07:45:00.000Z",
  },
  {
    id: 203,
    competency: "Stakeholder storytelling",
    currentLevel: 5,
    targetLevel: 6,
    evidence: "Delivered discovery playback to product & QA pods.",
    lastUpdated: "2024-10-12T18:20:00.000Z",
  },
  {
    id: 204,
    competency: "Code review quality",
    currentLevel: 7,
    targetLevel: 8,
    evidence: "Flagged regression on payment retries before merge.",
    lastUpdated: "2024-10-23T09:55:00.000Z",
  },
];

const DEFAULT_SESSIONS: MentorshipSession[] = [
  {
    id: 301,
    title: "Sprint grooming & blockers",
    mentor: "Anita Rao",
    focus: "Align weekly sprint backlog and unblock impediments.",
    startAt: "2024-10-28T05:30:00.000Z",
    cadence: "WEEKLY",
    status: "PLANNED",
  },
  {
    id: 302,
    title: "Monthly architecture review",
    mentor: "Rahul Menon",
    focus: "Deep dive on blueprint checkpoints and scale tests.",
    startAt: "2024-11-01T11:00:00.000Z",
    cadence: "MONTHLY",
    status: "PLANNED",
  },
  {
    id: 303,
    title: "Code review dojo",
    mentor: "Sonia Patel",
    focus: "Pair review recent pull requests and share heuristics.",
    startAt: "2024-10-22T13:30:00.000Z",
    cadence: "WEEKLY",
    status: "COMPLETED",
  },
  {
    id: 304,
    title: "Stakeholder storytelling lab",
    mentor: "Deepak Verma",
    focus: "Practice end-to-end narrative with feedback loops.",
    startAt: "2024-10-25T16:00:00.000Z",
    cadence: "WEEKLY",
    status: "IN_PROGRESS",
  },
];

const DEFAULT_ALERTS = [
  "Architecture blueprint submission needs revision in 24 hours.",
  "Mentor feedback overdue for Sprint 01 demo recording.",
  "Skill matrix gap detected for DevOps automation.",
];

const DEFAULT_DATA_MAINTENANCE = [
  {
    title: "Tables & entities",
    items: [
      "mentorship_milestones (status, mentor_feedback, due_date)",
      "mentorship_submissions (artifact_url, review_status, score)",
      "skill_progress (competency, current_level, target_level)",
      "mentorship_sessions (cadence, focus_area, mentor_id)",
    ],
  },
  {
    title: "API endpoints",
    items: [
      "GET /api/mentorship/milestones",
      "POST /api/mentorship/submissions/{id}/review",
      "PATCH /api/mentorship/skills/{id}",
      "POST /api/mentorship/sessions",
    ],
  },
  {
    title: "Reports & notifications",
    items: [
      "Weekly readiness digest to super-admin & mentors",
      "Session reminders via email + in-app notification 30 mins before start",
      "Auto-close loop when submissions sit in pending for 72 hours",
      "Uptime alerting to escalate missing feedback to sub-admins",
    ],
  },
];

export default function MentorshipSubAdminPage() {
  const [requests, setRequests] = useState<DashboardAccessRequest[]>(() =>
    readSharedState<DashboardAccessRequest[]>(ACCESS_REQUESTS_KEY, []),
  );
  const [programNotes, setProgramNotes] = useState<Record<ProductKey, ProgramNoteEntry[]>>(() =>
    normalizeNoteStore(
      readSharedState<Record<ProductKey, ProgramNoteEntry[]>>(
        PROGRAM_NOTES_KEY,
        createEmptyNotesStore(),
      ),
    ),
  );
  const [programChat, setProgramChat] = useState<Record<ProductKey, ProgramChatMessage[]>>(() =>
    normalizeChatStore(
      readSharedState<Record<ProductKey, ProgramChatMessage[]>>(
        PROGRAM_CHAT_KEY,
        createEmptyChatStore(),
      ),
    ),
  );
  const [milestones, setMilestones] = useState<MentorshipMilestone[]>(DEFAULT_MILESTONES);
  const [submissions, setSubmissions] = useState<MentorshipSubmission[]>(DEFAULT_SUBMISSIONS);
  const [skillMatrix, setSkillMatrix] = useState<SkillProgress[]>(DEFAULT_SKILL_MATRIX);
  const [sessions] = useState<MentorshipSession[]>(DEFAULT_SESSIONS);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteKind, setNoteKind] = useState<ProgramNoteKind>("UPDATE");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [requestNotes, setRequestNotes] = useState<Record<number, string>>({});
  const [selectedMenteeId, setSelectedMenteeId] = useState<number | null>(
    menteeRoster[0]?.id ?? null,
  );

  const mentorshipRequests = useMemo(
    () => requests.filter((request) => request.product === "PROJECT_MENTORSHIP"),
    [requests],
  );

  const selectedMentee = useMemo(
    () =>
      selectedMenteeId
        ? menteeRoster.find((profile) => profile.id === selectedMenteeId) ?? null
        : null,
    [selectedMenteeId],
  );

  const mentorshipNotesStore = programNotes.PROJECT_MENTORSHIP ?? [];
  const mentorshipChatStore = programChat.PROJECT_MENTORSHIP ?? [];

  const menteeNotes = useMemo(() => {
    if (!selectedMenteeId) {
      return [];
    }
    return mentorshipNotesStore.filter(
      (entry) => entry.participantId === selectedMenteeId,
    );
  }, [mentorshipNotesStore, selectedMenteeId]);

  const menteeChatMessages = useMemo(() => {
    if (!selectedMenteeId) {
      return [];
    }
    return mentorshipChatStore.filter(
      (entry) => entry.participantId === selectedMenteeId,
    );
  }, [mentorshipChatStore, selectedMenteeId]);

  const readinessScore = useMemo(() => {
    const total = milestones.length || 1;
    const completed = milestones.filter((item) => item.status === "DONE").length;
    const inReview = milestones.filter((item) => item.status === "REVIEW").length;
    return Math.round(((completed + inReview * 0.5) / total) * 100);
  }, [milestones]);

  const pendingReviews = useMemo(
    () => submissions.filter((submission) => submission.reviewStatus === "PENDING").length,
    [submissions],
  );

  const blockedMilestones = useMemo(
    () => milestones.filter((item) => item.status === "REVIEW" || item.status === "IN_PROGRESS").length,
    [milestones],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(ACCESS_REQUESTS_KEY, requests);
  }, [requests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_NOTES_KEY, programNotes);
  }, [programNotes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_CHAT_KEY, programChat);
  }, [programChat]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_REQUESTS_KEY) {
        if (event.newValue) {
          try {
            setRequests(JSON.parse(event.newValue) as DashboardAccessRequest[]);
          } catch {
            setRequests([]);
          }
        } else {
          setRequests([]);
        }
      }
      if (event.key === PROGRAM_NOTES_KEY) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as unknown;
            setProgramNotes(normalizeNoteStore(parsed));
          } catch {
            setProgramNotes(createEmptyNotesStore());
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
            setProgramChat(createEmptyChatStore());
          }
        } else {
          setProgramChat(createEmptyChatStore());
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    const unsubscribeRequests = subscribeToSharedState<DashboardAccessRequest[]>(
      ACCESS_REQUESTS_KEY,
      setRequests,
    );
    const unsubscribeNotes = subscribeToSharedState<unknown>(PROGRAM_NOTES_KEY, (payload) => {
      setProgramNotes(normalizeNoteStore(payload));
    });
    const unsubscribeChat = subscribeToSharedState<unknown>(PROGRAM_CHAT_KEY, (payload) => {
      setProgramChat(normalizeChatStore(payload));
    });

    return () => {
      window.removeEventListener("storage", handleStorage);
      unsubscribeRequests();
      unsubscribeNotes();
      unsubscribeChat();
    };
  }, []);

  const handleRequestDecision = (requestId: number, status: RequestStatus) => {
    const decidedAt = new Date().toISOString();
    const note = requestNotes[requestId]?.trim();
    setRequests((previous) =>
      previous.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              decidedAt,
              note: note && note.length > 0 ? note : undefined,
            }
          : request,
      ),
    );
    setRequestNotes((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  };

  const handleNoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = noteDraft.trim();
    if (!trimmed || !selectedMenteeId) return;
    const entry: ProgramNoteEntry = {
      id: Date.now(),
      product: "PROJECT_MENTORSHIP",
      author: "MENTORSHIP_SUB_ADMIN",
      kind: noteKind,
      content: trimmed,
      participantId: selectedMenteeId,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setProgramNotes((prev) => ({
      ...prev,
      PROJECT_MENTORSHIP: [...mentorshipNotesStore, entry],
    }));
    setNoteDraft("");
  };

  const handleBeginEditNote = (entry: ProgramNoteEntry) => {
    setEditingNoteId(entry.id);
    setEditingNoteDraft(entry.content);
  };

  const handleSaveNoteEdit = () => {
    if (!editingNoteId) return;
    const trimmed = editingNoteDraft.trim();
    if (!trimmed) return;
    const timestamp = new Date().toISOString();
    setProgramNotes((prev) => ({
      ...prev,
      PROJECT_MENTORSHIP: mentorshipNotesStore.map((entry) =>
        entry.id === editingNoteId
          ? { ...entry, content: trimmed, updatedAt: timestamp }
          : entry,
      ),
    }));
    setEditingNoteId(null);
    setEditingNoteDraft("");
  };

  const handleCancelNoteEdit = () => {
    setEditingNoteId(null);
    setEditingNoteDraft("");
  };

  const handleDeleteNote = (entryId: number) => {
    setProgramNotes((prev) => ({
      ...prev,
      PROJECT_MENTORSHIP: mentorshipNotesStore.filter((entry) => entry.id !== entryId),
    }));
  };

  const handleSendChat = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatDraft.trim();
    if (!trimmed || !selectedMenteeId) return;
    const message: ProgramChatMessage = {
      id: Date.now(),
      product: "PROJECT_MENTORSHIP",
      from: "SUB_ADMIN",
      content: trimmed,
      participantId: selectedMenteeId,
      createdAt: new Date().toISOString(),
    };
    setProgramChat((prev) => ({
      ...prev,
      PROJECT_MENTORSHIP: [...mentorshipChatStore, message],
    }));
    setChatDraft("");
  };

  const handleAdvanceMilestone = (milestoneId: number) => {
    const sequence: MentorshipMilestone["status"][] = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "REVIEW",
      "DONE",
    ];
    setMilestones((prev) =>
      prev.map((item) => {
        if (item.id !== milestoneId) return item;
        const currentIndex = sequence.indexOf(item.status);
        const nextIndex = Math.min(sequence.length - 1, currentIndex + 1);
        const nextStatus = sequence[nextIndex];
        return {
          ...item,
          status: nextStatus,
          mentorFeedback:
            nextStatus === "DONE"
              ? "Marked complete during sub-admin review."
              : item.mentorFeedback,
        };
      }),
    );
  };

  const handleSubmissionDecision = (
    submissionId: number,
    reviewStatus: MentorshipSubmission["reviewStatus"],
    score?: number,
    reviewerComments?: string,
  ) => {
    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              reviewStatus,
              score: score ?? submission.score,
              reviewerComments:
                reviewerComments !== undefined ? reviewerComments : submission.reviewerComments,
            }
          : submission,
      ),
    );
  };

  const handleSkillUpdate = (
    skillId: number,
    updates: Partial<SkillProgress>,
  ) => {
    setSkillMatrix((prev) =>
      prev.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              ...updates,
              lastUpdated: new Date().toISOString(),
            }
          : skill,
      ),
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        title="Mentorship sub-admin"
        subtitle="Steer project mentorship cohorts, approvals, and progress rituals."
        items={SIDEBAR_ITEMS}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <section
            id="overview"
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
                  Project mentorship control centre
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                  Keep mentees unblocked and progress transparent
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Review dashboard access requests, manage milestone velocity, and push actionable
                  feedback straight into the user workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-700">
                <p className="font-semibold">Live programme alerts</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {DEFAULT_ALERTS.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            </header>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Readiness score",
                  value: `${readinessScore}%`,
                  icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
                  caption: "Blend of completed and review milestones.",
                },
                {
                  label: "Pending reviews",
                  value: pendingReviews,
                  icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
                  caption: "Submissions awaiting mentor verdict.",
                },
                {
                  label: "Active mentees",
                  value: 12,
                  icon: <Users2 className="h-5 w-5 text-indigo-500" />,
                  caption: "Across current mentorship cohort.",
                },
                {
                  label: "Milestones in motion",
                  value: blockedMilestones,
                  icon: <AlertTriangle className="h-5 w-5 text-rose-500" />,
                  caption: "Keep an eye for blockers or missing feedback.",
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-white p-2 shadow-sm">{stat.icon}</div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.caption}</p>
                </article>
              ))}
            </div>
          </section>
          <section
            id="maintenance"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Progress &amp; data maintenance</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Keep mentorship telemetry healthy. These are the touchpoints that ensure updates,
                  reports, and alerts stay in lockstep across dashboards.
                </p>
              </div>
              <span className="rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                Shared with super-admin
              </span>
            </header>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {DEFAULT_DATA_MAINTENANCE.map((section) => (
                <article
                  key={section.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800">Automation hooks</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Wire these into the backend queue to keep everyone in sync.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  <li>Trigger stakeholder digest if readiness drops below 65 percent.</li>
                  <li>Auto-notify mentors when mentees miss two consecutive sessions.</li>
                  <li>Escalate to super-admin if review backlog exceeds three submissions.</li>
                  <li>Pipe milestone completions into celebration banner on user dashboard.</li>
                </ul>
              </article>
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Bell className="h-4 w-4 text-indigo-500" />
              <span>
                Tip: connect these actions to the notification centre so every decision pings the right
                stakeholders.
              </span>
            </div>
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900"
            >
              Jump to super-admin oversight
            </Link>
          </footer>

          <section
            id="guidance"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Guidance &amp; chat</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Curate actionable notes and respond to mentee questions. Entries show up inside the
                  user dashboard guidance feed.
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
                <p className="font-semibold">Mentor visibility</p>
                <p>Notes sync to the shared programme log for all mentors.</p>
          </div>
        </header>
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Mentee roster</h3>
              <p className="text-xs text-slate-500">
                Switch the active mentee to focus notes, chats, and follow-ups.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {menteeRoster.length} mentee{menteeRoster.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {menteeRoster.map((mentee) => {
              const isActive = mentee.id === selectedMenteeId;
              return (
                <button
                  key={mentee.id}
                  type="button"
                  onClick={() => setSelectedMenteeId(mentee.id)}
                  className={`text-left rounded-2xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isActive
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{mentee.fullName}</p>
                  <p className="text-xs text-slate-500">{mentee.projectName}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                    <span>{mentee.status.toLowerCase()}</span>
                    <span>{mentee.mentor}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{mentee.focusArea}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <form onSubmit={handleNoteSubmit} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mentee
                      <select
                        value={selectedMenteeId ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedMenteeId(value ? Number(value) : null);
                        }}
                        className="ml-3 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Select mentee</option>
                        {menteeRoster.map((mentee) => (
                          <option key={mentee.id} value={mentee.id}>
                            {mentee.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Note type
                      <select
                        value={noteKind}
                        onChange={(event) =>
                          setNoteKind(event.target.value as ProgramNoteKind)
                        }
                        className="ml-3 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="UPDATE">Progress update</option>
                        <option value="ACTION_ITEM">Action item</option>
                        <option value="SUGGESTION">Suggestion</option>
                      </select>
                    </label>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Visible to mentees
                    </span>
                    {selectedMentee ? (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                        Target: {selectedMentee.fullName}
                      </span>
                    ) : null}
                  </div>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Share next steps, links, or suggestions that help mentees move forward."
                    disabled={!selectedMenteeId}
                  />
                  <button
                    type="submit"
                    disabled={noteDraft.trim().length === 0 || !selectedMenteeId}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Publish note
                  </button>
                </form>
                <div className="space-y-3">
                  {!selectedMenteeId || menteeNotes.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                      No programme notes yet for this mentee. Share an update above to kick things off.
                    </p>
                  ) : (
                    menteeNotes
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <article
                          key={entry.id}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                        >
                          <div className="flex items-start justify-between gap-3 text-xs uppercase tracking-wide text-slate-400">
                            <span>{entry.kind.replace("_", " ")}</span>
                            <span>{new Date(entry.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{entry.content}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>Author: mentorship sub-admin</span>
                            {entry.updatedAt ? (
                              <span>Edited {new Date(entry.updatedAt).toLocaleString("en-IN")}</span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleBeginEditNote(entry)}
                              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(entry.id)}
                              className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                          {editingNoteId === entry.id ? (
                            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <textarea
                                value={editingNoteDraft}
                                onChange={(event) => setEditingNoteDraft(event.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleSaveNoteEdit}
                                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                                  disabled={editingNoteDraft.trim().length === 0}
                                >
                                  Save changes
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelNoteEdit}
                                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      ))
                  )}
                </div>
              </div>
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <form onSubmit={handleSendChat} className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Chat with {selectedMentee ? selectedMentee.fullName : "mentees"}
                  </p>
                  <textarea
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Answer questions, share links, or provide encouragement."
                    disabled={!selectedMenteeId}
                  />
                  <button
                    type="submit"
                    disabled={chatDraft.trim().length === 0 || !selectedMenteeId}
                    className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send reply
                  </button>
                </form>
                <div className="space-y-3">
                  {!selectedMenteeId || menteeChatMessages.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                      No chats yet for this mentee. Replies from here appear instantly inside the mentee dashboard.
                    </p>
                  ) : (
                    menteeChatMessages
                      .slice()
                      .reverse()
                      .map((message) => (
                        <article
                          key={message.id}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                        >
                          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                            <span>{message.from === "SUB_ADMIN" ? "You" : "User"}</span>
                            <span>{new Date(message.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{message.content}</p>
                        </article>
                      ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section
            id="sessions"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Session calendar</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Weekly touchpoints and monthly deep dives. Share these links with mentees so they
                  can join straight from their dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                <p className="font-semibold">Calendar tip</p>
                <p>Drag and drop events into the user dashboard using shared state sync.</p>
              </div>
            </header>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                      <p className="text-xs text-slate-500">Mentor: {session.mentor}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.cadence === "WEEKLY" ? "Weekly" : "Monthly"} &bull;{" "}
                        {new Date(session.startAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-600"
                          : session.status === "IN_PROGRESS"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {session.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{session.focus}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-700"
                    >
                      Copy agenda link
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                    >
                      Notify mentees
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="skills"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Skill matrix</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Track competency uplift and flag where mentors should double down. Adjust levels
                  once evidence is verified.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Calibration reminder</p>
                <p>Target vs current levels inform readiness score &amp; nudges.</p>
              </div>
            </header>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {skillMatrix.map((skill) => {
                const delta = skill.targetLevel - skill.currentLevel;
                return (
                  <article
                    key={skill.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{skill.competency}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Updated {new Date(skill.lastUpdated).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        Gap {delta > 0 ? `-${delta}` : "+1"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{skill.evidence}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-600">
                        Current {skill.currentLevel}/10
                      </span>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-600">
                        Target {skill.targetLevel}/10
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSkillUpdate(skill.id, {
                            currentLevel: Math.min(10, skill.currentLevel + 1),
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        Increment level
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSkillUpdate(skill.id, {
                            evidence: "Mentor verified improvement during latest pairing session.",
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        Add mentor evidence
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            id="submissions"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Submission reviews</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Inspect artefacts, score delivery, and leave crisp feedback. Status updates sync to
                  mentee dashboards instantly.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-600">
                {pendingReviews} pending reviews
              </span>
            </header>
            <div className="mt-6 space-y-4">
              {submissions.map((submission) => {
                const milestone = milestones.find((item) => item.id === submission.milestoneId);
                return (
                  <article
                    key={submission.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Submission #{submission.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          Milestone: {milestone ? milestone.title : "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Uploaded {new Date(submission.submittedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <a
                        href={submission.artifactUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        View artefact
                      </a>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Current status: {submission.reviewStatus.replace("_", " ").toLowerCase()}
                    </p>
                    {submission.reviewerComments ? (
                      <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                        Reviewer comments: {submission.reviewerComments}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSubmissionDecision(
                            submission.id,
                            "APPROVED",
                            Math.max(submission.score ?? 0, 8),
                            "Approved by sub-admin. Ready for the next sprint.",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSubmissionDecision(
                            submission.id,
                            "CHANGES_REQUESTED",
                            submission.score ?? 6,
                            "Share additional test evidence and retry within 48 hours.",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:text-rose-700"
                      >
                        Request changes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSubmissionDecision(submission.id, "PENDING", submission.score ?? 7)
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-700"
                      >
                        Mark as pending
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            id="roadmap"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Roadmap &amp; milestone tracker</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Flip milestones forward as mentees progress. Completed steps celebrate on the user
                  dashboard automatically.
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
                <p className="font-semibold">Need a reset?</p>
                <p>Use the action buttons to move a milestone to the next stage.</p>
              </div>
            </header>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {milestones.map((milestone) => (
                <article
                  key={milestone.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{milestone.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Due {new Date(milestone.dueDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        milestone.status === "DONE"
                          ? "bg-emerald-100 text-emerald-600"
                          : milestone.status === "REVIEW"
                            ? "bg-amber-100 text-amber-600"
                            : milestone.status === "IN_PROGRESS"
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <ListChecks className="h-4 w-4" />
                      {milestone.status.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{milestone.description}</p>
                  {milestone.mentorFeedback ? (
                    <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                      Mentor feedback: {milestone.mentorFeedback}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleAdvanceMilestone(milestone.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    Advance stage
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section
            id="approvals"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Access approvals</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Review user requests for the mentorship dashboard. Approve to unlock the workspace
                  or reject with a note that syncs back to the user dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                <p className="font-semibold">Auto-sync enabled</p>
                <p>Decisions broadcast instantly to user & super admin dashboards.</p>
              </div>
            </header>
            <div className="mt-6 space-y-4">
              {mentorshipRequests.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No pending requests right now. Users will show up here after selecting Project
                  Mentorship on their dashboard.
                </p>
              ) : (
                mentorshipRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Request #{request.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(request.submittedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          request.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-600"
                            : request.status === "REJECTED"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {request.status.toLowerCase()}
                      </span>
                    </div>
                    {request.decidedAt ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Updated {new Date(request.decidedAt).toLocaleString("en-IN")}
                      </p>
                    ) : null}
                    <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Decision note (optional)
                      <textarea
                        value={requestNotes[request.id] ?? request.note ?? ""}
                        onChange={(event) =>
                          setRequestNotes((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="Share why the dashboard is being approved or the remediation needed."
                      />
                    </label>
                    {request.status === "PENDING" ? (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleRequestDecision(request.id, "APPROVED")}
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                          Approve &amp; notify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDecision(request.id, "REJECTED")}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-400 hover:text-rose-700"
                        >
                          Reject request
                        </button>
                      </div>
                    ) : (
                      request.note && (
                        <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          Decision note shared with user: {request.note}
                        </p>
                      )
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
