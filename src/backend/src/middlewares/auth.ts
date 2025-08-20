import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authMiddleware';

// Export the authenticate function with the expected name
export const authenticateToken = authenticate; 