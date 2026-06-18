# Corporate Bulk Rental Portal — Bug Reports

This file documents all active bugs identified in the current QA test suite.

---

## Active Bugs

### [BUG-001] Invalid Email Accepted in Quote Request Form

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-001 |
| **Title** | Invalid Email Accepted in Quote Request Form |
| **Severity** | Medium |
| **Status** | Open |

#### Steps to Reproduce
1. Open Quote Request Form.
2. Enter invalid email (`ghhjj`).
3. Continue.

#### Expected Result
Validation message displayed.

#### Actual Result
User proceeds to next step.

---

### [BUG-006] API Request Returns 401 Unauthorized

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-006 |
| **Title** | API Request Returns 401 Unauthorized |
| **Severity** | High |
| **Status** | Open |

#### Steps to Reproduce
1. Fill rental request form.
2. Submit request.

#### Expected Result
Request stored successfully.

#### Actual Result
API returns 401 Unauthorized (POST request to Supabase API failed).

---

### [BUG-007] Resource Not Found (404)

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-007 |
| **Title** | Resource Not Found (404) |
| **Severity** | Low |
| **Status** | Open |

#### Expected Result
Resource loads successfully.

#### Actual Result
Resource returns HTTP 404.

---

### [BUG-008] Login Page Displays Invalid API Key

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-008 |
| **Title** | Login Page Displays Invalid API Key |
| **Severity** | High |
| **Status** | Open |

#### Steps to Reproduce
1. Open Login page.

#### Expected Result
Login page should load without backend errors.

#### Actual Result
"Invalid API Key" displayed.

---

### [BUG-009] Registration Fails Due to Invalid API Key

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-009 |
| **Title** | Registration Fails Due to Invalid API Key |
| **Severity** | High |
| **Status** | Open |

#### Steps to Reproduce
1. Fill registration details.
2. Submit registration.

#### Expected Result
User account created.

#### Actual Result
Registration blocked with Invalid API Key error.

---

### [BUG-010] Google OAuth Redirect Failure

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-010 |
| **Title** | Google OAuth Redirect Failure |
| **Severity** | High |
| **Status** | Open |

#### Steps to Reproduce
1. Click Google Sign-In button.
2. Authenticate.

#### Expected Result
User redirected back to application after Google login.

#### Actual Result
Redirected to 404 NOT_FOUND page.
