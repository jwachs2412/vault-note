# VaultNote - Secure Personal Notes

A full-stack notes application with user authentication. Users register, log in, and manage private notes that only they can access. Built with JWT authentication, bcrypt password hashing and role-based access control.

## Features

- User registration and login with secure password hashing
- JWT token-based authentication
- Private notes - users can only access their own
- Full CRUD operations on notes
- Admin statistics dashboard
- Client-side routing with React Router

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Auth**: bcrypt, JSON Web Tokens
- **Deployment**: Vercel (frontend), Render (backend + database)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+

### Installation

```bash
git clone https://github.com/jwachs2412/vault-note.git
cd vault-note

cd client && npm install && cd ..
cd server && npm install && cd ..

createdb vaultnote
psql vaultnote < server/src/db/schema.sql

# Create server/.env with DATABASE_URL, JWT_SECRET, etc.
```

### Running Locally

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

- Frontend: https://vault-note-pi.vercel.app/
- Backend: https://vault-note-api.onrender.com

## API Endpoints

| Method | Endpoint           | Auth  | Description       |
| ------ | ------------------ | ----- | ----------------- |
| POST   | /api/auth/register | No    | Create account    |
| POST   | /api/auth/login    | No    | Login, get token  |
| GET    | /api/auth/me       | Yes   | Current user info |
| GET    | /api/notes         | Yes   | List user's notes |
| POST   | /api/notes         | Yes   | Create a note     |
| GET    | /api/notes/:id     | Yes   | Get a note        |
| PUT    | /api/notes/:id     | Yes   | Update a note     |
| DELETE | /api/notes/:id     | Yes   | Delete a note     |
| GET    | /api/admin/stats   | Admin | Usage statistics  |
| GET    | /api/health        | No    | Health check      |

## What I Learned

This project demonstrates understanding of:

- Authentication system design
- Security awareness
- Middleware architecture
- Protected API design
- Client-side routing
- Secrets management
