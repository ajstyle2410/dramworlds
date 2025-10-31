'use client';

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  InterviewSession,
  MockIssue,
  MockTopic,
  PlacementProgress,
} from "@/types";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

interface CandidateDashboardData {
  id: number;
  fullName: string;
  targetRole: string;
  mentorName: string;
  placementProgress: PlacementProgress;
  sessions: InterviewSession[];
  topics: MockTopic[];
  issues: MockIssue[];
}

const candidateDatabase: CandidateDashboardData[] = [
  {
    id: 101,
    fullName: "Kiran Patel",
    targetRole: "Senior Backend Engineer",
    mentorName: "Ananya Sharma",
    placementProgress: {
      overallScore: 68,
      lastUpdated: "2025-10-28T11:35:00.000Z",
      nextMilestone: "Complete LinkedIn optimisation checklist",
      checklist: [
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
      ],
    },
    sessions: [
      {
        id: 1,
        scheduledAt: "2025-10-22T09:00:00.000Z",
        durationMinutes: 45,
        format: "DSA",
        interviewerName: "Ananya Sharma",
        focusAreas: ["Arrays", "Two pointers"],
        feedbackSummary: "Needs to articulate brute-force baseline before optimal.",
      },
      {
        id: 2,
        scheduledAt: "2025-11-03T10:00:00.000Z",
        durationMinutes: 60,
        format: "SYSTEM_DESIGN",
        interviewerName: "Rahul Mehta",
        focusAreas: ["API Gateway", "Caching"],
      },
    ],
    topics: [
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
    ],
    issues: [
      {
        id: 201,
        topicId: 11,
        description: "Struggling to derive optimal solution under 10 minutes.",
        resolutionStatus: "IN_PROGRESS",
        mentorNotes: "Rehearse template decomposition exercises.",
        createdAt: "2025-10-21T09:15:00.000Z",
      },
    ],
  },
  {
    id: 102,
    fullName: "Neha Gupta",
    targetRole: "Product Manager",
    mentorName: "Sahana Iyer",
    placementProgress: {
      overallScore: 82,
      lastUpdated: "2025-10-24T09:22:00.000Z",
      nextMilestone: "Finalize storytelling deck",
      checklist: [
        {
          id: 5,
          category: "COMMUNICATION",
          label: "Elevator pitch drill",
          status: "COMPLETED",
          targetDate: "2025-10-20",
          reviewerNotes: "Excellent STAR articulation.",
        },
        {
          id: 6,
          category: "PORTFOLIO",
          label: "Update case study slides",
          status: "IN_PROGRESS",
          targetDate: "2025-11-05",
        },
      ],
    },
    sessions: [
      {
        id: 3,
        scheduledAt: "2025-10-29T14:30:00.000Z",
        durationMinutes: 50,
        format: "BEHAVIORAL",
        interviewerName: "Sahana Iyer",
        focusAreas: ["Leadership principles", "Conflict resolution"],
        feedbackSummary: "Impactful STAR stories; refine conflict resolution framing.",
      },
      {
        id: 4,
        scheduledAt: "2025-11-05T09:00:00.000Z",
        durationMinutes: 55,
        format: "SYSTEM_DESIGN",
        interviewerName: "Ananya Sharma",
        focusAreas: ["Metrics", "PRD structure"],
      },
    ],
    topics: [
      {
        id: 21,
        title: "Product strategy narratives",
        difficulty: "INTERMEDIATE",
        tags: ["PM", "Communication"],
        lastPracticedAt: "2025-10-23T16:21:00.000Z",
        completionRate: 90,
      },
    ],
    issues: [
      {
        id: 202,
        topicId: 21,
        description: "Needs clearer success metrics in narratives.",
        resolutionStatus: "OPEN",
        mentorNotes: "Review OKR playbook before next session.",
        createdAt: "2025-10-25T11:40:00.000Z",
      },
    ],
  },
];

