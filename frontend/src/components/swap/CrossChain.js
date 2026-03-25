import { useState } from "react";
import { ArrowLeftRight, ExternalLink, Info } from "lucide-react";

const AFFILIATE_ID = "G4nvHmbdX";
const SIDESHIFT_URL = `https://sideshift.ai/a/${AFFILIATE_ID}`;

// Popular pairs for quick selection
const QUICK_PAIRS = [
  { from:"BTC",  to:"MON",  label:"BTC → MON"  },
  { from:"ETH",  to:"MON",  label:"ETH → MON"  },
  { from:"USDC", to:"MON",  label:"USDC → MON" },
  { from:"SOL",  to:"MON",  label:"SOL → MON"  },
  { from:"MON",  to:"BTC",  label:"MON → BTC"  },
  { from:"MON",  to:"ETH",  label:"MON → ETH"  },
  { from:"MON",  to:"USDC", label:"MON → USDC" },
];

export default function CrossChain() {
  const [selectedPair, setSelectedPair] = useState(QUICK_PAIRS[0]);
  const [iframeKey,    setIframeKey]    = useState(0);

  const iframeUrl = `${SIDESHIFT_URL}?from=${selectedPair.from}&to=${selectedPair.to}`;

  function selectPair(pair) {
    setSelectedPair(pair);
    setIframeKey(k => k + 1);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="card" style={{ padding:"16px 20px" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold flex items-center gap-2" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>
              <ArrowLeftRight size={18} className="text-primary" />
              CROSS-CHAIN SWAP
            </h2>
            <p className="text-xs text-muted mt-0.5" style={{ fontFamily:"'Space Mono',monospace" }}>
              Powered by SideShift.ai · Swap any coin to Monad & back
            </p>
          </div>
          <a href={SIDESHIFT_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            style={{ fontFamily:"'Space Mono',monospace" }}>
            Open in SideShift <ExternalLink size={11} />
          </a>
        </div>

        {/* Quick pair buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_PAIRS.map(pair => (
            <button key={pair.label} onClick={() => selectPair(pair)}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                selectedPair.label === pair.label
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted border-border hover:text-text hover:border-border/80"
              }`}
              style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>
              {pair.label}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-black/30 border border-border/50 text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
          <Info size={13} className="text-primary flex-shrink-0 mt-0.5" />
          <span>
            Cross-chain swaps via SideShift.ai. No account needed. Affiliate fees support SwapZone development.
            SwapZone earns a small commission on each swap at no extra cost to you.
          </span>
        </div>
      </div>

      {/* SideShift iframe */}
      <div className="card" style={{ padding:0, overflow:"hidden", borderRadius:16 }}>
        <div style={{ position:"relative", height:600, background:"#0A0A0A" }}>
          <iframe
            key={iframeKey}
            src={iframeUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="SideShift Cross-Chain Swap"
            style={{ display:"block", border:"none", borderRadius:16 }}
            allow="clipboard-write"
          />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted/40" style={{ fontFamily:"'Space Mono',monospace" }}>
        SwapZone is not responsible for cross-chain swaps. Always verify addresses. Use at your own risk.
      </p>
    </div>
  );
}
