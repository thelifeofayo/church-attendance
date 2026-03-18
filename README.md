# Church Attendance Tracking System

A full-stack web application for tracking church attendance across Wednesday and Sunday services, with role-based access control for Admin, Team Heads, and HODs (Heads of Department).

## Features

- **Dual Service Days**: Track attendance for Wednesday and Sunday services independently
- **Role-Based Access Control**:
  - **Admin/Ministry Team**: Full visibility, manage teams, generate reports
  - **Team Heads**: Manage departments and HODs within their team
  - **HODs**: Manage department members and submit attendance
- **Real-time Dashboards**: Role-specific views with attendance summaries
- **Report Generation**: Export attendance data as PDF or CSV
- **Audit Logging**: Track all changes for accountability

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT with refresh tokens |
| Validation | Zod (shared between frontend/backend) |
| UI | shadcn/ui + Tailwind CSS |
| State Management | TanStack Query + Zustand |

## Project Structure

```
attendance-system/
├── backend/           # Express API server
│   ├── prisma/        # Database schema and migrations
│   └── src/
│       ├── config/    # Environment configuration
│       ├── middleware/# Auth, RBAC, validation
│       ├── modules/   # Feature modules (auth, users, teams, etc.)
│       ├── jobs/      # Scheduled tasks
│       └── utils/     # Helpers (JWT, password, audit)
├── frontend/          # React SPA
│   └── src/
│       ├── components/# UI components and layouts
│       ├── features/  # Feature pages (dashboard, attendance, etc.)
│       ├── lib/       # API client and utilities
│       └── stores/    # Zustand stores
└── shared/            # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd attendance-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and secrets
```

4. Set up the database:
```bash
npm run db:push    # Apply schema
npm run db:seed    # Seed test data
```

5. Start development servers:
```bash
npm run dev        # Starts both backend and frontend
```

### Environment Variables

Create `backend/.env` with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-chars"
PORT=3000
NODE_ENV=development
```

## Default Test Accounts

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@church.org | Admin123! |
| Team Head (Music) | music.head@church.org | TeamHead123! |
| Team Head (Media) | media.head@church.org | TeamHead123! |
| HOD (Choir) | choir.hod@church.org | HOD123! |
| HOD (Instrumentalists) | instruments.hod@church.org | HOD123! |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Teams (Admin only)
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `PATCH /api/teams/:id` - Update team

### Departments (Admin, Team Head)
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `PATCH /api/departments/:id/assign-hod` - Assign HOD

### Members (HOD only)
- `GET /api/members` - List department members
- `POST /api/members` - Add member
- `PATCH /api/members/:id` - Update member
- `DELETE /api/members/:id` - Deactivate member

### Attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/:id` - Get attendance details
- `POST /api/attendance/:id/submit` - Submit attendance
- `PATCH /api/attendance/:id` - Update attendance

### Dashboard
- `GET /api/dashboard/hod` - HOD dashboard
- `GET /api/dashboard/team-head` - Team Head dashboard
- `GET /api/dashboard/admin` - Admin dashboard

### Reports (Admin only)
- `GET /api/reports/weekly` - Weekly summary
- `GET /api/reports/export` - Export PDF/CSV

## Scripts

```bash
npm run dev          # Start both servers in development
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio
```

## Architecture Decisions

1. **Monorepo with npm workspaces**: Shared types between frontend and backend
2. **JWT with refresh tokens**: Secure authentication with token rotation
3. **Role-based middleware**: Server-side permission enforcement
4. **Scheduled jobs**: Automatic attendance record creation on service days
5. **Audit logging**: All mutations tracked for accountability

## License

MIT
