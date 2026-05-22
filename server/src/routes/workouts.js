import { Router } from 'express';
import { getWorkouts, createWorkout, deleteWorkout, getStats } from '../controllers/workouts.js';

const router = Router();

router.get('/stats', getStats);
router.get('/', getWorkouts);
router.post('/', createWorkout);
router.delete('/:id', deleteWorkout);

export default router;
