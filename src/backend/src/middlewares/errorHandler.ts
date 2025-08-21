import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error status and message
  let statusCode = 500;
  let message = 'خطای سرور';
  let stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  // If it's our custom error, use its status code and message
  if ('statusCode' in err) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    stack,
  });
}; 
