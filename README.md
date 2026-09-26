# NSRIET Faculty Evaluation Management System

A production-grade, secure, and modern Faculty Evaluation Management System built for **NSR Institute of Engineering & Technology (NSRIET)**.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14/15 (App Router, TypeScript)
- **Styling**: Tailwind CSS & Modern Academic Design System
- **Components**: shadcn/ui design patterns (Cards, Dialogs, Tables, Badges, Slicers)
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) policies
- **Excel Engine**: SheetJS (`xlsx`) for Excel export and prepared historical import
- **Deployment**: Vercel-ready with environment variables configuration

---

## 🔑 User Roles & Credentials

### 1. Faculty Portal (`/login` or `/register`)
- **Login Fields**: `Faculty ID` + `Password`
- **Default Password Format**: `FacultyID@NSRIET`
- **Sample Faculty Accounts**:
  - Faculty ID: `F001` | Password: `F001@NSRIET` (Dr. Ravi Kumar - CSE)
  - Faculty ID: `F002` | Password: `F002@NSRIET` (Dr. S. Ananya - ECE)
  - Faculty ID: `F003` | Password: `F003@NSRIET` (Prof. K. Ramesh - MECH)
  - Faculty ID: `F004` | Password: `F004@NSRIET` (Dr. P. Sneha - CSE)
- **Registration**: If Faculty ID does not exist, faculty can self-register with Name, Designation, Department, Faculty ID, and custom password.

### 2. Administrator Portal (`/admin-login`)
- **Admin ID**: `ADMIN01`
- **Admin Password**: `admin123`
- **Admin Access**: Executive Dashboard, Faculty Management, Month Records, Lock Month.

---

## 📋 Evaluation Workflow (8 Heads)

1. **Head 1: Institutional Leadership & Administrative Performance**
   - Faculty view: **Locked/Read-Only**.
   - Admin assigns marks directly through the Admin Portal.
   - No reference required.
2. **Heads 2 to 8**:
   - **Head 2**: Teaching, Learning & Curriculum Delivery
   - **Head 3**: Research, Publications & Sponsored Projects
   - **Head 4**: Student Feedback & Academic Performance
   - **Head 5**: Departmental Activities & Accreditation Support
   - **Head 6**: FDPs, Workshops & Upskilling
   - **Head 7**: Mentoring, Counseling & Career Guidance
   - **Head 8**: Institutional Governance & Committees
   - Faculty enters marks (0–10) and reference details step-by-step with draft auto-saving.
3. **Faculty Preview & Final Submit**:
   - Shows all 8 heads together.
   - Direct `Edit` buttons for Heads 2–8.
   - Final `Submit` locks active month evaluation.
   - Independent records preserved by `Faculty ID + Year + Month`.

---

## 🛡️ Admin Features (Strictly 4 Navigation Items)

1. **Dashboard (`/admin/dashboard`)**:
   - Summary cards: Total Faculty, Submitted, Pending, Department-wise summary table.
   - Clicking the **Pending** card opens a modal showing `Faculty ID`, `Faculty Name`, and `Department`.
2. **Faculty Management (`/admin/faculty`)**:
   - Tabular view of all faculty: `Faculty ID, Name, Department, Head 1..8, Total Marks, Status`.
   - **Export Excel** button: SheetJS `.xlsx` download with faculty details & marks (references excluded).
3. **Month Records (`/admin/month-records`)**:
   - Slicers: `Year`, `Month`, `Department`, `Faculty Search`.
   - **Faculty → Month History**: Select a faculty to view their months for 2026.
   - **Single-Page Evaluation View**: Shows Heads 1–8 on one page. Admin enters Head 1 marks, submits, and updates DB & tables instantly. Clickable Head 2–8 modal popup for reference inspection.
4. **Lock Month (`/admin/lock-month`)**:
   - Lock/unlock evaluation cycles. Locked months are read-only for faculty.

---

## 🚀 Setup & Supabase Database Migration

### 1. Configure Supabase Environment
Copy `.env.local.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Execute SQL Migrations in Supabase SQL Editor
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create all tables, unique constraints, triggers, views, and RLS security policies.
3. (Optional) Run [`supabase/seed.sql`](supabase/seed.sql) to load initial sample data for faculty and evaluations.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```
