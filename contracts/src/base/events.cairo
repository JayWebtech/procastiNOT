use starknet::ContractAddress;
use starknet::class_hash::ClassHash;

#[event]
#[derive(Drop, starknet::Event)]
pub enum Event {
    ChallengeCreated: ChallengeCreated,
    StakeLocked: StakeLocked,
    ProofSubmitted: ProofSubmitted,
    ACPApproved: ACPApproved,
    ACPRejected: ACPRejected,
    DisputeRaised: DisputeRaised,
    PayoutExecuted: PayoutExecuted,
    JurorEnrolled: JurorEnrolled,
    VotePhaseStarted: VotePhaseStarted,
    VoteCommitted: VoteCommitted,
    VoteRevealed: VoteRevealed,
    CaseResolved: CaseResolved,
    Upgraded: Upgraded,
    OwnerChanged: OwnerChanged,
    ContractPaused: ContractPaused,
    ContractUnpaused: ContractUnpaused,
    DebugBalance: DebugBalance,
}

// Individual event structs
#[derive(Drop, starknet::Event)]
pub struct ChallengeCreated {
    pub challenge_id: u64,
    pub staker: ContractAddress,
    pub acp: ContractAddress,
    pub stake_amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct StakeLocked {
    pub challenge_id: u64,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct ProofSubmitted {
    pub challenge_id: u64,
    pub proof_cid: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct ACPApproved {
    pub challenge_id: u64,
}

#[derive(Drop, starknet::Event)]
pub struct ACPRejected {
    pub challenge_id: u64,
}

#[derive(Drop, starknet::Event)]
pub struct DisputeRaised {
    pub challenge_id: u64,
    pub case_id: u64,
}

#[derive(Drop, starknet::Event)]
pub struct PayoutExecuted {
    pub challenge_id: u64,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub fee: u256,
}

#[derive(Drop, starknet::Event)]
pub struct JurorEnrolled {
    pub case_id: u64,
    pub juror: ContractAddress,
    pub stake: u256,
}

#[derive(Drop, starknet::Event)]
pub struct VotePhaseStarted {
    pub case_id: u64,
}

#[derive(Drop, starknet::Event)]
pub struct VoteCommitted {
    pub case_id: u64,
    pub juror: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct VoteRevealed {
    pub case_id: u64,
    pub juror: ContractAddress,
    pub vote: bool,
}

#[derive(Drop, starknet::Event)]
pub struct CaseResolved {
    pub case_id: u64,
    pub unanimous: bool,
    pub staker_wins: bool,
}

#[derive(Drop, starknet::Event)]
pub struct Upgraded {
    pub implementation: ClassHash,
}

#[derive(Drop, starknet::Event)]
pub struct OwnerChanged {
    pub old_owner: ContractAddress,
    pub new_owner: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ContractPaused {
    pub paused_by: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ContractUnpaused {
    pub unpaused_by: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct DebugBalance {
    pub case_id: u64,
    pub contract_balance: u256,
    pub total_payout: u256,
    pub juror_stake: u256,
    pub fee: u256,
    pub acp_amount: u256,
}
