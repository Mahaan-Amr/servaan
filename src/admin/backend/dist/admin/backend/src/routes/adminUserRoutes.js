"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../middlewares/adminAuth");
const AdminUserService_1 = require("../services/AdminUserService");
const router = express_1.default.Router();
// List admin users
router.get('/', adminAuth_1.authenticateAdmin, (0, adminAuth_1.authorizeAdmin)(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role = 'ALL', isActive = 'all' } = req.query;
        const params = { page: Number(page), limit: Number(limit) };
        if (typeof search === 'string' && search.length > 0)
            params.search = search;
        if (typeof role === 'string')
            params.role = role;
        if (typeof isActive === 'string')
            params.isActive = isActive;
        const data = await AdminUserService_1.AdminUserService.list(params);
        return res.json({ success: true, data });
    }
    catch (e) {
        console.error('Admin users list error:', e);
        return res.status(500).json({ success: false, message: 'Failed to list users' });
    }
});
// Create admin user
router.post('/', adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role)
            return res.status(400).json({ success: false, message: 'Missing fields' });
        const created = await AdminUserService_1.AdminUserService.create({ email, password, role });
        return res.status(201).json({ success: true, data: created });
    }
    catch (e) {
        console.error('Admin user create error:', e);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});
// Update role
router.put('/:id/role', adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const allowed = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT', 'DEVELOPER'];
        if (!role || !allowed.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const roleTyped = role;
        const updated = await AdminUserService_1.AdminUserService.updateRole(id, roleTyped);
        return res.json({ success: true, data: updated });
    }
    catch (e) {
        console.error('Admin user update role error:', e);
        return res.status(500).json({ success: false, message: 'Failed to update role' });
    }
});
// Activate / Deactivate
router.put('/:id/active', adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const updated = await AdminUserService_1.AdminUserService.setActive(id, Boolean(isActive));
        return res.json({ success: true, data: updated });
    }
    catch (e) {
        console.error('Admin user set active error:', e);
        return res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});
// Reset password
router.post('/:id/reset-password', adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        await AdminUserService_1.AdminUserService.resetPassword(id, newPassword);
        return res.json({ success: true });
    }
    catch (e) {
        console.error('Admin user reset password error:', e);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});
exports.default = router;
//# sourceMappingURL=adminUserRoutes.js.map