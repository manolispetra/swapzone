import { useAccount, useDisconnect, useWalletClient, usePublicClient } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useMemo } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const signer = useMemo(() => {
    if (!walletClient) return null;
    try {
      const { account, chain, transport } = walletClient;
      const network = { chainId: chain.id, name: chain.name, ensAddress: null };
      const provider = new ethers.BrowserProvider(transport, network);
      return new ethers.JsonRpcSigner(provider, account.address);
    } catch { return null; }
  }, [walletClient]);

  const provider = useMemo(() => {
    if (!publicClient) return null;
    try {
      return new ethers.BrowserProvider(publicClient.transport);
    } catch { return null; }
  }, [publicClient]);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    address,
    shortAddress,
    isConnected,
    chain,
    signer,
    provider,
    connect:    () => open(),
    disconnect: () => disconnect(),
  };
}
