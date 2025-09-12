export interface TokenOption {
    symbol: string;
    address: string;
    decimals: number;
  }
  
  export const MAINNET_SUPPORTED_TOKENS = Object.freeze({
    STRK: {
      symbol: "STRK",
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      decimals: 18,
    },
  }) as Readonly<Record<string, Readonly<TokenOption>>>;
  
  export const TESTNET_SUPPORTED_TOKENS = Object.freeze({
    STRK: {
      symbol: "STRK",
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      decimals: 18,
    },
  }) as Readonly<Record<string, Readonly<TokenOption>>>;
  
  export const TESTNET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS;
  export const MAINNET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS;
  
  export const getContractAddress = (isMainnet: boolean) => 
    isMainnet ? MAINNET_CONTRACT_ADDRESS : TESTNET_CONTRACT_ADDRESS;
  
  export const getSupportedTokens = (isMainnet: boolean) => 
    isMainnet ? MAINNET_SUPPORTED_TOKENS : TESTNET_SUPPORTED_TOKENS; 