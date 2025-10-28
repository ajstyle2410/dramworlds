'use client';

import type { ReactNode } from "react";
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
  BellRing,
  ClipboardList,
  Code2,
  Download,
  Loader2,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Trash2,
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

type PasswordResetFormState = {
  userId: number | null;
  fullName: string;
  password: string;
  confirmPassword: string;
};

type ShipmentAudienceKey =
  | "CUSTOMER_WORKSPACE"
  | "ADMIN_COMMAND"
  | "PROJECT_DEVELOPER";

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

const emptyPasswordResetForm: PasswordResetFormState = {
  userId: null,
  fullName: "",
  password: "",
  confirmPassword: "",
};

const shipmentAudienceConfig: Record<
  ShipmentAudienceKey,
  {
    audience: string;
    title: string;
    accent: string;
    icon: ReactNode;
  }
> = {
  CUSTOMER_WORKSPACE: {
    audience: "Customer workspace",
    title: "Shipment alternates",
    accent: "bg-indigo-50",
    icon: <Package className="h-6 w-6 text-indigo-600" />,
  },
  ADMIN_COMMAND: {
    audience: "Admin command",
    title: "Governance & alerts",
    accent: "bg-amber-50",
    icon: <BellRing className="h-6 w-6 text-amber-600" />,
  },
  PROJECT_DEVELOPER: {
    audience: "Project developer",
    title: "Developer playbooks",
    accent: "bg-emerald-50",
    icon: <Code2 className="h-6 w-6 text-emerald-600" />,
  },
};

const initialShipmentFeatures: Record<ShipmentAudienceKey, string[]> = {
  CUSTOMER_WORKSPACE: [
    "Switch between phased or big-bang release windows on demand.",
    "Request rollback bundles with a single approval click.",
    "Live shipment tracker links embedded in the client dashboard.",
  ],
  ADMIN_COMMAND: [
    "Automated stakeholder pings when shipment alternates are toggled.",
    "Pre-flight sign-off checklist and dependency verification panel.",
    "Export alternate plans straight into reporting downloads.",
  ],
  PROJECT_DEVELOPER: [
    "Side-by-side build pipelines for primary and rollback deployments.",
    "Automated smoke-test suites tied to alternate shipment toggles.",
    "Release notes templates pushed to the developer workspace.",
  ],
};

