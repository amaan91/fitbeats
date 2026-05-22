import pool from '../db/pool.js';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/spotify/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SCOPES = 'user-read-email playlist-modify-public playlist-modify-private';

// Maps workout type to target BPM range and energy level for Spotify recommendations
const WORKOUT_PARAMS = {
  run:   { min_tempo: 140, max_tempo: 180, target_energy: 0.8, target_valence: 0.7 },
  hiit:  { min_tempo: 150, max_tempo: 200, target_energy: 0.95, target_valence: 0.7 },
  lift:  { min_tempo: 120, max_tempo: 160, target_energy: 0.85, target_valence: 0.5 },
  cycle: { min_tempo: 130, max_tempo: 170, target_energy: 0.85, target_valence: 0.6 },
  yoga:  { min_tempo: 60,  max_tempo: 100, target_energy: 0.3, target_valence: 0.5 },
  other: { min_tempo: 120, max_tempo: 160, target_energy: 0.7, target_valence: 0.6 },
};

async function spotifyFetch(url, options = {}, accessToken) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify API error ${res.status}: ${err}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  return data.access_token;
}

export function login(_req, res) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}

export async function callback(req, res) {
  const { code } = req.query;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const { access_token, refresh_token } = await tokenRes.json();

  const profile = await spotifyFetch('https://api.spotify.com/v1/me', {}, access_token);

  const { rows } = await pool.query(
    `INSERT INTO users (spotify_id, display_name, email, access_token, refresh_token)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (spotify_id) DO UPDATE
       SET display_name = $2, email = $3, access_token = $4, refresh_token = $5
     RETURNING id`,
    [profile.id, profile.display_name, profile.email, access_token, refresh_token]
  );

  req.session.userId = rows[0].id;
  req.session.accessToken = access_token;
  req.session.refreshToken = refresh_token;

  res.redirect(`${FRONTEND_URL}/dashboard`);
}

export async function getMe(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { rows } = await pool.query('SELECT id, display_name, email, spotify_id FROM users WHERE id = $1', [req.session.userId]);
  res.json(rows[0] || null);
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ success: true }));
}

export async function generatePlaylist(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { workoutId, workoutType, durationMinutes, intensity } = req.body;
  let accessToken = req.session.accessToken;

  // Refresh token if needed
  try {
    await spotifyFetch('https://api.spotify.com/v1/me', {}, accessToken);
  } catch {
    accessToken = await refreshAccessToken(req.session.refreshToken);
    req.session.accessToken = accessToken;
  }

  const params = WORKOUT_PARAMS[workoutType] || WORKOUT_PARAMS.other;
  const trackCount = Math.max(5, Math.ceil(durationMinutes / 3.5));

  // Scale energy by intensity (1-10)
  const targetEnergy = Math.min(1, params.target_energy * (0.7 + intensity * 0.03));

  const seedGenres = workoutType === 'yoga' ? 'ambient,chill' : 'hip-hop,pop,electronic';

  const recUrl = new URL('https://api.spotify.com/v1/recommendations');
  recUrl.searchParams.set('limit', String(trackCount));
  recUrl.searchParams.set('seed_genres', seedGenres);
  recUrl.searchParams.set('min_tempo', String(params.min_tempo));
  recUrl.searchParams.set('max_tempo', String(params.max_tempo));
  recUrl.searchParams.set('target_energy', String(targetEnergy.toFixed(2)));
  recUrl.searchParams.set('target_valence', String(params.target_valence));

  const recommendations = await spotifyFetch(recUrl.toString(), {}, accessToken);
  const trackUris = recommendations.tracks.map(t => t.uri);

  const profile = await spotifyFetch('https://api.spotify.com/v1/me', {}, accessToken);

  const workoutLabel = workoutType.charAt(0).toUpperCase() + workoutType.slice(1);
  const playlist = await spotifyFetch(
    `https://api.spotify.com/v1/users/${profile.id}/playlists`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: `FitBeats — ${workoutLabel} ${new Date().toLocaleDateString()}`,
        description: `Auto-generated by FitBeats for your ${durationMinutes}min ${workoutType} workout (intensity ${intensity}/10)`,
        public: false,
      }),
    },
    accessToken
  );

  await spotifyFetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
    { method: 'POST', body: JSON.stringify({ uris: trackUris }) },
    accessToken
  );

  if (workoutId) {
    await pool.query(
      'UPDATE workouts SET playlist_id = $1, playlist_name = $2 WHERE id = $3 AND user_id = $4',
      [playlist.id, playlist.name, workoutId, req.session.userId]
    );
  }

  res.json({ playlistId: playlist.id, playlistUrl: playlist.external_urls.spotify, name: playlist.name });
}
