'use client';

import { useMemo, useState } from "react";
import {
  InterviewSession,
  MockIssue,
  MockTopic,
  PlacementChecklistItem,
  PlacementProgress,
} from "@/types";

type SessionViewMode = "WEEKLY" | "MONTHLY";

const mockSessions: InterviewSession[] = [
  {
    id: 1,
    scheduledAt: "2025-10-31T08:30:00.000Z",
    durationMinutes: 60,
    format: "DSA",
    interviewerName: "Ananya Sharma",
    focusAreas: ["Arrays", "Two Pointers", "Time complexity"],
    recordingUrl: "https://example.com/recordings/session-1",
    feedbackSummary: "Good pattern recognition. Needs faster brute→optimal transitions.",
  },
  {
    id: 2,
    scheduledAt: "2025-11-02T14:00:00.000Z",
    durationMinutes: 50,
    format: "SYSTEM_DESIGN",
    interviewerName: "Rahul Mehta",
    focusAreas: ["API Gateway", "Rate limiting", "Capacity planning"],
    feedbackSummary: null,
  },
  {
    id: 3,
    scheduledAt: "2025-11-05T10:00:00.000Z",
    durationMinutes: 45,
    format: "BEHAVIORAL",
    interviewerName: "Sahana Iyer",
    focusAreas: ["STAR responses", "Conflict resolution", "Leadership principles"],
    feedbackSummary: null,
  },
  {
    id: 4,
    scheduledAt: "2025-11-15T12:00:00.000Z",
    durationMinutes: 55,
    format: "DOMAIN",
    interviewerName: "Vikram Rao",
    focusAreas: ["Microservices", "Step functions", "Observability"],
    feedbackSummary: null,
  },
];

const placementChecklist: PlacementChecklistItem[] = [
  {
    id: 1,
    category: "RESUME",
    label: "Resume peer review",
    status: "COMPLETED",
    targetDate: "2025-10-20",
    reviewerNotes: "Incorporated quantified outcomes.",
  },
  {
    id: 2,
    category: "PORTFOLIO",
    label: "Update LinkedIn headline",
    status: "IN_PROGRESS",
    targetDate: "2025-11-01",
  },
  {
    id: 3,
    category: "APTITUDE",
    label: "Weekly mock aptitude test",
    status: "IN_PROGRESS",
    targetDate: "2025-11-10",
    reviewerNotes: "Focus on probability & permutations.",
  },
  {
    id: 4,
    category: "COMMUNICATION",
    label: "Elevator pitch dry run",
    status: "NOT_STARTED",
    targetDate: "2025-11-05",
  },
];

const placementProgress: PlacementProgress = {
  overallScore: 68,
  lastUpdated: "2025-10-28T11:35:00.000Z",
  nextMilestone: "Complete LinkedIn optimisation checklist",
  checklist: placementChecklist,
};

const mockTopics: MockTopic[] = [
  {
    id: 11,
    title: "Binary Search Tree variations",
    difficulty: "INTERMEDIATE",
    tags: ["DSA", "Trees"],
    lastPracticedAt: "2025-10-26T18:00:00.000Z",
    completionRate: 70,
  },
  {
    id: 12,
    title: "Designing scalable notification systems",
    difficulty: "ADVANCED",
    tags: ["System design", "Messaging"],
    completionRate: 45,
  },
  {
    id: 13,
    title: "Leadership principles walkthrough",
    difficulty: "BEGINNER",
    tags: ["Behavioral"],
    lastPracticedAt: "2025-10-23T16:21:00.000Z",
    completionRate: 90,
  },
];

const mockIssues: MockIssue[] = [
  {
    id: 201,
    topicId: 11,
    description: "Struggling to derive optimal solution under 10 minutes.",
    resolutionStatus: "IN_PROGRESS",
    mentorNotes: "Practice template-based decompositions. Revisit binary lifting.",
    createdAt: "2025-10-21T09:15:00.000Z",
  },
  {
    id: 202,
    topicId: 12,
    description: "Confused about idempotency across retries.",
    resolutionStatus: "RESOLVED",
    mentorNotes: "Read through the saga design pattern summary & sample diagrams.",
    createdAt: "2025-10-19T10:42:00.000Z",
  },
];

function formatDate(input: string) {
  const date = new Date(input);
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupSessionsByMonth(sessions: InterviewSession[]) {
  const groups = new Map<string, InterviewSession[]>();
  sessions.forEach((session) => {
    const date = new Date(session.scheduledAt);
    const key = date.toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
    });
    const value = groups.get(key) ?? [];
    value.push(session);
    groups.set(key, value);
  });
  return Array.from(groups.entries()).map(([month, list]) => ({
    month,
    sessions: list.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    ),
  }));
}

