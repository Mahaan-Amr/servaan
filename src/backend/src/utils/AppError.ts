export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(
    message: string, 
    statusCode: number, 
    details?: any, 
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
} 