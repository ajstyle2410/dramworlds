# Dashboard Manuals Overview

This guide breaks down the primary dashboards available within Arc-i-Tech. Each persona sees a tailored workspace; use the checklists and tips below to navigate efficiently.

---

## 1. Super Admin Dashboard

**Purpose**  
Central command tower for orchestration, reporting, staffing, and service catalogue management.

**Key Panels & Actions**
- **Provision staff** – create sub-admin and developer accounts, reset passwords, monitor rosters.
- **Shipment alternate features** – maintain dynamic playbooks for customers, admins, and developers.
- **Launch readiness control** – track all projects, trigger “Mark as shipped” status, and broadcast completion notifications.
- **Service catalogue management** – add, edit, or remove offerings, highlight top services, and manage icons/metadata.
- **Project staffing** – assign squad members to projects, view current roster, and remove assignments when needed.
- **Reporting & conversations** – export project, assignment, services, and staff reports; browse admin discussion summaries.

**Recommended Workflow**
1. Review stats cards for customers, team size, and service count.
2. Update shipment playbooks so all personas understand alternate rollouts.
3. Use Launch readiness to monitor progress; when a project hits 100 %, mark it shipped to trigger notifications.
4. Provision or reassign staff as the delivery pod scales.
5. Download reports before leadership reviews; check discussions for latest governance notes.

**Tips**
- The celebration overlay confirms notifications have fired after marking a project complete.
- Inline edit buttons (service list, shipment features) let you tweak copy without leaving the page.
- Password resets highlight the selected staff member so you don’t lose context.

---

## 2. Customer (User) Dashboard

**Purpose**  
Enable customers to monitor delivery progress, request new builds, and collaborate with the Arc-i-Tech squad.

**Key Panels & Actions**
- **Welcome strip & manual button** – revisit the guided manual any time via the “View dashboard manual” CTA.
- **Status tiles** – snapshot counts of active projects, shipped items, and discovery queues.
- **Recently shipped** – celebrates launches and lists delivery highlights.
- **Delivery timeline** – per-project cards showing summaries, progress bars, feature highlights, and prioritized task lists.
- **Request a new build** – submit briefs with problem statements, additional details, and launch targets.
- **Featured capabilities** – top services curated by the super admin.
- **Next milestones** – countdown to upcoming deliveries with open task counts.
- **Delivery desk** – chat with the Arc-i-Tech squad.

**Recommended Workflow**
1. Skim status tiles and recently shipped cards to stay in sync.
2. Dive into delivery timeline cards for progress metrics and blockers.
3. Use the task list within each card to see current priorities (In Progress tasks appear first).
4. Submit new briefs via “Request a new build” when you need more work scheduled.
5. Keep an eye on the milestones panel for approaching deadlines.
6. Open the dashboard manual button for a refresher on features or share it with new stakeholders.

**Tips**
- Feature highlights pull from project details; add bullet points during project intake for richer dashboards.
- Notifications (top-right bell) reflect shipment completions and task changes pushed from the backend.
- Use chat to clarify blockers shown in the task list.

---

## 3. Project Developer Dashboard

**Purpose**  
Give developers a consolidated view of assigned tasks, project statuses, communications, and inquiries.

**Core Components**
- **Task board** – Kanban-style lanes (To Do, In Progress, Review, Blocked, Done) with drag/drop or status update endpoints.
- **Recent events** – timeline of latest project updates, QA notes, or deployment checkpoints.
- **Project summaries** – show computed progress, outstanding work, and contributor lists.
- **Assigned projects** – quick links to delivery contexts owned by the developer.
- **Inquiries & notifications** – surface new customer inquiries and unread alerts so nothing slips.

**Recommended Workflow**
1. Start each day with the Task board; pull new items from To Do or resolve Blocked tasks.
2. Check Recent events to understand discussions and decisions.
3. Review Project summaries to see overall progress and major contributors.
4. Respond to inquiries or notifications so the customer-facing team stays informed.
5. Update task statuses promptly to keep super-admin metrics accurate and ensure completion notifications fire correctly.

**Tips**
- Notifications include “PROJECT_COMPLETED” when super admins mark launches done—use them to transition to support mode.
- When finishing a task, add relevant notes so customers see new highlights on their dashboard.
- Coordinate with sub-admins via discussions or chat for quick escalations.

---

## 4. Sub Admin Dashboard

**Purpose**  
Manage multiple customers or delivery pods, bridging super admin governance and developer execution.

**Core Components**
- **Portfolio overview** – list of projects under the sub admin’s oversight with progress metrics.
- **Staffing visibility** – assigned developers per project, role breakdown, and reassignment tools where permitted.
- **Task heatmap** – aggregated counts of overdue or blocked tasks requiring intervention.
- **Inquiry triage** – queue of customer inquiries with statuses (NEW, IN_DISCUSSION, QUOTED, etc.).
- **Notification feed** – alerts for task updates, project notes, or customer actions.

**Recommended Workflow**
1. Monitor the portfolio overview to spot at-risk engagements.
2. Coordinate staffing adjustments with the super admin; use assignment controls where your role permits.
3. Triage inquiries daily to keep pipeline healthy.
4. Address blocked tasks through developer hand-offs or escalate to super admins.
5. Review notifications; acknowledge or mark them read so teams know you are tracking changes.

**Tips**
- Sub admins can manage developer/customer accounts but not super-admin roles—leverage the super admin console when needed.
- Keep detailed notes in project discussions to feed the reporting module automatically.
- Use the shipment alternate playbook to brief customers when toggling release strategies.

---

## 5. Shared Best Practices

- **Consistency**: Update task statuses and project progress regularly; many downstream dashboards pull from these fields.
- **Documentation**: Use project “details” fields for bullet highlights—they appear in multiple dashboards and reports.
- **Notifications**: Encourage team members to keep their notification stream clear; critical alerts (like project completion) arrive there.
- **Reports**: Super admins distribute exports (project ledger, assignments, etc.)—coordinate before weekly or executive reviews.

For deeper architectural context, pair this manual with `documentation/project-overview.md`.