const formatDateTime = (input: string) =>
  new Date(input).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CandidateDashboardPage() {
  const params = useParams<{ id: string }>();
  const candidateId = Number(params?.id ?? NaN);

  const candidate = candidateDatabase.find((entry) => entry.id === candidateId);

  if (!candidate) {
    notFound();
  }

  const upcomingSessions = candidate.sessions
    .filter((session) => new Date(session.scheduledAt) > new Date())
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  const completedSessions = candidate.sessions.filter(
    (session) => new Date(session.scheduledAt) <= new Date(),
  );

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Link
                href="/dashboard/mock-interviews"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to mock dashboard
              </Link>
              <span className="rounded-full bg-indigo-100 px-3 py-1">
                Candidate dashboard
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {candidate.fullName}
            </h1>
            <p className="text-sm text-slate-500">
              {candidate.targetRole} · Mentored by {candidate.mentorName}
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

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Placement readiness
            </p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-semibold text-indigo-600">
                {candidate.placementProgress.overallScore}%
              </p>
              <p className="text-xs text-slate-500">
                Updated{" "}
                {new Date(
                  candidate.placementProgress.lastUpdated,
                ).toLocaleDateString("en-IN")}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Next milestone: {candidate.placementProgress.nextMilestone}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Completed sessions
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {completedSessions.length}
              <span className="ml-2 text-sm text-slate-400">
                / {candidate.sessions.length}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Feedback archived for {completedSessions.length} rounds.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Upcoming sessions
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {upcomingSessions.length}
            </p>
            <p className="text-xs text-slate-500">
              Next:{" "}
              {upcomingSessions.length > 0
                ? formatDateTime(upcomingSessions[0].scheduledAt)
                : "TBD"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Interview sessions
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <ClipboardList className="h-3.5 w-3.5" />
              {candidate.sessions.length} records
            </span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {candidate.sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {session.format.replace("_", " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(session.scheduledAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {session.durationMinutes} minutes
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-600">
                    Interviewer: {session.interviewerName}
                  </span>
                  {session.focusAreas.map((area) => (
                    <span key={`${session.id}-${area}`} className="rounded-full bg-white px-2 py-1">
                      {area}
                    </span>
                  ))}
                </div>
                {session.feedbackSummary ? (
                  <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-500">
                    {session.feedbackSummary}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Placement checklist
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {candidate.placementProgress.checklist.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        {item.category}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        item.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  {item.targetDate ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Target {new Date(item.targetDate).toLocaleDateString("en-IN")}
                    </p>
                  ) : null}
                  {item.reviewerNotes ? (
                    <p className="mt-2 rounded bg-white p-3 text-xs text-slate-500">
                      Notes: {item.reviewerNotes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Topics & blockers
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Focus topics
                </h3>
                <div className="mt-3 space-y-2">
                  {candidate.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {topic.title}
                        </p>
                        <span className="text-xs text-slate-500">
                          {topic.completionRate}% complete
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {topic.tags.map((tag) => (
                          <span key={`${topic.id}-${tag}`} className="rounded-full bg-slate-200 px-2 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Blockers
                </h3>
                <div className="mt-2 space-y-2 text-xs text-rose-700">
                  {candidate.issues.length === 0 ? (
                    <p>All clear! No blockers logged.</p>
                  ) : (
                    candidate.issues.map((issue) => (
                      <div key={issue.id}>
                        <p className="font-semibold">{issue.description}</p>
                        <p className="text-[11px]">
                          Status: {issue.resolutionStatus.toLowerCase()} •{" "}
                          {issue.mentorNotes}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Success playbook
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Award className="h-4 w-4 text-indigo-500" />
                Targets
              </h3>
              <ul className="mt-2 space-y-1">
                <li>Health score {"\u003E"} 80% for two consecutive weeks.</li>
                <li>All milestone submissions approved.</li>
                <li>Stakeholder demo with 4.5+/5 feedback.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                Weekly habits
              </h3>
              <ul className="mt-2 space-y-1">
                <li>One mock interview and one self-practice recording.</li>
                <li>Update checklist and share learnings in the community.</li>
                <li>Review mentor feedback within 24 hours.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                Support squad
              </h3>
              <ul className="mt-2 space-y-1">
                <li>Interview sub-admin for scheduling.</li>
                <li>Mentorship sub-admin for project guidance.</li>
                <li>Career success manager for offer support.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
