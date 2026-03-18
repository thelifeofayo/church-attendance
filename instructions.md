# Church Attendance System - Setup Instructions

Follow these steps in order to set up and run the application.

---

## Step 1: Prerequisites

Make sure you have the following installed:

- **Node.js 18+**: Check with `node --version`
- **npm 9+**: Check with `npm --version`
- **PostgreSQL 14+**: Check with `psql --version`

---

## Step 2: Install PostgreSQL (if not installed)

### Option A: Using Docker (Recommended)
```bash
docker run --name attendance-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=attendance_db \
  -p 5432:5432 \
  -d postgres:14
```

### Option B: Install PostgreSQL Locally

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

---

## Step 3: Create the Database

If using local PostgreSQL (not Docker), create the database:

```bash
# Switch to postgres user
sudo -u postgres psql

# In the PostgreSQL shell, run:
CREATE DATABASE attendance_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO postgres;
\q
```

---

## Step 4: Configure Environment Variables

The `.env` file has been created at `backend/.env`. Update it if your database credentials are different:

```bash
# Edit the file
nano backend/.env
```

Default contents:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-in-production-min-32-chars"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**Update `DATABASE_URL` if needed:**
- Format: `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`
- Example: `postgresql://myuser:mypassword@localhost:5432/attendance_db`

---

## Step 5: Install Dependencies

```bash
cd "/home/ayobami.ajibade@Interswitchng.com/Repos/Attendance code"
npm install
```

---

## Step 6: Generate Prisma Client

```bash
npm run db:generate -w backend
```

---

## Step 7: Push Database Schema

This creates all the tables in your database:

```bash
npm run db:push
```

---

## Step 8: Seed Test Data

This populates the database with test users, teams, departments, and members:

```bash
npm run db:seed
```

---

## Step 9: Start the Application

```bash
npm run dev
```

This starts both:
- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:5173

---

## Step 10: Login to the Application

Open your browser and go to: **http://localhost:5173**

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@church.org | Admin123! |
| Team Head (Music) | music.head@church.org | TeamHead123! |
| Team Head (Media) | media.head@church.org | TeamHead123! |
| HOD (Choir) | choir.hod@church.org | HOD123! |
| HOD (Instrumentalists) | instruments.hod@church.org | HOD123! |

---

## Troubleshooting

### Error: "Can't reach database server at localhost:5432"

PostgreSQL is not running. Start it:

```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# macOS
brew services start postgresql@14

# Docker
docker start attendance-db
```

### Error: "database attendance_db does not exist"

Create the database:
```bash
sudo -u postgres createdb attendance_db
```

### Error: "password authentication failed"

Update the `DATABASE_URL` in `backend/.env` with correct credentials.

### Error: "EADDRINUSE: address already in use"

Another process is using port 3000 or 5173. Kill it:
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Reset Everything

To start fresh:
```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE attendance_db;"
sudo -u postgres psql -c "CREATE DATABASE attendance_db;"

# Push schema and seed again
npm run db:push
npm run db:seed
```

---

## Quick Start Summary

```bash
# 1. Start PostgreSQL (choose one)
docker run --name attendance-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=attendance_db -p 5432:5432 -d postgres:14
# OR
sudo systemctl start postgresql

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate -w backend

# 4. Create database tables
npm run db:push

# 5. Seed test data
npm run db:seed

# 6. Start the app
npm run dev

# 7. Open browser to http://localhost:5173
# Login with: admin@church.org / Admin123!
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run dev:backend` | Start only backend |
| `npm run dev:frontend` | Start only frontend |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed test data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run build` | Build for production |
