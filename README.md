# FitBeats

A full-stack workout tracker that recommends Apple Music songs matched to your workout type and intensity.

**Live demo:** https://fitbeats-chi.vercel.app

## Features

- Sign up with just your name and email — no password needed
- Log workouts by type (run, lift, HIIT, cycle, yoga), duration, and intensity
- Get Apple Music song recommendations tuned to your workout energy
- Dashboard with workout history and stats (total workouts, total minutes, avg intensity, this week)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon) in production, SQLite locally |
| Auth | Session-based (express-session) |
| Music | iTunes Search API |
| Deployment | Vercel (frontend), Render (backend) |

## Local Setup

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```
PORT=3001
SESSION_SECRET=any_random_string
```

```bash
npm run dev
```

The server runs on `http://localhost:3001`. SQLite is used automatically when `DATABASE_URL` is not set.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deployment

The app is deployed with:
- **Render** for the backend — set `DATABASE_URL` (Neon PostgreSQL), `SESSION_SECRET`, and `FRONTEND_URL` as environment variables
- **Vercel** for the frontend — set `VITE_API_URL` to your Render backend URL
