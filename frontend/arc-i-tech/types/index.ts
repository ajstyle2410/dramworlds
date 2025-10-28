export type Role = "SUPER_ADMIN" | "SUB_ADMIN" | "DEVELOPER" | "CUSTOMER";

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: Role;
    active: boolean;
}

export interface AuthResponsePayload {
  token: string;
  expiresInMs: number;
  user: UserProfile;
}

export type ProjectStatus =
  | "PLANNING"
  | "DISCOVERY"
  | "IN_DEVELOPMENT"
  | "TESTING"
  | "DEPLOYED"
  | "ON_HOLD";

export interface Project {
  id: number;
  name: string;
  summary: string;
  details: string | null;
  status: ProjectStatus;
  progressPercentage: number;
  startDate: string | null;
  targetDate: string | null;
  highlighted: boolean;
  clientId: number | null;
  clientName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOffering {
  id: number;
  name: string;
  shortDescription: string;
  detailedDescription: string | null;
  category: string;
  icon: string | null;
  startingPrice: number | null;
  featured: boolean;
}

export type InquiryStatus =
  | "NEW"
  | "IN_DISCUSSION"
  | "QUOTED"
  | "WON"
  | "LOST"
  | "CLOSED";

export interface Inquiry {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: InquiryStatus;
  assignedTo: string | null;
  source: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  senderRole: Role;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface ServiceFormPayload {
  name: string;
  shortDescription: string;
  detailedDescription?: string | null;
  category: string;
  icon?: string | null;
  startingPrice?: number | null;
  featured: boolean;
}

export interface ProjectAssignment {
  id: number;
  projectId?: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  assignmentRole: Role;
  assignedAt: string;
}

export interface AdminDiscussion {
  id: number;
  context: "PROJECT" | "SERVICE" | "OPERATIONS";
  projectId: number | null;
  projectName: string | null;
  serviceCategory: string | null;
  subject: string;
  message: string;
  progressRatio: number | null;
  senderId: number;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "REVIEW"
  | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TimelineEventType =
  | "DISCOVERY"
  | "PLANNING"
  | "DEVELOPMENT"
  | "QA"
  | "DEPLOYMENT"
  | "SUPPORT"
  | "NOTE";

export type NotificationType =
  | "PROJECT_ASSIGNMENT"
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "INQUIRY_SUBMITTED"
  | "PROJECT_NOTE"
  | "PROJECT_COMPLETED"
  | "CUSTOM";

export interface StaffSummary {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface ProjectTask {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: StaffSummary | null;
  updatedAt: string;
}

export interface TaskBoard {
  todo: ProjectTask[];
  inProgress: ProjectTask[];
  review: ProjectTask[];
  blocked: ProjectTask[];
  done: ProjectTask[];
}

export interface ProjectTimelineEvent {
  id: number;
  eventType: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
  actor: StaffSummary | null;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  projectId: number | null;
  taskId: number | null;
}

export interface NotificationFeed {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface DeveloperProjectSummary {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  todoTasks: number;
  upcomingTasks: ProjectTask[];
  computedProgressPercentage: number;
  contributors: StaffSummary[];
}

export interface DeveloperWorkspace {
  taskBoard: TaskBoard;
  recentEvents: ProjectTimelineEvent[];
  assignedProjects: Project[];
  projectSummaries: DeveloperProjectSummary[];
  recentInquiries: Inquiry[];
  notifications: NotificationItem[];
  unreadNotifications: number;
}
