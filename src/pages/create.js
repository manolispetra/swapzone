import Layout from "../components/ui/Layout";
import TokenCreator from "../components/tokens/TokenCreator";

export default function CreatePage() {
  return (
    <Layout title="Create Token">
      <div className="pt-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold neon-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
            CREATE TOKEN
          </h1>
          <p className="text-muted text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
            Deploy your own ERC-20 token on Monad in one click
          </p>
        </div>
        <TokenCreator />
      </div>
    </Layout>
  );
}
