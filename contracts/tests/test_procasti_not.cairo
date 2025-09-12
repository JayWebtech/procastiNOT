use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_block_timestamp, stop_cheat_block_timestamp, start_cheat_caller_address,
    stop_cheat_caller_address, start_cheat_block_number, stop_cheat_block_number,
};
use snforge_std::{EventSpyAssertionsTrait, spy_events};

use starknet::ContractAddress;
use starknet::contract_address_const;

use contracts::{IProcastiNotDispatcher, IProcastiNotDispatcherTrait};
use contracts::ProcastiNotV1::{ChallengeCreated, ProofSubmitted, ACPApproved, ACPRejected, 
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
const TREASURY_ADDRESS: felt252 = 0x888;

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
fn test_contract_deployment() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    // Test initial state
    let owner = procasti_dispatcher.get_owner();
    assert(owner == OWNER_ADDRESS.try_into().unwrap(), 'Wrong owner');
    
    let version = procasti_dispatcher.get_version();
    assert(version == 1, 'Wrong version');
    
    let is_paused = procasti_dispatcher.get_contract_status();
    assert(!is_paused, 'Contract should not be paused');
    
    let treasury = procasti_dispatcher.get_treasury_balance();
    assert(treasury == 0, 'Treasury should be empty');
}

#[test]
fn test_create_challenge() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    
    let task = "Complete coding challenge";
    let time_limit = 86400; // 1 day
    let acp_address = ACP_ADDRESS.try_into().unwrap();
    
    let challenge_id = procasti_dispatcher.create_challenge(
        acp_address,
        STAKE_AMOUNT,
        task,
        time_limit
    );
    
    stop_cheat_caller_address(procasti_address);
    
    // Verify challenge creation
    assert(challenge_id == 1, 'Wrong challenge ID');
    
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.id == challenge_id, 'Wrong challenge ID');
    assert(challenge.staker == STAKER_ADDRESS.try_into().unwrap(), 'Wrong staker');
    assert(challenge.acp == acp_address, 'Wrong ACP');
    assert(challenge.stake_amount == STAKE_AMOUNT, 'Wrong stake amount');
    assert(challenge.status == ChallengeStatus::Created, 'Wrong status');
    assert(challenge.time_limit == time_limit, 'Wrong time limit');
    
    // Verify event emission
    let expected_event = contracts::ProcastiNotV1::Event::ChallengeCreated(
        ChallengeCreated {
            challenge_id,
            staker: STAKER_ADDRESS.try_into().unwrap(),
            acp: acp_address,
            stake_amount: STAKE_AMOUNT,
        }
    );
    let expected_events = array![(procasti_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
fn test_submit_proof() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    // Create challenge first
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    
    // Submit proof
    let proof_cid = 0x12345;
    procasti_dispatcher.submit_proof(challenge_id, proof_cid);
    stop_cheat_caller_address(procasti_address);
    
    // Verify challenge status
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.status == ChallengeStatus::Locked, 'Status should be Locked');
    assert(challenge.proof_cid == proof_cid, 'Wrong proof CID');
    
    // Verify event emission
    let expected_event = contracts::ProcastiNotV1::Event::ProofSubmitted(
        ProofSubmitted { challenge_id, proof_cid }
    );
    let expected_events = array![(procasti_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
fn test_acp_approve() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    // Create challenge and submit proof
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    // ACP approves
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_approve(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Verify challenge status
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.status == ChallengeStatus::ACPApproved, 'Status should be ACPApproved');
    assert(challenge.acp_decision_at > 0, 'Decision timestamp should be set');
    
    // Verify event emission
    let expected_event = contracts::ProcastiNotV1::Event::ACPApproved(
        ACPApproved { challenge_id }
    );
    let expected_events = array![(procasti_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
fn test_acp_reject_and_dispute() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    // Create challenge and submit proof
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    // ACP rejects
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    // Verify challenge and case status
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.status == ChallengeStatus::ACPRejected, 'Status should be ACPRejected');
    
    let case_id = 1; // First case created
    let case = procasti_dispatcher.get_case(case_id);
    assert(case.challenge_id == challenge_id, 'Wrong challenge ID in case');
    assert(case.status == CaseStatus::JurorEnrollment, 'Case should be in enrollment phase');
    assert(case.jurors == 0, 'No jurors enrolled yet');
    assert(case.stake_amount == STAKE_AMOUNT, 'Wrong stake amount in case');
    
    // Verify event emissions
    let expected_events = array![
        (procasti_address, contracts::ProcastiNotV1::Event::ACPRejected(ACPRejected { challenge_id })),
        (procasti_address, contracts::ProcastiNotV1::Event::DisputeRaised(DisputeRaised { challenge_id, case_id }))
    ];
    spy.assert_emitted(@expected_events);
}

#[test]
fn test_juror_enrollment_and_voting() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    // Create challenge, submit proof, and reject
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
    
    // Enroll jurors
    let jurors = array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    let votes = array![true, true, false, true, true]; // 4 approve, 1 reject
    
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        let vote = votes.at(i).read();
        
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(1, vote); // case_id = 1
        stop_cheat_caller_address(procasti_address);
    }
    
    // Verify case resolution
    let case = procasti_dispatcher.get_case(1);
    assert(case.status == CaseStatus::Resolved, 'Case should be resolved');
    assert(case.jurors == 5, 'All 5 jurors should be enrolled');
    
    // Verify final challenge status
    let challenge = procasti_dispatcher.get_challenge(challenge_id);
    assert(challenge.status == ChallengeStatus::Resolved, 'Challenge should be resolved');
}

#[test]
fn test_unanimous_juror_decision() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    let mut spy = spy_events();
    
    // Create challenge, submit proof, and reject
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
    
    // All jurors vote unanimously for staker (approve)
    let jurors = array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(1, true); // All approve
        stop_cheat_caller_address(procasti_address);
    }
    
    // Verify unanimous decision event
    let expected_event = contracts::ProcastiNotV1::Event::CaseResolved(
        CaseResolved { case_id: 1, unanimous: true, staker_wins: true }
    );
    let expected_events = array![(procasti_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
#[should_panic(expected: ('Amount must be greater than 0',))]
fn test_create_challenge_zero_stake() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        0, // Zero stake
        "Complete coding challenge",
        86400
    );
}

