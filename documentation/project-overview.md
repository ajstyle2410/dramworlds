# Arc-i-Tech Platform Documentation

## 1. High-Level Overview

- **Vision**: Arc-i-Tech orchestrates digital delivery for customers, super admins, and project developers. The platform combines project intake, staffing, service catalogue management, and real-time collaboration.
- **Architecture**: A Next.js 16 front-end (TypeScript, App Router) paired with a Spring Boot backend exposing REST APIs backed by JPA entities. Authentication is bearer-token based; role-driven access gates critical endpoints.
- **Key Personas**:
  - **Customer Workspace**: Request builds, monitor milestones, check task boards, and review completed shipments.
  - **Super Admin Console**: Provision staff, curate services, supervise project staffing, and run launch controls.
  - **Project Developers & Sub Admins**: Manage assigned work via task boards, receive notifications, and coordinate delivery cadences.

## 2. Backend Reference (Spring Boot)

- **Modules**:
  - `com.arcitech.project`: Projects, assignments, tasks, status updates, and shipment completion logic.
  - `com.arcitech.user`: Authentication, roles, notifications, and staff provisioning.
  - `com.arcitech.catalog`: Service offerings CRUD for super admins.
  - `com.arcitech.reporting`: Downloadable reports (projects, assignments, services, etc.).
- **Notifications**:
  - Stored via `UserNotificationRepository`; exposed through `/api/notifications`.
  - Notification types include task events, project notes, and **PROJECT_COMPLETED** (triggered when a project reaches 100% or DEPLOYED).
  - Completion flow (`ProjectService`) fans out alerts to the customer and every assigned squad member.
- **Security**:
  - Pre-authorized endpoints ensure least privilege (e.g., `/api/super-admin/**` requires `ROLE_SUPER_ADMIN`).
  - Password updates and staff creation rely on request DTOs with validation annotations.

## 3. Frontend Reference (Next.js)

- **Structure**:
  - `/app` routes handle pages for customers (`/dashboard`), super admins (`/super-admin`), admin staff (`/admin`), etc.
  - Shared UI lives in `/components`; typed models in `/types/index.ts`.
  - API consumption routed through `lib/api.ts` with token injection and error handling.
- **Super Admin Console Enhancements**:
  - **Shipment Alternate Features**: Dynamic playbook configurable from the UI with per-audience highlights and inline removal.
  - **Launch Readiness Control**: One-click "Mark as shipped" workflow sends backend PATCH requests, triggers celebration overlays, and reflects status visually.
  - **Staff Tools**: Password reset panel, staff provisioning, and service CRUD with edit/cancel flows.
- **Customer Dashboard Enhancements**:
  - Task board summaries plus detailed lists per project card (status badges, prioritized tasks).
  - Completed project announcements and feature highlight parsing from project details.

## 4. Deployment & Runtime Notes

- **Environment**:
  - Backend requires Java 17+, Maven/Gradle build; configure `NEXT_PUBLIC_API_URL` for the frontend.
  - Frontend runs via `npm run dev` / `next build`.
  - Notification fan-out depends on the backend JDBC connection (MySQL per docs) and proper role assignments.
- **Key Configuration**:
  - `.env` (frontend): `NEXT_PUBLIC_API_URL`.
  - Backend application properties: datasource credentials, JWT secrets, and CORS settings.
- **Testing Hooks**:
  - Backend: prefer integration tests (`@SpringBootTest`) for project and notification modules.
  - Frontend: align with Next.js testing stack (React Testing Library) for key flows (shipment spotlight, launch control).

## 5. Operational Playbooks

- **Marking Projects Complete**:
  1. Navigate to Super Admin -> Launch readiness control.
  2. Click "Mark as shipped"; confirm celebration overlay.
  3. Validate notification feed (customer + squad) for "Launch complete" and "Project shipped" entries.
- **Updating Shipment Features**:
  1. Use the shipment alternate section to add or remove highlights per persona.
  2. No code changes needed; state persists in React during session (persist to backend if required).
- **Provisioning Staff**:
  1. Create sub-admins or developers with the provisioning form.
  2. Assign to projects via Project Staffing grid; removal possible inline.
  3. Reset credentials using the roster-side action and confirmation panel.
- **Product-Based Dashboard Assignment**:
  1. On customer registration, present a product selection modal with the options:
     - **Mock Interviews & Placement Guidance** (requires sub-admin approval).
     - **Project Mentorship** (requires sub-admin approval).
     - **Software Consulting** (public, default access).
  2. Persist the customer's selections and immediately enable dashboards marked as public (Software Consulting).
  3. For approval-gated dashboards, emit a request to the sub-admin queue:
     - API endpoint: `POST /api/admin/dashboard-access-requests`.
     - Payload: user id, requested dashboard ids, justification (optional).
     - Status transitions: `PENDING -> APPROVED` or `PENDING -> REJECTED`.
  4. Sub admin console surfaces pending requests; approving a request assigns the dashboard to the user profile and notifies the customer.
  5. Customer sees the new dashboard entry on next login or via WebSocket push.
  6. Super admin reporting includes a coverage matrix (product vs. enrolled users).

