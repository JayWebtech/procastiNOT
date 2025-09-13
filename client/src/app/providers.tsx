'use client';
import { ReactNode, useCallback } from 'react';
import { ArgentMobileConnector } from 'starknetkit/argentMobile';
import { WebWalletConnector } from 'starknetkit/webwallet';
import { sepolia, mainnet, Chain } from '@starknet-react/chains';
import {
  argent,
  braavos,
  Connector,
  StarknetConfig,
  starkscan,
  useInjectedConnectors,
} from '@starknet-react/core';

import { jsonRpcProvider } from '@starknet-react/core';
import ToastProvider from '../components/ui/ToastProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const chains = [mainnet, sepolia];
  const { connectors: injected } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'always',
  });

  const rpc = useCallback((chain: Chain) => {
    return {
      nodeUrl: `https://starknet-mainnet.public.blastapi.io`,
      //nodeUrl: `https://starknet-sepolia.public.blastapi.io`
    };
  }, []);

  const provider = jsonRpcProvider({ rpc });

  const ArgentMobile = ArgentMobileConnector.init({
    options: {
      dappName: 'Token bound explorer',
      url: 'https://www.tbaexplorer.com/',
    },
    inAppBrowserOptions: {},
  });

  const connectors = [
    ...injected,
    new WebWalletConnector({
      url: 'https://web.argent.xyz',
    }) as never as Connector,
    ArgentMobile as never as Connector,
  ];
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      explorer={starkscan}
      autoConnect={true}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </StarknetConfig>
  );
}
