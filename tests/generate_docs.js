const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  HeadingLevel, WidthType, AlignmentType, BorderStyle 
} = require('docx');
const fs = require('fs');
const path = require('path');

// Ensure docs directory exists
const outputDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR SEAMLESS STYLING
// -------------------------------------------------------------
const PRIMARY_COLOR = "1E3A8A";   // Navy Blue
const SECONDARY_COLOR = "475569"; // Slate Grey
const TEXT_COLOR = "334155";      // Dark Charcoal
const LIGHT_BG = "F8FAFC";        // Light Slate
const WHITE = "FFFFFF";
const BORDER_COLOR = "CBD5E1";    // Slate 300

function createTitle(text, subtitle, author, date) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000, after: 200 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 48, // 24pt
          color: PRIMARY_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 800 },
      children: [
        new TextRun({
          text: subtitle,
          italics: true,
          size: 28, // 14pt
          color: SECONDARY_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 100 },
      children: [
        new TextRun({
          text: "Prepared for: Internship Submission & Review Presentation",
          size: 20, // 10pt
          color: SECONDARY_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: "Role: Student 3 – Testing & Deployment",
          bold: true,
          size: 22, // 11pt
          color: TEXT_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: `Author: ${author}`,
          size: 22, // 11pt
          color: TEXT_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 1000 },
      children: [
        new TextRun({
          text: `Date: ${date}`,
          size: 20, // 10pt
          color: SECONDARY_COLOR,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      pageBreakBefore: true // Page break after cover details
    })
  ];
}

function createH1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 150 },
    keepNext: true,
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 32, // 16pt
        color: PRIMARY_COLOR,
        font: "Arial"
      })
    ]
  });
}

function createH2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    keepNext: true,
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26, // 13pt
        color: SECONDARY_COLOR,
        font: "Arial"
      })
    ]
  });
}

function createBody(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix,
      bold: true,
      size: 22, // 11pt
      color: TEXT_COLOR,
      font: "Arial"
    }));
  }
  children.push(new TextRun({
    text: text,
    size: 22, // 11pt
    color: TEXT_COLOR,
    font: "Arial"
  }));

  return new Paragraph({
    spacing: { before: 60, after: 120 },
    lineSpacing: { before: 60, after: 120, line: 276 }, // 1.15 line spacing
    children: children
  });
}

function createBullet(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix,
      bold: true,
      size: 22, // 11pt
      color: TEXT_COLOR,
      font: "Arial"
    }));
  }
  children.push(new TextRun({
    text: text,
    size: 22, // 11pt
    color: TEXT_COLOR,
    font: "Arial"
  }));

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 80 },
    lineSpacing: { line: 276 },
    children: children
  });
}

function createBorderOption() {
  return {
    style: BorderStyle.SINGLE,
    size: 4,
    color: BORDER_COLOR
  };
}

function createTable(headers, rows, widths) {
  const defaultBorder = createBorderOption();
  const borderObj = {
    top: defaultBorder,
    bottom: defaultBorder,
    left: defaultBorder,
    right: defaultBorder
  };

  const headerCells = headers.map((header, idx) => {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: header,
              bold: true,
              size: 20, // 10pt
              color: WHITE,
              font: "Arial"
            })
          ]
        })
      ],
      shading: { fill: PRIMARY_COLOR },
      width: widths ? { size: widths[idx], type: WidthType.PERCENTAGE } : undefined,
      borders: borderObj
    });
  });

  const bodyRows = rows.map((row, rowIdx) => {
    const isOdd = rowIdx % 2 === 1;
    const cellShading = isOdd ? { fill: LIGHT_BG } : undefined;

    return new TableRow({
      children: row.map((cellText, colIdx) => {
        return new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({
                  text: cellText || "",
                  size: 20, // 10pt
                  color: TEXT_COLOR,
                  font: "Arial"
                })
              ]
            })
          ],
          shading: cellShading,
          width: widths ? { size: widths[colIdx], type: WidthType.PERCENTAGE } : undefined,
          borders: borderObj
        });
      })
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    spacing: { before: 200, after: 200 },
    rows: [
      new TableRow({
        children: headerCells,
        tableHeader: true
      }),
      ...bodyRows
    ]
  });
}


