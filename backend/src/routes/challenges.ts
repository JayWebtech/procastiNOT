import express from 'express';
import Joi from 'joi';
import { ChallengeModel, CreateChallengeData } from '../models/Challenge';
import emailService from '../services/emailService';
import { query } from '../database/connection';

const router = express.Router();

// Validation schemas
const createChallengeSchema = Joi.object({
  creator_email: Joi.string().email().required(),
  creator_wallet: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  task_description: Joi.string().min(10).max(1000).required(),
  accountability_partner_email: Joi.string().email().required(),
  accountability_partner_wallet: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  stake_amount: Joi.number().positive().precision(8).required(),
  duration_minutes: Joi.number().integer().min(5).max(129600).required(),
  contract_address: Joi.string().optional(),
  transaction_hash: Joi.string().optional(),
  challenge_id: Joi.number().integer().min(0).optional()
});

const submitProofSchema = Joi.object({
  proof_description: Joi.string().min(10).max(1000).required(),
  evidence_url: Joi.string().uri().required()
});

const reviewProofSchema = Joi.object({
  decision: Joi.string().valid('approve', 'reject').required(),
  comment: Joi.string().min(10).max(500).required()
});

/**
 * @swagger
 * /challenges:
 *   post:
 *     summary: Create a new challenge
 *     description: Creates a new accountability challenge with stake amount and deadline
 *     tags: [Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChallengeRequest'
 *           example:
 *             creator_email: "creator@example.com"
 *             creator_wallet: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *             task_description: "Complete a 30-day fitness challenge with daily workouts"
 *             accountability_partner_email: "partner@example.com"
 *             accountability_partner_wallet: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *             stake_amount: 10.5
 *             duration_minutes: 1440
 *     responses:
 *       201:
 *         description: Challenge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               message: "Challenge created successfully"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 creator_email: "creator@example.com"
 *                 creator_wallet: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *                 task_description: "Complete a 30-day fitness challenge with daily workouts"
 *                 accountability_partner_email: "partner@example.com"
 *                 accountability_partner_wallet: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *                 stake_amount: 10.5
 *                 duration_minutes: 1440
 *                 status: "active"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 deadline_at: "2024-01-16T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error, value } = createChallengeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const challengeData: CreateChallengeData = value;

    // Create challenge in database
    const challenge = await ChallengeModel.create(challengeData);

    // Send email notification to ACP
    try {
      const emailSent = await emailService.sendEmail({
        to: challenge.accountability_partner_email,
        subject: `🎯 New Challenge Assignment - ${challenge.task_description.substring(0, 50)}...`,
        html: emailService.generateACPNotificationTemplate(challenge)
      });

      // Log email notification
      await query(`
        INSERT INTO email_notifications (challenge_id, recipient_email, notification_type, subject, body, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        challenge.id,
        challenge.accountability_partner_email,
        'acp_notification',
        `🎯 New Challenge Assignment - ${challenge.task_description.substring(0, 50)}...`,
        emailService.generateACPNotificationTemplate(challenge),
        emailSent ? 'sent' : 'failed'
      ]);

      // Schedule proof reminder
      const reminderTime = new Date(challenge.deadline_at.getTime() - 24 * 60 * 60 * 1000); // 24 hours before deadline
      await query(`
        INSERT INTO proof_reminders (challenge_id, scheduled_for, reminder_type)
        VALUES ($1, $2, $3)
      `, [challenge.id, reminderTime, 'proof_reminder']);

    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the challenge creation if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    });
  }
});

/**
 * @swagger
 * /challenges/creator/{email}:
 *   get:
 *     summary: Get challenges by creator email
 *     description: Retrieves all challenges created by a specific email address
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address of the challenge creator
 *         example: "creator@example.com"
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   creator_email: "creator@example.com"
 *                   task_description: "Complete a 30-day fitness challenge"
 *                   status: "active"
 *                   created_at: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/creator/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !Joi.string().email().validate(email).error) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    const challenges = await ChallengeModel.findByCreatorEmail(email);
    
    return res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error fetching creator challenges:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /challenges/acp/{email}:
 *   get:
 *     summary: Get challenges for ACP review
 *     description: Retrieves all challenges where the specified email is the accountability partner
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address of the accountability partner
 *         example: "partner@example.com"
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   creator_email: "creator@example.com"
 *                   accountability_partner_email: "partner@example.com"
 *                   task_description: "Complete a 30-day fitness challenge"
 *                   status: "proof_submitted"
 *                   created_at: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/acp/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !Joi.string().email().validate(email).error) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    const challenges = await ChallengeModel.getChallengesForACPReview(email);
    
    return res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error fetching ACP challenges:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /challenges/{id}:
 *   get:
 *     summary: Get challenge by ID
 *     description: Retrieves a specific challenge by its unique identifier
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Challenge ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Challenge retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 creator_email: "creator@example.com"
 *                 task_description: "Complete a 30-day fitness challenge"
 *                 status: "active"
 *                 created_at: "2024-01-15T10:30:00Z"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await ChallengeModel.findById(id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    
    return res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get challenge data formatted for contract deployment
router.get('/:id/contract-data', async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await ChallengeModel.findById(id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    
    const contractData = ChallengeModel.prepareForContract(challenge);
    
    return res.json({
      success: true,
      data: contractData
    });
  } catch (error) {
    console.error('Error fetching contract data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /challenges/{id}/proof:
 *   post:
 *     summary: Submit proof for a challenge
 *     description: Submits proof of challenge completion with evidence
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Challenge ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitProofRequest'
 *           example:
 *             proof_description: "Completed 30 minutes of cardio workout as evidenced by the attached photo"
 *             evidence_url: "https://example.com/proof.jpg"
 *     responses:
 *       200:
 *         description: Proof submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               message: "Proof submitted successfully"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "proof_submitted"
 *                 proof_submitted_at: "2024-01-15T12:00:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = submitProofSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const challenge = await ChallengeModel.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not active'
      });
    }

    if (new Date() > challenge.deadline_at) {
      return res.status(400).json({
        success: false,
        message: 'Challenge deadline has passed'
      });
    }

    const updatedChallenge = await ChallengeModel.updateStatus(id, 'proof_submitted', {
      proof_description: value.proof_description,
      proof_evidence_url: value.evidence_url,
      proof_submitted_at: new Date()
    });

    // Send notification to ACP about proof submission
    try {
      await emailService.sendEmail({
        to: challenge.accountability_partner_email,
        subject: `📸 Proof Submitted - Review Required`,
        html: `
          <h2>Proof Submitted for Review</h2>
          <p>A challenger has submitted proof for your assigned challenge:</p>
          <p><strong>Task:</strong> ${challenge.task_description}</p>
          <p><strong>Proof:</strong> ${value.proof_description}</p>
          <p><a href="${process.env.FRONTEND_URL}/acp/review">Review Now</a></p>
        `
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return res.json({
      success: true,
      message: 'Proof submitted successfully',
      data: updatedChallenge
    });

  } catch (error) {
    console.error('Error submitting proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /challenges/{id}/review:
 *   post:
 *     summary: Review proof submission
 *     description: Allows accountability partner to approve or reject submitted proof
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Challenge ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewProofRequest'
 *           example:
 *             decision: "approve"
 *             comment: "Great job! Evidence clearly shows completion of the challenge."
 *     responses:
 *       200:
 *         description: Proof review completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               message: "Proof approved successfully"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "proof_approved"
 *                 proof_approved_at: "2024-01-15T14:00:00Z"
 *                 acp_review_comment: "Great job! Evidence clearly shows completion."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = reviewProofSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const challenge = await ChallengeModel.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (challenge.status !== 'proof_submitted') {
      return res.status(400).json({
        success: false,
        message: 'No proof submitted for this challenge'
      });
    }

    const now = new Date();
    const newStatus = value.decision === 'approve' ? 'proof_approved' : 'proof_rejected';
    const additionalData = {
      acp_review_comment: value.comment,
      [value.decision === 'approve' ? 'proof_approved_at' : 'proof_rejected_at']: now
    };

    const updatedChallenge = await ChallengeModel.updateStatus(id, newStatus, additionalData);

    // Send notification to creator about the decision
    try {
      await emailService.sendEmail({
        to: challenge.creator_email,
        subject: `🎯 Challenge ${value.decision === 'approve' ? 'Approved' : 'Rejected'}`,
        html: `
          <h2>Challenge ${value.decision === 'approve' ? 'Approved' : 'Rejected'}</h2>
          <p>Your accountability partner has ${value.decision === 'approve' ? 'approved' : 'rejected'} your proof submission.</p>
          <p><strong>Comment:</strong> ${value.comment}</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard">View Details</a></p>
        `
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return res.json({
      success: true,
      message: `Proof ${value.decision === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: updatedChallenge
    });

  } catch (error) {
    console.error('Error reviewing proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /challenges/user/{wallet}:
 *   get:
 *     summary: Get user email by wallet address
 *     description: Retrieves the email address associated with a wallet address from previous challenges
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *         description: Wallet address to lookup
 *         example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *     responses:
 *       200:
 *         description: User email found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         wallet:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *             example:
 *               success: true
 *               message: "User email found"
 *               data:
 *                 email: "user@example.com"
 *                 wallet: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *       404:
 *         description: No email found for this wallet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "No email found for this wallet address"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    // Validate wallet address format
    if (!wallet || !/^0x[a-fA-F0-9]{64}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        message: 'Valid wallet address is required (0x + 64 hex characters)'
      });
    }

    // Query to get the most recent email for this wallet address
    const result = await query(`
      SELECT creator_email as email, creator_wallet as wallet
      FROM challenges 
      WHERE creator_wallet = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [wallet]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No email found for this wallet address'
      });
    }

    return res.json({
      success: true,
      message: 'User email found',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user email:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    });
  }
});

/**
 * @swagger
 * /challenges:
 *   get:
 *     summary: Get all active challenges
 *     description: Retrieves all active challenges for community cases and public viewing
 *     tags: [Challenges]
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   creator_email: "creator@example.com"
 *                   task_description: "Complete a 30-day fitness challenge"
 *                   status: "active"
 *                   created_at: "2024-01-15T10:30:00Z"
 *                 - id: "456e7890-e89b-12d3-a456-426614174001"
 *                   creator_email: "creator2@example.com"
 *                   task_description: "Learn a new programming language"
 *                   status: "active"
 *                   created_at: "2024-01-16T09:15:00Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const challenges = await ChallengeModel.getAllActiveChallenges();
    
    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
