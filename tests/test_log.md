# Corporate Bulk Rental Portal — Test Log & Summary Index

This log is the executive index for the QA test suite, linking to the specialized spreadsheets and bug reports.

---

## 1. Testing and Quality Objectives

From a quality perspective, the project focuses on the following five testing objectives:

1. **Functional Completeness & API Correctness**: Validate backend API and Supabase endpoints.
2. **Cross-Device UI Responsiveness**: Verify layout correctness on mobile and desktop.
3. **Role-Based Authorization & Guarding**: Verify authorization guards block unauthorized access.
4. **Data Integrity & Schema Mapping**: Prevent PostgreSQL integrity constraint failures.
5. **PDF Export & Quotation Accuracy**: Ensure correctness of rule-based pricing and exports.

---

## 2. API Testing Tool Installation

* **Tool Installed**: Postman Desktop Client (Windows 64-bit)
* **Version**: `12.15.4`
* **Status**: Successfully Installed

---

## 3. QA Documentation Index

All raw data and test logs have been separated into dedicated sheets for modularity and single-source integrity:

### 📋 Test Cases Log
* **Sheet Path**: **[test_cases.csv](file:///c:/Users/sasid/OneDrive/Apps/open/tests/test_cases.csv)**
* **Overview**: Records all 38 test cases (TC-001 to TC-038) covering Website accessibility, Navigation, Wizard forms, APIs, Mobile/Tablet layouts, Route Guards, Role-Based Access, and Student 3 custom verification (B2B Accounts, ROI calculations, and AI outputs).

### 🐛 Bug Reports Log
* **Detailed Logs**: **[bug_reports.md](file:///c:/Users/sasid/OneDrive/Apps/open/tests/bug_reports.md)**
* **Sheet Path**: **[bug_reports.csv](file:///c:/Users/sasid/OneDrive/Apps/open/tests/bug_reports.csv)**
* **Overview**: Details the 6 active bugs (BUG-001, BUG-006 to BUG-010) with steps to reproduce and severity rankings.

### 🌐 API Testing Log
* **Sheet Path**: **[api_testing.csv](file:///c:/Users/sasid/OneDrive/Apps/open/tests/api_testing.csv)**
* **Observations**:
  * Backend API is not accepting requests.
  * Authentication services are failing.
  * Supabase integration appears misconfigured.
  * Deployment environment variables may be missing or invalid.

### 🔐 Authentication Testing Log
* **Sheet Path**: **[authentication_testing.csv](file:///c:/Users/sasid/OneDrive/Apps/open/tests/authentication_testing.csv)**
* **Overview**: Logs login page, registration page, password validation, registration submission, and Google OAuth login results.

### 🚀 Deployment Validation Log
* **Sheet Path**: **[deployment_validation.csv](file:///c:/Users/sasid/OneDrive/Apps/open/tests/deployment_validation.csv)**
* **Overview**: Logs Frontend UI components vs Backend server communication status.
