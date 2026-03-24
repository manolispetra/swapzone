import Layout from "../components/ui/Layout";
import TokenExplorer from "../components/tokens/TokenExplorer";

export default function TokensPage() {
  return (
    <Layout title="Token Explorer">
      <div className="pt-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold neon-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
            TOKEN EXPLORER
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
            Auto-indexed tokens on Monad · Verified & community listings
          </p>
        </div>
        <TokenExplorer />
      </div>
    </Layout>
  );
}
