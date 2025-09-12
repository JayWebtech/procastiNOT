export const MY_CONTRACT_ABI = [
  {
    "name": "ProcastiNotV1Impl",
    "type": "impl",
    "interface_name": "contracts::interface::IProcastiNot::IProcastiNot"
  },
  {
    "name": "core::integer::u256",
    "type": "struct",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "name": "core::byte_array::ByteArray",
    "type": "struct",
    "members": [
      {
        "name": "data",
        "type": "core::array::Array::<core::bytes_31::bytes31>"
      },
      {
        "name": "pending_word",
        "type": "core::felt252"
      },
      {
        "name": "pending_word_len",
        "type": "core::integer::u32"
      }
    ]
  },
  {
    "name": "core::bool",
    "type": "enum",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "name": "contracts::base::types::ChallengeStatus",
    "type": "enum",
    "variants": [
      {
        "name": "Created",
        "type": "()"
      },
      {
        "name": "Locked",
        "type": "()"
      },
      {
        "name": "ACPApproved",
        "type": "()"
      },
      {
        "name": "ACPRejected",
        "type": "()"
      },
      {
        "name": "Disputed",
        "type": "()"
      },
      {
        "name": "Resolved",
        "type": "()"
      }
    ]
  },
  {
    "name": "contracts::base::types::Challenge",
    "type": "struct",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u64"
      },
      {
        "name": "task",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "acp",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "staker",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "stake_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "status",
        "type": "contracts::base::types::ChallengeStatus"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "time_limit",
        "type": "core::integer::u64"
      },
      {
        "name": "acp_decision_at",
        "type": "core::integer::u64"
      },
      {
        "name": "dispute_raised_at",
        "type": "core::integer::u64"
      },
      {
        "name": "proof_cid",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "name": "contracts::base::types::CaseStatus",
    "type": "enum",
    "variants": [
      {
        "name": "VotePhase",
        "type": "()"
      },
      {
        "name": "Resolved",
        "type": "()"
      },
      {
        "name": "JurorEnrollment",
        "type": "()"
      }
    ]
  },
  {
    "name": "contracts::base::types::Case",
    "type": "struct",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u64"
      },
      {
        "name": "challenge_id",
        "type": "core::integer::u64"
      },
      {
        "name": "status",
        "type": "contracts::base::types::CaseStatus"
      },
      {
        "name": "task",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "stake_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "jurors",
        "type": "core::integer::u64"
      },
      {
        "name": "total_juror_stake",
        "type": "core::integer::u256"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "enrollment_end",
        "type": "core::integer::u64"
      },
      {
        "name": "total_votes",
        "type": "core::integer::u64"
      },
      {
        "name": "proof_cid",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "name": "contracts::base::types::Juror",
    "type": "struct",
    "members": [
      {
        "name": "address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "reputation",
        "type": "core::integer::u64"
      },
      {
        "name": "stake_committed",
        "type": "core::integer::u256"
      },
      {
        "name": "vote_committed",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "name": "contracts::interface::IProcastiNot::IProcastiNot",
    "type": "interface",
    "items": [
      {
        "name": "create_challenge",
        "type": "function",
        "inputs": [
          {
            "name": "acp",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "stake_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "task",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "time_limit",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "external"
      },
      {
        "name": "submit_proof",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          },
          {
            "name": "proof_cid",
            "type": "core::byte_array::ByteArray"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "acp_approve",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "acp_reject",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "juror_vote",
        "type": "function",
        "inputs": [
          {
            "name": "case_id",
            "type": "core::integer::u64"
          },
          {
            "name": "vote",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_challenge",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "contracts::base::types::Challenge"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_case",
        "type": "function",
        "inputs": [
          {
            "name": "case_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "contracts::base::types::Case"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_juror_info",
        "type": "function",
        "inputs": [
          {
            "name": "juror",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "contracts::base::types::Juror"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_treasury_balance",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_owner",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "change_owner",
        "type": "function",
        "inputs": [
          {
            "name": "new_owner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "upgrade",
        "type": "function",
        "inputs": [
          {
            "name": "impl_hash",
            "type": "core::starknet::class_hash::ClassHash"
          },
          {
            "name": "new_version",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_version",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u8"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "pause",
        "type": "function",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "unpause",
        "type": "function",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_contract_status",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_token_addr",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_protocol_fee",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "change_protocol_fee",
        "type": "function",
        "inputs": [
          {
            "name": "new_fee",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "staker_claims",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "acp_claims",
        "type": "function",
        "inputs": [
          {
            "name": "challenge_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_challenge_by_acp",
        "type": "function",
        "inputs": [
          {
            "name": "acp",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<contracts::base::types::Challenge>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_challenge_by_staker",
        "type": "function",
        "inputs": [
          {
            "name": "staker",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<contracts::base::types::Challenge>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_challenge_ids_by_staker",
        "type": "function",
        "inputs": [
          {
            "name": "staker",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<core::integer::u64>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_all_cases",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Array::<contracts::base::types::Case>"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "name": "constructor",
    "type": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::ChallengeCreated",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "challenge_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "staker",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "kind": "data",
        "name": "acp",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "kind": "data",
        "name": "stake_amount",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::ProofSubmitted",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "challenge_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "proof_cid",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::ACPApproved",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "challenge_id",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::ACPRejected",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "challenge_id",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::DisputeRaised",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "challenge_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "case_id",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::VoteCommitted",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "case_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "juror",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::CaseResolved",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "case_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "unanimous",
        "type": "core::bool"
      },
      {
        "kind": "data",
        "name": "staker_wins",
        "type": "core::bool"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::Upgraded",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "implementation",
        "type": "core::starknet::class_hash::ClassHash"
      }
    ]
  },
  {
    "kind": "struct",
    "name": "contracts::base::events::DebugBalance",
    "type": "event",
    "members": [
      {
        "kind": "data",
        "name": "case_id",
        "type": "core::integer::u64"
      },
      {
        "kind": "data",
        "name": "contract_balance",
        "type": "core::integer::u256"
      },
      {
        "kind": "data",
        "name": "total_payout",
        "type": "core::integer::u256"
      },
      {
        "kind": "data",
        "name": "juror_stake",
        "type": "core::integer::u256"
      },
      {
        "kind": "data",
        "name": "fee",
        "type": "core::integer::u256"
      },
      {
        "kind": "data",
        "name": "acp_amount",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "kind": "enum",
    "name": "contracts::ProcastiNot::ProcastiNotV12::Event",
    "type": "event",
    "variants": [
      {
        "kind": "nested",
        "name": "ChallengeCreated",
        "type": "contracts::base::events::ChallengeCreated"
      },
      {
        "kind": "nested",
        "name": "ProofSubmitted",
        "type": "contracts::base::events::ProofSubmitted"
      },
      {
        "kind": "nested",
        "name": "ACPApproved",
        "type": "contracts::base::events::ACPApproved"
      },
      {
        "kind": "nested",
        "name": "ACPRejected",
        "type": "contracts::base::events::ACPRejected"
      },
      {
        "kind": "nested",
        "name": "DisputeRaised",
        "type": "contracts::base::events::DisputeRaised"
      },
      {
        "kind": "nested",
        "name": "VoteCommitted",
        "type": "contracts::base::events::VoteCommitted"
      },
      {
        "kind": "nested",
        "name": "CaseResolved",
        "type": "contracts::base::events::CaseResolved"
      },
      {
        "kind": "nested",
        "name": "Upgraded",
        "type": "contracts::base::events::Upgraded"
      },
      {
        "kind": "nested",
        "name": "DebugBalance",
        "type": "contracts::base::events::DebugBalance"
      }
    ]
  }
]