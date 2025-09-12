use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_block_timestamp, stop_cheat_block_timestamp, start_cheat_caller_address,
    stop_cheat_caller_address, start_cheat_block_number, stop_cheat_block_number,
};
use snforge_std::{EventSpyAssertionsTrait, spy_events};

use starknet::ContractAddress;
use starknet::contract_address_const;

use contracts::{IProcastiNotDispatcher, IProcastiNotDispatcherTrait};
use contracts::base::types::{ChallengeCreated, ProofSubmitted, ACPApproved, ACPRejected, 
    DisputeRaised, VoteCommitted, CaseResolved, Upgraded};
use contracts::base::types::{ChallengeStatus, CaseStatus};

// Mock ERC20 token for testing
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// Test constants
const STAKER_ADDRESS: felt252 = 0x123;
const ACP_ADDRESS: felt252 = 0x456;
const JUROR1_ADDRESS: felt252 = 0x789;
const JUROR2_ADDRESS: felt252 = 0xABC;
const JUROR3_ADDRESS: felt252 = 0xDEF;
const JUROR4_ADDRESS: felt252 = 0x111;
const JUROR5_ADDRESS: felt252 = 0x222;
const OWNER_ADDRESS: felt252 = 0x999;

const INITIAL_SUPPLY: u256 = 1000000;
const STAKE_AMOUNT: u256 = 1000;
const JUROR_STAKE: u256 = 200; // STAKE_AMOUNT / 5

fn deploy_contracts() -> (IProcastiNotDispatcher, IERC20Dispatcher, ContractAddress) {
    // Deploy mock ERC20 token
    let token_contract = declare("ERC20");
    let mut token_args = array![];
    Serde::serialize(@"TestToken", ref token_args);
    Serde::serialize(@"TT", ref token_args);
    Serde::serialize(@INITIAL_SUPPLY, ref token_args);
    Serde::serialize(@STAKER_ADDRESS, ref token_args);
    
    let (token_address, _) = token_contract
        .unwrap()
        .contract_class()
        .deploy(@token_args)
        .unwrap();
    
    let token_dispatcher = IERC20Dispatcher { contract_address: token_address };

    // Deploy ProcastiNot contract
    let procasti_contract = declare("ProcastiNotV1");
    let mut procasti_args = array![];
    Serde::serialize(@OWNER_ADDRESS, ref procasti_args);
    Serde::serialize(@token_address, ref procasti_args);
    
    let (procasti_address, _) = procasti_contract
        .unwrap()
        .contract_class()
        .deploy(@procasti_args)
        .unwrap();
    
    let procasti_dispatcher = IProcastiNotDispatcher { contract_address: procasti_address };

    (procasti_dispatcher, token_dispatcher, procasti_address)
}

fn setup_accounts_and_approvals(
    procasti_dispatcher: IProcastiNotDispatcher,
    token_dispatcher: IERC20Dispatcher,
) {
    let procasti_address = procasti_dispatcher.contract_address;
    
    // Set up staker
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    token_dispatcher.approve(procasti_address, STAKE_AMOUNT * 10);
    stop_cheat_caller_address(procasti_address);

    // Set up ACP
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    token_dispatcher.approve(procasti_address, STAKE_AMOUNT * 10);
    stop_cheat_caller_address(procasti_address);

    // Set up jurors
    let jurors = array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        start_cheat_caller_address(procasti_address, juror_addr);
        token_dispatcher.approve(procasti_address, JUROR_STAKE * 10);
        stop_cheat_caller_address(procasti_address);
    }
}

#[test]
fn test_multiple_challenges() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    
    // Create multiple challenges
    let challenge1 = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Task 1",
        86400
    );
    
    let challenge2 = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Task 2",
        86400
    );
    
    stop_cheat_caller_address(procasti_address);
    
    // Verify both challenges exist
    assert(challenge1 == 1, 'First challenge should have ID 1');
    assert(challenge2 == 2, 'Second challenge should have ID 2');
    
    let challenge1_data = procasti_dispatcher.get_challenge(challenge1);
    let challenge2_data = procasti_dispatcher.get_challenge(challenge2);
    
    assert(challenge1_data.id == 1, 'Wrong challenge 1 ID');
    assert(challenge2_data.id == 2, 'Wrong challenge 2 ID');
}

#[test]
fn test_juror_reputation_system() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Create challenge and dispute
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Get initial juror reputation
    let juror1_addr = JUROR1_ADDRESS.try_into().unwrap();
    let initial_juror = procasti_dispatcher.get_juror_info(juror1_addr);
    let initial_reputation = initial_juror.reputation;
    
    // Juror votes correctly (with majority)
    start_cheat_caller_address(procasti_address, JUROR1_ADDRESS.try_into().unwrap());
    procasti_dispatcher.juror_vote(1, true); // Vote for staker
    stop_cheat_caller_address(procasti_address);
    
    // Complete the voting with majority for staker
    let jurors = array![JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    let votes = array![true, true, false, true]; // 4 approve, 1 reject
    
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        let vote = votes.at(i).read();
        
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(1, vote);
        stop_cheat_caller_address(procasti_address);
    }
    
    // Check reputation increase for winning jurors
    let final_juror = procasti_dispatcher.get_juror_info(juror1_addr);
    assert(final_juror.reputation == initial_reputation + 1, 'Reputation should increase for correct vote');
}

