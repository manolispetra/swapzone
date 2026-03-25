import Layout from "../components/ui/Layout";
import ReferralProgram from "../components/referral/ReferralProgram";
export default function ReferralPage() {
  return (
    <Layout title="Referral">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>REFERRAL PROGRAM</h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>Invite friends · Earn NFTs · Distributed after Genesis mint</p>
        </div>
        <ReferralProgram />
      </div>
    </Layout>
  );
}
