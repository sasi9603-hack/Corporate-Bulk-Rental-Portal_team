# Corporate Bulk Rental Portal — Test Log

This file contains the testing objectives, tool installation records, and backend endpoint test logs.

---

## 1. Testing and Quality Objectives

From a quality perspective, the project focuses on the following five testing objectives:

1. **Functional Completeness & API Correctness**: Validate that all API routes (Express backend endpoints and Supabase database requests) process requests successfully, return correct status codes, and handle boundary limits (e.g., negative device quantities) gracefully.
2. **Cross-Device UI Responsiveness**: Test that the layout switches dynamically and correctly between the mobile card grid layout and the laptop/desktop tabular layout, ensuring visual excellence and zero content overlap.
3. **Role-Based Authorization & Guarding**: Verify that the `AdminGuard` and `ClientGuard` routes properly block unauthorized requests, redirecting unauthenticated users to `/login` and routing logged-in users to their correct dashboards based on role profiles.
4. **Data Integrity & Schema Mapping**: Ensure database records are correctly created and linked between the `companies`, `rental_requests`, and `request_items` tables in PostgreSQL, preventing orphan records or database integrity constraint failures.
5. **PDF Export & Quotation Accuracy**: Test the rule-based quotation calculation logic and PDF export engine (`jsPDF` + `html2canvas`) to guarantee that generated quotation files contain accurate prices, tax details, and match One Point Solutions' branding.

---

## 2. API Testing Tool Installation

* **Tool Installed**: Postman Desktop Client (Windows 64-bit)
* **Installation Method**: Windows Package Manager (`winget`)
* **Package ID**: `Postman.Postman`
* **Version**: `12.15.4`
* **Status**: Successfully Installed

---

## 3. Backend API Route Test Log

The backend `/api/hello` route was tested to confirm that the local Express server starts correctly and handles requests.

### Test Case: Backend Connectivity Check (GET)
* **Date & Time**: 2026-06-17T09:39:00Z (UTC)
* **Endpoint URL**: `http://localhost:5000/api/hello`
* **HTTP Method**: `GET`
* **Test Client**: PowerShell `Invoke-RestMethod` / Postman API Client
* **Expected Status**: `200 OK`
* **Actual Status**: `200 OK`

### Request Header/Body:
*No request body required (GET request)*

### Response Payload:
```json
{
    "status": "success",
    "message": "Hello from Corporate Bulk Rental Portal Backend!",
    "timestamp": "2026-06-17T09:39:00.462Z"
}
```

### Test Result: **PASSED**
*The server is fully operational and CORS configurations are correctly allowing cross-origin requests.*

---

### Test Case: Personalized Hello Check (POST)
* **Date & Time**: 2026-06-17T09:49:57Z (UTC)
* **Endpoint URL**: `http://localhost:5000/api/hello`
* **HTTP Method**: `POST`
* **Test Client**: PowerShell `Invoke-RestMethod` / Postman API Client
* **Expected Status**: `200 OK`
* **Actual Status**: `200 OK`

### Request Header/Body:
* **Headers**: `Content-Type: application/json`
* **Body**:
```json
{
    "name": "Sasidhar"
}
```

### Response Payload:
```json
{
    "status": "success",
    "message": "Hello, Sasidhar! Welcome to the Corporate Bulk Rental Portal Backend.",
    "receivedData": {
        "name": "Sasidhar"
    },
    "timestamp": "2026-06-17T09:49:57.772Z"
}
```

### Test Result: **PASSED**
*The server successfully parsed the JSON request body, processed the custom name parameter, and responded with a personalized hello message.*