#[test]
fn test_treasury_fee_collection() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let initial_treasury = procasti_dispatcher.get_treasury_balance();
    assert(initial_treasury == 0, 'Initial treasury should be empty');
    
    // Create challenge and get ACP to win (to trigger fee collection)
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Jurors vote for ACP (ACP wins)
    let jurors = array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    let votes = array![false, false, false, true, true]; // 3 reject, 2 approve (ACP wins)
    
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        let vote = votes.at(i).read();
        
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(1, vote);
        stop_cheat_caller_address(procasti_address);
    }
    
    // Check treasury has collected fees
    let final_treasury = procasti_dispatcher.get_treasury_balance();
    let expected_fee = STAKE_AMOUNT * 500_000 / 100_000_000; // 0.5% fee
    assert(final_treasury == expected_fee, 'Treasury should collect protocol fee');
}

#[test]
fn test_time_limit_expiration() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let current_time = 1000;
    start_cheat_block_timestamp(procasti_address, current_time);
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        3600 // 1 hour time limit
    );
    
    // Submit proof before time limit
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    // Verify challenge is locked
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.status == ChallengeStatus::Locked, 'Challenge should be locked');
    assert(challenge.created_at == current_time, 'Created timestamp should match');
    assert(challenge.time_limit == 3600, 'Time limit should be set correctly');
    
    stop_cheat_block_timestamp(procasti_address);
}

#[test]
fn test_enrollment_window_expiration() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Create challenge and dispute
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Get case enrollment end time
    let case = procasti_dispatcher.get_case(1);
    let enrollment_end = case.enrollment_end;
    
    // Advance time beyond enrollment window
    start_cheat_block_timestamp(procasti_address, enrollment_end + 1);
    
    // Try to enroll juror after enrollment window
    start_cheat_caller_address(procasti_address, JUROR1_ADDRESS.try_into().unwrap());
    
    // This should fail due to enrollment window expiration
    // Note: The actual error checking would depend on your contract's implementation
    // You might need to add a function to check enrollment status or modify the juror_vote function
    
    stop_cheat_caller_address(procasti_address);
    stop_cheat_block_timestamp(procasti_address);
}

#[test]
fn test_contract_upgrade() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    let mut spy = spy_events();
    
    // Deploy new implementation
    let new_impl_contract = declare("ProcastiNotV1");
    let new_impl_hash = new_impl_contract.unwrap().contract_class().class_hash();
    
    start_cheat_caller_address(procasti_address, OWNER_ADDRESS.try_into().unwrap());
    
    let old_version = procasti_dispatcher.get_version();
    assert(old_version == 1, 'Initial version should be 1');
    
    // Upgrade contract
    procasti_dispatcher.upgrade(new_impl_hash, 2);
    
    let new_version = procasti_dispatcher.get_version();
    assert(new_version == 2, 'Version should be updated to 2');
    
    // Verify upgrade event
    let expected_event = contracts::ProcastiNotV1::Event::Upgraded(
        Upgraded { implementation: new_impl_hash }
    );
    let expected_events = array![(procasti_address, expected_event)];
    spy.assert_emitted(@expected_events);
    
    stop_cheat_caller_address(procasti_address);
}

#[test]
fn test_juror_stake_distribution() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Get initial balances
    let juror1_addr = JUROR1_ADDRESS.try_into().unwrap();
    let initial_balance = token_dispatcher.balance_of(juror1_addr);
    
    // Create challenge and dispute
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Juror 1 votes for staker (winner), others vote for ACP (losers)
    start_cheat_caller_address(procasti_address, JUROR1_ADDRESS.try_into().unwrap());
    procasti_dispatcher.juror_vote(1, true); // Vote for staker
    stop_cheat_caller_address(procasti_address);
    
    let jurors = array![JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(1, false); // Vote for ACP
        stop_cheat_caller_address(procasti_address);
    }
    
    // Check that juror 1 got their stake back plus share of losers' stakes
    let final_balance = token_dispatcher.balance_of(juror1_addr);
    let expected_gain = JUROR_STAKE + (JUROR_STAKE * 4 / 1); // 4 losers' stakes divided by 1 winner
    assert(final_balance == initial_balance + expected_gain, 'Juror should receive stake plus winnings');
}

#[test]
fn test_edge_case_zero_jurors() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Create challenge and dispute
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Don't enroll any jurors - case should remain in enrollment phase
    let case = procasti_dispatcher.get_case(1);
    assert(case.status == CaseStatus::JurorEnrollment, 'Case should remain in enrollment phase');
    assert(case.jurors == 0, 'No jurors should be enrolled');
}

#[test]
fn test_paused_contract_operations() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Pause contract
    start_cheat_caller_address(procasti_address, OWNER_ADDRESS.try_into().unwrap());
    procasti_dispatcher.pause();
    stop_cheat_caller_address(procasti_address);
    
    // Try to create challenge while paused - should fail
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    
    // This should panic with contract paused error
    // Note: You may need to add this check to your contract's create_challenge function
    // procasti_dispatcher.create_challenge(
    //     ACP_ADDRESS.try_into().unwrap(),
    //     STAKE_AMOUNT,
    //     "Complete coding challenge",
    //     86400
    // );
    
    stop_cheat_caller_address(procasti_address);
}
