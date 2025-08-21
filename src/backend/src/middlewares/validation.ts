import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    return res.status(400).json({
      success: false,
      message: 'اطلاعات ارسالی نامعتبر است',
      messageEn: 'Invalid data sent',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  
  next();
}; 
