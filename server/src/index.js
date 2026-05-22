import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import workoutRoutes from './routes/workouts.js';
import authRoutes from './routes/auth.js';
import musicRoutes from './routes/music.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !!process.env.DATABASE_URL,
    sameSite: process.env.DATABASE_URL ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/music', musicRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
