import Layout from "../components/ui/Layout";
import LiquidityManager from "../components/liquidity/LiquidityManager";

export default function LiquidityPage() {
  return (
    <Layout title="Liquidity">
      <div className="pt-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold neon-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
            LIQUIDITY POOLS
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
            Provide liquidity and earn trading fees on every swap
          </p>
        </div>
        <LiquidityManager />
      </div>
    </Layout>
  );
}