function filterSessionsForNextWeek(sessions: InterviewSession[]) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return sessions
    .filter((session) => {
      const when = new Date(session.scheduledAt);
      return when >= now && when <= sevenDaysFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

export default function MockInterviewsDashboardPage() {
  const [viewMode, setViewMode] = useState<SessionViewMode>("WEEKLY");

  const weeklySessions = useMemo(
    () => filterSessionsForNextWeek(mockSessions),
    [],
  );
  const monthlyGroups = useMemo(
    () => groupSessionsByMonth(mockSessions),
    [],
  );

  const nextSession = weeklySessions[0] ?? mockSessions[0];
  const completedSessions = mockSessions.filter(
    (session) => new Date(session.scheduledAt) < new Date(),
  ).length;

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2">
          <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            Mock interviews & placement guidance
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sharpen every interview iteration with a guided cockpit.
          </h1>
          <p className="text-sm text-slate-500">
            Track upcoming sessions, drill core topics, resolve blockers, and monitor placement readiness at a glance.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Next session
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDate(nextSession.scheduledAt)}
            </p>
            <p className="text-xs text-slate-500">
              {nextSession.format} with {nextSession.interviewerName}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Sessions completed
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {completedSessions}
              <span className="ml-2 text-sm text-slate-400">
                / {mockSessions.length}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Feedback archived for {completedSessions} sessions.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Placement readiness
            </p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-semibold text-indigo-600">
                {placementProgress.overallScore}%
              </p>
              <p className="text-xs text-slate-500">
                Updated {new Date(placementProgress.lastUpdated).toLocaleDateString("en-IN")}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Next milestone: {placementProgress.nextMilestone}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Interview session planner
            </h2>
            <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
              {(["WEEKLY", "MONTHLY"] as SessionViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full px-3 py-1 transition ${
                    viewMode === mode
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-white"
                  }`}
                >
                  {mode === "WEEKLY" ? "This week" : "Monthly view"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {viewMode === "WEEKLY" ? (
              weeklySessions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No sessions scheduled for the next 7 days. Add one to keep momentum going.
                </p>
              ) : (
                weeklySessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(session.scheduledAt)}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-indigo-500">
                          {session.format.replace("_", " ")}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {session.durationMinutes} minutes
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-600">
                        Interviewer: {session.interviewerName}
                      </span>
                      {session.focusAreas.map((area) => (
                        <span
                          key={`${session.id}-${area}`}
                          className="rounded-full bg-slate-200 px-2 py-1"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    {session.feedbackSummary && (
                      <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-500">
                        {session.feedbackSummary}
                      </p>
                    )}
                  </div>
                ))
              )
            ) : (
              monthlyGroups.map((group) => (
                <div key={group.month} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {group.month}
                  </h3>
                  {group.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDate(session.scheduledAt)}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-indigo-500">
                            {session.format.replace("_", " ")}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {session.durationMinutes} minutes
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Interviewer: {session.interviewerName}
                      </p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Placement readiness checklist
            </h2>
            <div className="mt-4 space-y-3">
              {placementProgress.checklist.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {item.category}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.targetDate ? (
                      <p>Target: {new Date(item.targetDate).toLocaleDateString("en-IN")}</p>
                    ) : null}
                    {item.reviewerNotes ? (
                      <p className="mt-1 text-slate-400">Notes: {item.reviewerNotes}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Offer pipeline snapshot
            </h2>
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Track every opportunity with stage, recruiter updates, and compensation benchmarks. (Integrate with ATS API or maintain manually.)
            </div>
            <h3 className="mt-6 text-sm font-semibold text-slate-900">
              Mock topics focus
            </h3>
            <div className="mt-3 space-y-3 text-xs text-slate-600">
              {mockTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{topic.title}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        {topic.difficulty.toLowerCase()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">
                      {topic.completionRate}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {topic.tags.map((tag) => (
                      <span
                        key={`${topic.id}-${tag}`}
                        className="rounded-full bg-white px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {topic.lastPracticedAt ? (
                    <p className="mt-2 text-[11px] text-slate-400">
                      Practiced on{" "}
                      {new Date(topic.lastPracticedAt).toLocaleDateString("en-IN")}
                    </p>
                  ) : null}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${topic.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Mock blockers & growth opportunities
            </h2>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
              {mockIssues.filter((issue) => issue.resolutionStatus !== "RESOLVED").length} open blockers
            </span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {mockIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {issue.description}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      issue.resolutionStatus === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-600"
                        : issue.resolutionStatus === "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {issue.resolutionStatus.replace("_", " ")}
                  </span>
                </div>
                {issue.mentorNotes ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Mentor notes: {issue.mentorNotes}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] text-slate-400">
                  Logged on{" "}
                  {new Date(issue.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
