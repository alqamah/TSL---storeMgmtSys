# Store Management System — Implementation Plan

A system to **issue**, **return**, and **check** items from a store. Employees can be issued items, and the system tracks what's out, what's returned, and when calibration/checks are due.

## Tech Stack

| Layer    | Technology         |
| -------- | ------------------ |
| Backend  | Express.js (Node)  |
| Frontend | React (Vite)       |
| Database | MongoDB (Mongoose) |

---


#### Backend — Project Setup

##### [NEW] `backend/package.json`
Initialize with Express, Mongoose, cors, dotenv, and dev dependencies (nodemon).

##### [NEW] `backend/.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/storeMgmtSys
```

##### [NEW] `backend/server.js`
Entry point — connect to MongoDB, register middleware (cors, json), mount route files.

---

#### Backend — Mongoose Schemas

##### [NEW] `backend/models/Item.js`

```js
const itemSchema = new Schema({
  sap_id:         { type: String, required: true, unique: true },
  title:          { type: String, required: true },
  capacity:       { type: Number, required: true },
  description:    { type: String },
  certificate_no: { type: String },
  make:           { type: String },
  prev_due_date:  { type: Date },
  next_due_date:  { type: Date },
  location:       { type: String },
  owner:          { type: String },
  umc:            { type: String },
  remarks:        { type: String },
}, { timestamps: true });
```

- `sap_id` is marked **unique** so no duplicates.
- `timestamps: true` adds `createdAt` / `updatedAt` automatically.

##### [NEW] `backend/models/Employee.js`

```js
const employeeSchema = new Schema({
  p_no: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Za-z0-9]{6}$/   // exactly 6 characters
  },
  name:  { type: String, required: true },
  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/            // exactly 10 digits
  },
  vendor_supervisor_name:       { type: String },
  vendor_supervisor_gatepass_no:{ type: String },
  job_location:                 { type: String },
}, { timestamps: true });
```

##### [NEW] `backend/models/Issue.js`

```js
const issueSchema = new Schema({
  item:       { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  employee:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  issue_date: { type: Date, required: true, default: Date.now },
  return_date:{ type: Date, default: null },       // null = still issued
  issuer_p_no:{
    type: String,
    required: true,
    match: /^[A-Za-z0-9]{6}$/
  },
}, { timestamps: true });
```

- `return_date: null` means the item is **currently issued out**.
- Populating `item` and `employee` refs gives full details on query.

---

### Phase 2: REST API Routes (next)

| Method | Endpoint                 | Purpose                          |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/api/items`             | List all items                   |
| POST   | `/api/items`             | Create item                      |
| GET    | `/api/items/:id`         | Get single item                  |
| PUT    | `/api/items/:id`         | Update item                      |
| DELETE | `/api/items/:id`         | Delete item                      |
| GET    | `/api/employees`         | List employees                   |
| POST   | `/api/employees`         | Create employee                  |
| GET    | `/api/employees/:id`     | Get single employee              |
| PUT    | `/api/employees/:id`     | Update employee                  |
| DELETE | `/api/employees/:id`     | Delete employee                  |
| GET    | `/api/issues`            | List all issues (with filters)   |
| POST   | `/api/issues`            | Issue an item to an employee     |
| PUT    | `/api/issues/:id/return` | Return an item (set return_date) |
| GET    | `/api/issues/active`     | Currently issued items           |

---

### Phase 3: React Frontend (after APIs are working)

- Vite + React scaffold
- Pages: **Dashboard**, **Items**, **Employees**, **Issue/Return**
- Component library with a clean, modern dark UI

---

### Phase 4: Polish & Features

- Search & filter across items/employees
- Due-date alerts (calibration overdue highlighting)
- Export to Excel
- Responsive design

---

## Open Questions

> [!IMPORTANT]
> 1. Should one issue record support **multiple items**, or one item per issue?
> 2. On return — update the existing issue record, or create a separate return entry?
> 3. Is **authentication** needed at this stage?
> 4. Is `capacity` the total stock count (many units), or is each Item document a unique physical asset?

---