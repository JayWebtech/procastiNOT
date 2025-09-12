import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Use Resend if available, otherwise fall back to SMTP
    if (process.env.RESEND_API_KEY) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
      console.log('📧 Using Resend email service');
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
      console.log('📧 Using SMTP email service');
    } else {
      console.warn('⚠️ No email service configured - emails will be skipped');
    }

    // DISABLED: Email verification causing startup timeouts
    // this.verifyConnection().catch(() => {
    //   // Ignore verification errors - don't block startup
    // });
  }

  private async verifyConnection(): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error('Transporter not initialized');
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timeout')), 5000);
      });
      
      await Promise.race([
        this.transporter.verify(),
        timeoutPromise
      ]);
      
      console.log('✅ Email service ready');
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if email service is properly configured
      if (!this.isConfigured() || !this.transporter) {
        console.warn('⚠️ Email service not configured, skipping email send');
        return false;
      }

      const mailOptions = {
        from: process.env.RESEND_API_KEY 
          ? `"${process.env.FROM_NAME || 'ProcastiNot'}" <onboarding@resend.dev>`
          : `"${process.env.FROM_NAME || 'ProcastiNot'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000);
      });

      const emailPromise = this.transporter.sendMail(mailOptions);

      const info = await Promise.race([emailPromise, timeoutPromise]);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  private isConfigured(): boolean {
    if (process.env.RESEND_API_KEY) {
      console.log('📧 Email configured with Resend API');
      return true;
    }
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('📧 Email configured with SMTP');
      return true;
    }
    
    console.log('⚠️ Email not configured - missing required environment variables');
    return false;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Email templates
  generateACPNotificationTemplate(challenge: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Challenge Assignment - ProcastiNot</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #a855f7; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .challenge-details { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 3px solid #a855f7; }
          .button { display: inline-block; background: #a855f7; color: white; padding: 10px 20px; text-decoration: none; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Challenge Assignment</h1>
          <p>You've been selected as an Accountability Partner!</p>
        </div>
        
        <div class="content">
          <h2>Challenge Details</h2>
          
          <div class="challenge-details">
            <h3>Task Description</h3>
            <p>${challenge.task_description}</p>
            
            <h3>Stake Amount</h3>
            <p><strong>${challenge.stake_amount} STRK</strong></p>
            
            <h3>Duration</h3>
            <p>${challenge.duration_minutes} minutes</p>
            
            <h3>Deadline</h3>
            <p>${new Date(challenge.deadline_at).toLocaleDateString()} at ${new Date(challenge.deadline_at).toLocaleTimeString()}</p>
            
            <h3>Challenger</h3>
            <p>${challenge.creator_email}</p>
          </div>
          
          <p><strong>Important:</strong> Wait for the challenger to submit proof before the deadline. Review evidence fairly and objectively.</p>
        
          
          <p>Thank you for being part of the ProcastiNot community!</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from ProcastiNot</p>
        </div>
      </body>
      </html>
    `;
  }

  generateProofReminderTemplate(challenge: any): string {
    const hoursRemaining = Math.ceil((new Date(challenge.deadline_at).getTime() - Date.now()) / (1000 * 60 * 60));
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proof Submission Reminder - ProcastiNot</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #a855f7; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .challenge-details { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 3px solid #a855f7; }
          .button { display: inline-block; background: #a855f7; color: white; padding: 10px 20px; text-decoration: none; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .urgent { background: #fef3c7; padding: 15px; border-left: 3px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Proof Submission Reminder</h1>
          <p>Don't forget to submit your proof!</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <h3>Time Running Out!</h3>
            <p><strong>${hoursRemaining} hours remaining</strong> until your challenge deadline.</p>
          </div>
          
          <h2>Challenge Details</h2>
          
          <div class="challenge-details">
            <h3>Your Task</h3>
            <p>${challenge.task_description}</p>
            
            <h3>Your Stake</h3>
            <p><strong>${challenge.stake_amount} STRK</strong></p>
            
            <h3>Deadline</h3>
            <p>${new Date(challenge.deadline_at).toLocaleDateString()} at ${new Date(challenge.deadline_at).toLocaleTimeString()}</p>
          </div>
          
          <p><strong>Remember:</strong> If you fail to submit proof before the deadline, your stake will be transferred to your accountability partner.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from ProcastiNot</p>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
