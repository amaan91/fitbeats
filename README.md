# FitBeats

Log workouts and get Spotify playlists automatically matched to your intensity.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Spotify OAuth 2.0

## Setup

### 1. Spotify Developer App
1. Go to [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Create an app
3. Add `http://localhost:3001/api/spotify/callback` as a Redirect URI

### 2. Database (Supabase)
1. Create a free project at [supabase.com](https://supabase.com)
2. Run `server/src/db/schema.sql` in the Supabase SQL editor

### 3. Backend
```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 4. Frontend
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

## Features
- Spotify OAuth login
- Log workouts (type, duration, intensity, notes)
- Auto-generate Spotify playlists matched to workout type + intensity
- Dashboard with workout history and stats (total workouts, total minutes, weekly count)
