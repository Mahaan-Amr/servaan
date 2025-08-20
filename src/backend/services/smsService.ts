import Kavenegar from 'kavenegar';
import { PrismaClient } from '../../shared/generated/client';
import { config } from '../src/config';

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

      // Log the invitation in database
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

  // Core SMS sending method
  private async sendSMS(params: {
    message: string;
    receptor: string;
    sender: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      kavenegarApi.Send(
        {
          message: params.message,
          sender: params.sender,
          receptor: params.receptor
        },
        (response: any, status: any) => {
          console.log('📱 SMS Response:', response);
          console.log('📱 SMS Status:', status);
          
          if (response && response.return && response.return.status === 200) {
            resolve(response);
          } else {
            reject(new Error(`SMS sending failed: ${JSON.stringify(response)}`));
          }
        }
      );
    });
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
      kavenegarApi.AccountInfo((response: any, status: any) => {
        if (response && response.return && response.return.status === 200) {
          resolve(response);
        } else {
          reject(new Error(`Account info failed: ${JSON.stringify(response)}`));
        }
      });
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

  // Log SMS to database (we'll create the table schema later)
  private async logSMS(logData: {
    phoneNumber: string;
    message: string;
    type: string;
    status: string;
    messageId: string | null;
    metadata: any;
  }): Promise<void> {
    try {
      // For now, just log to console - we'll implement database logging later
      console.log('📝 SMS Log:', {
        timestamp: new Date().toISOString(),
        ...logData
      });
    } catch (error) {
      console.error('❌ Failed to log SMS:', error);
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
}

export const smsService = new SMSService();
export default smsService; 