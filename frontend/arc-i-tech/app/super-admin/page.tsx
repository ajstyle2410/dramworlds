'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatDate } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  AdminDiscussion,
  Project,
  ProjectAssignment,
  ServiceFormPayload,
  ServiceOffering,
  UserProfile,
} from "@/types";
import {
  ClipboardList,
  Download,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

type StaffRole = "SUB_ADMIN" | "DEVELOPER";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type StaffFormState = {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
};

type ServiceFormState = ServiceFormPayload;

type AssignmentFormState = {
  projectId: string;
  memberRole: StaffRole;
  memberId: string;
};

const emptyStaffForm: StaffFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "SUB_ADMIN",
};

const emptyServiceForm: ServiceFormState = {
  name: "",
  shortDescription: "",
  detailedDescription: "",
  category: "",
  icon: "",
  startingPrice: 1000,
  featured: false,
};

const emptyAssignmentForm: AssignmentFormState = {
  projectId: "",
  memberRole: "SUB_ADMIN",
  memberId: "",
};

export default function SuperAdminPage() {
  const { token, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [subAdmins, setSubAdmins] = useState<UserProfile[]>([]);
  const [developers, setDevelopers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);

  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);

  const [creatingStaff, setCreatingStaff] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [assigningMember, setAssigningMember] = useState(false);
  const refreshAssignments = useCallback(
    async (projectId: number | null) => {
      if (!token || !projectId) {
        setAssignments([]);
        return;
      }
      const response = await apiFetch<ProjectAssignment[]>(
        `/api/admin/projects/${projectId}/assignments`,
        { token },
      );
      setAssignments(response.data);
    },
    [token],
  );

  const bootstrap = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [
        customerRes,
        subAdminRes,
        developerRes,
        serviceRes,
        projectRes,
        discussionRes,
      ] = await Promise.all([
        apiFetch<UserProfile[]>("/api/admin/users", { token }),
        apiFetch<UserProfile[]>("/api/super-admin/staff/sub-admins", { token }),
        apiFetch<UserProfile[]>("/api/super-admin/staff/developers", { token }),
        apiFetch<ServiceOffering[]>("/api/super-admin/services", { token }),
        apiFetch<Project[]>("/api/admin/projects", { token }),
        apiFetch<AdminDiscussion[]>(
          "/api/admin/discussions/context/PROJECT",
          { token },
        ),
      ]);
      setCustomers(customerRes.data);
      setSubAdmins(subAdminRes.data);
      setDevelopers(developerRes.data);
      setServices(serviceRes.data);
      setProjects(projectRes.data);
      setDiscussions(discussionRes.data);

      if (projectRes.data.length > 0) {
        const first = projectRes.data[0];
        setAssignmentForm((prev) => ({
          ...prev,
          projectId: first.id.toString(),
        }));
        await refreshAssignments(first.id);
      }
    } catch (error) {
      console.error("Failed to bootstrap super admin console", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout, refreshAssignments]);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin || !token) {
      router.replace("/login");
      return;
    }
    void bootstrap();
  }, [isAuthenticated, isSuperAdmin, token, router, bootstrap]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setCreatingStaff(true);
    try {
      const response = await apiFetch<UserProfile>(
        "/api/super-admin/staff",
        {
          method: "POST",
          token,
          body: JSON.stringify(staffForm),
        },
      );
      if (staffForm.role === "SUB_ADMIN") {
        setSubAdmins((prev) => [response.data, ...prev]);
      } else {
        setDevelopers((prev) => [response.data, ...prev]);
      }
      setStaffForm(emptyStaffForm);
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleSaveService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSavingService(true);
    try {
      const response = await apiFetch<ServiceOffering>(
        "/api/super-admin/services",
        {
          method: "POST",
          token,
          body: JSON.stringify(serviceForm),
        },
      );
      setServices((prev) => [response.data, ...prev]);
      setServiceForm(emptyServiceForm);
    } finally {
      setSavingService(false);
    }
  };

  const handleAssignMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !assignmentForm.projectId || !assignmentForm.memberId) return;
    setAssigningMember(true);
    try {
      const response = await apiFetch<ProjectAssignment | null>(
        "/api/super-admin/project-assignments",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            projectId: Number(assignmentForm.projectId),
            memberId: Number(assignmentForm.memberId),
            assignmentRole: assignmentForm.memberRole,
          }),
        },
      );
      const payload = response.data;
      if (!payload) {
        return;
      }
      const augmentedAssignment: ProjectAssignment = {
        ...payload,
        projectId: Number(assignmentForm.projectId),
      };
      setAssignments((prev) => {
        const alreadyAssigned = prev.some(
          (assignment) =>
            assignment.memberId === augmentedAssignment.memberId &&
            Number(assignment.projectId ?? assignmentForm.projectId) === augmentedAssignment.projectId,
        );
        if (alreadyAssigned) {
          return prev;
        }
        return [augmentedAssignment, ...prev];
      });
      setAssignmentForm((prev) => ({
        ...prev,
        memberId: "",
      }));
    } finally {
      setAssigningMember(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!token) return;
    await apiFetch<void>(`/api/super-admin/project-assignments/${assignmentId}`, {
      method: "DELETE",
      token,
      parseJson: false,
    });
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== assignmentId),
    );
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!token) return;
    await apiFetch<void>(`/api/super-admin/services/${serviceId}`, {
      method: "DELETE",
      token,
      parseJson: false,
    });
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
  };

  const stats = useMemo(() => {
    return [
      {
        label: "Customers",
        value: customers.length,
        icon: <Users className="h-5 w-5 text-indigo-500" />,
      },
      {
        label: "Core team",
        value: subAdmins.length + developers.length,
        icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      },
      {
        label: "Service lines",
        value: services.length,
        icon: <ClipboardList className="h-5 w-5 text-amber-500" />,
      },
    ];
  }, [customers.length, subAdmins.length, developers.length, services.length]);

  const handleDownload = useCallback((endpoint: string) => {
    const url = `${API_BASE}${endpoint}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-100 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            Preparing super admin console...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Super Admin Control Tower
          </h1>
          <p className="text-sm text-slate-500">
            Orchestrate staffing, services, governance, and reporting for
            Arc-i-Tech.
          </p>
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

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Provision staff
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Spin up sub-admins to run programs or developers to execute delivery.
            </p>
            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Full name
                  <input
                    value={staffForm.fullName}
                    onChange={(event) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Email
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(event) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Password
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(event) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    required
                    minLength={8}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Role
                  <select
                    value={staffForm.role}
                    onChange={(event) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        role: event.target.value as StaffRole,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="SUB_ADMIN">Sub-admin</option>
                    <option value="DEVELOPER">Developer</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingStaff ? "Creating..." : "Create account"}
              </button>
            </form>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Sub-admin roster
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {subAdmins.length === 0 ? (
                    <li>No sub-admins yet.</li>
                  ) : (
                    subAdmins.map((member) => (
                      <li key={member.id} className="rounded bg-white p-2">
                        <p className="font-semibold text-slate-800">
                          {member.fullName}
                        </p>
                        <p>{member.email}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Developer roster
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {developers.length === 0 ? (
                    <li>No developers yet.</li>
                  ) : (
                    developers.map((member) => (
                      <li key={member.id} className="rounded bg-white p-2">
                        <p className="font-semibold text-slate-800">
                          {member.fullName}
                        </p>
                        <p>{member.email}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Manage services
            </h2>
            <form onSubmit={handleSaveService} className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-600">
                Service name
                <input
                  value={serviceForm.name}
                  onChange={(event) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Short description
                <textarea
                  value={serviceForm.shortDescription}
                  onChange={(event) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      shortDescription: event.target.value,
                    }))
                  }
                  required
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Detailed description
                <textarea
                  value={serviceForm.detailedDescription ?? ""}
                  onChange={(event) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      detailedDescription: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Category
                  <input
                    value={serviceForm.category}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Icon keyword
                  <input
                    value={serviceForm.icon ?? ""}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        icon: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Starting price (-)
                  <input
                    type="number"
                    min={1}
                    value={serviceForm.startingPrice ?? 0}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        startingPrice: Number(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={serviceForm.featured}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        featured: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Highlight on home page
                </label>
              </div>
              <button
                type="submit"
                disabled={savingService}
                className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingService ? "Saving..." : "Add service"}
              </button>
            </form>
            <div className="mt-6 space-y-3">
              {services.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No services yet. Start by adding the Arc-i-Tech capabilities above.
                </p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {service.name}
                        </p>
                        <p className="text-xs text-indigo-500">
                          {service.category}
                          {service.featured ? " - Featured" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-xs">{service.shortDescription}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Project staffing
            </h2>
            <form onSubmit={handleAssignMember} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">
                Project
                <select
                  value={assignmentForm.projectId}
                  onChange={(event) => {
                    const projectId = event.target.value;
                    setAssignmentForm((prev) => ({
                      ...prev,
                      projectId,
                    }));
                    void refreshAssignments(projectId ? Number(projectId) : null);
                  }}
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
              <label className="text-xs font-semibold text-slate-600">
                Role
                <select
                  value={assignmentForm.memberRole}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      memberRole: event.target.value as StaffRole,
                      memberId: "",
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="SUB_ADMIN">Sub-admin</option>
                  <option value="DEVELOPER">Developer</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Team member
                <select
                  value={assignmentForm.memberId}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      memberId: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select member</option>
                  {(assignmentForm.memberRole === "SUB_ADMIN"
                    ? subAdmins
                    : developers
                  ).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={
                    assigningMember ||
                    !assignmentForm.projectId ||
                    !assignmentForm.memberId
                  }
                  className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assigningMember ? "Assigning..." : "Assign to project"}
                </button>
              </div>
            </form>
            <div className="mt-6 space-y-3">
              {assignments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  Select a project to view its squad roster.
                </p>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {assignment.memberName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {assignment.memberEmail}
                      </p>
                      <p className="text-xs text-indigo-600">
                        {assignment.assignmentRole.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Reporting & conversations
            </h2>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => handleDownload("/api/super-admin/reports/projects")}
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Project ledger <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDownload("/api/super-admin/reports/assignments")}
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Assignment roster <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDownload("/api/super-admin/reports/services")}
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Service catalogue <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownload("/api/super-admin/reports/staff?role=SUB_ADMIN")
                }
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Sub-admin roster <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownload("/api/super-admin/reports/staff?role=DEVELOPER")
                }
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Developer roster <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDownload("/api/super-admin/reports/inquiries")}
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Inquiry register <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {discussions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No admin discussions logged yet. Encourage program leads to share
                  updates from the main board.
                </p>
              ) : (
                discussions.slice(0, 5).map((discussion) => (
                  <div
                    key={discussion.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {discussion.subject}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(discussion.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-wide text-indigo-500">
                      {discussion.context}
                      {discussion.projectName ? ` - ${discussion.projectName}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {discussion.senderName} -{" "}
                      {discussion.senderRole.replace("_", " ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}




