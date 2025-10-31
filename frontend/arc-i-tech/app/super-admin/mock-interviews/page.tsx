'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  InterviewerProfile,
  MockInterviewRecord,
  PlacementChecklistItem,
} from "@/types";
import { ArrowLeft, CalendarCheck2, ClipboardList, Filter, Search } from "lucide-react";

const interviewerRoster: InterviewerProfile[] = [
  {
    id: 1,
    fullName: "Ananya Sharma",
    role: "LEAD",
    expertise: ["System design", "DSA", "Career coaching"],
    totalSessions: 148,
    rating: 4.8,
    active: true,
  },
  {
    id: 2,
    fullName: "Rahul Mehta",
    role: "MENTOR",
    expertise: ["System design", "Observability"],
    totalSessions: 96,
    rating: 4.6,
    active: true,
  },
  {
    id: 3,
    fullName: "Sahana Iyer",
    role: "MENTOR",
    expertise: ["Behavioral", "Leadership principles"],
    totalSessions: 75,
    rating: 4.9,
    active: false,
  },
];

const interviewCatalog: MockInterviewRecord[] = [
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
    format: "DSA",
    status: "COMPLETED",
    feedback: "Strong fundamentals. Needs to verbalise trade-offs sooner.",
    score: 8.5,
  },
  {
    id: 503,
    candidateName: "Arjun Nair",
    interviewerId: 3,
    scheduledAt: "2025-10-28T16:00:00.000Z",
    format: "BEHAVIORAL",
    status: "NO_SHOW",
  },
  {
    id: 504,
    candidateName: "Meera Rao",
    interviewerId: 2,
    scheduledAt: "2025-11-06T09:00:00.000Z",
    format: "SYSTEM_DESIGN",
    status: "SCHEDULED",
  },
];

const placementQueue: PlacementChecklistItem[] = [
  {
    id: 601,
    category: "RESUME",
    label: "Resume review - Kiran Patel",
    status: "IN_PROGRESS",
    targetDate: "2025-10-30",
    reviewerNotes: "Add measurable impact to the payments project.",
  },
  {
    id: 602,
    category: "APTITUDE",
    label: "Mock test analysis - Meera Rao",
    status: "NOT_STARTED",
    targetDate: "2025-11-04",
  },
  {
    id: 603,
    category: "COMMUNICATION",
    label: "Elevator pitch drill - Neha Gupta",
    status: "COMPLETED",
    targetDate: "2025-10-25",
    reviewerNotes: "Excellent STAR articulation.",
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

export default function SuperAdminMockInterviewsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MockInterviewRecord["status"] | "ALL">(
    "ALL",
  );

  const stats = useMemo(() => {
    const totalSessions = interviewCatalog.length;
    const completed = interviewCatalog.filter(
      (record) => record.status === "COMPLETED",
    ).length;
    const upcoming = interviewCatalog.filter(
      (record) => record.status === "SCHEDULED",
    ).length;
    const noShows = interviewCatalog.filter(
      (record) => record.status === "NO_SHOW",
    ).length;

    return [
      {
        label: "Total sessions",
        value: totalSessions,
        delta: `Completed ${completed}`,
      },
      {
        label: "Upcoming",
        value: upcoming,
        delta: "Next 7 days prioritised",
      },
      {
        label: "No-shows",
        value: noShows,
        delta: "Auto-reminders enabled",
      },
      {
        label: "Interviewer satisfaction",
        value: `${(
          interviewerRoster.reduce((sum, mentor) => sum + mentor.rating, 0) /
          interviewerRoster.length
        ).toFixed(1)} / 5`,
        delta: "Average mentor rating",
      },
    ];
  }, []);

  const filteredSessions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return interviewCatalog.filter((record) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : record.status === statusFilter;
      const matchesQuery =
        term.length === 0 ||
        record.candidateName.toLowerCase().includes(term) ||
        record.format.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [statusFilter, query]);

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to super admin
            </Link>
            <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              Interviewer admin dashboard
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Coordinate mock interviews, mentors, and placement readiness.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review interviewer load, audit session quality, and oversee placement guidance artefacts from one control panel.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Interview session ledger
              </h2>
              <p className="text-sm text-slate-500">
                Filter by status or search candidates to audit outcomes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search candidate or format"
                  className="bg-transparent text-xs text-slate-600 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as MockInterviewRecord["status"] | "ALL")
                  }
                  className="bg-transparent text-xs text-slate-600 outline-none"
                >
                  <option value="ALL">All statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No show</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Interviewer</th>
                  <th className="px-4 py-3 text-left">Format</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                      No sessions match your filters. Adjust the search criteria and try again.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((record) => {
                    const interviewer = interviewerRoster.find(
                      (profile) => profile.id === record.interviewerId,
                    );
                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{record.candidateName}</p>
                          <p className="text-[11px] text-slate-400">Record #{record.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {interviewer?.fullName ?? "Unassigned"}
                          </p>
                          <p className="text-[11px] text-slate-400">{interviewer?.role ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs uppercase tracking-wide text-indigo-600">
                          {record.format.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDateTime(record.scheduledAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              record.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-600"
                                : record.status === "SCHEDULED"
                                ? "bg-indigo-100 text-indigo-600"
                                : record.status === "CANCELLED"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {record.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {record.score != null ? `${record.score}/10` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Interviewer roster
            </h2>
            <p className="text-sm text-slate-500">
              Assign load, monitor ratings, and toggle availability.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {interviewerRoster.map((mentor) => (
                <div
                  key={mentor.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{mentor.fullName}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        {mentor.role}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{mentor.totalSessions} sessions</p>
                      <p>Rating {mentor.rating.toFixed(1)}/5</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {mentor.expertise.map((skill) => (
                      <span
                        key={`${mentor.id}-${skill}`}
                        className="rounded-full bg-white px-2 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold ${
                        mentor.active
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {mentor.active ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Manage allocation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Placement checklist queue
            </h2>
            <p className="text-sm text-slate-500">
              Monitor outstanding placement artefacts and reviewer notes.
            </p>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              {placementQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.label}
                    </p>
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
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                    {item.category}
                  </p>
                  {item.targetDate ? (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Target {formatDateTime(`${item.targetDate}T00:00:00.000Z`).split(",")[0]}
                    </p>
                  ) : null}
                  {item.reviewerNotes ? (
                    <p className="mt-2 rounded bg-white p-3 text-[11px] text-slate-500">
                      Notes: {item.reviewerNotes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Operational playbook
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarCheck2 className="h-4 w-4 text-indigo-500" />
                Scheduling
              </h3>
              <ul className="mt-2 space-y-1">
                <li>Sync calendars via ATS integration.</li>
                <li>Auto-remind candidates 24h before sessions.</li>
                <li>Escalate repeated no-shows to talent ops.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                Quality
              </h3>
              <ul className="mt-2 space-y-1">
                <li>Sample 10% of completed sessions for QA.</li>
                <li>Track mentor ratings quarterly.</li>
                <li>Run calibration meetings every sprint.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Filter className="h-4 w-4 text-indigo-500" />
                Reporting
              </h3>
              <ul className="mt-2 space-y-1">
                <li>Export weekly session ledger for analytics.</li>
                <li>Share placement readiness radar with sales.</li>
                <li>Feed offer insights into talent benchmarks.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
