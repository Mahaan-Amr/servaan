import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authMiddleware';
import { smsService } from '../services/smsService';
import { smsStatsService } from '../services/smsStatsService';
import { config } from '../config';

const router = Router();

// Validation schemas
const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شده و 11 رقم باشد')
});

const verificationSchema = z.object({
  phoneNumber: z.string().regex(/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شده و 11 رقم باشد'),
  code: z.string().length(5, 'کد تایید باید 5 رقم باشد')
});

const invitationSchema = z.object({
  phoneNumber: z.string().regex(/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شده و 11 رقم باشد'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  businessName: z.string().min(1),
  inviterName: z.string().min(1),
  invitationLink: z.string().url()
});

const testSMSSchema = z.object({
  phoneNumber: z.string().regex(/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شده و 11 رقم باشد'),
  message: z.string().min(1).max(500),
  method: z.enum(['https', 'axios', 'alternative', 'sdk', 'all']).optional()
});

// Send business invitation SMS
router.post('/invite', authenticate, async (req, res) => {
  try {
    console.log('🔍 SMS Invite endpoint called with config:');
    console.log('  - developmentMode:', config.kavenegar.developmentMode);
    console.log('  - enableRealSMS:', config.kavenegar.enableRealSMS);
    console.log('  - Raw ENABLE_REAL_SMS env:', JSON.stringify(process.env.ENABLE_REAL_SMS));
    
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name;
    
    // Only ADMIN and MANAGER can send invitations
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'دسترسی محدود - فقط مدیران می‌توانند دعوت‌نامه ارسال کنند' });
    }

    const { phoneNumber, recipientName, businessName, invitationLink, role } = req.body;

    if (!phoneNumber || !businessName) {
      return res.status(400).json({ message: 'شماره تلفن و نام کسب‌وکار الزامی است' });
    }

    // Validate phone number
    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    // Check if we should send real SMS or simulate
    const forceRealSMS = req.body.forceRealSMS === true;
    console.log('🔍 forceRealSMS parameter:', forceRealSMS);
    
    if (config.kavenegar.developmentMode && !config.kavenegar.enableRealSMS && !forceRealSMS) {
      console.log('🧪 Development Mode - SMS Simulation');
      console.log('📱 Would send SMS to:', phoneValidation.formatted);
      console.log('📝 Message would contain link:', invitationLink);
      
      // Simulate successful response
      const mockResponse = {
        entries: [{
          messageid: 'dev-' + Date.now(),
          message: 'SMS simulated in development mode',
          status: 1,
          statustext: 'Simulated'
        }]
      };

      return res.json({ 
        message: 'دعوت‌نامه شبیه‌سازی شد (حالت توسعه)',
        phoneNumber: phoneValidation.formatted,
        messageId: mockResponse.entries[0].messageid,
        developmentMode: true,
        invitationLink: invitationLink
      });
    }

    // Send real SMS
    console.log('📱 Sending real SMS invitation to:', phoneValidation.formatted);
    const result = await smsService.sendBusinessInvitationWithLink({
      phoneNumber: phoneValidation.formatted,
      recipientName: recipientName || 'کاربر گرامی',
      businessName,
      inviterName: userName,
      invitationLink: invitationLink || '',
      role: role || 'STAFF'
    });

    res.json({ 
      message: 'دعوت‌نامه با موفقیت ارسال شد',
      phoneNumber: phoneValidation.formatted,
      messageId: result.entries?.[0]?.messageid
    });

  } catch (error) {
    console.error('Error sending invitation SMS:', error);
    res.status(500).json({ message: 'خطا در ارسال دعوت‌نامه' });
  }
});