function extractFeatureLines(details: string | null | undefined): string[] {
  if (!details) {
    return [];
  }
  return details
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

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
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [passwordResetForm, setPasswordResetForm] = useState<PasswordResetFormState>(
    emptyPasswordResetForm,
  );
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);
  const [updatingProjectId, setUpdatingProjectId] = useState<number | null>(null);
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const [celebratingProject, setCelebratingProject] = useState<string | null>(null);
  const [shipmentFeatures, setShipmentFeatures] = useState(initialShipmentFeatures);
  const [newShipmentFeature, setNewShipmentFeature] = useState("");
  const [newShipmentAudience, setNewShipmentAudience] =
    useState<ShipmentAudienceKey>("CUSTOMER_WORKSPACE");
  const confettiPieces = useMemo(() => {
    const colors = ["#6366f1", "#f97316", "#10b981", "#ec4899"];
    return Array.from({ length: 18 }, (_, index) => ({
      left: `${(index / 18) * 100}%`,
      delay: `${index * 0.12}s`,
      color: colors[index % colors.length],
    }));
  }, []);
  const handleAddShipmentFeature = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = newShipmentFeature.trim();
      if (!trimmed) {
        return;
      }
      setShipmentFeatures((prev) => ({
        ...prev,
        [newShipmentAudience]: [...prev[newShipmentAudience], trimmed],
      }));
      setNewShipmentFeature("");
    },
    [newShipmentFeature, newShipmentAudience],
  );

  const handleRemoveShipmentFeature = useCallback(
    (audience: ShipmentAudienceKey, index: number) => {
      setShipmentFeatures((prev) => {
        const nextEntries = [...prev[audience]];
        nextEntries.splice(index, 1);
        return {
          ...prev,
          [audience]: nextEntries,
        };
      });
    },
    [],
  );
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

  useEffect(() => {
    if (!celebratingProject) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCelebratingProject(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [celebratingProject]);

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

  const handleBeginPasswordReset = (staff: UserProfile) => {
    setPasswordResetForm({
      userId: staff.id,
      fullName: staff.fullName,
      password: "",
      confirmPassword: "",
    });
    setPasswordResetError(null);
    setPasswordResetSuccess(null);
  };

  const handleCancelPasswordReset = () => {
    setPasswordResetForm(emptyPasswordResetForm);
    setPasswordResetError(null);
  };

  const handleResetStaffPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !passwordResetForm.userId) {
      return;
    }
    if (passwordResetForm.password.length < 8) {
      setPasswordResetError("Password must be at least 8 characters long.");
      return;
    }
    if (passwordResetForm.password !== passwordResetForm.confirmPassword) {
      setPasswordResetError("Passwords do not match.");
      return;
    }
    setResettingPassword(true);
    setPasswordResetError(null);
    try {
      const response = await apiFetch<UserProfile>(
        `/api/admin/user-management/users/${passwordResetForm.userId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            password: passwordResetForm.password,
          }),
        },
      );
      const updatedUser = response.data;
      if (updatedUser.role === "SUB_ADMIN") {
        setSubAdmins((prev) =>
          prev.map((member) =>
            member.id === updatedUser.id ? updatedUser : member,
          ),
        );
      }
      if (updatedUser.role === "DEVELOPER") {
        setDevelopers((prev) =>
          prev.map((member) =>
            member.id === updatedUser.id ? updatedUser : member,
          ),
        );
      }
      setPasswordResetSuccess(`Password updated for ${updatedUser.fullName}.`);
      setPasswordResetForm(emptyPasswordResetForm);
    } catch (error) {
      setPasswordResetError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.",
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCompleteProject = async (projectId: number) => {
    if (!token) return;
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    setUpdatingProjectId(projectId);
    setProjectActionError(null);
    try {
      const response = await apiFetch<Project>(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: "DEPLOYED",
          progressPercentage: 100,
        }),
      });
      const updatedProject = response.data;
      setProjects((prev) =>
        prev.map((item) => (item.id === updatedProject.id ? updatedProject : item)),
      );
      setCelebratingProject(updatedProject.name);
    } catch (error) {
      console.error("Failed to complete project", error);
      setProjectActionError(
        error instanceof Error ? error.message : "Unable to mark the project as completed.",
      );
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const handleSaveService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSavingService(true);
    try {
      if (editingServiceId !== null) {
        const response = await apiFetch<ServiceOffering>(
          `/api/super-admin/services/${editingServiceId}`,
          {
            method: "PUT",
            token,
            body: JSON.stringify(serviceForm),
          },
        );
        setServices((prev) =>
          prev.map((service) =>
            service.id === response.data.id ? response.data : service,
          ),
        );
      } else {
        const response = await apiFetch<ServiceOffering>(
          "/api/super-admin/services",
          {
            method: "POST",
            token,
            body: JSON.stringify(serviceForm),
          },
        );
        setServices((prev) => [response.data, ...prev]);
      }
      setServiceForm(emptyServiceForm);
      setEditingServiceId(null);
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
    if (editingServiceId === serviceId) {
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm);
    }
  };

  const handleEditService = (service: ServiceOffering) => {
    setServiceForm({
      name: service.name,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription ?? "",
      category: service.category,
      icon: service.icon ?? "",
      startingPrice: service.startingPrice ?? null,
      featured: service.featured,
    });
    setEditingServiceId(service.id);
  };

  const handleCancelEditService = () => {
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
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
      {celebratingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white px-8 py-10 text-center shadow-2xl">
            <div className="pointer-events-none absolute inset-0">
              {confettiPieces.map((piece, index) => (
                <span
                  key={`confetti-${index}`}
                  className="confetti-piece"
                  style={{
                    left: piece.left,
                    animationDelay: piece.delay,
                    backgroundColor: piece.color,
                  }}
                />
              ))}
            </div>
            <div className="relative flex flex-col items-center gap-4">
              <Sparkles className="h-9 w-9 text-indigo-500 animate-pulse" />
              <h3 className="text-2xl font-semibold text-slate-900">
                {celebratingProject} shipped!
              </h3>
              <p className="max-w-md text-sm text-slate-600">
                Notifications have been dispatched to the customer and every assigned squad member.
              </p>
              <button
                type="button"
                onClick={() => setCelebratingProject(null)}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <Sparkles className="h-4 w-4" />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Shipment alternate features
              </h2>
              <p className="text-sm text-slate-500">
                Rapidly pivot between delivery plans for customers, administrators, and project developers.
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 md:mt-0">
              <UserCog className="h-3.5 w-3.5" />
              Dynamic rollout matrix
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(Object.entries(shipmentAudienceConfig) as Array<
              [ShipmentAudienceKey, (typeof shipmentAudienceConfig)[ShipmentAudienceKey]]
            >).map(([audienceKey, config]) => {
              const features = shipmentFeatures[audienceKey];
              return (
                <article
                  key={audienceKey}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl ${config.accent} p-3`}>{config.icon}</div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {config.audience}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
                    </div>
                  </div>
                  {features.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-3 text-xs text-slate-400">
                      Add highlights below to showcase this rollout lane.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-600">
                      {features.map((feature, index) => (
                        <li
                          key={`${audienceKey}-feature-${index}`}
                          className="flex items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            <span>{feature}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveShipmentFeature(audienceKey, index)}
                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600"
                            aria-label={`Remove feature "${feature}"`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
          <form
            onSubmit={handleAddShipmentFeature}
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Audience
                <select
                  value={newShipmentAudience}
                  onChange={(event) =>
                    setNewShipmentAudience(event.target.value as ShipmentAudienceKey)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="CUSTOMER_WORKSPACE">Customer workspace</option>
                  <option value="ADMIN_COMMAND">Admin command</option>
                  <option value="PROJECT_DEVELOPER">Project developer</option>
                </select>
              </label>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Feature highlight
                <textarea
                  value={newShipmentFeature}
                  onChange={(event) => setNewShipmentFeature(event.target.value)}
                  rows={2}
                  placeholder="Describe an alternate-shipment perk or safeguard..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!newShipmentFeature.trim()}
            >
              <Plus className="h-4 w-4" />
              Add feature
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Launch readiness control
              </h2>
              <p className="text-sm text-slate-500">
                Track shipment alternates, confirm completion, and broadcast handover updates in one place.
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 md:mt-0">
              <Package className="h-3.5 w-3.5" />
              {projects.length} briefs monitored
            </span>
          </div>
          {projectActionError && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {projectActionError}
            </p>
          )}
          <div className="mt-4 space-y-3">
            {projects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No projects yet. As soon as a customer brief is approved it will land here for launch orchestration.
              </p>
            ) : (
              projects.map((project) => {
                const featureLines = extractFeatureLines(project.details);
                const progressValue = Math.min(Math.max(project.progressPercentage ?? 0, 0), 100);
                const isComplete =
                  project.status === "DEPLOYED" || (project.progressPercentage ?? 0) >= 100;
                const isUpdating = updatingProjectId === project.id;
                return (
                  <article
                    key={`launch-${project.id}`}
                    className={`rounded-2xl border p-5 shadow-sm transition ${
                      isComplete
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.summary}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{progressValue}% complete</span>
                        <span>Target {formatDate(project.targetDate)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400">
                        Last update {formatDate(project.updatedAt)}
                      </p>
                      {isComplete ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">
                          <Sparkles className="h-3.5 w-3.5" />
                          Shipped
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCompleteProject(project.id)}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4" />
                              Mark as shipped
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {featureLines.length > 0 && (
                      <div className="mt-3 rounded-xl bg-white/70 p-3">
                        <p className="text-xs font-semibold text-slate-600">Feature highlights</p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-500">
                          {featureLines.slice(0, 4).map((line, index) => (
                            <li key={`${project.id}-ship-feature-${index}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {isComplete && (
                      <p className="mt-3 text-xs font-semibold text-emerald-700">
                        Notifications sent to customer and squad. Celebrate the shipment!
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
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
                      <li
                        key={member.id}
                        className={`flex items-start justify-between gap-2 rounded border p-2 ${
                          passwordResetForm.userId === member.id
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {member.fullName}
                          </p>
                          <p>{member.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBeginPasswordReset(member)}
                          className="text-nowrap text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={resettingPassword}
                        >
                          Reset password
                        </button>
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
                      <li
                        key={member.id}
                        className={`flex items-start justify-between gap-2 rounded border p-2 ${
                          passwordResetForm.userId === member.id
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {member.fullName}
                          </p>
                          <p>{member.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBeginPasswordReset(member)}
                          className="text-nowrap text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={resettingPassword}
                        >
                          Reset password
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              </div>
            {passwordResetForm.userId !== null && (
              <form
                onSubmit={handleResetStaffPassword}
                className="mt-6 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Reset password for {passwordResetForm.fullName}
                </p>
                <label className="text-xs font-semibold text-slate-600">
                  New password
                  <input
                    type="password"
                    value={passwordResetForm.password}
                    onChange={(event) =>
                      setPasswordResetForm((prev) => ({
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
                  Confirm password
                  <input
                    type="password"
                    value={passwordResetForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordResetForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    required
                    minLength={8}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                {passwordResetError && (
                  <p className="text-xs font-semibold text-rose-600">
                    {passwordResetError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPasswordReset}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={resettingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={resettingPassword}
                  >
                    {resettingPassword ? "Updating..." : "Save password"}
                  </button>
                </div>
              </form>
            )}
            {passwordResetSuccess && (
              <p className="mt-4 text-xs font-semibold text-emerald-600">
                {passwordResetSuccess}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Manage services
            </h2>
            {editingServiceId !== null && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                Editing existing service
              </p>
            )}
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
                    value={serviceForm.startingPrice ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setServiceForm((prev) => ({
                        ...prev,
                        startingPrice: value === "" ? null : Number(value),
                      }));
                    }}
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
              <div className="flex items-center justify-end gap-2">
                {editingServiceId !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEditService}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingService}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingService}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingService
                    ? "Saving..."
                    : editingServiceId !== null
                    ? "Update service"
                    : "Add service"}
                </button>
              </div>
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
                    className={`rounded-lg border p-3 text-sm text-slate-600 ${
                      editingServiceId === service.id
                        ? "border-indigo-300 bg-white"
                        : "border-slate-200 bg-slate-50"
                    }`}
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
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditService(service)}
                          className="text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
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
      <style jsx global>{`
        .confetti-piece {
          position: absolute;
          top: -20%;
          width: 8px;
          height: 12px;
          border-radius: 2px;
          opacity: 0;
          animation-name: confetti-fall;
          animation-duration: 3.2s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-20%) rotateZ(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(220%) rotateZ(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}




