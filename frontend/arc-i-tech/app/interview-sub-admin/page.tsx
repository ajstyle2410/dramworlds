'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  InterviewerProfile,
  MockCandidateProfile,
  MockEscalation,
  MockInterviewRecord,
  MockResource,
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
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Users2,
  Video,
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

const ACCESS_REQUESTS_KEY = "arc-dashboard-access-requests";
const PROGRAM_NOTES_KEY = "arc-program-notes";
const PROGRAM_CHAT_KEY = "arc-program-chat";
const PROGRAM_MEETS_KEY = "arc-program-meets";
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
    product: entry?.product ?? "MOCK_INTERVIEWS",
    author: entry?.author ?? "INTERVIEW_SUB_ADMIN",
    kind: entry?.kind ?? "QUESTION",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.targetCandidateId === "number"
        ? entry.targetCandidateId
        : 0,
    createdAt: entry?.createdAt ?? new Date().toISOString(),
    updatedAt: entry?.updatedAt ?? null,
  };
}

function normalizeChatEntry(entry: any): ProgramChatMessage {
  return {
    id: entry?.id ?? Date.now(),
    product: entry?.product ?? "MOCK_INTERVIEWS",
    from: entry?.from === "USER" ? "USER" : "SUB_ADMIN",
    content: entry?.content ?? "",
    participantId:
      typeof entry?.participantId === "number"
        ? entry.participantId
        : typeof entry?.targetCandidateId === "number"
        ? entry.targetCandidateId
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

const INTERVIEW_SUB_SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  {
    href: "#overview",
    label: "Overview",
    description: "Persona switcher & daily briefing",
    icon: <LayoutDashboard className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#stats",
    label: "Daily pulse",
    description: "Active candidates and programme KPIs",
    icon: <BarChart3 className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#approvals",
    label: "Access queue",
    description: "Approve or reject dashboard requests",
    icon: <ClipboardList className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#meet-studio",
    label: "Meet studio",
    description: "Spin up Google Meet rooms for mocks",
    icon: <Video className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#guidance",
    label: "Guidance & chat",
    description: "Share interview questions and replies",
    icon: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#pipeline",
    label: "Candidate pipeline",
    description: "Progress, mentors, and upcoming sessions",
    icon: <Users2 className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#sessions",
    label: "Sessions & risks",
    description: "Ledger, feedback, and escalations",
    icon: <Calendar className="h-4 w-4 text-indigo-500" />,
  },
  {
    href: "#resources",
    label: "Resource library",
    description: "Playbooks and templates from super admin",
    icon: <BookOpen className="h-4 w-4 text-indigo-500" />,
  },
];

const interviewerRoster: InterviewerProfile[] = [
  {
    id: 1,
    fullName: "Ananya Sharma",
    role: "LEAD",
    expertise: ["System design", "Career coaching"],
    totalSessions: 148,
    rating: 4.8,
    active: true,
  },
  {
    id: 2,
    fullName: "Rahul Mehta",
    role: "MENTOR",
    expertise: ["DSA", "Observability"],
    totalSessions: 96,
    rating: 4.6,
    active: true,
  },
];

const candidateRoster: MockCandidateProfile[] = [
  {
    id: 101,
    fullName: "Kiran Patel",
    targetRole: "Senior Backend Engineer",
    currentStatus: "ACTIVE",
    nextSessionAt: "2025-11-03T10:00:00.000Z",
    progressScore: 68,
    assignedInterviewerId: 1,
    tags: ["Java", "Microservices"],
  },
  {
    id: 102,
    fullName: "Neha Gupta",
    targetRole: "Product Manager",
    currentStatus: "ACTIVE",
    nextSessionAt: "2025-11-05T09:00:00.000Z",
    progressScore: 82,
    assignedInterviewerId: 2,
    tags: ["Customer Discovery", "Roadmaps"],
  },
  {
    id: 103,
    fullName: "Arjun Nair",
    targetRole: "Engineering Manager",
    currentStatus: "PAUSED",
    nextSessionAt: null,
    progressScore: 54,
    assignedInterviewerId: 1,
    tags: ["Leadership", "Hiring"],
  },
];

const sessionLedger: MockInterviewRecord[] = [
  {
    id: 501,
    candidateName: "Kiran Patel",
    interviewerId: 1,
    scheduledAt: "2025-11-03T10:00:00.000Z",
    format: "SYSTEM_DESIGN",
    status: "SCHEDULED",
  },
  {
    id: 502,
    candidateName: "Neha Gupta",
    interviewerId: 2,
    scheduledAt: "2025-10-29T14:30:00.000Z",
    format: "BEHAVIORAL",
    status: "COMPLETED",
    feedback: "Impactful STAR stories. Refine conflict resolution framing.",
    score: 8.8,
  },
  {
    id: 503,
    candidateName: "Kiran Patel",
    interviewerId: 1,
    scheduledAt: "2025-10-22T09:00:00.000Z",
    format: "DSA",
    status: "COMPLETED",
    feedback: "Needs to articulate brute-force baseline before jumping to optimal.",
    score: 7.4,
  },
];

const escalations: MockEscalation[] = [
  {
    id: 801,
    candidateId: 103,
    priority: "HIGH",
    issue: "Candidate paused due to offer stage; needs resume refresh before reactivation.",
    status: "OPEN",
    createdAt: "2025-10-25T10:00:00.000Z",
    owner: "Ananya Sharma",
  },
  {
    id: 802,
    candidateId: 101,
    priority: "MEDIUM",
    issue: "Repeated reschedules for weekday slots.",
    status: "TRACKING",
    createdAt: "2025-10-20T08:30:00.000Z",
    owner: "Program Ops",
  },
];

const resources: MockResource[] = [
  {
    id: 901,
    title: "Mock interviewer SOP",
    type: "DOC",
    url: "https://example.com/resources/mock-interviewer-sop.pdf",
    description: "Weekly checklist for interviewers: pre-read, scoring, feedback.",
    updatedAt: "2025-10-15T12:00:00.000Z",
  },
  {
    id: 902,
    title: "Feedback rubric template",
    type: "TEMPLATE",
    url: "https://example.com/resources/feedback-template.docx",
    description: "Consistent rubric for system design and DSA rounds.",
    updatedAt: "2025-10-18T09:45:00.000Z",
  },
  {
    id: 903,
    title: "Placement readiness radar",
    type: "CHECKLIST",
    url: "https://example.com/resources/placement-radar.xlsx",
    description: "Tracker for resume, portfolio, aptitude, communication, domain readiness.",
    updatedAt: "2025-10-22T07:30:00.000Z",
  },
];

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
};

