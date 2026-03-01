# LabFlow — Business Plan

## Executive Summary

LabFlow is a B2B SaaS platform purpose-built for dental laboratories and the dentist practices they serve. It replaces fragmented workflows — spreadsheets, phone calls, paper tracking slips — with a unified digital system that manages the full lifecycle of a dental case from intake to shipment. The platform operates as two connected portals: a full-featured lab management system for internal staff and a streamlined doctor portal for dentist clients, creating a shared source of truth between labs and practices.

---

## Mission

To modernize dental lab operations by providing an affordable, intuitive platform that eliminates manual case tracking, reduces errors, accelerates turnaround times, and strengthens the business relationship between labs and the practices they serve.

---

## Problem

Dental laboratories today face persistent operational challenges:

- **Case tracking is manual and error-prone.** Most labs rely on paper tickets, whiteboards, or basic spreadsheets to track cases through production stages. Cases get lost, status updates are delayed, and staff waste time searching for information.
- **Communication with doctors is fragmented.** Labs and practices communicate via phone, text, and email with no centralized thread tied to the case itself. Instructions get lost, shade mismatches happen, and remakes cost the lab money.
- **Financial visibility is poor.** Invoicing is often done manually at month-end. Labs struggle to track which cases have been billed, and doctors have no self-service way to review their invoice history.
- **No data-driven decision making.** Without analytics, labs cannot identify bottlenecks, track technician productivity, or forecast workload.

## Solution

LabFlow addresses each of these problems through a single integrated platform:

| Problem | LabFlow Solution |
|---|---|
| Manual case tracking | Digital case lifecycle with 5-stage status workflow |
| Fragmented communication | Per-case messaging between lab and doctor |
| Poor invoicing visibility | Integrated invoice generation with doctor-facing history |
| No analytics | Built-in reports, charts, and activity audit trail |
| Doctor disconnect | Dedicated doctor portal with real-time case visibility |

---

## Product — Features Overview

### Lab Portal (Internal Staff)

**Case Management**
- Create, edit, and track cases through a defined status workflow: Received → In Progress → Quality Check → Ready → Shipped
- Assign cases to doctors, set due dates, flag rush orders
- Attach files (scans, photos, prescriptions) with drag-and-drop upload
- Per-case messaging thread for direct communication with the doctor
- Track materials used per case

**Doctor Management**
- Maintain a directory of all client doctors and practices
- View per-doctor case volume and statistics
- Invite doctors to self-register for portal access

**Invoicing**
- Generate PDF invoices per doctor with itemized case details
- Track invoiced vs. uninvoiced cases
- Multi-page invoice support with lab branding

**Shipping**
- Log shipping carrier and tracking number per case
- Dedicated shipping tracker view for outbound cases

**Inventory**
- Track materials with SKU, category, quantity, unit cost, and supplier
- Reorder-level alerts for low stock
- Material usage linked to individual cases

**Reports & Analytics**
- Case status distribution (pie chart)
- Case volume by type and by doctor (bar charts)
- Filterable date ranges and export options

**Calendar**
- Visual calendar view of cases by due date
- Quick identification of workload distribution and rush cases

**Activity Log**
- Full audit trail of all significant actions (case creation, status changes, file uploads, messages)
- Filterable by user, action type, and date

**Team Management**
- Invite staff via email with role assignment (admin or tech)
- Admin and technician roles with permission-based visibility
- Admin-only access to financials, reports, inventory, and team settings

**Settings**
- Configure lab name, contact information, and branding
- Settings visible to doctors in the portal header

### Doctor Portal (External Clients)

- **Case Dashboard** — View all submitted cases with search, filter, and sort capabilities
- **Case Detail** — See case status, due date, shade, notes, and attachments (no financial data exposed)
- **Messaging** — Send and receive messages tied to specific cases
- **Invoice History** — View invoiced cases and amounts
- **Self-Registration** — Doctors register with their email; the system matches them to their existing lab record

---

## Engineering Structure

### Claude Code as Chief Engineer

LabFlow's engineering operation is led by **Claude Code (Anthropic's AI coding agent)**, which serves as the **Chief Engineer** of the project. Claude Code operates as the central technical authority responsible for:

- **Architectural decisions** — Defining the tech stack, data model, component structure, and overall system design
- **Code review and quality control** — Every piece of code is reviewed and validated by Claude Code before it becomes part of the codebase
- **Task delegation and coordination** — Complex features are broken down into discrete tasks and delegated to specialized subagents
- **Consistency enforcement** — Ensuring that all code follows established patterns, conventions, and the project's architectural principles

