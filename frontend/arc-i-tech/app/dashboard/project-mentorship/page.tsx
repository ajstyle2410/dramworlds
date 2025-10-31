'use client';

import { useMemo, useState } from "react";
import {
  MentorshipMilestone,
  MentorshipSubmission,
  SkillProgress,
} from "@/types";

type MilestoneView = "ROADMAP" | "CALENDAR";

const mentorshipMilestones: MentorshipMilestone[] = [
  {
    id: 101,
    title: "Discovery workshop & vision doc",
    description: "Capture user journeys, success metrics, and risk log.",
    dueDate: "2025-11-01",
    status: "DONE",
    mentorFeedback: "Great articulation of personas; add NFRs in next version.",
  },
  {
    id: 102,
    title: "Architecture blueprint",
    description: "Draft service boundaries, sequence diagrams, and integration matrix.",
    dueDate: "2025-11-10",
    status: "IN_PROGRESS",
    mentorFeedback: "Clarify caching layer responsibilities.",
  },
  {
    id: 103,
    title: "MVP sprint backlog",
    description: "Define backlog items, acceptance criteria, and estimations.",
    dueDate: "2025-11-18",
    status: "NOT_STARTED",
  },
  {
    id: 104,
    title: "Pilot release & retrospective",
    description: "Ship pilot build, run retro, capture learning deck.",
    dueDate: "2025-12-02",
    status: "NOT_STARTED",
  },
];

const mentorshipSubmissions: MentorshipSubmission[] = [
  {
    id: 501,
    milestoneId: 101,
    submittedAt: "2025-10-20T09:15:00.000Z",
    artifactUrl: "https://example.com/docs/vision.pdf",
    reviewStatus: "APPROVED",
    score: 9,
    reviewerComments: "Clear user stories. Good risk mitigation plan.",
  },
  {
    id: 502,
    milestoneId: 102,
    submittedAt: "2025-10-27T14:45:00.000Z",
    artifactUrl: "https://example.com/docs/architecture.pdf",
    reviewStatus: "CHANGES_REQUESTED",
    reviewerComments: "Add sequence diagram for payments flow. Provide load assumptions.",
  },
];

const skills: SkillProgress[] = [
  {
    id: 1,
    competency: "Product discovery",
    currentLevel: 3,
    targetLevel: 5,
    evidence: "Vision doc & customer interview notes.",
    lastUpdated: "2025-10-20T09:15:00.000Z",
  },
  {
    id: 2,
    competency: "Architectural thinking",
    currentLevel: 2,
    targetLevel: 5,
    evidence: "Drafted initial diagrams; needs resiliency focus.",
    lastUpdated: "2025-10-27T14:45:00.000Z",
  },
  {
    id: 3,
    competency: "Team rituals",
    currentLevel: 4,
    targetLevel: 5,
    evidence: "Facilitated sprint retro & backlog refinement.",
    lastUpdated: "2025-10-18T08:00:00.000Z",
  },
];

