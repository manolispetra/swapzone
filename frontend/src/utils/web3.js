import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Monad Mainnet chain definition ─────────────────────────────────────────────
export const monadMainnet = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
    public:  { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://monadexplorer.com" },
  },
};

// ── WalletConnect Project ID ───────────────────────────────────────────────────
// Get yours free at https://cloud.walletconnect.com
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

const metadata = {
  name:        "SwapZone DEX",
  description: "Next-gen DEX on Monad",
  url:         "https://swapzone.vercel.app",
  icons:       ["https://swapzone.vercel.app/logo.png"],
};

export const wagmiConfig = defaultWagmiConfig({
  chains:    [monadMainnet],
  projectId: WC_PROJECT_ID,
  metadata,
  ssr: true,
});

// Init Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId:      WC_PROJECT_ID,
  chains:         [monadMainnet],
  defaultNetwork: monadMainnet,
  themeMode:      "dark",
  themeVariables: {
    "--w3m-accent":           "#00FFD1",
    "--w3m-background-color": "#0A0A0A",
    "--w3m-border-radius-master": "12px",
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
