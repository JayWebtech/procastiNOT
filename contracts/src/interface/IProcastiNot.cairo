use starknet::ContractAddress;
use starknet::class_hash::ClassHash;
use crate::base::types::{Challenge, Juror, Case};

#[starknet::interface]
pub trait IProcastiNot<TContractState> {
    fn create_challenge(ref self: TContractState, acp: ContractAddress, stake_amount: u256, task: ByteArray, time_limit: u64) -> u64;
    fn submit_proof(ref self: TContractState, challenge_id: u64, proof_cid: ByteArray);
    fn acp_approve(ref self: TContractState, challenge_id: u64);
    fn acp_reject(ref self: TContractState, challenge_id: u64);
    fn juror_vote(ref self: TContractState, case_id: u64, vote: bool);
    fn get_challenge(self: @TContractState, challenge_id: u64) -> Challenge;
    fn get_case(self: @TContractState, case_id: u64) -> Case;
    fn get_juror_info(self: @TContractState, juror: ContractAddress) -> Juror;
    fn get_treasury_balance(self: @TContractState) -> u256;
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn change_owner(ref self: TContractState, new_owner: ContractAddress);
    fn upgrade(ref self: TContractState, impl_hash: ClassHash, new_version: u8);
    fn get_version(self: @TContractState) -> u8;
    fn pause(ref self: TContractState);
    fn unpause(ref self: TContractState);
    fn get_contract_status(self: @TContractState) -> bool;
    fn get_token_addr(self: @TContractState) -> ContractAddress;
    fn get_protocol_fee(self: @TContractState) -> u256;
    fn change_protocol_fee(ref self: TContractState, new_fee: u256);
    fn staker_claims(ref self: TContractState, challenge_id: u64);
    fn acp_claims(ref self: TContractState, challenge_id: u64);
    fn get_challenge_by_acp(self: @TContractState, acp: ContractAddress) -> Array<Challenge>;
    fn get_challenge_by_staker(self: @TContractState, staker: ContractAddress) -> Array<Challenge>;
    fn get_challenge_ids_by_staker(self: @TContractState, staker: ContractAddress) -> Array<u64>;
    fn get_all_cases(self: @TContractState) -> Array<Case>;
}