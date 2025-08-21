import Kavenegar from 'kavenegar';
import { PrismaClient } from '../../shared/generated/client';
import { config } from '../config';
import axios from 'axios';
import https from 'https';
import { URLSearchParams } from 'url';

const prisma = new PrismaClient();

// Initialize Kavenegar API
const kavenegarApi = Kavenegar.KavenegarApi({
  apikey: config.kavenegar.apiKey
});

export interface SMSTemplate {
  BUSINESS_INVITATION: string;
  VERIFICATION_CODE: string;
  WELCOME_MESSAGE: string;
  PAYMENT_CONFIRMATION: string;
  LOW_STOCK_ALERT: string;
}

export interface InvitationSMSData {
  businessName: string;
  inviterName: string;
  inviteCode: string;
  phoneNumber: string;
  recipientName?: string;
}

export interface InvitationWithLinkSMSData {
  businessName: string;
  inviterName: string;
  invitationLink: string;
  phoneNumber: string;
  recipientName?: string;
  role: string;
}

export interface VerificationSMSData {
  phoneNumber: string;
  code: string;
  purpose: 'registration' | 'login' | 'password_reset';
}

class SMSService {
  private templates: SMSTemplate = {
    BUSINESS_INVITATION: `سلام {recipientName}!
    
شما توسط {inviterName} برای پیوستن به تیم {businessName} دعوت شده‌اید.

🔗 کد دعوت: {inviteCode}
📱 برای پیوستن از کد فوق استفاده کنید.

با تشکر - سرووان`,

    VERIFICATION_CODE: `کد تایید سرووان: {code}
    
این کد برای {purpose} شما می‌باشد.
⏰ این کد تا 5 دقیقه معتبر است.

امنیت حساب شما برای ما مهم است 🔐`,

    WELCOME_MESSAGE: `🎉 خوش آمدید به {businessName}!
    
حساب شما با موفقیت ایجاد شد.
✅ اکنون می‌توانید از تمام امکانات استفاده کنید.

سرووان - مدیریت هوشمند کسب‌وکار`,

    PAYMENT_CONFIRMATION: `💰 پرداخت شما تایید شد
    
مبلغ: {amount} ریال
📄 شماره فاکتور: {invoiceNumber}
📅 تاریخ: {date}

با تشکر از خرید شما - {businessName}`,

    LOW_STOCK_ALERT: `⚠️ هشدار موجودی کم
    
کالای {itemName} در انبار {businessName} کم شده است.
📦 موجودی فعلی: {currentStock}
🔢 حداقل مورد نیاز: {minStock}

لطفاً اقدام لازم را انجام دهید.`
  };

