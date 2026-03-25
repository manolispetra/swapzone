import Layout from "../components/ui/Layout";
import SwapWidget from "../components/swap/SwapWidget";
import Logo from "../components/ui/Logo";

export default function SwapPage() {
  return (
    <Layout title="Swap">
      <div className="flex flex-col items-center pt-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <h1 className="neon-text text-5xl font-bold mb-2"
            style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.04em" }}>
            SWAPZONE
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            Next-gen DEX · Monad Mainnet · Auto fees · No backend
          </p>
        </div>
        <div className="flex justify-center gap-8 mb-8 flex-wrap">
          {[
            { label:"AMM Model",    value:"x · y = k" },
            { label:"Trading Fee",  value:"0.30%"      },
            { label:"Protocol Fee", value:"Auto"       },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</div>
              <div className="font-bold neon-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, letterSpacing:"0.06em" }}>{value}</div>
            </div>
          ))}
        </div>
        <SwapWidget />
        <p className="mt-8 text-xs text-muted/30" style={{ fontFamily:"'Space Mono',monospace" }}>
          SwapZone · Built on Monad · Open Source
        </p>
      </div>
    </Layout>
  );
}