const formatDateTime = (input: string) =>
  new Date(input).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (input: string | null | undefined) =>
  input
    ? new Date(input).toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "â€”";

export default function InterviewSubAdminDashboardPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<MockCandidateProfile | null>(
    candidateRoster[0],
  );
  const [requests, setRequests] = useState<DashboardAccessRequest[]>(() =>
    readSharedState<DashboardAccessRequest[]>(ACCESS_REQUESTS_KEY, []),
  );
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
  const [questionDraft, setQuestionDraft] = useState("");
  const [suggestionDraft, setSuggestionDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [meetTopic, setMeetTopic] = useState("");
  const [meetAgenda, setMeetAgenda] = useState("");
  const [meetHostId, setMeetHostId] = useState(interviewerRoster[0]?.id ?? 0);
  const [meetStartAt, setMeetStartAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return toLocalInputValue(now);
  });
  const [meetCopied, setMeetCopied] = useState(false);
  const relevantRequests = useMemo(
    () => requests.filter((request) => request.product === "MOCK_INTERVIEWS"),
    [requests],
  );
  const mockNotes = useMemo(() => {
    const participantId = selectedCandidate?.id;
    if (!participantId) {
      return [];
    }
    return [...(programNotes.MOCK_INTERVIEWS ?? [])]
      .filter((entry) => entry.participantId === participantId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [programNotes, selectedCandidate]);
  const activeMeet = programMeets.MOCK_INTERVIEWS ?? null;
  const creationDisabled = !!activeMeet && activeMeet.status !== "ENDED";

  const mockChatMessages = useMemo(() => {
    const participantId = selectedCandidate?.id;
    if (!participantId) {
      return [];
    }
    return [...(programChat.MOCK_INTERVIEWS ?? [])].filter(
      (message) => message.participantId === participantId,
    );
  }, [programChat, selectedCandidate]);

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
    if (typeof window === "undefined") return;
    persistSharedState(PROGRAM_MEETS_KEY, programMeets);
  }, [programMeets]);

  useEffect(() => {
    if (!meetCopied) return;
    const timeout = window.setTimeout(() => setMeetCopied(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [meetCopied]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_REQUESTS_KEY) {
        if (event.newValue) {
          try {
            setRequests(JSON.parse(event.newValue) as DashboardAccessRequest[]);
          } catch {
            /* noop */
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
      unsubscribeRequests();
      unsubscribeNotes();
      unsubscribeChat();
      unsubscribeMeets();
    };
  }, []);

  const handleRequestDecision = (requestId: number, status: RequestStatus) => {
    const decidedAt = new Date().toISOString();
    setRequests((prev) => {
      const next = prev.map((request) =>
        request.id === requestId ? { ...request, status, decidedAt } : request,
      );
      return next;
    });
  };

  const appendProgramNote = (kind: ProgramNoteKind, content: string) => {
    const trimmed = content.trim();
    const participantId = selectedCandidate?.id;
    if (!trimmed || !participantId) return;
    const entry: ProgramNoteEntry = {
      id: Date.now(),
      product: "MOCK_INTERVIEWS",
      author: "INTERVIEW_SUB_ADMIN",
      kind,
      content: trimmed,
      participantId,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setProgramNotes((prev) => {
      const existing = prev.MOCK_INTERVIEWS ?? [];
      const nextEntries = [...existing, entry];
      return {
        ...prev,
        MOCK_INTERVIEWS: nextEntries,
      };
    });
  };

  const beginNoteEdit = (entry: ProgramNoteEntry) => {
    setEditingNoteId(entry.id);
    setEditingNoteDraft(entry.content);
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
    setEditingNoteDraft("");
  };

  const handleUpdateNote = () => {
    if (editingNoteId === null) return;
    const trimmed = editingNoteDraft.trim();
    if (!trimmed) return;
    const timestamp = new Date().toISOString();
    setProgramNotes((prev) => {
      const existing = prev.MOCK_INTERVIEWS ?? [];
      const nextEntries = existing.map((entry) =>
        entry.id === editingNoteId
          ? { ...entry, content: trimmed, updatedAt: timestamp }
          : entry,
      );
      return {
        ...prev,
        MOCK_INTERVIEWS: nextEntries,
      };
    });
    setEditingNoteId(null);
    setEditingNoteDraft("");
  };

  const handleDeleteNote = (noteId: number) => {
    setProgramNotes((prev) => {
      const existing = prev.MOCK_INTERVIEWS ?? [];
      return {
        ...prev,
        MOCK_INTERVIEWS: existing.filter((entry) => entry.id !== noteId),
      };
    });
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setEditingNoteDraft("");
    }
  };

  const generateMeetCode = () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const randomBlock = () =>
      Array.from({ length: 3 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
        "",
      );
    return `${randomBlock()}-${randomBlock()}-${randomBlock()}`;
  };

  const handleCreateMeet = (event: React.FormEvent) => {
    event.preventDefault();
    const host = interviewerRoster.find((profile) => profile.id === meetHostId);
    if (!host) {
      return;
    }
    const topic = meetTopic.trim() || "Mock interview sync";
    const startSource = meetStartAt ? new Date(meetStartAt) : new Date();
    const startAt = Number.isNaN(startSource.getTime())
      ? new Date().toISOString()
      : startSource.toISOString();
    const now = new Date().toISOString();
    const session: ProgramMeetSession = {
      id: Date.now(),
      product: "MOCK_INTERVIEWS",
      title: topic,
      agenda: meetAgenda.trim(),
      hostId: host.id,
      hostName: host.fullName,
      startAt,
      createdAt: now,
      updatedAt: now,
      status: "SCHEDULED",
      meetingLink: `https://meet.google.com/${generateMeetCode()}`,
    };
    setProgramMeets((prev) => ({
      ...prev,
      MOCK_INTERVIEWS: session,
    }));
    setMeetTopic("");
    setMeetAgenda("");
    const bump = new Date();
    bump.setMinutes(bump.getMinutes() + 30);
    setMeetStartAt(toLocalInputValue(bump));
    setMeetCopied(false);
  };

  const updateMeetStatus = (status: ProgramMeetStatus) => {
    setProgramMeets((prev) => {
      const current = prev.MOCK_INTERVIEWS;
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        MOCK_INTERVIEWS: {
          ...current,
          status,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleCopyMeetLink = async () => {
    const link = programMeets.MOCK_INTERVIEWS?.meetingLink;
    if (!link) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(link);
        setMeetCopied(true);
      } catch {
        setMeetCopied(false);
      }
    }
  };

  const handleResetMeet = () => {
    setProgramMeets((prev) => ({
      ...prev,
      MOCK_INTERVIEWS: null,
    }));
    setMeetCopied(false);
  };

  const handleStartMeet = () => updateMeetStatus("LIVE");
  const handleEndMeet = () => updateMeetStatus("ENDED");

  const handleSubmitQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    appendProgramNote("QUESTION", questionDraft);
    setQuestionDraft("");
  };

  const handleSubmitSuggestion = (event: React.FormEvent) => {
    event.preventDefault();
    appendProgramNote("SUGGESTION", suggestionDraft);
    setSuggestionDraft("");
  };

  const handleSendChatMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = chatDraft.trim();
    const participantId = selectedCandidate?.id;
    if (!trimmed || !participantId) return;
    const message: ProgramChatMessage = {
      id: Date.now(),
      product: "MOCK_INTERVIEWS",
      from: "SUB_ADMIN",
      content: trimmed,
      participantId,
      createdAt: new Date().toISOString(),
    };
    setProgramChat((prev) => {
      const existing = prev.MOCK_INTERVIEWS ?? [];
      return {
        ...prev,
        MOCK_INTERVIEWS: [...existing, message],
      };
    });
    setChatDraft("");
  };

  const stats = useMemo(() => {
    const totalCandidates = candidateRoster.length;
    const active = candidateRoster.filter(
      (candidate) => candidate.currentStatus === "ACTIVE",
    ).length;
    const paused = candidateRoster.filter(
      (candidate) => candidate.currentStatus === "PAUSED",
    ).length;
    const averageProgress =
      candidateRoster.reduce((sum, candidate) => sum + candidate.progressScore, 0) /
      candidateRoster.length;
    return [
      {
        label: "Active candidates",
        value: active,
        delta: `${paused} paused`,
      },
      {
        label: "Average progress",
        value: `${Math.round(averageProgress)}%`,
        delta: "Across all active cohorts",
      },
      {
        label: "Upcoming sessions",
        value: sessionLedger.filter((record) => record.status === "SCHEDULED").length,
        delta: "Next 7 days scheduled",
      },
      {
        label: "Open escalations",
        value: escalations.filter((item) => item.status !== "RESOLVED").length,
        delta: "Handle before end of week",
      },
    ];
  }, []);

  const candidateSessions = useMemo(() => {
    if (!selectedCandidate) return [];
    return sessionLedger.filter(
      (record) => record.candidateName === selectedCandidate.fullName,
    );
  }, [selectedCandidate]);

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 lg:flex-row lg:items-start">
        <DashboardSidebar
          title="Dashboard menu"
          subtitle="Mock interview operations"
          items={INTERVIEW_SUB_SIDEBAR_ITEMS}
          footer={
            <span className="text-slate-400">
              Coordinate with the super admin for escalations or staffing changes.
            </span>
          }
        />
        <div className="flex-1 space-y-8">
        <header
          id="overview"
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Switch persona
              </Link>
              <span className="rounded-full bg-indigo-100 px-3 py-1">
                Interview sub-admin dashboard
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Guide candidates, balance interviewer load, resolve blockers.
            </h1>
            <p className="text-sm text-slate-500">
              Track mentor allocations, session outcomes, and placement readiness collaborations in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {new Date().toLocaleString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </div>
        </header>

        <section
          id="stats"
          className="grid gap-4 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.delta}</p>
            </div>
          ))}
        </section>

        <section
          id="program-ops"
          className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]"
        >
          <div
            id="approvals"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Dashboard approval queue
            </h2>
            <p className="text-sm text-slate-500">
              Review user requests for the mock interview workspace. Approve to unlock dashboards, or reject with a note.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {relevantRequests.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  No pending requests right now. You will see new submissions as soon as users opt in.
                </p>
              ) : (
                relevantRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Request #{request.id}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Submitted {new Date(request.submittedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          request.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-600"
                            : request.status === "REJECTED"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {request.status.toLowerCase()}
                      </span>
                    </div>
                    {request.decidedAt ? (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Updated {new Date(request.decidedAt).toLocaleString("en-IN")}
                      </p>
                    ) : null}
                    {request.status === "PENDING" && (
                      <div className="mt-3 flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleRequestDecision(request.id, "APPROVED")}
                          className="flex-1 rounded-full bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDecision(request.id, "REJECTED")}
                          className="flex-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Google Meet studio
            </h2>
            <p className="text-sm text-slate-500">
              Launch a live mock interview room, share the Meet link, and monitor call status.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div
                id="meet-studio"
                className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 text-white shadow-inner">
                  <div className="absolute inset-0 opacity-25 mix-blend-overlay">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff33,_transparent_60%)]" />
                  </div>
                  <div className="relative flex h-full flex-col justify-between p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 drop-shadow-sm" />
                        {activeMeet
                          ? activeMeet.status === "LIVE"
                            ? "Live now"
                            : activeMeet.status === "SCHEDULED"
                            ? "Scheduled"
                            : "Ended"
                          : "Idle"}
                      </span>
                      <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {activeMeet ? activeMeet.title : "No active session"}
                      </h3>
                      <p className="mt-1 text-xs text-indigo-100">
                        {activeMeet
                          ? `Hosted by ${activeMeet.hostName}`
                          : "Create a meeting to unlock the virtual room preview."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  {activeMeet ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                          Starts {new Date(activeMeet.startAt).toLocaleString("en-IN")}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                          Host Â· {activeMeet.hostName}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                          Status Â· {activeMeet.status.toLowerCase()}
                        </span>
                      </div>
                      {activeMeet.agenda ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Agenda
                          </p>
                          <p className="mt-1 whitespace-pre-line text-slate-600">{activeMeet.agenda}</p>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={activeMeet.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          Join Meet
                        </a>
                        <button
                          type="button"
                          onClick={handleCopyMeetLink}
                          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:text-indigo-700"
                          disabled={!activeMeet}
                        >
                          {meetCopied ? "Link copied!" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          onClick={handleStartMeet}
                          disabled={!activeMeet || activeMeet.status === "LIVE"}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Go live
                        </button>
                        <button
                          type="button"
                          onClick={handleEndMeet}
                          disabled={!activeMeet || activeMeet.status === "ENDED"}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          End session
                        </button>
                        <button
                          type="button"
                          onClick={handleResetMeet}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-700"
                        >
                          Clear meeting
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-slate-500">
                      No Meet session scheduled. Use the form to create a Google Meet link and notify the candidate through chat.
                    </p>
                  )}
                </div>
              </div>
              <form
                onSubmit={handleCreateMeet}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Schedule new session</h3>
                  <p className="text-[11px] text-slate-500">
                    Configure the Meet title, start time, and host. Existing sessions must be ended before creating another.
                  </p>
                </div>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Session title
                  <input
                    value={meetTopic}
                    onChange={(event) => setMeetTopic(event.target.value)}
                    placeholder="Mock interview â€” system design focus"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    disabled={creationDisabled}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Start time
                  <input
                    type="datetime-local"
                    value={meetStartAt}
                    onChange={(event) => setMeetStartAt(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    disabled={creationDisabled}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Host
                  <select
                    value={meetHostId}
                    onChange={(event) => setMeetHostId(Number(event.target.value))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    disabled={creationDisabled}
                  >
                    {interviewerRoster.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.fullName} Â· {profile.role.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Agenda / notes
                  <textarea
                    value={meetAgenda}
                    onChange={(event) => setMeetAgenda(event.target.value)}
                    rows={3}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Warm-up: 10 mins behavioral â€¢ System design deep dive â€¢ Offer debrief"
                    disabled={creationDisabled}
                  />
                </label>
                <button
                  type="submit"
                  disabled={creationDisabled}
                  className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creationDisabled ? "End current session to schedule" : "Create Google Meet"}
                </button>
              </form>
            </div>
          </div>
          <div
            id="guidance"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Program guidance & chat
            </h2>
            <p className="text-sm text-slate-500">
              Share interview questions or suggestions, and respond to users directly.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <form onSubmit={handleSubmitQuestion} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  Target candidate: {selectedCandidate?.fullName ?? "Select a candidate"}
                </p>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                  Add interview question
                  <textarea
                    value={questionDraft}
                    onChange={(event) => setQuestionDraft(event.target.value)}
                    rows={2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Example: Tell me about a time you resolved production downtime under pressure."
                    disabled={!selectedCandidate}
                  />
                </label>
                <button
                  type="submit"
                  disabled={questionDraft.trim().length === 0 || !selectedCandidate}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Publish question
                </button>
              </form>
              <form onSubmit={handleSubmitSuggestion} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  Target candidate: {selectedCandidate?.fullName ?? "Select a candidate"}
                </p>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                  Share suggestions / tips
                  <textarea
                    value={suggestionDraft}
                    onChange={(event) => setSuggestionDraft(event.target.value)}
                    rows={2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Example: Rehearse system design interviews with the capstone case studies."
                    disabled={!selectedCandidate}
                  />
                </label>
                <button
                  type="submit"
                  disabled={suggestionDraft.trim().length === 0 || !selectedCandidate}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Publish suggestion
                </button>
              </form>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Published guidance</h3>
                  <div className="flex items-center gap-3">
                    {selectedCandidate ? (
                      <span className="text-[11px] uppercase tracking-wide text-indigo-500">
                        {selectedCandidate.fullName}
                      </span>
                    ) : null}
                    {mockNotes.length > 0 ? (
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        {mockNotes.length} item{mockNotes.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  {mockNotes.length === 0 ? (
                    <p className="text-slate-400">
                      No notes yet. Publish interview questions or suggestions to guide users.
                    </p>
                  ) : (
                    mockNotes.map((entry) => {
                      const isEditing = editingNoteId === entry.id;
                      return (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-800">
                              {entry.kind === "QUESTION"
                                ? "Interview question"
                                : "Suggestion"}
                            </p>
                            <div className="flex items-center gap-2">
                              {isEditing ? null : (
                                <button
                                  type="button"
                                  onClick={() => beginNoteEdit(entry)}
                                  className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(entry.id)}
                                className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {isEditing ? (
                            <>
                              <textarea
                                value={editingNoteDraft}
                                onChange={(event) => setEditingNoteDraft(event.target.value)}
                                rows={3}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleUpdateNote}
                                  disabled={editingNoteDraft.trim().length === 0}
                                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelNoteEdit}
                                  className="rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="mt-2 text-slate-600">{entry.content}</p>
                          )}
                          <p className="mt-2 text-[11px] text-slate-400">
                            Created {new Date(entry.createdAt).toLocaleString("en-IN")}
                            {entry.updatedAt
                              ? ` | Updated ${new Date(entry.updatedAt).toLocaleString("en-IN")}`
                              : ""}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Chat</h3>
                <div className="mt-3 flex h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  {mockChatMessages.length === 0 ? (
                    <p className="text-slate-400">No messages yet.</p>
                  ) : (
                    mockChatMessages.slice(-12).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.from === "SUB_ADMIN" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.from === "SUB_ADMIN"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="mt-1 text-[10px] opacity-70">
                            {new Date(message.createdAt).toLocaleTimeString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendChatMessage} className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    <span>
                      Chatting with: {selectedCandidate?.fullName ?? "Select a candidate"}
                    </span>
                    {selectedCandidate ? (
                      <span className="text-slate-400">Status: {selectedCandidate.currentStatus.toLowerCase()}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      placeholder={
                        selectedCandidate
                          ? `Reply to ${selectedCandidate.fullName}...`
                          : "Select a candidate to reply..."
                      }
                      className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      disabled={!selectedCandidate}
                    />
                    <button
                      type="submit"
                      disabled={chatDraft.trim().length === 0 || !selectedCandidate}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pipeline"
          className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Candidate pipeline
            </h2>
            <p className="text-sm text-slate-500">
              Select a candidate to review their recent sessions, upcoming commitments, and progress metrics.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              {candidateRoster.map((candidate) => {
                const mentor = interviewerRoster.find(
                  (profile) => profile.id === candidate.assignedInterviewerId,
                );
                const progressPercent = Math.min(100, Math.round(candidate.progressScore));
                const active = selectedCandidate?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {candidate.fullName}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          candidate.currentStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-600"
                            : candidate.currentStatus === "PAUSED"
                            ? "bg-amber-100 text-amber-600"
                            : candidate.currentStatus === "HIRED"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {candidate.currentStatus.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Target role: {candidate.targetRole}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {candidate.tags.map((tag) => (
                        <span key={`${candidate.id}-${tag}`} className="rounded-full bg-white px-2 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Mentor: {mentor?.fullName ?? "TBD"}</span>
                      <span>Next session: {formatDate(candidate.nextSessionAt ?? null)}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Mentor allocations
            </h2>
            <p className="text-sm text-slate-500">
              View load, satisfaction, and core skills by interviewer.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {interviewerRoster.map((mentor) => {
                const assigned = candidateRoster.filter(
                  (candidate) => candidate.assignedInterviewerId === mentor.id,
                ).length;
                return (
                  <div
                    key={mentor.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{mentor.fullName}</p>
                      <span className="text-xs text-slate-500">
                        {assigned} candidate{assigned === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      {mentor.role} â€¢ {mentor.totalSessions} sessions â€¢ {mentor.rating.toFixed(1)}/5
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {mentor.expertise.map((skill) => (
                        <span key={`${mentor.id}-${skill}`} className="rounded-full bg-white px-2 py-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Manage sessions
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="sessions"
          className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Session ledger for {selectedCandidate?.fullName ?? "candidate"}
              </h2>
              {selectedCandidate ? (
                <Link
                  href={`/dashboard/candidate/${selectedCandidate.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-white"
                >
                  View candidate dashboard
                </Link>
              ) : null}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {candidateSessions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No sessions logged yet. Ask the program manager to schedule the first mock interview.
                </p>
              ) : (
                candidateSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {session.format.replace("_", " ")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(session.scheduledAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          session.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-600"
                            : session.status === "SCHEDULED"
                            ? "bg-indigo-100 text-indigo-600"
                            : session.status === "CANCELLED"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {session.status.replace("_", " ")}
                      </span>
                    </div>
                    {session.feedback ? (
                      <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-500">
                        Feedback: {session.feedback}
                      </p>
                    ) : null}
                    {session.score != null ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Score: {session.score}/10
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Escalations & risks
            </h2>
            <p className="text-sm text-slate-500">
              Coordinate with super admin when intervention is required.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {escalations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No escalations logged. Keep monitoring for candidate blockers or interviewer load issues.
                </p>
              ) : (
                escalations.map((item) => {
                  const candidate = candidateRoster.find(
                    (profile) => profile.id === item.candidateId,
                  );
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {candidate?.fullName ?? "Candidate"}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                            item.priority === "HIGH"
                              ? "bg-rose-100 text-rose-600"
                              : item.priority === "MEDIUM"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {item.priority.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{item.issue}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Owner: {item.owner ?? "Unassigned"}</span>
                        <span>Status: {item.status.toLowerCase()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section
          id="resources"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Resource library & playbooks
            </h2>
            <Link
              href="/super-admin/mock-interviews"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            >
              Sync with super admin
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  {resource.type === "DOC" ? (
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  ) : resource.type === "TEMPLATE" ? (
                    <Clipboard className="h-3.5 w-3.5 text-indigo-500" />
                  ) : resource.type === "CHECKLIST" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                  ) : (
                    <Users2 className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  {resource.type.toLowerCase()}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                  {resource.title}
                </p>
                {resource.description ? (
                  <p className="mt-1 text-xs text-slate-500">{resource.description}</p>
                ) : null}
                <p className="mt-3 text-[11px] text-slate-400">
                  Updated {new Date(resource.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </a>
            ))}
          </div>
          </section>
        </div>
      </div>
    </div>
  );
}
