import { query } from '../database/connection';

export interface Challenge {
  id: string;
  creator_email: string;
  creator_wallet: string;
  task_description: string;
  accountability_partner_email: string;
  accountability_partner_wallet: string;
  stake_amount: number;
  duration_minutes: number;
  status: 'active' | 'proof_submitted' | 'proof_approved' | 'proof_rejected' | 'completed' | 'failed' | 'disputed';
  created_at: Date;
  updated_at: Date;
  deadline_at: Date;
  contract_address?: string;
  transaction_hash?: string;
  proof_submitted_at?: Date;
  proof_approved_at?: Date;
  proof_rejected_at?: Date;
  proof_evidence_url?: string;
  proof_description?: string;
  acp_review_comment?: string;
  completed_at?: Date;
  failed_at?: Date;
  rewards_claimed_at?: Date;
  created_by_contract: boolean;
  contract_deployed_at?: Date;
}

export interface CreateChallengeData {
  creator_email: string;
  creator_wallet: string;
  task_description: string;
  accountability_partner_email: string;
  accountability_partner_wallet: string;
  stake_amount: number;
  duration_minutes: number;
  contract_address?: string;
  transaction_hash?: string;
  challenge_id?: number;
}

export interface ChallengeForContract {
  id: number;
  task: string;
  acp: string;
  staker: string;
  stake_amount: string;
  created_at: number;
  time_limit: number; // Unix timestamp in seconds
}

export class ChallengeModel {
  static async create(data: CreateChallengeData): Promise<Challenge> {
    const deadline_at = new Date(Date.now() + data.duration_minutes * 60 * 1000);
    
    const result = await query(`
      INSERT INTO challenges (
        creator_email, creator_wallet, task_description, 
        accountability_partner_email, accountability_partner_wallet,
        stake_amount, duration_minutes, deadline_at, contract_address, transaction_hash, challenge_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      data.creator_email,
      data.creator_wallet,
      data.task_description,
      data.accountability_partner_email,
      data.accountability_partner_wallet,
      data.stake_amount,
      data.duration_minutes,
      deadline_at,
      data.contract_address,
      data.transaction_hash,
      data.challenge_id
    ]);

    return result.rows[0];
  }

  static async findById(id: string): Promise<Challenge | null> {
    const result = await query('SELECT * FROM challenges WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByCreatorEmail(email: string): Promise<Challenge[]> {
    const result = await query(
      'SELECT * FROM challenges WHERE creator_email = $1 ORDER BY created_at DESC',
      [email]
    );
    return result.rows;
  }

  static async findByACPPartnerEmail(email: string): Promise<Challenge[]> {
    const result = await query(
      'SELECT * FROM challenges WHERE accountability_partner_email = $1 ORDER BY created_at DESC',
      [email]
    );
    return result.rows;
  }

  static async updateStatus(id: string, status: string, additionalData?: any): Promise<Challenge | null> {
    const setClause = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [id, status];
    let paramIndex = 3;

    if (additionalData) {
      if (additionalData.proof_submitted_at) {
        setClause.push(`proof_submitted_at = $${paramIndex}`);
        values.push(additionalData.proof_submitted_at);
        paramIndex++;
      }
      if (additionalData.proof_approved_at) {
        setClause.push(`proof_approved_at = $${paramIndex}`);
        values.push(additionalData.proof_approved_at);
        paramIndex++;
      }
      if (additionalData.proof_rejected_at) {
        setClause.push(`proof_rejected_at = $${paramIndex}`);
        values.push(additionalData.proof_rejected_at);
        paramIndex++;
      }
      if (additionalData.proof_evidence_url) {
        setClause.push(`proof_evidence_url = $${paramIndex}`);
        values.push(additionalData.proof_evidence_url);
        paramIndex++;
      }
      if (additionalData.proof_description) {
        setClause.push(`proof_description = $${paramIndex}`);
        values.push(additionalData.proof_description);
        paramIndex++;
      }
      if (additionalData.acp_review_comment) {
        setClause.push(`acp_review_comment = $${paramIndex}`);
        values.push(additionalData.acp_review_comment);
        paramIndex++;
      }
      if (additionalData.completed_at) {
        setClause.push(`completed_at = $${paramIndex}`);
        values.push(additionalData.completed_at);
        paramIndex++;
      }
      if (additionalData.failed_at) {
        setClause.push(`failed_at = $${paramIndex}`);
        values.push(additionalData.failed_at);
        paramIndex++;
      }
    }

    const result = await query(
      `UPDATE challenges SET ${setClause.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async getActiveChallengesNeedingProofReminder(): Promise<Challenge[]> {
    const reminderHours = parseInt(process.env.PROOF_REMINDER_HOURS || '24');
    const reminderTime = new Date(Date.now() + reminderHours * 60 * 60 * 1000);
    
    const result = await query(`
      SELECT c.* FROM challenges c
      LEFT JOIN proof_reminders pr ON c.id = pr.challenge_id AND pr.status = 'sent'
      WHERE c.status = 'active' 
        AND c.deadline_at <= $1
        AND c.proof_submitted_at IS NULL
        AND pr.id IS NULL
    `, [reminderTime]);

    return result.rows;
  }

  static async getChallengesForACPReview(acpEmail: string): Promise<Challenge[]> {
    const result = await query(`
      SELECT * FROM challenges 
      WHERE accountability_partner_email = $1 
        AND status = 'proof_submitted'
        AND proof_approved_at IS NULL 
        AND proof_rejected_at IS NULL
      ORDER BY proof_submitted_at ASC
    `, [acpEmail]);

    return result.rows;
  }

  static async findByCreatorWallet(wallet: string): Promise<Challenge[]> {
    const result = await query(
      'SELECT * FROM challenges WHERE creator_wallet = $1 ORDER BY created_at DESC',
      [wallet]
    );
    return result.rows;
  }

  static async findByACPWallet(wallet: string): Promise<Challenge[]> {
    const result = await query(
      'SELECT * FROM challenges WHERE accountability_partner_wallet = $1 ORDER BY created_at DESC',
      [wallet]
    );
    return result.rows;
  }

  static async getAllActiveChallenges(): Promise<Challenge[]> {
    const result = await query(`
      SELECT * FROM challenges 
      WHERE status IN ('active', 'proof_submitted', 'disputed')
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  // Convert challenge to contract format with Unix timestamps
  static prepareForContract(challenge: Challenge): ChallengeForContract {
    return {
      id: parseInt(challenge.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to u64
      task: challenge.task_description,
      acp: challenge.accountability_partner_wallet,
      staker: challenge.creator_wallet,
      stake_amount: Math.floor(challenge.stake_amount * 1e18).toString(), // Convert to wei-like format
      created_at: Math.floor(challenge.created_at.getTime() / 1000), // Unix timestamp in seconds
      time_limit: Math.floor(challenge.deadline_at.getTime() / 1000) // Unix timestamp in seconds
    };
  }

  // Get Unix timestamp for current time + duration
  static getTimeLimitFromDuration(durationMinutes: number): number {
    return Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
  }

  // Get Unix timestamp for current time
  static getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
