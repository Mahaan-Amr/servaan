import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { LocalFirstSyncService } from '../services/localFirstSyncService';

const router = express.Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/devices/register', async (req, res, next) => {
  try {
    if (!req.user || !req.tenant) {
      return res.status(401).json({ message: 'Authentication and tenant context are required.' });
    }

    const device = await LocalFirstSyncService.registerDevice({
      tenantId: req.tenant.id,
      userId: req.user.id,
      deviceId: req.body.deviceId,
      name: req.body.name || req.body.deviceName || 'Web device',
      platform: req.body.platform || 'web',
      appVersion: req.body.appVersion,
      syncProtocolVersion: req.body.syncProtocolVersion,
      localSchemaVersion: req.body.localSchemaVersion,
      mode: req.body.mode || 'personal'
    });

    res.status(201).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        name: device.name,
        platform: device.platform,
        offlineAuthExpiresAt: device.offlineAuthExpiresAt,
        revoked: Boolean(device.revokedAt)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/push', async (req, res, next) => {
  try {
    if (!req.user || !req.tenant) {
      return res.status(401).json({ message: 'Authentication and tenant context are required.' });
    }

    const result = await LocalFirstSyncService.pushOperations({
      tenantId: req.tenant.id,
      actorUserId: req.user.id,
      deviceId: req.body.deviceId,
      operations: req.body.operations || [],
      protocolVersion: req.body.protocolVersion,
      batchId: req.body.batchId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/pull', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ message: 'Tenant context is required.' });
    }

    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;
    const issues = await LocalFirstSyncService.getSyncIssues(req.tenant.id, deviceId);

    res.json({
      events: [],
      conflicts: issues.conflicts,
      newCursor: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/issues', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ message: 'Tenant context is required.' });
    }

    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;
    const issues = await LocalFirstSyncService.getSyncIssues(req.tenant.id, deviceId);

    res.json({
      success: true,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

export default router;