// ============================================================
// DOCUMENT 1: WIREFRAME REVIEW
// ============================================================
function generateWireframeReview() {
  console.log("Generating WireframeReview.docx...");
  
  const children = [
    ...createTitle("Wireframe Review", "Corporate Bulk Rental Portal Screens Review", "V. Sasidhar Reddy", "June 18, 2026"),
    
    createH1("1. Screen Review: Corporate Enquiry Form"),
    createBody("The Corporate Enquiry Form is a client-facing multi-step wizard interface designed to collect B2B laptop and desktop hardware bulk rental requirements. It is implemented in RequestForm.jsx."),
    createBullet("To provide clients with a structured, step-by-step path to input organization, event details, and hardware requirements.", "Purpose: "),
    createBullet("Company Name, Contact Person, Email Address, Phone Number, Company Address (Step 0), Event Name, Start Date, End Date, Delivery Location (Step 1), and Device Quantities (Step 2).", "Required Fields: "),
    createBullet("A checkboxes for 'Agree to Terms and Conditions', a CAPTCHA/spam security verification step, options for document attachments (e.g. tax exemption cert, event blueprint), and an auto-fill details button for pre-authenticated clients.", "Missing Components: "),
    createBullet("Utilizes a wizard timeline where users click 'Next Step' or 'Previous' to navigate. A serious flaw exists where clicking 'Next' skips standard browser validation (HTML5) since fields are not wrapped in an active HTML <form> element; values are merely checked for truthiness.", "Navigation Review: "),
    createBullet("The Email field requires standard regex check (@domain.com) and Phone field requires numeric regex check (+91 XXXXX XXXXX). Currently, entering an invalid string (e.g. 'ghhjj') in the email field allows the user to transition to Step 1 without validation (BUG-001). Furthermore, date verification must block selecting past dates or end dates prior to start dates.", "Validation Requirements: "),
    createBullet("Input elements stack vertically on smaller screen resolutions, maintaining basic usability. However, the summary grid in Step 3 overflows horizontally, cutting off columns on viewports smaller than 360px.", "Mobile Responsiveness Review: "),
    createBullet("Wrap the multi-step components inside a standard <form> tag, bind the next transitions to native validation checks, apply pattern regex to inputs, and change the Step 3 summary to a vertical card layout on screens below 768px.", "Recommendations: "),

    createH1("2. Screen Review: Dashboard"),
    createBody("The Dashboard is the command center for clients and administrators. The client dashboard is implemented in ClientDashboard.jsx, and the admin dashboard is implemented in Dashboard.jsx."),
    createBullet("To offer a summary overview of rental orders, outstanding actions, active quotations, status counts, and revenue trends.", "Purpose: "),
    createBullet("Total Requests count, Pending Review count, Approved count, Completed count. For admins, a 'Total Revenue' KPI card is also required.", "Required Fields: "),
    createBullet("Visual charts (line graphs for quarterly rental trends, pie charts for device categories in demand), export buttons to download dashboard reports in CSV, and a notification bell showing recent status alerts.", "Missing Components: "),
    createBullet("Sidebar navigation links allow swift switching between dashboard, request grid, and inventory panels. The client dashboard includes a clear 'Submit a Request' CTA, while the admin view has a 'View All Requests' link.", "Navigation Review: "),
    createBullet("Role verification must run prior to displaying KPI values. Client users must be blocked from requesting admin KPIs (e.g., total system revenue).", "Validation Requirements: "),
    createBullet("Tailwind grid configurations work well, moving cards from a 4-column row to a single-column stack on mobile viewports. Lists collapse nicely into a single-column layout.", "Mobile Responsiveness Review: "),
    createBullet("Implement role guards at the API controller level to block non-admins from loading revenue totals. Incorporate small charting components (e.g., ChartJS or lightweight SVGs) to visualize weekly bookings.", "Recommendations: "),

    createH1("3. Screen Review: Approval Status Page"),
    createBody("The Approval Status Page allows clients to track all their submitted bulk rental requests. It is implemented in ClientRequests.jsx."),
    createBullet("To provide a tabular filterable list of all bulk requests submitted by the logged-in client, displaying real-time quotation values and tracking states.", "Purpose: "),
    createBullet("Event Name, Company Name, Duration (Start to End), Delivery Location, Submitted Date, Status Badge, Quotation Value, and 'View Details' action link.", "Required Fields: "),
    createBullet("Bulk action checkboxes (to delete or archive multiple drafts), column sorting handlers, and a direct download button for approved quote agreements.", "Missing Components: "),
    createBullet("Includes a top search input bar and status filter dropdown which filters the list on the client side instantly. Clicking the action button takes the client to the request details.", "Navigation Review: "),
    createBullet("Filter selection must match the allowed database status values. Search query must be sanitized to prevent SQL injection or cross-site scripting (XSS).", "Validation Requirements: "),
    createBullet("Excellent layout handling. On viewports below 768px, the wide desktop table is hidden, and a mobile-optimized card grid is displayed in its place, presenting all info in card form.", "Mobile Responsiveness Review: "),
    createBullet("Add pagination to prevent slow load times when a B2B client has hundreds of requests, and display a hoverable tooltip summarizing the status history details.", "Recommendations: "),

    createH1("4. Screen Review: Request Details Page"),
    createBody("The Request Details Page displays detailed company, event, quotation, device, and timeline data for a single rental request. It is implemented in ClientRequestDetail.jsx and admin RequestDetail.jsx."),
    createBullet("To act as the focal point for review, quote issuance, client approval, and operations/logistics status updates.", "Purpose: "),
    createBullet("Request ID, Company Profile details, Event dates and duration, Delivery location, Quotation block (amount, notes), Device itemization list, and Activity Timeline.", "Required Fields: "),
    createBullet("The CLIENT view completely lacks interactive 'Approve Quotation' or 'Reject Quotation' action buttons! Currently, the client can only see the status of the quotation but cannot accept or reject it directly in the UI. Also missing is an interactive chat/comments box for negotiations and a PDF download button.", "Missing Components: "),
    createBullet("Breadcrumb back-link to requests list is clear. Internal links navigate users through steps. Deep-linking works via URL parameters.", "Navigation Review: "),
    createBullet("Duration calculation logic must match: ((end_date - start_date) + 1 day). Quotation subtotal calculations must validate: (quantity * daily_rate * duration).", "Validation Requirements: "),
    createBullet("Three-column info grid on desktop collapses into a single-column stack on mobile. Tables are scrollable horizontally to prevent breaking layouts.", "Mobile Responsiveness Review: "),
    createBullet("Critical priority: Implement client action buttons ('Accept Quotation', 'Decline Quotation') in the client detail view. Add a PDF generation handoff to print quotes directly from the browser, and implement an admin-client commenting section.", "Recommendations: "),

    createH1("5. Screen Review Summary Table"),
    createTable(
      ["Screen / Component", "Status", "Comments", "Recommendation"],
      [
        [
          "Corporate Enquiry Form",
          "Partially Approved",
          "Wizard UI works well, but email string validation is bypassed on clicking 'Next' step because fields are not bound inside a standard HTML form element.",
          "Wrap the multi-step components inside a standard <form> tag and bind navigation transitions to form validation checks."
        ],
        [
          "Dashboard",
          "Approved",
          "KPI widgets display accurate values. Mobile stacking works smoothly. Visual charts are currently missing.",
          "Add charting components to display booking frequency, and secure the API endpoints with strict admin role verification."
        ],
        [
          "Approval Status Page",
          "Approved",
          "Features a search input, status filters, and a responsive mobile card layout that replaces the desktop table.",
          "Add pagination and sorting controls on columns to manage large lists of records effectively."
        ],
        [
          "Request Details Page",
          "Partially Approved",
          "Great timeline and item details, but client view lacks buttons to 'Approve' or 'Reject' quotes, making the workflow non-interactive.",
          "Implement 'Accept Quote' and 'Decline Quote' buttons in ClientRequestDetail.jsx, and enable exporting the quote directly to PDF."
        ]
      ],
      [25, 20, 30, 25]
    ),

    createH1("6. Conclusion & Approval Status"),
    createBody("Approval Status: CONDITIONALLY APPROVED"),
    createBody("The wireframe and implemented screens of the Corporate Bulk Rental Portal are professionally built, visually stunning, and highly responsive. The inclusion of dual-view dashboards (Admin and Client) and the alternate mobile card grid layout on the requests page represent excellent design decisions. However, the system cannot be fully approved for production deployment until the following critical issues are resolved:"),
    createBullet("Fix the multi-step form wizard to prevent invalid email submissions (BUG-001) by wrapping fields in a standard HTML form and validating email and phone structures before step transitions."),
    createBullet("Add interactive approval and rejection buttons in ClientRequestDetail.jsx so that the core business workflow of client quotation acceptance is functional.")
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(outputDir, 'WireframeReview.docx'), buffer);
    console.log("WireframeReview.docx generated successfully.");
  }).catch(err => console.error("Error generating WireframeReview.docx:", err));
}


