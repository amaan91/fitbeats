import { Router } from 'express';
import { login, callback, getMe, logout, generatePlaylist } from '../controllers/spotify.js';

const router = Router();

router.get('/login', login);
router.get('/callback', callback);
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/generate-playlist', generatePlaylist);

export default router;
