use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_block_timestamp, stop_cheat_block_timestamp, start_cheat_caller_address,
    stop_cheat_caller_address,
};

use starknet::ContractAddress;

use contracts::{IProcastiNotDispatcher, IProcastiNotDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// Test constants
pub const STAKER_ADDRESS: felt252 = 0x123;
pub const ACP_ADDRESS: felt252 = 0x456;
pub const JUROR1_ADDRESS: felt252 = 0x789;
pub const JUROR2_ADDRESS: felt252 = 0xABC;
pub const JUROR3_ADDRESS: felt252 = 0xDEF;
pub const JUROR4_ADDRESS: felt252 = 0x111;
pub const JUROR5_ADDRESS: felt252 = 0x222;
pub const OWNER_ADDRESS: felt252 = 0x999;
pub const TREASURY_ADDRESS: felt252 = 0x888;

pub const INITIAL_SUPPLY: u256 = 1000000;
pub const STAKE_AMOUNT: u256 = 1000;
pub const JUROR_STAKE: u256 = 200; // STAKE_AMOUNT / 5

// Utility functions for test setup

pub fn deploy_contracts() -> (IProcastiNotDispatcher, IERC20Dispatcher, ContractAddress) {
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

pub fn setup_accounts_and_approvals(
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

pub fn create_challenge_with_proof(
    procasti_dispatcher: IProcastiNotDispatcher,
    procasti_address: ContractAddress,
    task: ByteArray,
    time_limit: u64,
) -> u64 {
    start_cheat_caller_address(procasti_address, STAKER_ADDRESS.try_into().unwrap());
    
    let challenge_id = procasti_dispatcher.create_challenge(
        ACP_ADDRESS.try_into().unwrap(),
        STAKE_AMOUNT,
        task,
        time_limit
    );
    
    procasti_dispatcher.submit_proof(challenge_id, 0x12345);
    
    stop_cheat_caller_address(procasti_address);
    
    challenge_id
}

pub fn create_dispute(
    procasti_dispatcher: IProcastiNotDispatcher,
    procasti_address: ContractAddress,
    challenge_id: u64,
) -> u64 {
    start_cheat_caller_address(procasti_address, ACP_ADDRESS.try_into().unwrap());
    procasti_dispatcher.acp_reject(challenge_id);
    stop_cheat_caller_address(procasti_address);
    
    1 // First case ID
}

pub fn enroll_jurors_with_votes(
    procasti_dispatcher: IProcastiNotDispatcher,
    procasti_address: ContractAddress,
    case_id: u64,
    votes: Array<bool>,
) {
    let jurors = array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS];
    
    for i in 0..jurors.len() {
        let juror_addr: ContractAddress = jurors.at(i).read().try_into().unwrap();
        let vote = votes.at(i).read();
        
        start_cheat_caller_address(procasti_address, juror_addr);
        procasti_dispatcher.juror_vote(case_id, vote);
        stop_cheat_caller_address(procasti_address);
    }
}

pub fn create_full_dispute_scenario(
    procasti_dispatcher: IProcastiNotDispatcher,
    token_dispatcher: IERC20Dispatcher,
    procasti_address: ContractAddress,
) -> (u64, u64) {
    // Create challenge and submit proof
    let challenge_id = create_challenge_with_proof(
        procasti_dispatcher,
        procasti_address,
        "Complete coding challenge",
        86400
    );
    
    // ACP rejects, creating dispute
    let case_id = create_dispute(procasti_dispatcher, procasti_address, challenge_id);
    
    (challenge_id, case_id)
}

pub fn assert_balance_change(
    token_dispatcher: IERC20Dispatcher,
    address: ContractAddress,
    expected_change: u256,
    initial_balance: u256,
) {
    let final_balance = token_dispatcher.balance_of(address);
    let actual_change = final_balance - initial_balance;
    assert(actual_change == expected_change, 'Balance change does not match expected');
}

pub fn get_juror_addresses() -> Array<felt252> {
    array![JUROR1_ADDRESS, JUROR2_ADDRESS, JUROR3_ADDRESS, JUROR4_ADDRESS, JUROR5_ADDRESS]
}

pub fn get_staker_votes() -> Array<bool> {
    array![true, true, false, true, true] // 4 approve, 1 reject (staker wins)
}

pub fn get_acp_votes() -> Array<bool> {
    array![false, false, false, true, true] // 3 reject, 2 approve (ACP wins)
}

pub fn get_unanimous_staker_votes() -> Array<bool> {
    array![true, true, true, true, true] // All approve (unanimous staker win)
}

pub fn get_unanimous_acp_votes() -> Array<bool> {
    array![false, false, false, false, false] // All reject (unanimous ACP win)
}