### Subagent Model

Under Claude Code's direction, specialized subagents manage individual assets and features of the platform:

| Subagent Role | Responsibility |
|---|---|
| **Explore Agent** | Codebase research, file discovery, architecture analysis |
| **Plan Agent** | Feature design, implementation strategy, dependency mapping |
| **General-Purpose Agent** | Multi-step implementation tasks, complex code searches, cross-cutting concerns |
| **Build & Test Agents** | Code validation, build verification, regression checks |

**Workflow:**
1. A feature request or bug report is received
2. Claude Code (Chief Engineer) analyzes the request and determines scope
3. Subagents are dispatched — often in parallel — to research, plan, or implement
4. All subagent output is reviewed by Claude Code before integration
5. Claude Code performs final validation, ensures architectural consistency, and commits the change

This structure enables rapid development with consistent quality. The Chief Engineer maintains full context of the codebase (guided by `CLAUDE.md`) while subagents handle focused, parallelizable work.

### Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS 4, Lucide React icons
- **Database & Auth:** Supabase (PostgreSQL, Row-Level Security, Auth, Storage)
- **Charts:** Recharts
- **PDF Generation:** jsPDF with autoTable
- **Deployment:** Vercel

---

## Target Market

### Primary: Small to Mid-Size Dental Laboratories

- 1–25 technicians
- Processing 50–500+ cases per month
- Currently using manual or spreadsheet-based tracking
- Seeking affordable software that doesn't require dedicated IT staff

### Secondary: Dentist Practices (via Doctor Portal)

- General dentists and specialists who send cases to labs
- Value transparency into case status without calling the lab
- Practices sending cases to multiple labs benefit from a unified portal experience

---

## Revenue Model

| Tier | Target | Features |
|---|---|---|
| **Starter** | Solo labs / 1–3 staff | Core case management, 1 admin, limited doctors |
| **Professional** | Growing labs / 4–10 staff | Full feature set, unlimited doctors, analytics, inventory |
| **Enterprise** | Large labs / 10+ staff | Multi-location support, advanced reporting, API access, priority support |

Pricing: Monthly SaaS subscription per lab. Doctor portal access is free (drives lab adoption).

---

## Competitive Advantage

1. **Two-portal architecture** — Most competitors focus only on internal lab tools. LabFlow's doctor portal creates a network effect: doctors prefer labs that offer transparency, and labs using LabFlow retain more clients.
2. **AI-engineered quality** — With Claude Code as Chief Engineer, the codebase maintains professional-grade architecture and consistency that would typically require a senior engineering team.
3. **Modern tech stack** — Built on Next.js 16, React 19, and Supabase rather than legacy technologies. This means faster iteration, lower maintenance costs, and a better user experience.
4. **Low barrier to entry** — No complex setup, no on-premise servers. Labs sign up, configure settings, and start tracking cases immediately. Doctor onboarding is self-service.
5. **Built-in compliance readiness** — Activity audit trail, role-based access control, and row-level security provide a foundation for HIPAA-aligned data handling.

---

## Roadmap

### Phase 1 — Foundation (Complete)
- Case lifecycle management with 5-stage workflow
- Doctor directory and management
- Role-based access (admin, tech, doctor)
- Authentication with password reset
- Team invitations and onboarding

### Phase 2 — Collaboration (Complete)
- Doctor portal with self-registration
- Per-case messaging between lab and doctor
- File attachments with drag-and-drop and preview
- Doctor-facing invoice history

### Phase 3 — Operations (Complete)
- Shipping tracker with carrier/tracking info
- Inventory management with reorder alerts
- Calendar view by due date
- Analytics and reporting dashboard
- Activity audit log

### Phase 4 — Growth (Planned)
- Multi-location lab support
- Automated notifications (email/SMS for status changes)
- Doctor portal mobile optimization
- Recurring case templates
- Integration with dental CAD/CAM systems

### Phase 5 — Scale (Planned)
- API access for third-party integrations
- White-label option for enterprise labs
- Advanced analytics with AI-powered insights
- Billing integration (Stripe) for automated invoicing and payment collection

---

## Summary

LabFlow transforms dental lab operations from manual, disconnected workflows into a streamlined digital platform. By serving both the lab and its doctor clients through a unified system, it creates value on both sides of the relationship. With Claude Code as Chief Engineer driving consistent, high-quality development through an AI-native subagent model, LabFlow can iterate faster and maintain higher code quality than traditionally-staffed competitors — turning AI-assisted engineering into a genuine business advantage.
