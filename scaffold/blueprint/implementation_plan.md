# Store Management System — Implementation Plan

A system to **issue**, **return**, and **check** items from a store. Authorised users (admin / issuer) issue items to employees, and the system tracks what's out, what's returned, and when calibration/checks are due.

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Backend   | Express.js (Node)   |
| Frontend  | React (Vite)        |
| Database  | MongoDB (Mongoose)  |
| Auth      | JWT + bcrypt        |


## Proposed Changes

### Phase 1: Project Scaffolding & MongoDB Schemas ✅ *complete*

---

#### Backend — Project Setup

##### ✅ `backend/package.json`
Express, Mongoose, cors, dotenv, bcryptjs, jsonwebtoken, nodemon (dev).

##### ✅ `backend/.env`
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<secret>
```

##### ✅ `backend/server.js`
Entry point — connects to MongoDB, registers middleware (cors, json), mounts route files (`/api/auth`, `/api/items`, `/api/issues`), global error handler for validation & duplicate-key errors.

---

#### Backend — Mongoose Schemas

##### ✅ `backend/models/Item.js`

```js
const itemSchema = new Schema({
  sap_id:         { type: String, required: true, unique: true, trim: true },
  title:          { type: String, required: true, trim: true },
  category:       { type: String, trim: true },
  capacity:       { type: Number, required: true, min: 0 },
  quantity:       { type: Number, required: true, min: 0, default: 0 },
  description:    { type: String, trim: true, default: '' },
  certificate_no: { type: String, trim: true, default: '' },
  make:           { type: String, trim: true, default: '' },
  prev_due_date:  { type: Date, default: null },
  next_due_date:  { type: Date, default: null },
  location:       { type: String, trim: true, default: '' },
  owner:          { type: String, trim: true, default: '' },
  umc:            { type: String, trim: true, default: '' },
  remarks:        { type: String, trim: true, default: '' },
}, { timestamps: true });

// Text index for search
itemSchema.index({ title: 'text', sap_id: 'text' });
```

**Key changes from original plan:**
- Added `category` field for item classification.
- Added `quantity` (current stock in store, separate from `capacity` which is total owned).
- All string fields have `trim: true` and sensible defaults.
- Custom validation error messages on required/min fields.
- Text index on `title` + `sap_id` for full-text search.

> [!WARNING]
> Line 47 has a stray `parent` token — this is a **syntax error** that needs to be fixed.

---

##### ✅ `backend/models/User.js` *(replaces old Employee.js)*

```js
const userSchema = new Schema({
  p_no:     { type: String, required: true, unique: true, trim: true,
              match: /^[A-Za-z0-9]{6}$/ },
  name:     { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 4 },
  role:     { type: String, enum: ['admin', 'issuer'], default: 'issuer' },
}, { timestamps: true });

// Pre-save: bcrypt hash password
// Method: comparePassword(candidate)
// Method: toJSON — strips password from output
```

**Key changes from original plan:**
- **Employee model removed.** Users are the staff who operate the system (issuers/admins), not the people receiving items.
- Employee details (name, phone, vendor info, job location) are now captured per-issue as denormalized fields.
- Password hashing with bcrypt (salt rounds = 10).
- Role-based access: `admin` and `issuer`.

---

##### ✅ `backend/models/Issue.js` *(major redesign)*

```js
// Sub-schema for each item in the issue
const issueItemSchema = new Schema({
  item:              { type: ObjectId, ref: 'Item', required: true },
  quantity:          { type: Number, required: true, min: 1 },
  returned_quantity: { type: Number, default: 0, min: 0 },
}, { _id: false });

