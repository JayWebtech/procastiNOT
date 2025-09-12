#[starknet::contract]
pub mod ProcastiNotV13 {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::class_hash::ClassHash;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use crate::base::errors::{
        ACP_ADDRESS_MUST_BE_NON_ZERO, ACP_AND_STAKER_CANNOT_BE_THE_SAME, ALREADY_ENROLLED,
        AMOUNT_MUST_BE_GREATER_THAN_0, CLASS_HASH_CANNOT_BE_ZERO, CONTRACT_IS_ACTIVE_ALREADY,
        CONTRACT_IS_PAUSED, CONTRACT_IS_PAUSED_ALREADY, ENROLLMENT_FULL,
        ENROLLMENT_NOT_IN_ENROLLMENT_PHASE, ENROLLMENT_PHASE_EXPIRED, INSUFFICIENT_ALLOWANCE,
        INSUFFICIENT_BALANCE, INVALID_STATUS, NOT_ACP, NOT_STAKER, TASK_MUST_BE_GREATER_THAN_0,
        TIME_LIMIT_MUST_BE_GREATER_THAN_0, UNAUTHORIZED_CALLER, ZERO_ADDRESS_NOT_ALLOWED, TIME_LIMIT_NOT_EXPIRED   
    };
    use crate::base::events::{
        ACPApproved, ACPRejected, CaseResolved, ChallengeCreated, DebugBalance, DisputeRaised, ProofSubmitted,
        Upgraded, VoteCommitted,
    };
    use crate::base::types::{
        Case, CaseStatus, Challenge, ChallengeStatus, JUROR_ENROLL_WINDOW, Juror, JurorVote,
        PROTOCOL_FEE_PERCENT, REQUIRED_JURORS,
    };
    use crate::interface::IProcastiNot::IProcastiNot;

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ChallengeCreated: crate::base::events::ChallengeCreated,
        ProofSubmitted: crate::base::events::ProofSubmitted,
        ACPApproved: crate::base::events::ACPApproved,
        ACPRejected: crate::base::events::ACPRejected,
        DisputeRaised: crate::base::events::DisputeRaised,
        VoteCommitted: crate::base::events::VoteCommitted,
        CaseResolved: crate::base::events::CaseResolved,
        Upgraded: crate::base::events::Upgraded,
        DebugBalance: crate::base::events::DebugBalance,
    }

    #[storage]
    struct Storage {
        // Challenge storage
        challenges: Map<u64, Challenge>,
        challenge_counter: u64,
        // Case storage
        cases: Map<u64, Case>,
        case_counter: u64,
        case_by_challenge: Map<u64, u64>,
        // Juror storage
        jurors: Map<ContractAddress, Juror>,
        juror_votes: Map<(u64, ContractAddress), JurorVote>, // case_id -> juror -> vote
        protocol_fee: u256,
        version: u8,
        jurors_addr: Map<(u64, u64), ContractAddress>, // case_id, index -> juror_addr
        juror_count: Map<u64, u64>,
        // Access control
        owner: ContractAddress,
        is_paused: bool,
        token_addr: IERC20Dispatcher,
        treasury: u256,
        staker_challenge_ids: Map<(ContractAddress, u64), u64>, // (staker, index) -> challenge_id
        staker_challenge_count: Map<ContractAddress, u64>, // staker -> total_challenges
        acp_challenge_ids: Map<(ContractAddress, u64), u64>, // (acp, index) -> challenge_id  
        acp_challenge_count: Map<ContractAddress, u64>, // acp -> total_challenges

    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, token_addr: ContractAddress) {
        self.owner.write(owner);
        self.token_addr.write(IERC20Dispatcher { contract_address: token_addr });
        self.challenge_counter.write(0);
        self.case_counter.write(0);
        self.protocol_fee.write(PROTOCOL_FEE_PERCENT);
        self.version.write(1);
        self.treasury.write(0);
    }

    #[abi(embed_v0)]
    impl ProcastiNotV1Impl of IProcastiNot<ContractState> {
        fn create_challenge(
            ref self: ContractState,
            acp: ContractAddress,
            stake_amount: u256,
            task: ByteArray,
            time_limit: u64,
        ) -> u64 {
            self.is_contract_paused();
            let caller = get_caller_address();
            let contract_address = get_contract_address();

            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(stake_amount > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
            assert(time_limit > 0, TIME_LIMIT_MUST_BE_GREATER_THAN_0);
            assert(task.len() > 0, TASK_MUST_BE_GREATER_THAN_0);
            assert(acp.is_non_zero(), ACP_ADDRESS_MUST_BE_NON_ZERO);
            assert(acp != caller, ACP_AND_STAKER_CANNOT_BE_THE_SAME);

            let contract_allowance = self.token_addr.read().allowance(caller, contract_address);
            assert(contract_allowance >= stake_amount, INSUFFICIENT_ALLOWANCE);

            self.token_addr.read().transfer_from(caller, contract_address, stake_amount);

            let challenge_id = self.challenge_counter.read() + 1;
            self.challenge_counter.write(challenge_id);

            // Update staker challenge tracking
            let staker_count = self.staker_challenge_count.read(caller);
            self.staker_challenge_ids.write((caller, staker_count), challenge_id);
            self.staker_challenge_count.write(caller, staker_count + 1);

            // Update ACP challenge tracking  
            let acp_count = self.acp_challenge_count.read(acp);
            self.acp_challenge_ids.write((acp, acp_count), challenge_id);
            self.acp_challenge_count.write(acp, acp_count + 1);

            let mut challenge = Challenge {
                id: challenge_id,
                task,
                staker: caller,
                acp,
                stake_amount,
                proof_cid: "0",
                status: ChallengeStatus::Created,
                created_at: get_block_timestamp(),
                time_limit,
                acp_decision_at: 0,
                dispute_raised_at: 0,
            };

            self.challenges.write(challenge_id, challenge);

            self
                .emit(
                    Event::ChallengeCreated(
                        ChallengeCreated { challenge_id, staker: caller, acp, stake_amount },
                    ),
                );

            challenge_id
        }

        fn submit_proof(ref self: ContractState, challenge_id: u64, proof_cid: ByteArray) {
            self.is_contract_paused();
            let mut challenge = self.challenges.read(challenge_id);
            assert(challenge.status == ChallengeStatus::Created, INVALID_STATUS);
            assert(challenge.staker == get_caller_address(), NOT_STAKER);
            assert(get_caller_address().is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);

            challenge.proof_cid = proof_cid.clone();
            challenge.status = ChallengeStatus::Locked;
            self.challenges.write(challenge_id, challenge);

            self.emit(Event::ProofSubmitted(ProofSubmitted { challenge_id, proof_cid }));
        }

        fn acp_approve(ref self: ContractState, challenge_id: u64) {
            self.is_contract_paused();
            let mut challenge = self.challenges.read(challenge_id);
            assert(challenge.status == ChallengeStatus::Locked, INVALID_STATUS);
            assert(challenge.acp == get_caller_address(), NOT_ACP);

            self._safe_transfer(challenge.staker, challenge.stake_amount, 0);

            challenge.status = ChallengeStatus::ACPApproved;
            challenge.acp_decision_at = get_block_timestamp();
            self.challenges.write(challenge_id, challenge);

            self.emit(Event::ACPApproved(ACPApproved { challenge_id }));
        }

        fn acp_reject(ref self: ContractState, challenge_id: u64) {
            let mut challenge = self.challenges.read(challenge_id);
            assert(challenge.status == ChallengeStatus::Locked, INVALID_STATUS);
            assert(challenge.acp == get_caller_address(), NOT_ACP);

            challenge.status = ChallengeStatus::ACPRejected;
            challenge.acp_decision_at = get_block_timestamp();

            let case_id = self.case_counter.read() + 1;
            self.case_counter.write(case_id);

            let task_clone = challenge.task.clone();
            let stake_amount = challenge.stake_amount;

            let case = Case {
                id: case_id,
                challenge_id,
                status: CaseStatus::JurorEnrollment,
                total_juror_stake: 0,
                created_at: get_block_timestamp(),
                enrollment_end: get_block_timestamp() + JUROR_ENROLL_WINDOW,
                total_votes: 0,
                task: task_clone,
                stake_amount: stake_amount,
                jurors: 0,
                proof_cid: challenge.proof_cid.clone()
            };

            self.cases.write(case_id, case);
            self.case_by_challenge.write(challenge_id, case_id);
            self.challenges.write(challenge_id, challenge);

            self.emit(Event::DisputeRaised(DisputeRaised { challenge_id, case_id }));

            self.emit(Event::ACPRejected(ACPRejected { challenge_id }));
        }

        fn juror_vote(ref self: ContractState, case_id: u64, vote: bool) {
            self.is_contract_paused();
            let contract_address = get_contract_address();
            let mut case = self.cases.read(case_id);
            let challenge = self.challenges.read(case.challenge_id);

            assert(case.status == CaseStatus::JurorEnrollment, ENROLLMENT_NOT_IN_ENROLLMENT_PHASE);

            let current_time = get_block_timestamp();
            let caller = get_caller_address();
            assert(current_time <= case.enrollment_end, ENROLLMENT_PHASE_EXPIRED);
            assert(case.jurors < REQUIRED_JURORS, ENROLLMENT_FULL);
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(caller != challenge.staker, INVALID_STATUS);
            assert(caller != challenge.acp, INVALID_STATUS);

            let jurors = self.juror_votes.read((case_id, caller));

            assert(!jurors.hasVoted, ALREADY_ENROLLED);

            // Calculate required juror stake
            let challenge = self.challenges.read(case.challenge_id);
            let juror_stake = challenge.stake_amount / REQUIRED_JURORS.into();

            let contract_allowance = self.token_addr.read().allowance(caller, contract_address);
            assert(contract_allowance >= juror_stake, INSUFFICIENT_ALLOWANCE);

            self.token_addr.read().transfer_from(caller, contract_address, juror_stake);

            // Store vote
            self
                .juror_votes
                .write(
                    (case_id, caller),
                    JurorVote { hasVoted: true, vote: vote, juror_addr: get_caller_address() },
                );

            // Update juror status
            let mut juror = self.jurors.read(caller);
            juror.vote_committed += 1;
            juror.stake_committed += juror_stake;
            self.jurors.write(caller, juror);

            let count = self.juror_count.read(case_id);

            // write juror address at (case_id, count)
            self.jurors_addr.write((case_id, count), caller);

            // increment juror count
            self.juror_count.write(case_id, count + 1);

            // Add juror to case
            case.jurors += 1;
            case.total_juror_stake += juror_stake;
            case.total_votes += 1;
            self.cases.write(case_id, case);

            self.emit(Event::VoteCommitted(VoteCommitted { case_id, juror: caller }));

            let new_case = self.cases.read(case_id);

            // Check if all jurors have committed
            if (new_case.jurors == REQUIRED_JURORS) {
                // Count votes
                let mut approve_votes = 0;
                let mut reject_votes = 0;

                let mut i = 0;

                while i < new_case.jurors {
                    let juror_addr = self.jurors_addr.read((case_id, i));
                    let juror_vote = self.juror_votes.read((case_id, juror_addr));

                    if juror_vote.vote {
                        approve_votes += 1;
                    } else {
                        reject_votes += 1;
                    }

                    i += 1;
                }

                // Handle unanimous votes
                if approve_votes == REQUIRED_JURORS || reject_votes == REQUIRED_JURORS {
                    self._handle_unanimous_vote(case_id, approve_votes == REQUIRED_JURORS);
                    return;
                }

                // Handle majority votes
                if approve_votes > reject_votes {
                    self._handle_staker_win(case_id, approve_votes, reject_votes);
                } else {
                    self._handle_acp_win(case_id, approve_votes, reject_votes);
                }
            }
        }

        fn get_challenge(self: @ContractState, challenge_id: u64) -> Challenge {
            self.challenges.read(challenge_id)
        }

        fn get_case(self: @ContractState, case_id: u64) -> Case {
            self.cases.read(case_id)
        }

        fn get_juror_info(self: @ContractState, juror: ContractAddress) -> Juror {
            self.jurors.read(juror)
        }

        fn get_treasury_balance(self: @ContractState) -> u256 {
            self.treasury.read()
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn change_owner(ref self: ContractState, new_owner: ContractAddress) {
            self.only_owner();
            self.owner.write(new_owner);
        }

        fn upgrade(ref self: ContractState, impl_hash: ClassHash, new_version: u8) {
            self.only_owner();
            assert(impl_hash.is_non_zero(), CLASS_HASH_CANNOT_BE_ZERO);
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.version.write(new_version);
            self.emit(Event::Upgraded(Upgraded { implementation: impl_hash }));
        }

        fn get_version(self: @ContractState) -> u8 {
            self.version.read()
        }

        fn pause(ref self: ContractState) {
            self.only_owner();
            let status = self.is_paused.read();
            assert(!status, CONTRACT_IS_PAUSED_ALREADY);
            self.is_paused.write(true);
        }

        fn unpause(ref self: ContractState) {
            self.only_owner();
            let status = self.is_paused.read();
            assert(status, CONTRACT_IS_ACTIVE_ALREADY);
            self.is_paused.write(false);
        }

        fn get_contract_status(self: @ContractState) -> bool {
            self.is_paused.read()
        }

        fn get_token_addr(self: @ContractState) -> ContractAddress {
            self.token_addr.contract_address.read()
        }
        fn get_protocol_fee(self: @ContractState) -> u256 {
            self.protocol_fee.read()
        }
        fn change_protocol_fee(ref self: ContractState, new_fee: u256) {
            self.only_owner();
            self.protocol_fee.write(new_fee);
        }
        fn staker_claims(ref self: ContractState, challenge_id: u64) {
            let challenge = self.challenges.read(challenge_id);
            assert(get_block_timestamp() > challenge.time_limit, TIME_LIMIT_NOT_EXPIRED);
            assert(challenge.staker == get_caller_address(), NOT_STAKER);
            assert(challenge.status == ChallengeStatus::Locked, INVALID_STATUS);
            
            self._safe_transfer(challenge.staker, challenge.stake_amount, 0);
        }
        fn acp_claims(ref self: ContractState, challenge_id: u64) {
            let challenge = self.challenges.read(challenge_id);
            assert(get_block_timestamp() > challenge.time_limit, TIME_LIMIT_NOT_EXPIRED);
            assert(challenge.acp == get_caller_address(), NOT_ACP);
            assert(challenge.status == ChallengeStatus::Created, INVALID_STATUS);
            
            self._safe_transfer(challenge.acp, challenge.stake_amount, 0);
        }
        fn get_challenge_by_staker(self: @ContractState, staker: ContractAddress) -> Array<Challenge> {
            assert(staker.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            let total_count = self.staker_challenge_count.read(staker);
            let mut challenges = ArrayTrait::new();
            let mut i = 0_u64;
        
            while i < total_count {
                let challenge_id = self.staker_challenge_ids.read((staker, i));
                let challenge = self.challenges.read(challenge_id);
                challenges.append(challenge);
                i += 1;
            };
        
            challenges
        }
        
        fn get_challenge_by_acp(self: @ContractState, acp: ContractAddress) -> Array<Challenge> {
            assert(acp.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            let total_count = self.acp_challenge_count.read(acp);
            let mut challenges = ArrayTrait::new();
            let mut i = 0_u64;
        
            while i < total_count {
                let challenge_id = self.acp_challenge_ids.read((acp, i));
                let challenge = self.challenges.read(challenge_id);
                challenges.append(challenge);
                i += 1;
            };
        
            challenges
        }
        
        // Get challenge IDs only (more gas efficient)
        fn get_challenge_ids_by_staker(self: @ContractState, staker: ContractAddress) -> Array<u64> {
            let total_count = self.staker_challenge_count.read(staker);
            let mut challenge_ids = ArrayTrait::new();
            let mut i = 0_u64;
        
            while i < total_count {
                let challenge_id = self.staker_challenge_ids.read((staker, i));
                challenge_ids.append(challenge_id);
                i += 1;
            };
        
            challenge_ids
        }

        // Get all cases (for community cases view)
        fn get_all_cases(self: @ContractState) -> Array<Case> {
            let total_count = self.case_counter.read();
            let mut cases = ArrayTrait::new();
            let mut i = 1_u64; // Case IDs start from 1
        
            while i <= total_count {
                let case = self.cases.read(i);
                // Only include cases that exist (have a valid challenge_id)
                if case.challenge_id > 0 {
                    cases.append(case);
                }
                i += 1;
            };
        
            cases
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn only_owner(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);

            let owner = self.owner.read();
            assert(owner == caller, UNAUTHORIZED_CALLER);
        }

        fn is_contract_paused(ref self: ContractState) {
            let paused = self.is_paused.read();
            assert(!paused, CONTRACT_IS_PAUSED);
        }

        fn _safe_transfer(ref self: ContractState, to: ContractAddress, amount: u256, case_id: u64) {
            let contract_balance = self.token_addr.read().balance_of(get_contract_address());
            // Temporary debug: emit balance info before transfer
            self.emit(Event::DebugBalance(DebugBalance {
                case_id,
                contract_balance,
                total_payout: amount,
                juror_stake: 0,
                fee: 0,
                acp_amount: 0,
            }));
            assert(contract_balance >= amount, INSUFFICIENT_BALANCE);
            self.token_addr.read().transfer(to, amount);
        }
        fn _handle_unanimous_vote(ref self: ContractState, case_id: u64, staker_wins: bool) {
            let case = self.cases.read(case_id);
            let challenge = self.challenges.read(case.challenge_id);

            // Refund all juror stakes
            let juror_stake = challenge.stake_amount / REQUIRED_JURORS.into();
            let mut i = 0;

            while i < case.jurors {
                let juror_addr = self.jurors_addr.read((case_id, i));
                // Transfer juror_stake back to juror
                self._safe_transfer(juror_addr, juror_stake, case_id);

                // Update reputation
                let mut juror = self.jurors.read(juror_addr);
                juror.reputation += 1;
                self.jurors.write(juror_addr, juror);
                
                i += 1;
            }

            // Handle main stake
            if staker_wins { // Return full stake to staker
                self._safe_transfer(challenge.staker, challenge.stake_amount, case_id);
            } else {
                // Transfer stake to ACP with fee
                let fee = (challenge.stake_amount * PROTOCOL_FEE_PERCENT.into()) / 1000;
                let _acp_amount = if fee >= challenge.stake_amount { 0 } else { challenge.stake_amount - fee };

                let mut treasury = self.treasury.read();
                treasury += fee;
                self.treasury.write(treasury);
                // Transfer acp_amount to challenge.acp
                if _acp_amount > 0 {
                    self._safe_transfer(challenge.acp, _acp_amount, case_id);
                }
            }

            // Update case and challenge status
            let mut case_mut = self.cases.read(case_id);
            case_mut.status = CaseStatus::Resolved;
            self.cases.write(case_id, case_mut);

            let mut challenge_mut = self.challenges.read(case.challenge_id);
            challenge_mut.status = ChallengeStatus::Resolved;
            self.challenges.write(case.challenge_id, challenge_mut);

            self.emit(Event::CaseResolved(CaseResolved { case_id, unanimous: true, staker_wins }));
        }

        fn _handle_staker_win(ref self: ContractState, case_id: u64, winners: u64, losers: u64) {
            let case = self.cases.read(case_id);
            let challenge = self.challenges.read(case.challenge_id);

            let juror_stake = challenge.stake_amount / REQUIRED_JURORS.into();
            let loser_stake_per_winner = (losers * juror_stake.try_into().unwrap()) / winners;

            // Return full stake to staker
            // Transfer challenge.stake_amount to challenge.staker
            self._safe_transfer(challenge.staker, challenge.stake_amount, 0);

            let mut i = 0;

            while i < case.jurors {
                let juror_addr = self.jurors_addr.read((case_id, i));
                let juror_vote = self.juror_votes.read((case_id, juror_addr));
                if juror_vote.vote {
                    // Winner: get stake + share of losers' stakes
                    let _payout = juror_stake + loser_stake_per_winner.into();
                    // Transfer payout to juror_addr

                    self._safe_transfer(juror_addr, _payout, case_id);

                    // Update reputation
                    let mut juror = self.jurors.read(juror_addr);
                    juror.reputation += 1;
                    self.jurors.write(juror_addr, juror);
                } else {
                    // Loser: lose stake
                    // Update reputation
                    let mut juror = self.jurors.read(juror_addr);
                    if juror.reputation > 0 {
                        juror.reputation -= 1;
                    }
                    self.jurors.write(juror_addr, juror);
                }
                
                i += 1;
            }

            // Update status
            let mut case_mut = self.cases.read(case_id);
            case_mut.status = CaseStatus::Resolved;
            self.cases.write(case_id, case_mut);

            let mut challenge_mut = self.challenges.read(case.challenge_id);
            challenge_mut.status = ChallengeStatus::Resolved;
            self.challenges.write(case.challenge_id, challenge_mut);

            self
                .emit(
                    Event::CaseResolved(
                        CaseResolved { case_id, unanimous: false, staker_wins: true },
                    ),
                );
        }

        fn _handle_acp_win(ref self: ContractState, case_id: u64, losers: u64, winners: u64) {
            let case = self.cases.read(case_id);
            let challenge = self.challenges.read(case.challenge_id);

            let juror_stake = challenge.stake_amount / REQUIRED_JURORS.into();
            let loser_stake_per_winner = (losers * juror_stake.try_into().unwrap()) / winners;

            // Transfer stake to ACP with fee
            let fee = (challenge.stake_amount * PROTOCOL_FEE_PERCENT.into()) / 1000;
            let _acp_amount = if fee >= challenge.stake_amount { 0 } else { challenge.stake_amount - fee };

            let mut treasury = self.treasury.read();
            treasury += fee;
            self.treasury.write(treasury);

            // Transfer acp_amount to challenge.acp
            if _acp_amount > 0 {
                self._safe_transfer(challenge.acp, _acp_amount, case_id);
            }

            let mut i = 0;

            while i < case.jurors {
                let juror_addr = self.jurors_addr.read((case_id, i));
                let juror_vote = self.juror_votes.read((case_id, juror_addr));
                if !juror_vote.vote {
                    // Winner: get stake + share of losers' stakes
                    let _payout = juror_stake + loser_stake_per_winner.into();
                    // Transfer payout to juror_addr

                    self._safe_transfer(juror_addr, _payout, case_id);

                    // Update reputation
                    let mut juror = self.jurors.read(juror_addr);
                    juror.reputation += 1;
                    self.jurors.write(juror_addr, juror);
                } else {
                    // Loser: lose stake
                    // Update reputation
                    let mut juror = self.jurors.read(juror_addr);
                    if juror.reputation > 0 {
                        juror.reputation -= 1;
                    }
                    self.jurors.write(juror_addr, juror);
                }
                
                i += 1;
            }

            // Update status
            let mut case_mut = self.cases.read(case_id);
            case_mut.status = CaseStatus::Resolved;
            self.cases.write(case_id, case_mut);

            let mut challenge_mut = self.challenges.read(case.challenge_id);
            challenge_mut.status = ChallengeStatus::Resolved;
            self.challenges.write(case.challenge_id, challenge_mut);

            self
                .emit(
                    Event::CaseResolved(
                        CaseResolved { case_id, unanimous: false, staker_wins: false },
                    ),
                );
        }
    }
}
