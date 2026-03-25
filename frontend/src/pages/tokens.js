import Layout from "../components/ui/Layout";
import TokenExplorer from "../components/tokens/TokenExplorer";
export default function TokensPage() {
  return (
    <Layout title="Tokens">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>TOKEN EXPLORER</h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>Auto-indexed tokens on Monad · Verified & community listings</p>
        </div>
        <TokenExplorer />
      </div>
    </Layout>
  );
}
