import Layout from "../components/ui/Layout";
import FeePanel from "../components/fees/FeePanel";

export default function FeesPage() {
  return (
    <Layout title="Fee Management">
      <div className="pt-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold neon-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
            FEE MANAGEMENT
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
            View fee stats · Adjust parameters · Withdraw protocol fees
          </p>
        </div>
        <FeePanel />
      </div>
    </Layout>
  );
}
