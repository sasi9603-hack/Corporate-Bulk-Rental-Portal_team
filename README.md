# Corporate Bulk Rental Portal

An Internship Reference Document project built in collaboration with **One Point Solutions**.

## Project Metadata
* **Company**: One Point Solutions
* **Solution**: Corporate Bulk Rental Portal
* **What it Solves**: Allows companies to request laptops, desktops, monitors, projectors, or printers in bulk.
* **Why Useful**: Particularly useful for B2B clients who need devices for employees, events, or training programs.
* **Project Duration**: 01 June 2026 - 30 June 2026 (26 Working Days)
* **Team Size**: 3 Students

---

## Team Structure & Members
* **Student 1 (Frontend)**: `Praharsha`
  * *Responsibilities*: Corporate enquiry form, bulk device quantity grid, event/training date selector, delivery location fields, quotation request summary, approval status page, and corporate admin dashboard.
* **Student 2 (Backend)**: `Prem Sai`
  * *Responsibilities*: Bulk rental request APIs, quantity availability validation, corporate account linkage, quotation status workflow, delivery slot checks, invoice handoff, and request reports.
* **Student 3 (Testing & Deployment)**: `V.Sasidhar Reddy`
  * *Responsibilities*: Rental workflow testing, return checklist testing, KYC/agreement validation, bulk rental testing, logistics conflict testing, maintenance tracker testing, B2B account testing, ROI calculation testing, AI output testing, troubleshooting testing, photo inspection testing, API testing, GitHub management, and deployment validation.

---

## Technology Stack

| Layer | Technology | Role in This Project |
| **Frontend** | React, Vite, Tailwind CSS, Lucide React | Corporate enquiry form, bulk device quantity grid, date selectors, quote requests, status pages, and the admin dashboard. |
| **Backend & Auth** | Node.js (Express) / Supabase Auth | User registration/login, session management, secure backend endpoints, and role guards. |
| **Database** | PostgreSQL (via Supabase) | Stores customers, devices, rental bookings, return dates, device condition, KYC logs, deposits, and status histories. |
| **AI / Logic Layer** | Rule-Based Workflow Logic | Automates recommendations, summaries, alerts, status transitions, and quotation note drafting. |
| **Reporting** | jsPDF, html2canvas | Generates and exports client quote agreements and invoices directly to PDF. |

---

## Project Overview

### 1. The Problem
Every day, the company receives customer requests, operational updates, and follow-up requirements that need quick action. Currently, managing bulk rental requests for IT hardware (laptops, desktops, monitors, projectors, printers) is slow and scattered when handled manually over calls, emails, or spreadsheets.

This results in:
* Wasted administrative overhead.
* Slow response times to priority B2B clients.
* Missed revenue opportunities because follow-ups are delayed.
* No central audit trail to track request progress, ownership, and history.

### 2. What We Have Built
The **Corporate Bulk Rental Portal** is a working prototype that automates the end-to-end B2B hardware rental cycle:
1. **Client Request**: The corporate client enters request info (dates, quantities of devices, delivery location).
2. **Database Insertion**: The request is validated and saved with tracking details.
3. **Quotation Workflow**: Admin reviews the request and submits a custom package quotation.
4. **Approval & Allocation**: Client reviews and approves/rejects the quotation.
5. **Admin Operations**: Operations staff monitor status updates, inventory quantity, and log history.

---

## Review Milestones
* **Review 1 (06 June 2026)**: Company intro, project title, problem statement, objectives, abstract.
* **Review 2 (19-20 June 2026)**: Literature survey, system analysis, architecture, database design.
* **Review 3 (Final Present)**: Full deployed prototype, presentation, demo video.

---

## Testing & Deployment (Student 3 - V. Sasidhar Reddy)

### 1. Testing Strategy
Our testing strategy encompasses multiple testing phases to guarantee functional, visual, database, and security coverage:
* **Manual Exploratory Testing**: Validating client-to-admin workflows, step navigation of form wizard, and visual alignment across responsive breakpoints.
* **API Testing & Schema Validation**: Checking backend endpoint integrity, RLS permissions validation, and ensuring database tables block invalid inserts.
* **Authentication & Guard Verification**: Testing route protection (redirecting unauthorized guests) and admin role restriction.

### 2. Test Environment
* **Frontend**: React and Vite running on a local development server (`http://localhost:5173`).
* **Backend**: Node.js and Express server communicating with Supabase services.
* **Database**: Supabase PostgreSQL database instances running with customized Row-Level Security (RLS) policies.

### 3. Tools Used
* **Postman Desktop Client**: Version `12.15.4` (Windows 64-bit) used for batch execution of API validation test scenarios.
* **Browser DevTools**: Google Chrome and Microsoft Edge DevTools used for responsive viewport inspection, console trace reviews, and network request monitoring.
* **GitHub**: Repositories, commits, and branch tracking logs.

### 4. Defect Tracking Process
A centralized registry tracks all QA-identified bugs:
1. **Identification**: Testing runs detect anomalous behavior (e.g. invalid email acceptance).
2. **Logging**: Issue recorded in `testing/bug_reports.md` (and exported as `bug_reports.csv`) detailing title, description, severity, status (Open/Resolved), and steps to reproduce.
3. **Prioritization**: Priority levels (Critical, High, Medium, Low) assigned depending on operational blockages.

### 5. Deployment Validation Process
* **Pre-Deployment Checklist**: Verify local server builds without errors, run tests locally, audit RLS rules.
* **Post-Deployment Validation**: Execute a checklist comparing local and remote API URL variables, verify client dashboard KPI counters, test authentications, and run end-to-end enquiries to confirm full database write success.

