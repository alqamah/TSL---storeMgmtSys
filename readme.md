
* [backend rendor.com](https://tsl-storemgmtsys.onrender.com)

* [frontend rendor.com](https://tsl-storemgmtsys-1.onrender.com)

# Project Synopsis
## TSL Store Management System

---

### 1. Overview

The **TSL Store Management System** is a full-stack web application developed to digitize and streamline the inventory and tool-issuing operations of a store department. The system replaces manual, paper-based processes with a centralized, role-controlled digital platform that provides real-time visibility into stock levels, item issuances, and return tracking.

The application is deployed as a live cloud service and is accessible via web browser by authorized personnel from any location.

> **Live Deployments**
> - **Backend API:** https://tsl-storemgmtsys.onrender.com
> - **Frontend Application:** https://tsl-storemgmtsys-1.onrender.com

---

### 2. Problem Statement

Store operations in industrial environments often depend on manual registers and spreadsheets to track the issuance of tools, equipment, and materials to employees. This approach is prone to:

- Loss or damage of physical records
- Inability to query real-time stock levels
- Difficulty in auditing who holds which items, and for how long
- No enforcement of return workflows or accountability

The TSL Store Management System addresses all of these problems through a structured, database-backed application with user authentication and enforced business rules.

---

### 3. Core Modules

The application is organized into two primary functional modules:

#### 3.1 Inventory Management (Items)
This module maintains the master catalogue of all store items. Each item is a rich record that captures not only stock quantity but also traceability and compliance metadata:

| Field | Purpose |
|---|---|
| `title` | Descriptive name of the item |
| `sap_id` | Unique SAP system identifier (sparse, optional) |
| `part_no` | Auto-generated part number formula reference |
| `quantity` | Current available stock (enforced ≥ 0) |
| `category` | Classification group |
| `location` | Physical store location/bin |
| `capacity` | Rated capacity (for equipment/tools) |
| `make` | Manufacturer |
| `certificate_no` | Compliance/calibration certificate reference |
| `prev_due_date` / `next_due_date` | Calibration or inspection due dates (validated ordering) |
| `owner` | Department or person responsible |
| `umc` | Unit of measurement code |
| `remarks` | Free-text notes |

**Key capabilities:**
- Full-text search across `title` and `location` fields (MongoDB text index)
- Bulk import via Excel spreadsheet upload (SAP-ID-based upsert logic)
- Inline editing with live quantity tracking

#### 3.2 Issue Management (Issues)
This module handles the complete lifecycle of issuing items to employees and recording their return.

| Field | Purpose |
|---|---|
| `items[]` | Array of issued items with quantities and returned quantities |
| `employee_p_no` | 6-character alphanumeric employee personnel number |
| `employee_name` | Employee full name |
| `employee_phone` | 10-digit contact number |
| `vendor_supervisor_name` | Vendor/contractor supervisor (if applicable) |
| `vendor_supervisor_gatepass_no` | Gate pass reference |
| `job_location` | Site or location where items are deployed |
| `issue_date` | Date of issuance |
| `expected_return_date` | Planned return date (validated ≥ issue date) |
| `return_date` | Actual return date (auto-set when fully returned) |
| `issuer_p_no` | Personnel number of the staff member who issued the items |
| `is_permanent` | Flag for permanently assigned items |

**Key capabilities:**
- Stock-level validation before an issue is confirmed (prevents over-issuance)
- Atomic stock decrement on issue creation
- Partial return workflow (item-by-item, quantity-by-quantity)
- Full return in a single action
- Automatic `return_date` stamping when all quantities are returned
- Stock restoration on deletion of an issue record
- Filtering by status: **Active**, **Returned**, or **Permanent**
- `is_fully_returned` computed virtual field for UI logic

---

### 4. Technical Architecture

The system follows a classic **three-tier client-server architecture**:

```
┌─────────────────────────────┐
│        React Frontend        │  (Vite + React 19 + React Router 7)
│   ItemsPage | IssuesPage    │
│   LoginPage | RegisterPage  │
└────────────┬────────────────┘
             │  HTTP/REST (Axios)
┌────────────▼────────────────┐
│      Express.js Backend      │  (Node.js + Express 4)
│  /api/auth | /api/items     │
│  /api/issues | /api/health  │
└────────────┬────────────────┘
             │  Mongoose ODM
┌────────────▼────────────────┐
│          MongoDB             │  (Hosted via Render / Local)
│  Items | Issues | Users     │
└─────────────────────────────┘
```

---

### 5. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | React | 19.x |
| **Frontend Build Tool** | Vite | 8.x |
| **Client-Side Routing** | React Router DOM | 7.x |
| **HTTP Client** | Axios | 1.x |
| **Icon Library** | React Icons | 5.x |
| **Excel Processing** | SheetJS (xlsx) | 0.18.x |
| **Backend Framework** | Express.js | 4.x |
| **Runtime** | Node.js | — |
| **Database** | MongoDB | — |
| **ODM** | Mongoose | 8.x |
| **Authentication** | JSON Web Tokens (JWT) | 9.x |
| **Password Hashing** | bcryptjs | 3.x |
| **Environment Config** | dotenv | 16.x |
| **Hosting Platform** | Render.com | — |

---

### 6. Security Design

Authentication and authorization are implemented through a **JWT-based middleware** system:

- **User Registration:** Personnel register with their P.No, name, and password. Passwords are hashed using `bcryptjs` before storage — plain-text passwords are never persisted.
- **User Login:** On successful credential validation, a signed JWT is returned to the client.
- **Role-Based Access:**
  - **`issuer`** — default role; can create and manage issue records.
  - **`admin`** — elevated role with full access.
- **Route Guards:**
  - `requireAuth` middleware — blocks unauthenticated requests to all write operations (POST, PUT, DELETE).
  - `optionalAuth` middleware — permits read-only (GET) access by unauthenticated guests while still enriching the request with user context when a token is present.
- **Frontend Auth Context:** A React `AuthContext` manages the client-side session state, protecting routes from unauthorized access.

---

### 7. Frontend Structure

```
src/
├── App.jsx                  # Root router and provider composition
├── api.js                   # Centralized Axios instance
├── main.jsx                 # Application entry point
├── index.css                # Global design system (CSS variables, layout)
├── context/
│   ├── AuthContext.jsx      # Session & token management
│   ├── ThemeContext.jsx     # Light/dark theme toggle
│   └── ToastContext.jsx     # Global notification system
├── components/
│   └── Layout.jsx           # Persistent sidebar + page shell
└── pages/
    ├── LoginPage.jsx        # Authentication form
    ├── RegisterPage.jsx     # Registration form
    ├── ItemsPage.jsx        # Full inventory CRUD + bulk import
    └── IssuesPage.jsx       # Issue creation, tracking & return workflow
```

The UI uses **Vanilla CSS** with a centralized design token system (CSS custom properties) covering color, spacing, typography, and theming. A `ThemeContext` enables toggling between light and dark modes at runtime.

---

### 8. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login, receive JWT | No |
| `GET` | `/api/items` | List all items (supports search, location, owner filters) | No |
| `GET` | `/api/items/:id` | Get a single item | No |
| `POST` | `/api/items` | Create an item | **Yes** |
| `POST` | `/api/items/bulk` | Bulk import items from Excel data | **Yes** |
| `PUT` | `/api/items/:id` | Update an item | **Yes** |
| `DELETE` | `/api/items/:id` | Delete an item | **Yes** |
| `GET` | `/api/issues` | List all issues (filter by status, item, employee) | No |
| `GET` | `/api/issues/active` | List only active (unreturned) issues | No |
| `GET` | `/api/issues/:id` | Get a single issue | No |
| `POST` | `/api/issues` | Create an issue (deducts stock) | **Yes** |
| `PUT` | `/api/issues/:id/return` | Record partial or full return | **Yes** |
| `DELETE` | `/api/issues/:id` | Delete an issue (restores stock) | **Yes** |
| `GET` | `/api/health` | Server health check | No |

---

### 9. Key Business Rules & Data Integrity

The system enforces the following rules at both the database (Mongoose) and application (controller) layers:

1. **Non-negative stock** — Item quantities are validated with `min: 0`.
2. **Stock gate on issue** — An issue cannot be created if requested quantity exceeds available stock.
3. **Date ordering** — `next_due_date` must not precede `prev_due_date`; `return_date` must not precede `issue_date`.
4. **Atomic validation before stock change** — The issue document is validated *before* any stock is decremented, preventing partial corruption.
5. **Stock restoration on delete** — Deleting an issue restores only the quantity that has not yet been returned.
6. **SAP ID uniqueness** — The `sap_id` field uses a sparse unique index, allowing multiple items with no SAP ID while enforcing uniqueness among those that have one.
7. **Personnel number format** — Both `employee_p_no` and `issuer_p_no` are validated as exactly 6 alphanumeric characters.
8. **Bulk import upsert** — During bulk Excel import, rows with a known `sap_id` are updated (not duplicated); rows without are always inserted.

---

### 10. Conclusion

The TSL Store Management System delivers a complete, production-ready solution for managing store inventory and item issuances. Built on a modern, industry-standard technology stack (React, Node.js, Express, MongoDB), the application provides a secure, role-controlled environment with real-time data and a clean user interface accessible from any modern web browser. It is currently deployed and operational on the cloud, with both frontend and backend services hosted on Render.com.