const issueSchema = new Schema({
  items: {
    type: [issueItemSchema],
    validate: arr => arr.length > 0,   // at least one item required
  },

  // ── Denormalized employee info ──
  employee_p_no:                 { type: String, required: true, match: /^[A-Za-z0-9]{6}$/ },
  employee_name:                 { type: String, required: true },
  employee_phone:                { type: String, required: true, match: /^\d{10}$/ },
  vendor_supervisor_name:        { type: String, default: '' },
  vendor_supervisor_gatepass_no: { type: String, default: '' },
  job_location:                  { type: String, default: '' },

  // ── Dates ──
  issue_date:  { type: Date, required: true, default: Date.now },
  return_date: { type: Date, default: null },   // null = items still out

  // ── Issuer ──
  issuer_p_no: { type: String, required: true, match: /^[A-Za-z0-9]{6}$/ },
}, { timestamps: true });

// Indexes
issueSchema.index({ return_date: 1 });
issueSchema.index({ employee_p_no: 1 });
issueSchema.index({ employee_name: 'text', employee_p_no: 'text', job_location: 'text' });
issueSchema.index({ 'items.item': 1 });

// Virtual
issueSchema.virtual('is_fully_returned').get(function () {
  return this.items.every(i => i.returned_quantity >= i.quantity);
});
```

**Key changes from original plan:**
- **Multi-item support** via `issueItemSchema` sub-documents with per-item `quantity` and `returned_quantity`.
- **No ObjectId refs to Employee** — employee data is denormalized so issues are self-contained (name, phone, vendor supervisor, job location stored directly).
- **Partial returns** supported — return individual item quantities without closing the whole issue.
- **Virtual `is_fully_returned`** — computed from sub-document quantities.
- **Four indexes** for efficient queries: by return status, employee, text search, and by item reference.

---

### Phase 2: REST API Routes & Auth ✅ *complete*

Routes, controllers, and middleware are implemented.

| Method | Endpoint                 | Purpose                             |
|--------|--------------------------|-------------------------------------|
| POST   | `/api/auth/register`     | Register new user (admin/issuer)    |
| POST   | `/api/auth/login`        | Login, receive JWT                  |
| GET    | `/api/items`             | List all items                      |
| POST   | `/api/items`             | Create item                         |
| GET    | `/api/items/:id`         | Get single item                     |
| PUT    | `/api/items/:id`         | Update item                         |
| DELETE | `/api/items/:id`         | Delete item                         |
| GET    | `/api/issues`            | List all issues (with filters)      |
| POST   | `/api/issues`            | Issue items to an employee          |
| PUT    | `/api/issues/:id/return` | Return items (partial or full)      |
| GET    | `/api/issues/active`     | Currently issued items              |

> [!NOTE]
> Employee CRUD endpoints were **removed** — employee data is captured inline during issue creation. User CRUD (for admin management) is handled via auth routes.

---

### Phase 3: React Frontend ← *current phase*

- Vite + React scaffold ✅
- Pages: **Dashboard**, **Items**, **Employees** (display from issues), **Issue/Return**, **Login**
- Auth context with JWT token storage
- Component library with a clean, modern dark UI
- API service layer (`api.js`) for all backend calls

---

### Phase 4: Polish & Features

- Search & filter across items/issues
- Due-date alerts (calibration overdue highlighting)
- Export to Excel
- Responsive design
- Role-based UI (admin vs issuer views)

---

## Open Questions

> [!IMPORTANT]
> 1. **`Item.js` line 47 syntax error** — There is a stray `parent` token on line 47 that will cause a runtime error. Should this be a `parent` field (e.g., referencing a parent item for hierarchical categorisation), or should it simply be removed?
> 2. **Quantity sync** — Should the API automatically decrement `Item.quantity` on issue and increment on return, or is quantity managed manually?

---

## Verification Plan

### Automated Tests
- Schema validation tests (invalid `p_no`, `phone`, duplicate `sap_id`, negative quantities)
- API endpoint tests with Supertest (including auth flow)
- Frontend component tests with React Testing Library

### Manual Verification
- Postman/curl for all CRUD + auth endpoints
- Browser testing of the React UI
- MongoDB Compass to inspect documents & indexes