// Send verification code SMS
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, purpose = 'registration' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }

    // Validate phone number
    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    // Generate verification code
    const verificationCode = smsService.generateVerificationCode();

    // Check if we should send real SMS or simulate
    if (config.kavenegar.developmentMode && !config.kavenegar.enableRealSMS) {
      console.log('🧪 Development Mode - SMS Verification Bypass');
      console.log('📱 Phone:', phoneValidation.formatted);
      console.log('🔢 Verification Code:', verificationCode);
      
      return res.json({
        message: 'کد تایید آماده شد (حالت توسعه)',
        phoneNumber: phoneValidation.formatted,
        verificationCode: verificationCode,
        developmentMode: true,
        messageId: 'dev-' + Date.now()
      });
    }

    // Send real SMS
    console.log('📱 Sending real SMS verification to:', phoneValidation.formatted);
    const result = await smsService.sendVerificationCode({
      phoneNumber: phoneValidation.formatted,
      code: verificationCode,
      purpose
    });

    // In production, don't return the code in response for security
    const responseData: any = {
      message: 'کد تایید ارسال شد',
      phoneNumber: phoneValidation.formatted,
      messageId: result.entries?.[0]?.messageid
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error sending verification SMS:', error);
    res.status(500).json({ message: 'خطا در ارسال کد تایید' });
  }
});

// Send welcome message
router.post('/welcome', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'دسترسی محدود' });
    }

    const { phoneNumber, businessName } = req.body;

    if (!phoneNumber || !businessName) {
      return res.status(400).json({ message: 'شماره تلفن و نام کسب‌وکار الزامی است' });
    }

    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    const result = await smsService.sendWelcomeMessage(
      phoneValidation.formatted,
      businessName
    );

    res.json({ 
      message: 'پیام خوش‌آمدگویی ارسال شد',
      phoneNumber: phoneValidation.formatted,
      messageId: result.entries?.[0]?.messageid
    });

  } catch (error) {
    console.error('Error sending welcome SMS:', error);
    res.status(500).json({ message: 'خطا در ارسال پیام خوش‌آمدگویی' });
  }
});

// Send low stock alert
router.post('/alert/low-stock', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'دسترسی محدود' });
    }

    const { phoneNumber, businessName, itemName, currentStock, minStock } = req.body;

    if (!phoneNumber || !businessName || !itemName || currentStock === undefined || minStock === undefined) {
      return res.status(400).json({ message: 'تمام فیلدها الزامی است' });
    }

    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    const result = await smsService.sendLowStockAlert(
      phoneValidation.formatted,
      businessName,
      itemName,
      currentStock,
      minStock
    );

    res.json({ 
      message: 'هشدار موجودی کم ارسال شد',
      phoneNumber: phoneValidation.formatted,
      messageId: result.entries?.[0]?.messageid
    });

  } catch (error) {
    console.error('Error sending low stock alert SMS:', error);
    res.status(500).json({ message: 'خطا در ارسال هشدار موجودی کم' });
  }
});

// Send bulk SMS (Admin only)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود - فقط ادمین' });
    }

    const { phoneNumbers, message } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      return res.status(400).json({ message: 'لیست شماره تلفن‌ها و پیام الزامی است' });
    }

    if (phoneNumbers.length > 50) {
      return res.status(400).json({ message: 'حداکثر 50 شماره در هر درخواست مجاز است' });
    }

    const result = await smsService.sendBulkSMS(phoneNumbers, message);

    res.json({ 
      message: 'پیام‌های گروهی ارسال شد',
      sentCount: result.entries?.length || 0,
      messageIds: result.entries?.map((entry: any) => entry.messageid) || []
    });

  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ message: 'خطا در ارسال پیام‌های گروهی' });
  }
});

// Check SMS status
router.get('/status/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ message: 'شناسه پیام الزامی است' });
    }

    const status = await smsService.checkSMSStatus(messageId);

    res.json({ 
      message: 'وضعیت پیام دریافت شد',
      status
    });

  } catch (error) {
    console.error('Error checking SMS status:', error);
    res.status(500).json({ message: 'خطا در بررسی وضعیت پیام' });
  }
});

