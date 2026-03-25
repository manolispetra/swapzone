import Layout from "../components/ui/Layout";
import LiquidityManager from "../components/liquidity/LiquidityManager";
export default function LiquidityPage() {
  return (
    <Layout title="Liquidity">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>LIQUIDITY POOLS</h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>Provide liquidity · Earn trading fees · Auto LP rewards</p>
        </div>
        <LiquidityManager />
      </div>
    </Layout>
  );
}