#[test]
#[should_panic(expected: ('ACP and staker is the same',))]
fn test_create_challenge_same_staker_acp() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    procasti_dispatcher.create_challenge(
        STAKER_ADDRESS.try_into().unwrap(), // Same as staker
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
}

#[test]
#[should_panic(expected: ('Not ACP',))]
fn test_acp_approve_wrong_caller() {
    let (procasti_dispatcher, token_dispatcher, procasti_address) = deploy_contracts();
    setup_accounts_and_approvals(procasti_dispatcher, token_dispatcher);
    
    // Create challenge and submit proof
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        "Complete coding challenge",
        86400
    );
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    stop_cheat_caller_address(procasti_address);
    
    // Wrong caller tries to approve
    start_cheat_caller_address(procasti_address, JUROR1_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_approve(challenge_id);
}

#[test]
fn test_contract_pause_unpause() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    // Owner pauses contract
    start_cheat_caller_address(procasti_address, OWNER_ADDRESS.try_into().unwrap());
    procasti_dispatcher.pause();
    
    let is_paused = procasti_dispatcher.get_contract_status();
    assert(is_paused, 'Contract should be paused');
    
    // Owner unpauses contract
    procasti_dispatcher.unpause();
    
    let is_paused = procasti_dispatcher.get_contract_status();
    assert(!is_paused, 'Contract should not be paused');
    
    stop_cheat_caller_address(procasti_address);
}

#[test]
#[should_panic(expected: ('Unauthorized caller',))]
fn test_non_owner_cannot_pause() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    procasti_dispatcher.pause();
}

#[test]
fn test_owner_functions() {
    let (procasti_dispatcher, _token_dispatcher, procasti_address) = deploy_contracts();
    
    start_cheat_caller_address(procasti_address, OWNER_ADDRESS.try_into().unwrap());
    
    // Test change owner
    let new_owner = 0x777.try_into().unwrap();
    procasti_dispatcher.change_owner(new_owner);
    
    let owner = procasti_dispatcher.get_owner();
    assert(owner == new_owner, 'Owner should be changed');
    
    // Test change protocol fee
    let new_fee = 1000000; // 1%
    procasti_dispatcher.change_protocol_fee(new_fee);
    
    let fee = procasti_dispatcher.get_protocol_fee();
    assert(fee == new_fee, 'Protocol fee should be changed');
    
    stop_cheat_caller_address(procasti_address);
}
