-- Create database schema for ProcastiNot

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_email VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(255) NOT NULL,
    task_description TEXT NOT NULL,
    accountability_partner_email VARCHAR(255) NOT NULL,
    accountability_partner_wallet VARCHAR(255) NOT NULL,
    stake_amount DECIMAL(18, 8) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
    contract_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    proof_submitted_at TIMESTAMP WITH TIME ZONE,
    proof_approved_at TIMESTAMP WITH TIME ZONE,
    proof_rejected_at TIMESTAMP WITH TIME ZONE,
    proof_evidence_url TEXT,
    proof_description TEXT,
    acp_review_comment TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    rewards_claimed_at TIMESTAMP WITH TIME ZONE,
    created_by_contract BOOLEAN DEFAULT FALSE,
    contract_deployed_at TIMESTAMP WITH TIME ZONE
);

-- Email notifications log
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Proof reminder schedule
CREATE TABLE IF NOT EXISTS proof_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    reminder_type VARCHAR(50) DEFAULT 'proof_reminder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community cases (disputed challenges)
CREATE TABLE IF NOT EXISTS community_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    dispute_reason TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'voting',
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    total_staked DECIMAL(18, 8) DEFAULT 0,
    voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Community votes
CREATE TABLE IF NOT EXISTS community_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES community_cases(id) ON DELETE CASCADE,
    voter_wallet VARCHAR(255) NOT NULL,
    vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('for', 'against')),
    stake_amount DECIMAL(18, 8) NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, voter_wallet)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_creator_email ON challenges(creator_email);
CREATE INDEX IF NOT EXISTS idx_challenges_acp_email ON challenges(accountability_partner_email);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_deadline ON challenges(deadline_at);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at);

CREATE INDEX IF NOT EXISTS idx_email_notifications_challenge_id ON email_notifications(challenge_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_proof_reminders_scheduled_for ON proof_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_proof_reminders_status ON proof_reminders(status);

CREATE INDEX IF NOT EXISTS idx_community_cases_challenge_id ON community_cases(challenge_id);
CREATE INDEX IF NOT EXISTS idx_community_cases_status ON community_cases(status);

CREATE INDEX IF NOT EXISTS idx_community_votes_case_id ON community_votes(case_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_voter_wallet ON community_votes(voter_wallet);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for challenges table
CREATE TRIGGER update_challenges_updated_at 
    BEFORE UPDATE ON challenges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
