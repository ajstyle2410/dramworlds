# Arc-i-Tech Platform

Arc-i-Tech is a role-driven delivery platform for the Arc-i-Tech technology studio. A Spring Boot backend pairs with a Next.js 16 frontend to power customer journeys, sub-admin operations, developer workflows, and super admin governance—complete with project tracking, mentorship services, inquiry management, and rich collaboration.

## Architecture

- **Backend**: Spring Boot 3.5, MySQL, Spring Data JPA, Spring Security with JWT, RESTful chat and reporting endpoints.
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, SWR-style data hooks, and role-based dashboards.
- **Communication**: JSON APIs protected with bearer tokens; CSV exports generated on demand for governance.

## Feature Highlights

- Secure authentication with JWT and contextual role discovery.
- Customer portal for milestone tracking, project submissions, and secure chat with delivery pods.
- Sub-admin console for project maintenance, inquiry triage, customer roster access, and customer chat.
- Super admin control tower with staff provisioning (sub-admins & developers), service catalogue management, project staffing, admin discussions, and one-click CSV exports.
- Developer cockpit summarising assigned projects, deadlines, and leadership updates.
- Extensive service catalogue covering Software Consulting, Engineering Projects, Project Mentorship, Mock Interviews, Internships, Competency Tutoring, and Mock Tests.

## User Roles & Seeded Accounts

| Role         | Credentials                          | Purpose                                                   |
|--------------|--------------------------------------|-----------------------------------------------------------|
| Super Admin  | `admin@arcitech.com / ChangeMe123!`  | Staffing, services, reporting, executive oversight       |
| Sub-admin    | `ops.lead@arcitech.com / OpsLead123!`| Delivery operations, inquiries, customer collaboration    |
| Developer    | `dev.lead@arcitech.com / DevLead123!`| Executes assigned projects, monitors leadership updates   |
| Customer     | `client@arcitech.com / Client123!`   | Tracks project status, requests modules, collaborates     |

All accounts are created automatically by the `DataInitializer`, alongside a demo project and ten service offerings.

## Backend Setup

1. **Configure MySQL**

   Edit `src/main/resources/application.properties`:

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/arcitech?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
   spring.datasource.username=YOUR_DB_USERNAME
   spring.datasource.password=YOUR_DB_PASSWORD
   spring.jpa.hibernate.ddl-auto=update
   app.jwt.secret=change-me-to-a-very-long-secret-key
   app.jwt.expiration-ms=3600000
   app.cors.allowed-origins=http://localhost:3000
   ```

   > **Tip:** Ensure the JWT secret is at least 32 characters for HS256 signing.

2. **Launch the API**

   ```bash
   ./mvnw spring-boot:run
   ```

3. **Selected API Endpoints**

   | Method | Path                                                        | Description                                      |
   |--------|-------------------------------------------------------------|--------------------------------------------------|
   | POST   | `/api/auth/register`                                        | Customer registration                            |
   | POST   | `/api/auth/login`                                           | JWT issuance + profile                           |
   | GET    | `/api/services/featured`                                    | Public marketing data                            |
   | POST   | `/api/inquiries`                                            | Capture inbound leads                            |
   | GET    | `/api/projects`                                             | Customer project list                            |
   | GET    | `/api/admin/projects`                                       | Sub-admin project pipeline                       |
   | GET    | `/api/developer/projects`                                   | Projects assigned to authenticated developer     |
   | POST   | `/api/super-admin/staff`                                    | Provision sub-admin or developer accounts        |
   | POST   | `/api/super-admin/project-assignments`                      | Assign staff to projects                         |
   | GET    | `/api/super-admin/reports/{resource}`                       | CSV exports for governance                       |
   | POST   | `/api/chat/messages`                                        | Customer chat to delivery team                   |
   | POST   | `/api/admin/chat/{customerId}/messages`                     | Admin/sub-admin reply                            |

## Frontend Setup

1. **Install dependencies**

   ```bash
   cd arc-i-tech
   npm install
   ```

2. **Configure environment**

   Create `arc-i-tech/.env.local`:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. **Run locally**

   ```bash
   npm run dev
   ```

   The app is served at `http://localhost:3000`.

4. **Quality gates**

   ```bash
   npm run lint
   npm run build
   ./mvnw -DskipTests package
   ```

## Manual Validation Checklist

- Authenticate with each seeded account and confirm the correct dashboard is shown (customer, super admin, sub-admin, developer).
- As a customer, submit a new project request and chat with the delivery team.
- As a sub-admin, update project statuses, respond to inquiries, post admin discussions, and reply to customer chat.
- As a super admin, create a new sub-admin or developer, add a service, assign staff to a project, and download CSV exports.
- As a developer, review assigned projects and leadership updates.

## Roadmap Ideas

- Automated tests (Spring Boot slices, React Testing Library, Playwright flows).
- Push notifications via WebSocket/SSE for chat and discussion updates.
- Email/SMS alerts for new inquiries and staffing changes.
- Containerised deployment (Docker, Compose) plus CI/CD integration.
