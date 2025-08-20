import express from 'express';
import { customerRoutes } from './customerRoutes';
import { loyaltyRoutes } from './loyaltyRoutes';
import { visitRoutes } from './visitRoutes';
import { crmRoutes } from './crmRoutes';
import { inventoryRoutes } from './inventoryRoutes';
import reportRoutes from './reportRoutes';
import biRoutes from './biRoutes';
import { authRoutes } from './authRoutes';
import { scannerRoutes } from './scannerRoutes';

const router = express.Router();

// Authentication routes
router.use('/auth', authRoutes);

// CRM routes
router.use('/customers', customerRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/visits', visitRoutes);
router.use('/crm', crmRoutes);

// Business Intelligence routes
router.use('/bi', biRoutes);
router.use('/reports', reportRoutes);

// Inventory routes
router.use('/inventory', inventoryRoutes);

// Scanner routes
router.use('/scanner', scannerRoutes);

export default router;