export const ABI = [
  {
    "type": "impl",
    "name": "ProcastiNotV1Impl",
    "interface_name": "contracts::interface::IProcastiNot::IProcastiNot"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
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
    "type": "struct",
    "name": "core::byte_array::ByteArray",
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
    "type": "enum",
    "name": "core::bool",
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
    "type": "enum",
    "name": "contracts::base::types::ChallengeStatus",
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
    "type": "struct",
    "name": "contracts::base::types::Challenge",
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
    "type": "enum",
    "name": "contracts::base::types::CaseStatus",
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
    "type": "struct",
    "name": "contracts::base::types::Case",
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
    "type": "struct",
    "name": "contracts::base::types::Juror",
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
    "type": "interface",
    "name": "contracts::interface::IProcastiNot::IProcastiNot",
    "items": [
      {
        "type": "function",
        "name": "create_challenge",
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
        "type": "function",
        "name": "submit_proof",
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
        "type": "function",
        "name": "acp_approve",
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
        "type": "function",
        "name": "acp_reject",
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
        "type": "function",
        "name": "juror_vote",
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
        "type": "function",
        "name": "get_challenge",
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
        "type": "function",
        "name": "get_case",
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
        "type": "function",
        "name": "get_juror_info",
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
        "type": "function",
        "name": "get_treasury_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_owner",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "change_owner",
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
        "type": "function",
        "name": "upgrade",
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
        "type": "function",
        "name": "get_version",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u8"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "pause",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "unpause",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_contract_status",
        "inputs": [],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_token_addr",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_protocol_fee",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "change_protocol_fee",
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
        "type": "function",
        "name": "staker_claims",
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
        "type": "function",
        "name": "acp_claims",
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
        "type": "function",
        "name": "get_challenge_by_acp",
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
        "type": "function",
        "name": "get_challenge_by_staker",
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
        "type": "function",
        "name": "get_challenge_ids_by_staker",
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
        "type": "function",
        "name": "get_all_cases",
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
    "type": "constructor",
    "name": "constructor",
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
    "type": "event",
    "name": "contracts::base::events::ChallengeCreated",
    "kind": "struct",
    "members": [
      {
        "name": "challenge_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "staker",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "acp",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "stake_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::ProofSubmitted",
    "kind": "struct",
    "members": [
      {
        "name": "challenge_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "proof_cid",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::ACPApproved",
    "kind": "struct",
    "members": [
      {
        "name": "challenge_id",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::ACPRejected",
    "kind": "struct",
    "members": [
      {
        "name": "challenge_id",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::DisputeRaised",
    "kind": "struct",
    "members": [
      {
        "name": "challenge_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "case_id",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::VoteCommitted",
    "kind": "struct",
    "members": [
      {
        "name": "case_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "juror",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::CaseResolved",
    "kind": "struct",
    "members": [
      {
        "name": "case_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "unanimous",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "staker_wins",
        "type": "core::bool",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::base::events::Upgraded",
    "kind": "struct",
    "members": [
      {
        "name": "implementation",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::ProcastiNot::ProcastiNotV10::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "ChallengeCreated",
        "type": "contracts::base::events::ChallengeCreated",
        "kind": "nested"
      },
      {
        "name": "ProofSubmitted",
        "type": "contracts::base::events::ProofSubmitted",
        "kind": "nested"
      },
      {
        "name": "ACPApproved",
        "type": "contracts::base::events::ACPApproved",
        "kind": "nested"
      },
      {
        "name": "ACPRejected",
        "type": "contracts::base::events::ACPRejected",
        "kind": "nested"
      },
      {
        "name": "DisputeRaised",
        "type": "contracts::base::events::DisputeRaised",
        "kind": "nested"
      },
      {
        "name": "VoteCommitted",
        "type": "contracts::base::events::VoteCommitted",
        "kind": "nested"
      },
      {
        "name": "CaseResolved",
        "type": "contracts::base::events::CaseResolved",
        "kind": "nested"
      },
      {
        "name": "Upgraded",
        "type": "contracts::base::events::Upgraded",
        "kind": "nested"
      }
    ]
  }
] as const;
