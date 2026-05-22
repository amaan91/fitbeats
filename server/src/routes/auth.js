import { Router } from 'express';
import { signup, getMe, logout } from '../controllers/auth.js';

const router = Router();

router.post('/signup', signup);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