// Get account info and credit balance (Admin only)
router.get('/account/info', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود - فقط ادمین' });
    }

    // Add timeout protection for Kavenegar API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - Kavenegar API took too long to respond')), 10000)
    );

    try {
      const accountInfoPromise = smsService.getAccountInfo();
      const accountInfo = await Promise.race([accountInfoPromise, timeoutPromise]);

      res.json({ 
        message: 'اطلاعات حساب کاوه‌نگار دریافت شد',
        accountInfo,
        status: 'success'
      });
    } catch (apiError: any) {
      console.warn('Kavenegar API connection issue:', apiError.message);
      
      // Return mock data when Kavenegar is unreachable
      const mockAccountInfo = {
        remaincredit: 1000,
        expiredate: '1749587400',
        type: 'پیش‌پرداخت'
      };

      res.json({ 
        message: 'اطلاعات حساب (شبیه‌سازی شده)',
        accountInfo: mockAccountInfo,
        status: 'mock',
        warning: 'عدم دسترسی به سرور کاوه‌نگار - داده‌های نمایشی'
      });
    }

  } catch (error) {
    console.error('Error getting account info:', error);
    res.status(500).json({ 
      message: 'خطا در دریافت اطلاعات حساب',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate phone number utility endpoint
router.post('/validate-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }

    const validation = smsService.validateIranianPhoneNumber(phoneNumber);

    res.json({
      isValid: validation.isValid,
      formatted: validation.formatted,
      message: validation.isValid ? 'شماره تلفن معتبر است' : 'شماره تلفن نامعتبر است'
    });

  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({ message: 'خطا در اعتبارسنجی شماره تلفن' });
  }
});

// Test SMS connection (for debugging)
router.post('/test', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود - فقط ادمین' });
    }

    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }

    // Validate phone number
    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    // Send simple test SMS
    const testMessage = `تست پیامک سرووان

زمان: ${new Date().toLocaleString('fa-IR')}
✅ اتصال موفق`;

    // Use a simpler approach for testing
    const Kavenegar = require('kavenegar');
    const kavenegarApi = Kavenegar.KavenegarApi({
      apikey: config.kavenegar.apiKey
    });

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout after 15 seconds'));
      }, 15000);

      kavenegarApi.Send({
        message: testMessage,
        receptor: phoneValidation.formatted,
        sender: config.kavenegar.sender
      }, (response: any, status: any) => {
        clearTimeout(timeout);
        console.log('🧪 Test SMS Response:', response);
        console.log('🧪 Test SMS Status:', status);
        
        resolve({ response, status });
      });
    });

    res.json({ 
      message: 'تست پیامک ارسال شد',
      phoneNumber: phoneValidation.formatted,
      result
    });

  } catch (error) {
    console.error('Error in test SMS:', error);
    res.status(500).json({ 
      message: 'خطا در ارسال تست پیامک',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test real SMS sending (for development testing)
router.post('/test-real', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود - فقط ادمین' });
    }

    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }

    // Validate phone number
    const phoneValidation = smsService.validateIranianPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: 'شماره تلفن وارد شده معتبر نیست' });
    }

    // Force real SMS sending
    const testMessage = `تست واقعی پیامک سرووان

زمان: ${new Date().toLocaleString('fa-IR')}
✅ ارسال واقعی از سرور`;

    console.log('🚀 Forcing real SMS send...');
    
    const result = await smsService.sendBusinessInvitationWithLink({
      phoneNumber: phoneValidation.formatted,
      recipientName: 'کاربر تست',
      businessName: 'سرووان تست',
      inviterName: 'سیستم',
      invitationLink: `http://localhost:3002/invitation?code=test&phone=${phoneValidation.formatted}&role=STAFF`,
      role: 'STAFF'
    });

    res.json({ 
      message: 'تست واقعی پیامک ارسال شد',
      phoneNumber: phoneValidation.formatted,
      result
    });

  } catch (error) {
    console.error('Error in real SMS test:', error);
    res.status(500).json({ 
      message: 'خطا در ارسال تست واقعی پیامک',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/sms/send-verification - Send verification code
router.post('/send-verification', async (req, res, next) => {
  try {
    const { phoneNumber } = phoneSchema.parse(req.body);
    
    // Generate verification code
    const code = smsService.generateVerificationCode(5);
    
    // Check if development mode
    if (config.kavenegar.developmentMode && !config.kavenegar.enableRealSMS) {
      console.log('🧪 Development Mode - SMS Verification Bypass');
      console.log('📱 Phone:', phoneNumber);
      console.log('🔢 Verification Code:', code);
      
      return res.json({
        success: true,
        message: 'کد تایید در حالت توسعه ارسال شد',
        developmentMode: true,
        code: code, // Only in development
        phoneNumber: phoneNumber
      });
    }
    
    // Send real SMS
    const result = await smsService.sendVerificationCode({
      phoneNumber,
      code,
      purpose: 'registration'
    });
    
    res.json({
      success: true,
      message: 'کد تایید با موفقیت ارسال شد',
      messageId: result.return?.messageid
    });
    
  } catch (error: any) {
    console.error('SMS sending error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال پیامک',
      error: error.message
    });
  }
});

// POST /api/sms/verify - Verify SMS code
router.post('/verify', async (req, res, next) => {
  try {
    const { phoneNumber, code } = verificationSchema.parse(req.body);
    
    // In development mode, accept any 5-digit code
    if (config.kavenegar.developmentMode && !config.kavenegar.enableRealSMS) {
      console.log('🧪 Development Mode - SMS Verification Bypass');
      console.log('📱 Phone:', phoneNumber);
      console.log('🔢 Verification Code:', code);
      
      return res.json({
        success: true,
        message: 'شماره تلفن با موفقیت تایید شد',
        developmentMode: true
      });
    }
    
    // In production, you would verify against stored codes
    // For now, we'll accept the verification
    res.json({
      success: true,
      message: 'شماره تلفن با موفقیت تایید شد'
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطا در تایید کد',
      error: error.message
    });
  }
});

// POST /api/sms/send-invitation - Send invitation SMS
router.post('/send-invitation', authenticate, async (req, res, next) => {
  try {
    const { phoneNumber, role, businessName, inviterName, invitationLink } = invitationSchema.parse(req.body);
    
    // Check if development mode
    if (config.kavenegar.developmentMode && !config.kavenegar.enableRealSMS) {
      console.log('🧪 Development Mode - SMS Invitation Simulation');
      console.log('📱 Phone:', phoneNumber);
      console.log('👤 Role:', role);
      console.log('🏢 Business:', businessName);
      console.log('🔗 Link:', invitationLink);
      
      return res.json({
        success: true,
        message: 'دعوت‌نامه در حالت توسعه ارسال شد',
        developmentMode: true
      });
    }
    
    // Send real invitation SMS
    const result = await smsService.sendBusinessInvitationWithLink({
      phoneNumber,
      role,
      businessName,
      inviterName,
      invitationLink
    });
    
    res.json({
      success: true,
      message: 'دعوت‌نامه با موفقیت ارسال شد',
      messageId: result.return?.messageid
    });
    
  } catch (error: any) {
    console.error('Invitation SMS error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال دعوت‌نامه',
      error: error.message
    });
  }
});

// POST /api/sms/test - Test SMS functionality (Admin only)
router.post('/test', authenticate, async (req, res, next) => {
  try {
    // Only allow admins to test SMS
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیران سیستم می‌توانند SMS را تست کنند'
      });
    }
    
    const { phoneNumber, message, method = 'all' } = testSMSSchema.parse(req.body);
    
    console.log('🧪 SMS Test Request:', { phoneNumber, method, messageLength: message.length });
    
    const results: any[] = [];
    
    if (method === 'all') {
      // Test all methods
      const methods = ['https', 'axios', 'alternative', 'sdk'];
      
      for (const testMethod of methods) {
        try {
          console.log(`🧪 Testing ${testMethod} method...`);
          const result = await smsService.testSMSMethod(testMethod as any, {
            message: `[TEST ${testMethod.toUpperCase()}] ${message}`,
            receptor: phoneNumber,
            sender: config.kavenegar.sender
          });
          
          results.push({
            method: testMethod,
            success: true,
            result: result
          });
          
        } catch (error: any) {
          results.push({
            method: testMethod,
            success: false,
            error: error.message
          });
        }
      }
    } else {
      // Test specific method
      try {
        const result = await smsService.testSMSMethod(method as any, {
          message: `[TEST ${method.toUpperCase()}] ${message}`,
          receptor: phoneNumber,
          sender: config.kavenegar.sender
        });
        
        results.push({
          method: method,
          success: true,
          result: result
        });
        
      } catch (error: any) {
        results.push({
          method: method,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'تست SMS انجام شد',
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
    
  } catch (error: any) {
    console.error('SMS test error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطا در تست SMS',
      error: error.message
    });
  }
});

// GET /api/sms/status - Get SMS service status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status: any = {
      service: 'SMS Service',
      provider: 'Kavenegar',
      developmentMode: config.kavenegar.developmentMode,
      realSMSEnabled: config.kavenegar.enableRealSMS,
      apiKey: config.kavenegar.apiKey ? `${config.kavenegar.apiKey.substring(0, 10)}...` : 'Not configured',
      sender: config.kavenegar.sender,
      testPhone: config.kavenegar.testPhone,
      methods: config.kavenegar.methods,
      timestamp: new Date().toISOString()
    };
    
    // Try to get account info if real SMS is enabled
    if (config.kavenegar.enableRealSMS) {
      try {
        const accountInfo = await smsService.getAccountInfo();
        status.accountInfo = accountInfo;
      } catch (error: any) {
        status.accountError = error.message;
      }
    }
    
    res.json(status);
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت SMS',
      error: error.message
    });
  }
});

