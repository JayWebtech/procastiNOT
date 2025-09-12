import express from 'express';
import Joi from 'joi';
import emailService from '../services/emailService';
import { query } from '../database/connection';

const router = express.Router();

// Validation schema for notify-acp
const notifyAcpSchema = Joi.object({
  challengeId: Joi.number().integer().min(1).required(),
  proofCid: Joi.string().min(1).required()
});

/**
 * @swagger
 * /notifications/notify-acp:
 *   post:
 *     summary: Notify ACP about proof submission
 *     description: Sends email notification to ACP when proof is submitted to the contract
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               challengeId:
 *                 type: number
 *                 description: Challenge ID from the contract
 *                 example: 123
 *               proofCid:
 *                 type: string
 *                 description: IPFS CID of the submitted proof
 *                 example: "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
 *     responses:
 *       200:
 *         description: ACP notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "ACP notification sent successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/notify-acp', async (req, res) => {
  try {
    const { error, value } = notifyAcpSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { challengeId, proofCid } = value;

    // Get challenge details from database
    const challengeResult = await query(`
      SELECT 
        id,
        task_description,
        accountability_partner_email,
        creator_email,
        stake_amount,
        created_at,
        deadline_at
      FROM challenges 
      WHERE challenge_id = $1
    `, [challengeId]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found in database'
      });
    }

    const challenge = challengeResult.rows[0];
    // Parse the proof CID to get the actual file URL
    // The proofCid might be a metadata hash, so we need to fetch the actual file URL
    let actualFileUrl = `https://gateway.pinata.cloud/ipfs/${proofCid}`;
    
    try {
      // Try to fetch the metadata to get the actual file URL
      const metadataResponse = await fetch(actualFileUrl);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json() as any;
        if (metadata?.fileUrl) {
          actualFileUrl = metadata.fileUrl;
        }
      }
    } catch (error) {
      console.log('Could not fetch metadata, using direct IPFS URL');
    }

    const challengeDetails = {
      id: challengeId,
      task: challenge.task_description,
      acpEmail: challenge.accountability_partner_email,
      creatorEmail: challenge.creator_email,
      stakeAmount: challenge.stake_amount,
      createdAt: challenge.created_at,
      deadlineAt: challenge.deadline_at,
      proofUrl: actualFileUrl
    };

    // Send email notification to ACP
    try {
      await emailService.sendEmail({
        to: challengeDetails.acpEmail,
        subject: `📸 Proof Submitted - Challenge #${challengeId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #a855f7; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0;">Proof Submitted for Review</h1>
            </div>
            
            <p>A challenger has submitted proof for your assigned challenge:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 3px solid #a855f7; margin: 15px 0;">
              <h3 style="margin-top: 0;">Challenge Details</h3>
              <p><strong>Challenge ID:</strong> #${challengeId}</p>
              <p><strong>Task:</strong> ${challengeDetails.task}</p>
              <p><strong>Stake Amount:</strong> ${challengeDetails.stakeAmount} STRK</p>
              <p><strong>Created:</strong> ${new Date(challengeDetails.createdAt).toLocaleDateString()}</p>
              <p><strong>Deadline:</strong> ${new Date(challengeDetails.deadlineAt).toLocaleDateString()}</p>
              <p><strong>Proof Submitted:</strong> <a href="${challengeDetails.proofUrl}" target="_blank">View Proof on IPFS</a></p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Please review the submitted proof and make your decision to approve or reject it. 
              Your decision will determine whether the challenger gets their stake back plus rewards, or loses their stake to you.
            </p>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
              <p>This is an automated message from ProcastiNot</p>
            </div>
          </div>
        `
      });

      // Log the notification
      await query(`
        INSERT INTO email_notifications (challenge_id, recipient_email, notification_type, subject, body, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        challengeId,
        challengeDetails.acpEmail,
        'proof_submission_notification',
        `📸 Proof Submitted - Challenge #${challengeId}`,
        `Proof submitted for challenge ${challengeId}. IPFS CID: ${proofCid}`,
        'sent'
      ]);

      return res.json({
        success: true,
        message: 'ACP notification sent successfully'
      });

    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      
      // Log the failed notification
      await query(`
        INSERT INTO email_notifications (challenge_id, recipient_email, notification_type, subject, body, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        challengeId,
        challengeDetails.acpEmail,
        'proof_submission_notification',
        `📸 Proof Submitted - Challenge #${challengeId}`,
        `Proof submitted for challenge ${challengeId}. IPFS CID: ${proofCid}`,
        'failed'
      ]);

      return res.status(500).json({
        success: false,
        message: 'Failed to send email notification'
      });
    }

  } catch (error) {
    console.error('Error notifying ACP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    });
  }
});

export default router;
