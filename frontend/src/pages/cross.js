import Layout from "../components/ui/Layout";
import CrossChain from "../components/swap/CrossChain";

export default function CrossPage() {
  return (
    <Layout title="Cross-Chain">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1"
            style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>
            CROSS-CHAIN
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            BTC · ETH · SOL · USDC → Monad · and back
          </p>
        </div>
        <CrossChain />
      </div>
    </Layout>
  );
}
