import Layout from "../components/ui/Layout";
import SwapWidget from "../components/swap/SwapWidget";
import Logo from "../components/ui/Logo";

export default function SwapPage() {
  return (
    <Layout title="Swap">
      <div className="min-h-[calc(100vh-5rem)] flex flex-col">
        {/* Hero */}
        <div className="text-center pt-12 pb-10">
          <div className="flex justify-center mb-4">
            <Logo size={56} className="animate-float" />
          </div>
          <h1 className="text-5xl font-bold mb-3 neon-text" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.04em" }}>
            SWAPZONE
          </h1>
          <p className="text-muted text-sm max-w-xs mx-auto" style={{ fontFamily: "'Space Mono', monospace" }}>
            Next-gen DEX on Monad. Instant swaps, deep liquidity, zero compromises.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-10 flex-wrap">
          {[
            { label: "Network",     value: "Monad Testnet" },
            { label: "AMM Model",   value: "x · y = k"    },
            { label: "Default Fee", value: "0.30%"         },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>{label}</div>
              <div className="font-bold neon-text" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, letterSpacing: "0.06em" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Swap widget */}
        <div className="flex justify-center">
          <SwapWidget />
        </div>

        {/* Decorative bottom */}
        <div className="mt-auto pt-16 pb-4 text-center">
          <p className="text-xs text-muted/40" style={{ fontFamily: "'Space Mono', monospace" }}>
            SwapZone · Built on Monad · Open Source
          </p>
        </div>
      </div>
    </Layout>
  );
}