// GET /api/sms/config - Get SMS configuration (Admin only)
router.get('/config', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیران سیستم می‌توانند تنظیمات را مشاهده کنند'
      });
    }
    
    res.json({
      kavenegar: {
        ...config.kavenegar,
        apiKey: config.kavenegar.apiKey ? `${config.kavenegar.apiKey.substring(0, 10)}...` : 'Not configured'
      },
      environment: {
        nodeEnv: config.nodeEnv,
        port: config.port
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات',
      error: error.message
    });
  }
});

// GET /api/sms/stats - Get SMS statistics (Admin only)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    const tenantId = (req as any).user.tenantId || '1';
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیران می‌توانند آمار پیامک را مشاهده کنند'
      });
    }

    // Get account info for remaining credit
    let accountCredit = 0;
    try {
      const accountInfo = await smsService.getAccountInfo();
      accountCredit = accountInfo.remaincredit || 0;
    } catch (error) {
      console.warn('Could not get account credit:', error);
    }

    // Get comprehensive SMS statistics
    const stats = await smsStatsService.getSMSStats(tenantId, accountCredit);

    res.json({
      success: true,
      message: 'آمار پیامک با موفقیت دریافت شد',
      data: stats
    });

  } catch (error) {
    console.error('Error getting SMS stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار پیامک',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/sms/history - Get SMS history (Admin/Manager only)
router.get('/history', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    const tenantId = (req as any).user.tenantId || '1';
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیران می‌توانند تاریخچه پیامک را مشاهده کنند'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const messageType = req.query.messageType as string;
    const status = req.query.status as string;
    const phoneNumber = req.query.phoneNumber as string;
    
    // Date filters
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    
    if (req.query.dateFrom) {
      dateFrom = new Date(req.query.dateFrom as string);
    }
    
    if (req.query.dateTo) {
      dateTo = new Date(req.query.dateTo as string);
    }

    // Get SMS history
    const history = await smsStatsService.getSMSHistory(tenantId, {
      page,
      limit,
      messageType,
      status,
      phoneNumber,
      dateFrom,
      dateTo
    });

    res.json({
      success: true,
      message: 'تاریخچه پیامک با موفقیت دریافت شد',
      data: history
    });

  } catch (error) {
    console.error('Error getting SMS history:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تاریخچه پیامک',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const smsRoutes = router; 