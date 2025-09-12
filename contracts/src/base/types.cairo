use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct Challenge {
    pub id: u64,
    pub task: ByteArray,
    pub acp: ContractAddress,
    pub staker: ContractAddress,
    pub stake_amount: u256,
    pub status: ChallengeStatus,
    pub created_at: u64,
    pub time_limit: u64,
    pub acp_decision_at: u64,
    pub dispute_raised_at: u64,
    pub proof_cid: ByteArray
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
pub enum ChallengeStatus {
    #[default]
    Created,
    Locked,
    ACPApproved,
    ACPRejected,
    Disputed,
    Resolved,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Case {
    pub id: u64,
    pub challenge_id: u64,
    pub status: CaseStatus,
    pub task: ByteArray,
    pub stake_amount: u256,
    pub jurors: u64,
    pub total_juror_stake: u256,
    pub created_at: u64,
    pub enrollment_end: u64,
    pub total_votes: u64,
    pub proof_cid: ByteArray
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
pub enum CaseStatus {
    #[default]
    VotePhase,
    Resolved,
    JurorEnrollment
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Juror {
    pub address: ContractAddress,
    pub reputation: u64,
    pub stake_committed: u256,
    pub vote_committed: u256,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct JurorVote {
    pub hasVoted: bool,
    pub vote: bool, // true = approve staker, false = support ACP
    pub juror_addr: ContractAddress,
}

// Constants
pub const JUROR_ENROLL_WINDOW: u64 = 86400; // 24 hours
pub const DISPUTE_WINDOW: u64 = 3600;
pub const REQUIRED_JURORS: u64 = 5;
pub const PROTOCOL_FEE_PERCENT: u256 = 5; // 0.5% fee (5/1000 = 0.5%)
