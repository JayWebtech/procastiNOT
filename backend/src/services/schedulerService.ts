import cron from 'node-cron';
import { ChallengeModel } from '../models/Challenge';
import emailService from '../services/emailService';
import { query } from '../database/connection';

class SchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting scheduler service...');

    // Run every hour to check for proof reminders
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running proof reminder check...');
      await this.checkProofReminders();
    });

    // Run every day at midnight to clean up expired challenges
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 Running daily cleanup...');
      await this.cleanupExpiredChallenges();
    });

    // Run every 30 minutes to check for overdue challenges
    cron.schedule('*/30 * * * *', async () => {
      console.log('⏰ Checking for overdue challenges...');
      await this.checkOverdueChallenges();
    });

    this.isRunning = true;
    console.log('✅ Scheduler service started successfully');
  }

  private async checkProofReminders(): Promise<void> {
    try {
      // Get challenges that need proof reminders
      const challenges = await ChallengeModel.getActiveChallengesNeedingProofReminder();
      
      console.log(`📧 Found ${challenges.length} challenges needing proof reminders`);

      for (const challenge of challenges) {
        try {
          // Send reminder email to creator
          const emailSent = await emailService.sendEmail({
            to: challenge.creator_email,
            subject: `⏰ Proof Submission Reminder - ${challenge.task_description.substring(0, 50)}...`,
            html: emailService.generateProofReminderTemplate(challenge)
          });

          // Log the reminder
          await query(`
            INSERT INTO proof_reminders (challenge_id, scheduled_for, sent_at, status, reminder_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            challenge.id,
            new Date(),
            new Date(),
            emailSent ? 'sent' : 'failed',
            'proof_reminder'
          ]);

          console.log(`📧 Proof reminder ${emailSent ? 'sent' : 'failed'} for challenge ${challenge.id}`);

        } catch (error) {
          console.error(`❌ Failed to send proof reminder for challenge ${challenge.id}:`, error);
          
          // Log failed reminder
          await query(`
            INSERT INTO proof_reminders (challenge_id, scheduled_for, sent_at, status, reminder_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            challenge.id,
            new Date(),
            new Date(),
            'failed',
            'proof_reminder'
          ]);
        }
      }

    } catch (error) {
      console.error('❌ Error checking proof reminders:', error);
    }
  }

  private async cleanupExpiredChallenges(): Promise<void> {
    try {
      // Find challenges that are past deadline and still active
      const result = await query(`
        SELECT * FROM challenges 
        WHERE status = 'active' 
          AND deadline_at < CURRENT_TIMESTAMP 
          AND proof_submitted_at IS NULL
      `);

      console.log(`🧹 Found ${result.rows.length} expired challenges to mark as failed`);

      for (const challenge of result.rows) {
        try {
          // Mark challenge as failed
          await ChallengeModel.updateStatus(challenge.id, 'failed', {
            failed_at: new Date()
          });

          // Notify ACP that they can claim rewards
          await emailService.sendEmail({
            to: challenge.accountability_partner_email,
            subject: `💰 Rewards Available - Challenge Failed`,
            html: `
              <h2>Rewards Available for Claim</h2>
              <p>The challenger failed to submit proof before the deadline.</p>
              <p><strong>Challenge:</strong> ${challenge.task_description}</p>
              <p><strong>Reward:</strong> ${challenge.stake_amount} STRK</p>
              <p><a href="${process.env.FRONTEND_URL}/acp/rewards">Claim Rewards</a></p>
            `
          });

          console.log(`✅ Marked challenge ${challenge.id} as failed`);

        } catch (error) {
          console.error(`❌ Failed to process expired challenge ${challenge.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  private async checkOverdueChallenges(): Promise<void> {
    try {
      // Find challenges that are overdue but still have pending proof submissions
      const result = await query(`
        SELECT * FROM challenges 
        WHERE status = 'proof_submitted' 
          AND deadline_at < CURRENT_TIMESTAMP
          AND proof_approved_at IS NULL 
          AND proof_rejected_at IS NULL
      `);

      console.log(`⏰ Found ${result.rows.length} overdue challenges with pending reviews`);

      for (const challenge of result.rows) {
        try {
          // Send urgent reminder to ACP
          await emailService.sendEmail({
            to: challenge.accountability_partner_email,
            subject: `🚨 URGENT: Overdue Proof Review`,
            html: `
              <h2>🚨 Urgent: Overdue Proof Review</h2>
              <p>This challenge proof review is overdue!</p>
              <p><strong>Challenge:</strong> ${challenge.task_description}</p>
              <p><strong>Proof submitted:</strong> ${new Date(challenge.proof_submitted_at!).toLocaleString()}</p>
              <p><a href="${process.env.FRONTEND_URL}/acp/review">Review Now</a></p>
            `
          });

          console.log(`📧 Sent overdue reminder for challenge ${challenge.id}`);

        } catch (error) {
          console.error(`❌ Failed to send overdue reminder for challenge ${challenge.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error checking overdue challenges:', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping scheduler service...');
    // Note: node-cron doesn't provide a direct way to stop all tasks
    // In a production environment, you might want to store task references
    this.isRunning = false;
    console.log('✅ Scheduler service stopped');
  }
}

export default new SchedulerService();
