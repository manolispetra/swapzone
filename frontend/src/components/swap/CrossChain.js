import { useState, useEffect } from "react";
import { ExternalLink, ArrowLeftRight } from "lucide-react";

const AFFILIATE = "G4nvHmbdX";

const QUICK_PAIRS = [
  { from:"BTC",  to:"MON",  label:"BTC → MON"  },
  { from:"ETH",  to:"MON",  label:"ETH → MON"  },
  { from:"SOL",  to:"MON",  label:"SOL → MON"  },
  { from:"USDC", to:"MON",  label:"USDC → MON" },
  { from:"MON",  to:"BTC",  label:"MON → BTC"  },
  { from:"MON",  to:"ETH",  label:"MON → ETH"  },
  { from:"MON",  to:"USDC", label:"MON → USDC" },
  { from:"XMR",  to:"MON",  label:"XMR → MON"  },
  { from:"LTC",  to:"MON",  label:"LTC → MON"  },
  { from:"MATIC",to:"MON",  label:"MATIC → MON"},
];

export default function CrossChain() {
  const [from, setFrom] = useState("BTC");
  const [to,   setTo]   = useState("MON");
  const [key,  setKey]  = useState(0);

  // Build SideShift widget URL with affiliate + preset pair
  const widgetUrl = `https://sideshift.ai/a/${AFFILIATE}?from=${from}&to=${to}`;

  function selectPair(pair) {
    setFrom(pair.from);
    setTo(pair.to);
    setKey(k => k + 1);
  }

  // Load SideShift widget script once
  useEffect(() => {
    if (document.getElementById("sideshift-script")) return;
    const script = document.createElement("script");
    script.id  = "sideshift-script";
    script.src = "https://sideshift.ai/static/js/main.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="card" style={{ padding:"16px 20px" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold flex items-center gap-2"
              style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>
              <ArrowLeftRight size={18} className="text-primary"/>
              CROSS-CHAIN SWAP
            </h2>
            <p className="text-xs text-muted mt-0.5" style={{ fontFamily:"Space Mono,monospace" }}>
              Powered by SideShift.ai · Swap any coin to/from Monad
            </p>
          </div>
          <a href={widgetUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            style={{ fontFamily:"Space Mono,monospace" }}>
            Open full screen <ExternalLink size={11}/>
          </a>
        </div>

        {/* Quick pair buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PAIRS.map(pair => (
            <button key={pair.label}
              onClick={() => selectPair(pair)}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                from === pair.from && to === pair.to
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted border-border hover:text-text hover:border-border/80"
              }`}
              style={{ fontFamily:"Space Mono,monospace", fontSize:11 }}>
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* SideShift iframe embed — official supported method */}
      <div className="card" style={{ padding:0, overflow:"hidden", borderRadius:16 }}>
        <iframe
          key={key}
          src={widgetUrl}
          width="100%"
          height="620"
          frameBorder="0"
          title="SideShift.ai Cross-Chain Swap"
          style={{ display:"block", border:"none", borderRadius:16 }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
          allow="clipboard-write"
        />
      </div>

      <p className="text-center text-xs text-muted/30" style={{ fontFamily:"Space Mono,monospace" }}>
        Non-custodial · No account needed · SwapZone earns affiliate commission at no extra cost
      </p>
    </div>
  );
}
