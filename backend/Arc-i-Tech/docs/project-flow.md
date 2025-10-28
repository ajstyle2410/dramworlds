# Arc-i-Tech Project Flow DFD

`mermaid
graph TD
    Customer[Customer]
    SubAdmin[Sub Admin]
    Developer[Developer]
    SuperAdmin[Super Admin]
    ServiceCatalog[Service Catalogue]
    InquiryForm[Inquiry Form]
    InquiryService[Inquiry Service]
    ProjectController[Project Controller]
    ProjectAssignment[Assignment Service]
    TaskBoard[Task Board]
    Timeline(Project Timeline)
    Notifications[Notification Service]
    MySQL[(MySQL DB)]

    Customer -->|Browse| ServiceCatalog
    Customer -->|Submit Inquiry| InquiryForm
    InquiryForm --> InquiryService
    InquiryService --> MySQL
    SuperAdmin -->|Review inquiries & assign| ProjectController
    ProjectController --> ProjectAssignment
    ProjectAssignment --> SubAdmin
    ProjectAssignment --> Developer
    ProjectAssignment --> MySQL

    SubAdmin -->|Create tasks / update project| TaskBoard
    TaskBoard --> MySQL
    SubAdmin --> Timeline
    Timeline --> MySQL

    Developer --> TaskBoard
    Developer --> Timeline
    TaskBoard --> Notifications
    Timeline --> Notifications
    Notifications --> Developer
    Notifications --> SubAdmin

    MySQL --> ProjectController
    MySQL --> TaskBoard
    MySQL --> Timeline
`

## Flow Summary

1. **Customer Interaction**
   - Customer explores the service catalogue and files an inquiry.
   - Inquiry service persists inquiry details in MySQL.

2. **Super Admin Coordination**
   - Super admin reviews inquiries, approves projects, and assigns sub-admins/developers.
   - Assignments and project metadata are stored in MySQL.

3. **Sub Admin Execution**
   - Sub-admin manages project tasks, timeline events, and updates status.
   - Task changes and timeline events notify relevant users.

4. **Developer Workspace**
   - Developers view their task board (grouped by status), recent events, notifications, and in-flight inquiries.

5. **Notifications**
   - Task assignment/update or timeline changes trigger notifications to sub-admins and developers.

## Data Stores

- MySQL holds customers, staff, projects, assignments, tasks, timeline events, inquiries, and notifications.

## Key Services

- InquiryService: handles customer inquiries.
- ProjectAssignment: coordinates sub-admin/developer assignments.
- ProjectTaskService: CRUD over developer tasks.
- ProjectTimelineService: logs project timeline events.
- NotificationService: pushes notification entries to users.

## Future Enhancements

- Real-time websockets for notifications.
- SLA metrics per project timeline.
- Analytics on task cycle time and inquiry conversion rate.

