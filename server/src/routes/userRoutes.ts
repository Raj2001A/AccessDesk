import { Router } from 'express';
import { requireRole } from '../middleware/requireRole';
import { Role } from '../models/User';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../controllers/UserController';

const router = Router();

// All /api/users routes require Admin role
router.use(requireRole(Role.Admin));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/reset-password', resetPassword);
router.post('/:id/reset-password', resetPassword);

export default router;
