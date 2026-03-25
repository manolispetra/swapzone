import Layout from "../components/ui/Layout";
import TokenCreator from "../components/tokens/TokenCreator";
export default function CreatePage() {
  return (
    <Layout title="Create Token">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>CREATE TOKEN</h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>Deploy your ERC-20 on Monad · Auto-registered in SwapZone</p>
        </div>
        <TokenCreator />
      </div>
    </Layout>
  );
}