function groupMilestonesByStatus(items: MentorshipMilestone[]) {
  const buckets: Record<MentorshipMilestone["status"], MentorshipMilestone[]> = {
    NOT_STARTED: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };
  items.forEach((milestone) => {
    buckets[milestone.status].push(milestone);
  });
  return buckets;
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function ProjectMentorshipDashboardPage() {
  const [milestoneView, setMilestoneView] = useState<MilestoneView>("ROADMAP");

  const groupedMilestones = useMemo(
    () => groupMilestonesByStatus(mentorshipMilestones),
    [],
  );

  const activeMilestone = mentorshipMilestones.find(
    (milestone) => milestone.status === "IN_PROGRESS",
  );
  const approvedSubmissions = mentorshipSubmissions.filter(
    (submission) => submission.reviewStatus === "APPROVED",
  ).length;
  const completionPercentage =
    (mentorshipMilestones.filter((m) => m.status === "DONE").length /
      mentorshipMilestones.length) *
    100;

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2">
          <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Project mentorship
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">
            Build with clarity: mentorship insights, milestones, and mastery metrics.
          </h1>
          <p className="text-sm text-slate-500">
            Track roadmap progress, submission feedback, and competency growth across your mentorship journey.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Roadmap completion
            </p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-semibold text-emerald-600">
                {Math.round(completionPercentage)}%
              </p>
              <p className="text-xs text-slate-500">
                {mentorshipMilestones.filter((m) => m.status === "DONE").length} of {mentorshipMilestones.length} milestones
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Active milestone
            </p>
            {activeMilestone ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {activeMilestone.title}
                </p>
                <p className="text-xs text-slate-500">
                  Due {formatDate(activeMilestone.dueDate)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {activeMilestone.description}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No active milestone. Pick the next item from the roadmap.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Submission velocity
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {approvedSubmissions}
              <span className="ml-2 text-sm text-slate-400">
                approved
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {mentorshipSubmissions.length} submissions total • {mentorshipSubmissions.filter((s) => s.reviewStatus === "CHANGES_REQUESTED").length} needs attention
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Mentorship roadmap
            </h2>
            <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
              {(["ROADMAP", "CALENDAR"] as MilestoneView[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMilestoneView(mode)}
                  className={`rounded-full px-3 py-1 transition ${
                    milestoneView === mode
                      ? "bg-emerald-600 text-white"
                      : "hover:bg-white"
                  }`}
                >
                  {mode === "ROADMAP" ? "Status lanes" : "Calendar"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {milestoneView === "ROADMAP" ? (
              <div className="grid gap-4 md:grid-cols-4">
                {(Object.keys(groupedMilestones) as Array<
                  MentorshipMilestone["status"]
                >).map((status) => (
                  <div
                    key={status}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {status.replace("_", " ")}
                    </h3>
                    <div className="mt-3 space-y-3 text-xs text-slate-600">
                      {groupedMilestones[status].length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-slate-400">
                          No milestones in this lane.
                        </p>
                      ) : (
                        groupedMilestones[status].map((milestone) => (
                          <div
                            key={milestone.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <p className="font-semibold text-slate-900">
                              {milestone.title}
                            </p>
                            <p className="mt-1 text-slate-500">
                              {milestone.description}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-400">
                              Due {formatDate(milestone.dueDate)}
                            </p>
                            {milestone.mentorFeedback ? (
                              <p className="mt-2 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-600">
                                {milestone.mentorFeedback}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {mentorshipMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {milestone.title}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      {milestone.status.replace("_", " ")}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {milestone.description}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Due on {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Submission review feed
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {mentorshipSubmissions.map((submission) => {
                const milestone = mentorshipMilestones.find(
                  (m) => m.id === submission.milestoneId,
                );
                return (
                  <div
                    key={submission.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {milestone?.title ?? "Milestone"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(submission.submittedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          submission.reviewStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-600"
                            : submission.reviewStatus === "CHANGES_REQUESTED"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {submission.reviewStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Artifact:{" "}
                      <a
                        href={submission.artifactUrl}
                        className="text-indigo-600 underline"
                      >
                        View submission
                      </a>
                    </p>
                    {submission.score != null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Score: {submission.score}/10
                      </p>
                    ) : null}
                    {submission.reviewerComments ? (
                      <p className="mt-2 rounded-lg bg-white p-3 text-xs text-slate-500">
                        {submission.reviewerComments}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Skill progression matrix
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {skills.map((skill) => {
                const progressPercent = Math.min(
                  100,
                  Math.round((skill.currentLevel / skill.targetLevel) * 100),
                );
                return (
                  <div
                    key={skill.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {skill.competency}
                      </p>
                      <span className="text-xs text-slate-500">
                        Level {skill.currentLevel} of {skill.targetLevel}
                      </span>
                    </div>
                    {skill.evidence ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Evidence: {skill.evidence}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-400">
                      Updated {new Date(skill.lastUpdated).toLocaleDateString("en-IN")}
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Mentor pairings & ceremonies
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">
                Mentor roster
              </h3>
              <ul className="mt-2 space-y-2 text-xs">
                <li>
                  <span className="font-semibold text-slate-800">Ananya Sharma</span> – Product strategy & discovery
                </li>
                <li>
                  <span className="font-semibold text-slate-800">Rahul Mehta</span> – Architecture & scalability
                </li>
                <li>
                  <span className="font-semibold text-slate-800">Sahana Iyer</span> – Team leadership & rituals
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">
                Recurring ceremonies
              </h3>
              <ul className="mt-2 space-y-2 text-xs">
                <li>🎯 Strategy check-in – Mondays 7pm IST</li>
                <li>🛠️ Build review – Thursdays 8pm IST</li>
                <li>📚 Learning journal sync – Saturday mornings</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
