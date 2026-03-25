import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";

const WalletContext = createContext(null);

const MONAD_MAINNET = {
  chainId: "0x8f",  // 143 in hex
  chainName: "Monad Mainnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://rpc.monad.xyz"],
  blockExplorerUrls: ["https://monadexplorer.com"],
};

export function WalletProvider({ children }) {
  const [address,    setAddress]    = useState(null);
  const [provider,   setProvider]   = useState(null);
  const [signer,     setSigner]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const eth = window.ethereum;
    if (!eth) { setError("No wallet found. Install MetaMask or Rabby."); return; }
    setConnecting(true); setError(null);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: MONAD_MAINNET.chainId }] });
      } catch(sw) {
        if (sw.code === 4902) await eth.request({ method: "wallet_addEthereumChain", params: [MONAD_MAINNET] });
      }
      const p   = new ethers.BrowserProvider(eth);
      const s   = await p.getSigner();
      const a   = await s.getAddress();
      setProvider(p); setSigner(s); setAddress(a);

      eth.on("accountsChanged", accs => { if (accs.length === 0) disconnect(); else setAddress(accs[0]); });
      eth.on("chainChanged",    ()   => window.location.reload());
    } catch(e) { setError(e.message); }
    finally { setConnecting(false); }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null); setProvider(null); setSigner(null);
  }, []);

  const shortAddress = address ? `${address.slice(0,6)}…${address.slice(-4)}` : null;

  return (
    <WalletContext.Provider value={{ address, shortAddress, provider, signer, isConnected:!!address, connecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}
