import express from 'express';
import { authenticateAdmin, authorizeAdmin, requireSuperAdmin } from '../middlewares/adminAuth';
import { AdminUserService, AdminUserRole } from '../services/AdminUserService';

const router = express.Router();

// List admin users
router.get('/', authenticateAdmin, authorizeAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role = 'ALL', isActive = 'all' } = req.query as any;
    const params: any = { page: Number(page), limit: Number(limit) };
    if (typeof search === 'string' && search.length > 0) params.search = search;
    if (typeof role === 'string') params.role = role;
    if (typeof isActive === 'string') params.isActive = isActive;
    const data = await AdminUserService.list(params);
    return res.json({ success: true, data });
  } catch (e) {
    console.error('Admin users list error:', e);
    return res.status(500).json({ success: false, message: 'Failed to list users' });
  }
});

// Create admin user
router.post('/', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ success: false, message: 'Missing fields' });
    const created = await AdminUserService.create({ email, password, role });
    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    console.error('Admin user create error:', e);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update role
router.put('/:id/role', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role?: string };
    const allowed = ['SUPER_ADMIN','PLATFORM_ADMIN','SUPPORT','DEVELOPER'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const roleTyped = role as AdminUserRole;
    const updated = await AdminUserService.updateRole(id, roleTyped);
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Admin user update role error:', e);
    return res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// Activate / Deactivate
router.put('/:id/active', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { isActive } = req.body;
    const updated = await AdminUserService.setActive(id, Boolean(isActive));
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Admin user set active error:', e);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Reset password
router.post('/:id/reset-password', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { newPassword } = req.body;
    await AdminUserService.resetPassword(id, newPassword);
    return res.json({ success: true });
  } catch (e) {
    console.error('Admin user reset password error:', e);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;


