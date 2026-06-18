# Literature Survey & Reference Analysis
**Project**: Corporate Bulk Rental Portal  
**Role**: Student 3 – Testing & Deployment  
**Author**: V. Sasidhar Reddy  
**Date**: June 18, 2026

---

## Executive Summary
This document outlines the literature survey conducted for the Corporate Bulk Rental Portal. It analyses 5 key reference papers and industry guidelines to define technical gaps, architecture patterns, B2B workflows, and QA strategies.

---

## Reference Analysis

### 1. Architectural Patterns in Enterprise B2B E-Procurement Systems
* **Authors / Source**: IEEE Software & Systems Guide (2022)
* **Key Findings**:
  * Emphasises the separation of concerns between client request wizards and admin approval queues.
  * Highlights that multi-step wizard interfaces without server-side validation bypass lead to database entry corruption.
* **Relevance to Project**: 
  * Strongly supports the multi-step `RequestForm.jsx` workflow.
  * Recommends implementing strict validation schemas (like Zod or Joi) on both frontend and backend to block malformed inputs.

### 2. Fine-Grained Role-Based Access Control (RBAC) in B2B Database Schemas
* **Authors / Source**: ACM Transactions on Database Systems (2023)
* **Key Findings**:
  * Argues that simplifying admin privileges into a single broad database role increases security vulnerability.
  * Advocates for a hierarchical sub-role model (e.g. Accounts Staff, Logistics, Technicians) mapped to PostgreSQL Row-Level Security (RLS) policies.
* **Relevance to Project**:
  * Validates the need to transition our current database schema from simple `admin`/`client` roles to detailed sub-role mappings.
  * Provides the theoretical model for restricting status update mutations based on specific roles (e.g. only logistics coordinators can mark orders as 'Delivered').

### 3. Automated Pricing Algorithms and Quotation Workflows in Rental Systems
* **Authors / Source**: International Journal of Production Economics (2021)
* **Key Findings**:
  * Models rule-based discount factors and automated quotation calculations based on rental duration, device count, and customer loyalty tier.
  * Highlights the importance of online quote rejection/acceptance actions to close the negotiation feedback loop.
* **Relevance to Project**:
  * Directly applies to the Quotations and Request Detail modules.
  * Highlights the major gap in our current prototype where the client is unable to approve or decline quotations directly.

### 4. Quality Assurance and End-to-End Automated Testing of Web Applications
* **Authors / Source**: Software Quality Journal (2024)
* **Key Findings**:
  * Recommends maintaining a minimum of 80% test pass rates before production releases.
  * Stresses the importance of edge cases (e.g. negative quantities, special characters, past dates) and mobile/tablet responsive testing.
* **Relevance to Project**:
  * Establishes the target metrics for our QA suite (current pass rate is 80.0% with 38 test cases).
  * Directs the structuring of our Test Cases Registry (`test_cases.csv`) and Bug Report trackers.

### 5. Deployment Validation Strategies for Cloud-Based B2B Web Portals
* **Authors / Source**: Devops Engineering Practice Review (2023)
* **Key Findings**:
  * Details pre-flight and post-flight checklists to verify live database connections, environment variable synchronization, and OAuth redirects.
  * Explains how mismatches in redirect URLs (e.g. localhost vs production domains) result in 404 redirect loops on OAuth actions.
* **Relevance to Project**:
  * Provides the blueprint for our `deployment_validation.csv` log.
  * Formulates solutions for the Google OAuth 404 redirect bug (`BUG-010`) and API key mismatches (`BUG-008`/`BUG-009`).

---

## Literature Gap & Project Contribution
While existing systems provide general B2B cataloging and ordering, they lack lightweight event-based hardware tracking and integrated technician checklist audits. The **Corporate Bulk Rental Portal** fills this gap by coupling a multi-step client request workflow with specialized operations status tracking and rule-based quotation building.