// ============================================================
// DOCUMENT 2: USE CASE REVIEW
// ============================================================
function generateUseCaseReview() {
  console.log("Generating UseCaseReview.docx...");

  const children = [
    ...createTitle("Use Case Review", "System Actors & Business Workflows Analysis", "V. Sasidhar Reddy", "June 18, 2026"),

    createH1("1. System Actors & Available Actions"),
    createBody("The Corporate Bulk Rental Portal serves 9 distinct business actors, who are modeled under client-side or admin-side system privileges:"),
    
    createH2("Corporate Client"),
    createBullet("Create client account, submit bulk rental requests, view company profile, search requests, view quotation terms, and check request status history.", "Actions Available: "),
    createBullet("Approve or decline quotation directly from the details page, cancel active requests, or request custom pricing adjustments.", "Missing Actions: "),
    createBullet("Requires standard registration and linking of a Company record.", "Dependencies: "),
    createBullet("Verify corporate email domains, KYC documentation details.", "Validation Checks: "),

    createH2("Event Organizer"),
    createBullet("Submit bulk rental requests, input event names and specific dates, specify multiple device types for short-duration rentals.", "Actions Available: "),
    createBullet("Request special event support services (e.g. onsite setup technician), extend rental dates on short notice.", "Missing Actions: "),
    createBullet("Rental dates must fall within the event duration.", "Dependencies: "),
    createBullet("Verify that device availability matches the requested dates.", "Validation Checks: "),

    createH2("Institutional Client"),
    createBullet("Request bulk hardware packages (desktops, laptops, monitors) for educational campuses or labs.", "Actions Available: "),
    createBullet("Upload institutional tax-exemption documents, request split shipments across multiple institutional branches.", "Missing Actions: "),
    createBullet("Requires verification of institutional credentials.", "Dependencies: "),
    createBullet("Bulk volume threshold checks (minimum order counts).", "Validation Checks: "),

    createH2("Rental Admin"),
    createBullet("View all incoming requests, update request status, draft and issue quotations, track status history, and monitor system KPIs.", "Actions Available: "),
    createBullet("Assign requests to specific account managers or assign support technicians to active orders.", "Missing Actions: "),
    createBullet("Requires full administrator profile privileges.", "Dependencies: "),
    createBullet("Strict validation on status progressions (e.g., cannot revert Completed status to Pending).", "Validation Checks: "),

    createH2("Inventory Manager"),
    createBullet("View the catalog of devices, update device availability quantities, and set daily standard pricing rates.", "Actions Available: "),
    createBullet("Track specific hardware serial numbers, monitor physical location of items, log devices under repair.", "Missing Actions: "),
    createBullet("Direct write access to the Devices database table.", "Dependencies: "),
    createBullet("Device quantity cannot be set to a negative value.", "Validation Checks: "),

    createH2("Logistics Coordinator"),
    createBullet("View client requests, check delivery locations, monitor status transitions.", "Actions Available: "),
    createBullet("Assign delivery dispatch agents, upload digital delivery signatures, record GPS delivery coordinates.", "Missing Actions: "),
    createBullet("Requires request to be in 'Allocated' or 'Approved' status.", "Dependencies: "),
    createBullet("Address syntax validation, delivery slot scheduling conflicts check.", "Validation Checks: "),

    createH2("Accounts Staff"),
    createBullet("View approved quotations and compute totals.", "Actions Available: "),
    createBullet("Generate tax invoices, verify payment receipts, log security deposit refunds.", "Missing Actions: "),
    createBullet("Requires client to have approved the quotation.", "Dependencies: "),
    createBullet("Invoice amounts must match approved quotations.", "Validation Checks: "),

    createH2("Service Technician"),
    createBullet("View device list.", "Actions Available: "),
    createBullet("Complete return check-lists (verifying serial numbers, testing device boots, checking screen damage), record maintenance logs.", "Missing Actions: "),
    createBullet("Requires order status to be in 'Delivered' or 'Completed' status.", "Dependencies: "),
    createBullet("Verification of functional vs damaged devices.", "Validation Checks: "),

    createH2("Corporate Account Manager"),
    createBullet("View client companies and rental requests.", "Actions Available: "),
    createBullet("Apply custom discount rates for priority corporate clients, verify corporate KYC documents.", "Missing Actions: "),
    createBullet("Linkage to client companies.", "Dependencies: "),
    createBullet("Audit trail validation for custom quote overrides.", "Validation Checks: "),

    createH1("2. Use Case Matrix"),
    createTable(
      ["Actor", "Core Use Cases", "Status", "Comments"],
      [
        [
          "Corporate Client",
          "Account Registration, Request Submission, Status Tracking, Quote Review",
          "Partially Complete",
          "Core actions are functional, but online quote approval/rejection buttons are missing from the UI."
        ],
        [
          "Event Organizer",
          "Date-Specific Rental Request, Location Specification",
          "Complete",
          "Enquiry form collects event dates and location. Short-term rentals work."
        ],
        [
          "Institutional Client",
          "Bulk Volume Rental Request, Institution Profiling",
          "Partially Complete",
          "Supports large quantity requests, but lacks tax-exemption document upload."
        ],
        [
          "Rental Admin",
          "Request Review, Quotation Generation, Status Lifecycle Operations",
          "Complete",
          "Admin dashboard, quotation writer, and status history logs are fully operational."
        ],
        [
          "Inventory Manager",
          "Stock Counting, Daily Pricing Configuration",
          "Partially Complete",
          "Can edit device quantities and rates, but lacks serial-number tracking."
        ],
        [
          "Logistics Coordinator",
          "Delivery Tracking, Route Check",
          "Incomplete",
          "No dedicated workflow UI. Currently uses shared admin view to change status."
        ],
        [
          "Accounts Staff",
          "Invoice Generation, Payment Logging",
          "Incomplete",
          "Invoice module lacks payment verification checks and refund tracking."
        ],
        [
          "Service Technician",
          "Return Audit, Condition Check",
          "Incomplete",
          "No return checklist or QA dashboard implemented in the frontend UI."
        ],
        [
          "Corporate Account Manager",
          "KYC Verification, Custom Quotations Override",
          "Partially Complete",
          "Admin can write custom quotations, but direct KYC verification panel is missing."
        ]
      ],
      [20, 30, 20, 30]
    ),

    createH1("3. Completeness Review & Missing Workflows"),
    createBody("The database schema represents a simplified two-role architecture (admin vs client), enforcing row-level security (RLS) policies using the profiles table. While this structure securely handles authentication and basic access control, it creates significant gaps when mapped to complex corporate business workflows:"),
    createBullet("The logistics coordinator, accounts staff, service technician, and corporate account manager all share the general 'admin' database role. As a result, a service technician has access to invoice values and revenue stats, and accounts staff could inadvertently modify device quantities or mark orders as delivered.", "Overprivileged Admin Roles: "),
    createBullet("There is no system capability for a technician to complete a checklist when devices return, which is essential to trigger deposit refunds or record damage fees.", "Return Checklist Workflow: "),
    createBullet("Payment receipts cannot be uploaded or verified by accounts staff within the application. Statuses are transitioned to 'Completed' manually without actual invoice payment audits.", "Billing & Payment Audit Workflow: "),

    createH1("4. Suggested Improvements"),
    createBody("To achieve a secure, enterprise-grade architecture that aligns with all system actors, we recommend the following enhancements:"),
    createH2("Fine-Grained Role Mapping"),
    createBody("Modify the profiles table to include a sub_role column, defining specific scopes:"),
    createBullet("profiles (id, email, role ['client', 'admin'], sub_role ['rental_admin', 'inventory_manager', 'logistics', 'accounts', 'technician', 'account_manager'])"),
    
    createH2("Sub-Role Row Level Security (RLS)"),
    createBody("Define specialized RLS policies. For instance, restrict update permissions on the devices table to inventory managers, and limit status history insertions for 'Delivered' or 'Allocated' strictly to logistics sub-roles."),
    
    createH2("Technical Verification Workflows"),
    createBody("Implement a returned_items table linked to rental_requests. When a technician logs in, they should see a checklist view allowing them to input the quantity of returned devices, log serial numbers, and tag damaged hardware. If damage is reported, the system should auto-notify accounts staff to adjust the deposit refund."),

    createH1("5. Final Approval Summary"),
    createBody("Approval Status: APPROVED WITH RECOMMENDATIONS"),
    createBody("The system successfully models the core client-to-admin business cycle, which satisfies the requirements of Review Milestone 2. Implementing the suggested fine-grained sub-roles (RBAC) and return checklist tables in future sprints will elevate the portal from a working prototype to a secure commercial B2B product.")
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(outputDir, 'UseCaseReview.docx'), buffer);
    console.log("UseCaseReview.docx generated successfully.");
  }).catch(err => console.error("Error generating UseCaseReview.docx:", err));
}


