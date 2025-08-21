import express from 'express';
import { scannerController } from '../controllers/scannerController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all scanner routes
router.use(authenticate);

/**
 * Scanner History Routes
 */
// Record a scan
router.post('/history', scannerController.recordScan);

// Get scan history
router.get('/history', scannerController.getScanHistory);

// Clear scan history
router.delete('/history', scannerController.clearScanHistory);

/**
 * Product Lookup Routes
 */
// Look up product by barcode/QR code
router.get('/lookup/:code', scannerController.lookupProduct);

// External barcode lookup
router.get('/external-lookup/:barcode', scannerController.externalLookup);

// Search items by partial code or name
router.get('/search', scannerController.searchItems);

/**
 * Statistics Routes
 */
// Get scan statistics
router.get('/statistics', scannerController.getScanStatistics);

/**
 * Item Management Routes
 */
// Create item from scanned barcode
router.post('/create-item', scannerController.createItemFromScan);

// Generate QR code for item
router.post('/generate-qr/:itemId', scannerController.generateItemQR);

/**
 * Utility Routes
 */
// Validate barcode format
router.post('/validate', scannerController.validateBarcode);

// Bulk scan processing
router.post('/bulk-process', scannerController.processBulkScans);

export { router as scannerRoutes }; 