## 6. Product-Specific Dashboard Architecture

### Dashboard Surface Areas
- **Mock Interviews & Placement Guidance Dashboard**
  - Dedicated route: `/dashboard/mock-interviews`
  - Widgets: Interview schedule planner, session-day calendar, feedback archive, placement readiness checklist, mentor chat feed, offer tracking.
  - Data Structures:
    - `InterviewSession` (date, format, interviewer, focus areas, recording link).
    - `PlacementChecklistItem` (category, status, target date, reviewer notes).
    - `PlacementProgress` aggregate (overall percentage, last updated, upcoming milestones).
  - Visibility: Hidden until sub admin approval is granted.
- **Project Mentorship Dashboard**
  - Route: `/dashboard/project-mentorship`
  - Widgets: Mentorship roadmap, milestone tracker, mentor pairing roster, code/project submission review panel, skill matrix with progress.
  - Data Structures:
    - `MentorshipMilestone` (title, description, due date, status, mentor feedback).
    - `MentorshipSubmission` (artifact link, review status, score, iteration count).
    - `SkillProgress` (competency dimension, current level, target level, evidence).
  - Visibility: Hidden until sub admin approval is granted.
- **Software Consulting Dashboard**
  - Route: `/dashboard/software-consulting`
  - Widgets: Consulting engagement list, statement-of-work tracker, billing snapshot, communication log.
  - Visibility: Public; auto-enabled after registration if selected.

### Registration & Selection Flow
1. **Product Selection Modal**  
   Triggered after account creation; displays cards for each product with short summaries, eligibility notes, and a “Request access” or “Enable now” CTA.
2. **State Persistence**  
   Products flagged as public (Software Consulting) are immediately marked active and appended to the user’s dashboard navigation.
3. **Approval Workflow for Restricted Dashboards**
   - Submit request via `POST /api/admin/dashboard-access-requests` including `userId`, `requestedProducts`, and optional notes.
   - Default status `PENDING`; sub admin can approve (`PATCH /api/admin/dashboard-access-requests/{id}`) or reject.
   - On approval, backend updates user-product mapping and emits a notification (`NotificationType.PROJECT_NOTE` or dedicated type).
4. **Sub Admin Console Updates**
   - Add “Dashboard Access Requests” panel showing pending items with approve/reject controls and audit trail.
   - Optionally allow bulk approvals.
5. **Frontend Visibility**
   - Navigation builder reads active dashboard list; only authorised products render in the sidebar/topbar.
   - Attempting to visit a gated dashboard without access should display an informative lock screen.
6. **Reporting**
   - Super admin reports include product enrolment counts and approval turnaround times.
   - Consider CSV export via `/api/super-admin/reports/dashboard-access`.

### Progress & Data Maintenance Best Practices
- Persist interview and mentorship entities via dedicated tables (e.g., `interview_sessions`, `mentorship_milestones`, `skill_progress`) with foreign keys to the user profile.
- Expose granular APIs:
  - `GET /api/mock-interviews/sessions`, `POST /api/mock-interviews/sessions`
  - `GET /api/mock-interviews/placement-progress`
  - `GET /api/project-mentorship/milestones`, `PATCH /api/project-mentorship/milestones/{id}`
- Compute progress bars on the backend to keep the frontend simple and ensure consistency across reports.
- Offer export endpoints (`/api/mock-interviews/reports` and `/api/project-mentorship/reports`) for career services teams.
- Define notification hooks for key events such as new session scheduled, submission feedback posted, or readiness score crossing thresholds.
- **Frontend scaffolding**: Mock dashboards currently render sample data collections (sessions, milestones, topics) to illustrate layout and UX flows. Replace with real API hydration once backend endpoints are ready.

## 7. Future Improvements (Backlog)

- Persist shipment alternate features to backend configuration instead of local state.
- Introduce WebSocket push for immediate notification updates without polling.
- Expand project completion workflow to include automated release note generation and artifact links.
- Extend dashboard task lists with filtering, pagination, and inline status edits.
- Implement multi-dashboard provisioning UI with iconography and hover summaries.
- Add activity logs for dashboard access approvals to support audits.

---

_Maintainer tip_: Keep backend notification types mirrored in `frontend/arc-i-tech/types/index.ts` to avoid runtime mismatches. Add new types via shared constants or generated schemas when possible.
- **Interviewer Admin Dashboard**
  - Route: `/super-admin/mock-interviews`
  - Audience: Super admins overseeing interviewer load and quality.
  - Capabilities: Session ledger, mentor roster with ratings, placement checklist queue, and operational playbook.
  - Integrates with the main super admin console via quick-link for rapid navigation.
- **Interview Sub-Admin Dashboard**
  - Route: `/interview-sub-admin`
  - Audience: Sub-admins dedicated to the mock interview program.
  - Capabilities: Candidate pipeline, mentor allocations, session history, escalations, and shared resources.
  - Accounts are provisioned through the super admin console via the “Interview sub-admin onboarding” form (creates SUB_ADMIN credentials).