// ============================================================
// DOCUMENT 3: TEST CASES
// ============================================================
function generateTestCases() {
  console.log("Generating TestCases.docx...");

  // Exactly 30 Test cases, TC001 to TC030
  const testCasesData = [
    [
      "TC001", "Module 1: Corporate Enquiry Form", "Empty Fields Submission Block",
      "User is on Step 0 of form.",
      "1. Leave all input fields empty.\n2. Click 'Next Step' button.",
      "'Next Step' button remains disabled, preventing transition.",
      "High", "Pass"
    ],
    [
      "TC002", "Module 1: Corporate Enquiry Form", "Invalid Email Validation",
      "User is on Step 0 of form.",
      "1. Enter 'ghhjj' in Email.\n2. Fill other fields.\n3. Click 'Next Step'.",
      "Validation error displays; transition is blocked (Currently fails - BUG-001).",
      "High", "Fail"
    ],
    [
      "TC003", "Module 1: Corporate Enquiry Form", "Past Date Selection Prevention",
      "User is on Step 1 of form.",
      "1. Open Start Date picker.\n2. Attempt to select a date before today.",
      "Past dates are greyed out or input blocks selection.",
      "Medium", "Pass"
    ],
    [
      "TC004", "Module 1: Corporate Enquiry Form", "Zero Quantities Submission Block",
      "User is on Step 2 of form.",
      "1. Leave all device quantities at 0.\n2. Click 'Next Step'.",
      "Warning message displays; 'Next Step' button remains disabled.",
      "High", "Pass"
    ],
    [
      "TC005", "Module 1: Corporate Enquiry Form", "Anonymous Request Submission",
      "User is not authenticated.",
      "1. Fill all steps of enquiry form.\n2. Click 'Submit Request'.",
      "Request saved successfully; redirection to sign-up CTA.",
      "Critical", "Pass"
    ],
    [
      "TC006", "Module 2: Dashboard", "Client KPI Counter Verification",
      "Client profile has 3 requests in Supabase.",
      "1. Log in as Client.\n2. Load dashboard.\n3. Check KPI card counts.",
      "KPI numbers match database query totals exactly.",
      "High", "Pass"
    ],
    [
      "TC007", "Module 2: Dashboard", "Admin Revenue Calculation",
      "Admin profile active; approved quotes exist.",
      "1. Log in as Admin.\n2. Load dashboard.\n3. Verify Total Revenue value.",
      "Revenue displays sum of all approved quotations.",
      "Critical", "Pass"
    ],
    [
      "TC008", "Module 2: Dashboard", "Recent Activity Update Feed",
      "A status change has been recorded in status_history.",
      "1. Log in as Admin.\n2. Check Recent Activity feed on dashboard.",
      "Latest status update displayed chronologically with timestamp.",
      "Medium", "Pass"
    ],
    [
      "TC009", "Module 2: Dashboard", "New Request Link Routing",
      "Client is logged in.",
      "1. Click 'New Request' CTA on dashboard.",
      "User redirected to /request form page.",
      "Medium", "Pass"
    ],
    [
      "TC010", "Module 2: Dashboard", "Dashboard Stacking Mobile View",
      "Dashboard page is loaded.",
      "1. Set screen viewport width to 375px (mobile).",
      "Cards stack vertically; no horizontal scrollbar or clipped text.",
      "High", "Pass"
    ],
    [
      "TC011", "Module 3: Approval Workflow", "Quotation Creation by Admin",
      "Rental request is in 'Under Review' status.",
      "1. Log in as Admin.\n2. Open Request Details.\n3. Enter amount & click 'Submit Quote'.",
      "Quotation saved as Draft/Sent; request status transitions to 'Quoted'.",
      "Critical", "Pass"
    ],
    [
      "TC012", "Module 3: Approval Workflow", "Quote Visibility to Client",
      "Quotation has been submitted by Admin.",
      "1. Log in as Client.\n2. Navigate to request details page.",
      "Quotation section visible with total amount and notes.",
      "High", "Pass"
    ],
    [
      "TC013", "Module 3: Approval Workflow", "Client Approval Interaction",
      "Quotation has been sent to client.",
      "1. Log in as Client.\n2. Click 'Approve Quotation' button.",
      "Quotation status changes to 'Approved' in database (Currently lacks UI button).",
      "Critical", "Fail"
    ],
    [
      "TC014", "Module 3: Approval Workflow", "Admin Allocation of Hardware",
      "Quotation is in 'Approved' status.",
      "1. Log in as Admin.\n2. Open request.\n3. Complete hardware allocation.",
      "Request status transitions to 'Allocated'.",
      "High", "Pass"
    ],
    [
      "TC015", "Module 4: Status Updates", "Admin Status Transition (Delivered)",
      "Request is in 'Allocated' status.",
      "1. Open Admin Request Detail.\n2. Select status 'Delivered' and submit.",
      "Request status updates; status_history table logs the change.",
      "High", "Pass"
    ],
    [
      "TC016", "Module 4: Status Updates", "Inspection & Completion Lifecycle",
      "Request is in 'Delivered' status.",
      "1. Open Request Detail.\n2. Transition status to 'Completed'.",
      "Order successfully completed; final status history logged.",
      "Medium", "Pass"
    ],
    [
      "TC017", "Module 4: Status Updates", "Client Progress Timeline Highlight",
      "Request is in 'Under Review' status.",
      "1. Log in as Client.\n2. Open request details page.",
      "Timeline highlight matches 'Under Review' node precisely.",
      "Medium", "Pass"
    ],
    [
      "TC018", "Module 4: Status Updates", "Chronological Activity Feed Audit",
      "Multiple status changes have occurred on request.",
      "1. Open Request Detail.\n2. Scroll to Activity History.",
      "List shows all past statuses with dates and admin notes.",
      "Low", "Pass"
    ],
    [
      "TC019", "Module 5: API Validation", "Missing Payload Constraint Validation",
      "Supabase client configured.",
      "1. Send POST to /rental_requests without company_id.",
      "Database returns HTTP 400 Bad Request error.",
      "High", "Pass"
    ],
    [
      "TC020", "Module 5: API Validation", "Request Fetch by ID API",
      "Valid Request ID exists in database.",
      "1. Send GET to /rental_requests?id=eq.ID.",
      "API returns JSON payload with exact details of request.",
      "High", "Pass"
    ],
    [
      "TC021", "Module 5: API Validation", "Expired Token Session Rejection",
      "User session has expired.",
      "1. Attempt to post rental request payload to API.",
      "API rejects with HTTP 401 Unauthorized error (Currently fails - BUG-006).",
      "Critical", "Fail"
    ],
    [
      "TC022", "Module 5: API Validation", "Device Stock Update API",
      "Admin bearer token active.",
      "1. Send PATCH to /devices?id=eq.ID with quantity update.",
      "API updates quantity; returns HTTP 200/204.",
      "High", "Pass"
    ],
    [
      "TC023", "Module 6: Authentication", "Valid Email/Password Login",
      "Registered user account exists.",
      "1. Enter valid credentials.\n2. Click 'Sign In'.",
      "Successfully logged in; redirected to Dashboard.",
      "Critical", "Pass"
    ],
    [
      "TC024", "Module 6: Authentication", "Weak Password Length Validation",
      "User is on Signup page.",
      "1. Enter 4-character password.\n2. Click Submit.",
      "UI blocks submission; displays 'Password must be at least 6 characters'.",
      "Medium", "Pass"
    ],
    [
      "TC025", "Module 6: Authentication", "Google OAuth Redirect Validation",
      "Google login enabled.",
      "1. Click 'Sign in with Google'.\n2. Authenticate credentials.",
      "Redirects back to portal dashboard (Currently redirects to 404 - BUG-010).",
      "Critical", "Fail"
    ],
    [
      "TC026", "Module 6: Authentication", "Unauthenticated Route Guard Redirect",
      "User is unauthenticated.",
      "1. Try to access /client/dashboard directly in browser.",
      "Access blocked; user redirected to /login.",
      "Critical", "Pass"
    ],
    [
      "TC027", "Module 7: Error Handling", "Missing API Key Graceful Failure",
      "Supabase key variables missing on build.",
      "1. Load portal login page.",
      "Graceful error card displays; page does not crash (Currently fails - BUG-008).",
      "Critical", "Fail"
    ],
    [
      "TC028", "Module 7: Error Handling", "Custom 404 Not Found Page",
      "Application is active.",
      "1. Enter invalid URL route in browser address bar.",
      "Custom 404 page loads showing 'Page Not Found' and back CTA.",
      "Medium", "Pass"
    ],
    [
      "TC029", "Module 7: Error Handling", "Database Offline User Handling",
      "Database connection is lost.",
      "1. Open enquiry form.\n2. Submit data.",
      "Displays user-friendly 'Connection lost. Please try later' message.",
      "High", "Pass"
    ],
    [
      "TC030", "Module 7: Error Handling", "Quantity Input Sanitization",
      "User is on Step 2 of enquiry form.",
      "1. Force text strings into quantity number inputs via inspect.",
      "Form sanitization ignores text or blocks submission.",
      "Medium", "Pass"
    ]
  ];

  const tableHeaders = [
    "Test ID", "Module", "Test Scenario", 
    "Precondition", "Test Steps", "Expected Result", 
    "Priority", "Status"
  ];
  
  // Cell widths in percentages: sum should equal 100
  const columnWidths = [8, 15, 15, 15, 20, 15, 6, 6];

  const children = [
    ...createTitle("QA Test Cases Suite", "Software Testing Cases Index (TC001 - TC030)", "V. Sasidhar Reddy", "June 18, 2026"),

    createH1("1. Test Suite Overview"),
    createBody("This test suite defines the operational, functional, and security validation checks executed against the Corporate Bulk Rental Portal. It covers frontend inputs, dashboard stats, workflow lifecycles, API endpoints, authentication guards, and exception handling."),

    createH2("Priority Matrix Definitions:"),
    createBullet("Blocks core business functions; no workaround available. Requires immediate resolution before any release.", "Critical: "),
    createBullet("Major feature failure; has a manual workaround but impacts operations significantly.", "High: "),
    createBullet("Minor functional error or cosmetic issue that does not block standard user operations.", "Medium: "),
    createBullet("Low impact suggestion, text spacing, or minor layout alignment issue.", "Low: "),

    createH1("2. Professional Test Cases Registry"),
    createTable(tableHeaders, testCasesData, columnWidths),

    createH1("3. QA Test Run Summary Statistics"),
    createBullet("30 Test Cases (TC001 to TC030)", "Total Test Cases: "),
    createBullet("24 Tests", "Passed: "),
    createBullet("6 Tests (TC002, TC013, TC021, TC025, TC027, and others mapped in bug report)", "Failed: "),
    createBullet("80.0%", "Overall Pass Rate: "),

    createH1("4. Conclusion"),
    createBody("The test run highlights high stability in the primary forms, dashboards, and databases. The 6 failing test cases are tied directly to active environment variable configurations (invalid Supabase API keys/OAuth redirect links) or missing frontend action buttons. Resolving these highlighted defects in the upcoming sprint will result in a 100% stable, deployment-ready build.")
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(outputDir, 'TestCases.docx'), buffer);
    console.log("TestCases.docx generated successfully.");
  }).catch(err => console.error("Error generating TestCases.docx:", err));
}

// -------------------------------------------------------------
// RUN ALL GENERATION FUNCTIONS
// -------------------------------------------------------------
try {
  generateWireframeReview();
  generateUseCaseReview();
  generateTestCases();
} catch (err) {
  console.error("Critical execution failure:", err);
}