  // Method 1: Direct HTTPS request (most reliable)
  private async sendSMSViaHTTPS(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('📱 Sending SMS via HTTPS...');
      
      const postData = new URLSearchParams({
        receptor: params.receptor,
        sender: params.sender,
        message: params.message
      }).toString();

      const options = {
        hostname: 'api.kavenegar.com',
        port: 443,
        path: `/v1/${config.kavenegar.apiKey}/sms/send.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Servaan-SMS-Service/1.0'
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('✅ HTTPS SMS Response:', response);
            
            if (res.statusCode === 200 && response.return && response.return.status === 200) {
              resolve(response);
            } else {
              reject(new Error(`SMS API Error: ${JSON.stringify(response)}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse SMS response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTPS SMS Error:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTPS request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  // Method 2: Axios with custom configuration
  private async sendSMSViaAxios(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    try {
      console.log('📱 Sending SMS via Axios...');
      
      const response = await axios({
        method: 'POST',
        url: `https://api.kavenegar.com/v1/${config.kavenegar.apiKey}/sms/send.json`,
        data: new URLSearchParams({
          receptor: params.receptor,
          sender: params.sender,
          message: params.message
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Servaan-SMS-Service/1.0'
        },
        timeout: 30000,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      console.log('✅ Axios SMS Response:', response.data);
      
      if (response.status === 200 && response.data.return && response.data.return.status === 200) {
        return response.data;
      } else {
        throw new Error(`SMS API Error: ${JSON.stringify(response.data)}`);
      }

    } catch (error: any) {
      console.error('❌ Axios SMS Error:', error.message);
      throw error;
    }
  }

  // Method 3: Alternative API endpoint
  private async sendSMSViaAlternativeEndpoint(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    try {
      console.log('📱 Sending SMS via Alternative Endpoint...');
      
      const response = await axios({
        method: 'GET',
        url: 'https://api.kavenegar.com/v1/' + config.kavenegar.apiKey + '/sms/send.json',
        params: {
          receptor: params.receptor,
          sender: params.sender,
          message: params.message
        },
        timeout: 30000,
        headers: {
          'User-Agent': 'Servaan-SMS-Service/1.0'
        }
      });

      console.log('✅ Alternative SMS Response:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('❌ Alternative SMS Error:', error.message);
      throw error;
    }
  }

  // Enhanced SMS sending with multiple fallback methods
  private async sendSMS(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    const methods = [
      { name: 'HTTPS', method: this.sendSMSViaHTTPS.bind(this) },
      { name: 'Axios', method: this.sendSMSViaAxios.bind(this) },
      { name: 'Alternative', method: this.sendSMSViaAlternativeEndpoint.bind(this) },
      { name: 'SDK', method: this.sendSMSViaSDK.bind(this) }
    ];

    let lastError: any;

    for (const { name, method } of methods) {
      try {
        console.log(`📱 Trying ${name} method for SMS to ${params.receptor}...`);
        const result = await method(params);
        console.log(`✅ SMS sent successfully via ${name} method`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ ${name} method failed:`, error.message);
        
        // Wait a bit before trying next method
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error(`All SMS methods failed. Last error: ${lastError.message}`);
  }

  // Method 4: Original SDK method (kept as fallback) - Updated to match Kavenegar docs
  private async sendSMSViaSDK(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('📱 Sending SMS via SDK (Kavenegar format)...');
      console.log('📱 Message:', params.message);
      console.log('📱 Receptor:', params.receptor);
      console.log('📱 Sender:', params.sender);
      
      const timeout = setTimeout(() => {
        reject(new Error('SDK SMS request timeout after 30 seconds'));
      }, 30000);

      // Use the exact format from Kavenegar documentation
      kavenegarApi.Send({
        message: params.message,
        sender: params.sender,
        receptor: params.receptor
      }, (response: any, status: any) => {
        clearTimeout(timeout);
        
        console.log('📱 SDK SMS Response:', JSON.stringify(response, null, 2));
        console.log('📱 SDK SMS Status:', status);
        
        // More lenient success condition
        if (status === 200 || status === 1 || (response && response.return)) {
          resolve(response);
        } else {
          console.error('❌ SDK SMS failed with status:', status);
          console.error('❌ SDK SMS response:', response);
          reject(new Error(`SDK SMS sending failed. Status: ${status}, Response: ${JSON.stringify(response)}`));
        }
      });
    });
  }

  // Send business invitation SMS with link
  async sendBusinessInvitationWithLink(data: InvitationWithLinkSMSData): Promise<any> {
    try {
      const roleText = this.getRoleText(data.role);
      const message = `سلام ${data.recipientName || 'کاربر گرامی'}!

شما توسط ${data.inviterName} برای پیوستن به تیم ${data.businessName} به عنوان ${roleText} دعوت شده‌اید.

🔗 برای تکمیل ثبت‌نام روی لینک زیر کلیک کنید:
${data.invitationLink}

⏰ این لینک محدود به زمان است.

با تشکر - سرووان`;

      const result = await this.sendSMS({
        message,
        receptor: data.phoneNumber,
        sender: config.kavenegar.sender
      });

      // Log the invitation in database
      await this.logSMS({
        phoneNumber: data.phoneNumber,
        message,
        type: 'BUSINESS_INVITATION_LINK',
        status: result.status === 200 ? 'SENT' : 'FAILED',
        messageId: result.entries?.[0]?.messageid || null,
        metadata: {
          businessName: data.businessName,
          inviterName: data.inviterName,
          role: data.role,
          invitationLink: data.invitationLink
        }
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send business invitation SMS with link:', error);
      throw error;
    }
  }

  // Send business invitation SMS
  async sendBusinessInvitation(data: InvitationSMSData): Promise<any> {
    try {
      const message = this.templates.BUSINESS_INVITATION
        .replace('{recipientName}', data.recipientName || 'کاربر گرامی')
        .replace('{inviterName}', data.inviterName)
        .replace('{businessName}', data.businessName)
        .replace('{inviteCode}', data.inviteCode);

      const result = await this.sendSMS({
        message,
        receptor: data.phoneNumber,
        sender: config.kavenegar.sender
      });

      // Log the invitation in database (simplified for now)
      await this.logSMS({
        phoneNumber: data.phoneNumber,
        message,
        type: 'BUSINESS_INVITATION',
        status: result.status === 200 ? 'SENT' : 'FAILED',
        messageId: result.entries?.[0]?.messageid || null,
        metadata: {
          businessName: data.businessName,
          inviteCode: data.inviteCode,
          inviterName: data.inviterName
        }
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send business invitation SMS:', error);
      throw error;
    }
  }

  // Send verification code SMS
  async sendVerificationCode(data: VerificationSMSData): Promise<any> {
    try {
      const purposeText = this.getPurposeText(data.purpose);
      const message = this.templates.VERIFICATION_CODE
        .replace('{code}', data.code)
        .replace('{purpose}', purposeText);

      const result = await this.sendSMS({
        message,
        receptor: data.phoneNumber,
        sender: config.kavenegar.sender
      });

      // Log verification SMS
      await this.logSMS({
        phoneNumber: data.phoneNumber,
        message,
        type: 'VERIFICATION_CODE',
        status: result.status === 200 ? 'SENT' : 'FAILED',
        messageId: result.entries?.[0]?.messageid || null,
        metadata: {
          purpose: data.purpose,
          code: data.code
        }
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send verification SMS:', error);
      throw error;
    }
  }

  // Send welcome message
  async sendWelcomeMessage(phoneNumber: string, businessName: string): Promise<any> {
    try {
      const message = this.templates.WELCOME_MESSAGE
        .replace('{businessName}', businessName);

      const result = await this.sendSMS({
        message,
        receptor: phoneNumber,
        sender: config.kavenegar.sender
      });

      await this.logSMS({
        phoneNumber,
        message,
        type: 'WELCOME_MESSAGE',
        status: result.status === 200 ? 'SENT' : 'FAILED',
        messageId: result.entries?.[0]?.messageid || null,
        metadata: { businessName }
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send welcome SMS:', error);
      throw error;
    }
  }

  // Send low stock alert
  async sendLowStockAlert(
    phoneNumber: string, 
    businessName: string, 
    itemName: string, 
    currentStock: number, 
    minStock: number
  ): Promise<any> {
    try {
      const message = this.templates.LOW_STOCK_ALERT
        .replace('{itemName}', itemName)
        .replace('{businessName}', businessName)
        .replace('{currentStock}', currentStock.toString())
        .replace('{minStock}', minStock.toString());

      const result = await this.sendSMS({
        message,
        receptor: phoneNumber,
        sender: config.kavenegar.sender
      });

      await this.logSMS({
        phoneNumber,
        message,
        type: 'LOW_STOCK_ALERT',
        status: result.status === 200 ? 'SENT' : 'FAILED',
        messageId: result.entries?.[0]?.messageid || null,
        metadata: {
          businessName,
          itemName,
          currentStock,
          minStock
        }
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send low stock alert SMS:', error);
      throw error;
    }
  }

  // Check SMS delivery status
  async checkSMSStatus(messageId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      kavenegarApi.Status(
        { messageid: messageId },
        (response: any, status: any) => {
          if (response && response.return && response.return.status === 200) {
            resolve(response);
          } else {
            reject(new Error(`Status check failed: ${JSON.stringify(response)}`));
          }
        }
      );
    });
  }

  // Get account info and credit balance
  async getAccountInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: Kavenegar API request took too long (>8 seconds)'));
      }, 8000);

      try {
        kavenegarApi.AccountInfo(
          {},
          (response: any, status: any) => {
            clearTimeout(timeout);
            
            console.log('🔍 Kavenegar AccountInfo Response:', response);
            console.log('🔍 Kavenegar AccountInfo Status:', status);
            
            // Kavenegar AccountInfo returns different formats
            if (response && (
              (response.return && response.return.status === 200) || // Format 1: {return: {status: 200, entries: [...]}}
              (response.remaincredit !== undefined) || // Format 2: {remaincredit: 40442, expiredate: '1749587400', type: 'Master'}
              (status === 200) // Format 3: status parameter is 200
            )) {
              console.log('✅ Kavenegar AccountInfo successful');
              resolve(response);
            } else {
              console.warn('⚠️ Unexpected Kavenegar AccountInfo format:', response);
              reject(new Error(`Account info failed: ${JSON.stringify(response)}`));
            }
          }
        );
      } catch (error) {
        clearTimeout(timeout);
        console.error('🔥 Kavenegar API Exception:', error);
        reject(new Error(`Kavenegar connection error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  // Validate Iranian phone number
  validateIranianPhoneNumber(phoneNumber: string): { isValid: boolean; formatted: string } {
    // Remove any spaces or special characters
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Iranian mobile patterns
    const patterns = [
      /^(\+98|0098|98)?9\d{9}$/, // +989xxxxxxxxx, 00989xxxxxxxxx, 989xxxxxxxxx, 09xxxxxxxxx
      /^09\d{9}$/                // 09xxxxxxxxx
    ];
    
    let isValid = false;
    let formatted = '';
    
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        isValid = true;
        // Format to Iranian standard: 09xxxxxxxxx
        if (cleaned.startsWith('+98')) {
          formatted = '0' + cleaned.substring(3);
        } else if (cleaned.startsWith('0098')) {
          formatted = '0' + cleaned.substring(4);
        } else if (cleaned.startsWith('98')) {
          formatted = '0' + cleaned.substring(2);
        } else {
          formatted = cleaned;
        }
        break;
      }
    }
    
    return { isValid, formatted };
  }

  // Generate verification code
  generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
  }

  // Generate unique invitation code
  generateInvitationCode(businessName: string): string {
    const prefix = businessName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${randomNum}`;
  }

  // Log SMS to database with full tracking
  private async logSMS(logData: {
    phoneNumber: string;
    message: string;
    type: string;
    status: string;
    messageId: string | null;
    metadata: any;
    tenantId?: string;
    sentBy?: string;
    customerId?: string;
  }): Promise<void> {
    try {
      const { prisma } = await import('./dbService');
      
      // Map SMS type to enum
      const messageTypeMap: { [key: string]: any } = {
        'BUSINESS_INVITATION': 'INVITATION',
        'VERIFICATION_CODE': 'VERIFICATION',
        'WELCOME_MESSAGE': 'WELCOME',
        'LOW_STOCK_ALERT': 'LOW_STOCK_ALERT',
        'BULK': 'BULK',
        'TEST': 'TEST'
      };
      
      // Map status to enum
      const statusMap: { [key: string]: any } = {
        'SENT': 'SENT',
        'FAILED': 'FAILED',
        'PENDING': 'PENDING'
      };
      
      const messageType = messageTypeMap[logData.type] || 'TRANSACTIONAL';
      const smsStatus = statusMap[logData.status] || 'PENDING';
      
      // Save to database
      const smsRecord = await prisma.smsHistory.create({
        data: {
          tenantId: logData.tenantId || '1', // Default tenant for now
          phoneNumber: logData.phoneNumber,
          message: logData.message,
          messageType: messageType,
          messageId: logData.messageId,
          status: smsStatus,
          sentAt: logData.status === 'SENT' ? new Date() : null,
          failedAt: logData.status === 'FAILED' ? new Date() : null,
          sentBy: logData.sentBy,
          customerId: logData.customerId,
          metadata: logData.metadata || {},
          creditUsed: 1, // Default 1 credit per SMS
          costAmount: 10, // Default cost in Toman
        }
      });
      
      console.log('📝 SMS Logged to Database:', {
        id: smsRecord.id,
        phoneNumber: logData.phoneNumber,
        type: messageType,
        status: smsStatus,
        messageId: logData.messageId
      });
      
    } catch (error) {
      console.error('❌ Failed to log SMS to database:', error);
      // Fallback to console logging
      console.log('📝 SMS Log (Fallback):', {
        timestamp: new Date().toISOString(),
        ...logData
      });
    }
  }

  // Helper method to get purpose text in Persian
  private getPurposeText(purpose: string): string {
    const purposes = {
      registration: 'ثبت‌نام',
      login: 'ورود به حساب',
      password_reset: 'بازیابی رمز عبور'
    };
    return purposes[purpose as keyof typeof purposes] || purpose;
  }

  // Helper method to get role text in Persian
  private getRoleText(role: string): string {
    switch (role) {
      case 'ADMIN': return 'مدیر سیستم';
      case 'MANAGER': return 'مدیر';
      case 'STAFF': return 'کارمند';
      default: return 'کارمند';
    }
  }

  // Bulk SMS for multiple recipients
  async sendBulkSMS(recipients: string[], message: string): Promise<any> {
    try {
      const validatedRecipients = recipients
        .map(phone => this.validateIranianPhoneNumber(phone))
        .filter(result => result.isValid)
        .map(result => result.formatted);

      if (validatedRecipients.length === 0) {
        throw new Error('No valid phone numbers provided');
      }

      const receptorString = validatedRecipients.join(',');

      const result = await this.sendSMS({
        message,
        receptor: receptorString,
        sender: config.kavenegar.sender
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to send bulk SMS:', error);
      throw error;
    }
  }

  // Method for testing specific SMS methods (for debugging)
  async testSMSMethod(method: 'https' | 'axios' | 'alternative' | 'sdk', params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    console.log(`🧪 Testing ${method} method specifically...`);
    
    switch (method) {
      case 'https':
        return await this.sendSMSViaHTTPS(params);
      case 'axios':
        return await this.sendSMSViaAxios(params);
      case 'alternative':
        return await this.sendSMSViaAlternativeEndpoint(params);
      case 'sdk':
        return await this.sendSMSViaSDK(params);
      default:
        throw new Error(`Unknown SMS method: ${method}`);
    }
  }
}

export const smsService = new SMSService();
export default smsService; 
