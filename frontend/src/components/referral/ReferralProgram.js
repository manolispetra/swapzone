import { useState, useEffect } from "react";
import { Copy, Check, Users, Gift, Zap, ExternalLink } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { NFT_COLLECTION, RARITY_TIERS, renderPixelSVG } from "../../utils/nftCollection";

const STORAGE_KEY = "swapzone_referrals";
const REFERRAL_REWARDS = [
  { swaps: 1,  reward: "Whitelist Spot",    nft: null  },
  { swaps: 3,  reward: "Common NFT",        nft: 10    },
  { swaps: 5,  reward: "Uncommon NFT",      nft: 8     },
  { swaps: 10, reward: "Rare NFT",          nft: 5     },
  { swaps: 20, reward: "Epic NFT",          nft: 3     },
  { swaps: 50, reward: "Legendary NFT 🏆",  nft: 1     },
];

function getReferralData(address) {
  if (typeof window === "undefined") return { referrals: [], swapCount: 0 };
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data[address?.toLowerCase()] || { referrals: [], swapCount: 0 };
  } catch { return { referrals: [], swapCount: 0 }; }
}

function saveReferralData(address, data) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[address.toLowerCase()] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function ReferralProgram() {
  const { address, isConnected, connect } = useWallet();
  const [copied,  setCopied]  = useState(false);
  const [refData, setRefData] = useState({ referrals: [], swapCount: 0 });
  const [origin,  setOrigin]  = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    if (address) setRefData(getReferralData(address));
  }, [address]);

  // Check if arrived via referral link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref    = params.get("ref");
    if (ref && address && ref.toLowerCase() !== address.toLowerCase()) {
      const refD = getReferralData(ref);
      if (!refD.referrals.includes(address.toLowerCase())) {
        refD.referrals.push(address.toLowerCase());
        refD.swapCount = (refD.swapCount || 0) + 1;
        saveReferralData(ref, refD);
      }
    }
  }, [address]);

  const refLink = address ? `${origin}/?ref=${address}` : "";

  function copy() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalSwaps  = refData.swapCount || 0;
  const totalRefs   = refData.referrals?.length || 0;

  // Current and next reward
  const earnedTiers = REFERRAL_REWARDS.filter(r => totalSwaps >= r.swaps);
  const nextTier    = REFERRAL_REWARDS.find(r => totalSwaps < r.swaps);
  const progress    = nextTier
    ? Math.min(100, (totalSwaps / nextTier.swaps) * 100)
    : 100;

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-16">
          <Users size={40} className="mx-auto mb-4 text-muted opacity-40" />
          <p className="text-muted mb-4" style={{ fontFamily:"'Space Mono',monospace" }}>Connect wallet to access referral program</p>
          <button className="btn-primary" onClick={connect}>Connect Wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card text-center" style={{ background:"linear-gradient(135deg,#111 0%,#0D0D0D 100%)" }}>
        <Gift size={36} className="mx-auto mb-3 text-accent" />
        <h2 className="text-2xl font-bold mb-1 neon-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.05em" }}>
          REFERRAL PROGRAM
        </h2>
        <p className="text-muted text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>
          Invite friends to SwapZone. Earn exclusive NFTs distributed after mainnet launch.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Referrals", value: totalRefs,  color: "text-primary" },
          { label: "Swap Count",      value: totalSwaps, color: "text-accent"  },
          { label: "NFTs Earned",     value: earnedTiers.filter(t=>t.nft).length, color: "text-secondary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center" style={{ padding:16 }}>
            <div className={`text-2xl font-bold ${color}`} style={{ fontFamily:"'Rajdhani',sans-serif" }}>{value}</div>
            <div className="text-xs text-muted mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="card">
        <h3 className="mb-3 font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, letterSpacing:"0.05em" }}>YOUR REFERRAL LINK</h3>
        <div className="flex gap-2">
          <input readOnly value={refLink} className="sz-input flex-1 text-xs" style={{ fontSize:11 }} />
          <button className={`btn-primary flex items-center gap-2`} onClick={copy} style={{ padding:"10px 16px", minWidth:90 }}>
            {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy</>}
          </button>
        </div>
        <p className="text-xs text-muted mt-2" style={{ fontFamily:"'Space Mono',monospace" }}>
          Share this link. When friends connect their wallet and swap, you earn progress toward NFT rewards.
        </p>
      </div>

      {/* Progress */}
      {nextTier && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, letterSpacing:"0.05em" }}>NEXT REWARD</h3>
            <span className="text-xs text-accent" style={{ fontFamily:"'Space Mono',monospace" }}>
              {totalSwaps}/{nextTier.swaps} swaps
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${progress}%`, background:"linear-gradient(90deg,#00FFD1,#8458FF)" }} />
          </div>
          <div className="flex justify-between text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
            <span>0</span>
            <span className="text-accent font-bold">{nextTier.reward}</span>
            <span>{nextTier.swaps}</span>
          </div>
        </div>
      )}

      {/* Reward tiers */}
      <div className="card">
        <h3 className="mb-4 font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, letterSpacing:"0.05em" }}>REWARD TIERS</h3>
        <div className="space-y-3">
          {REFERRAL_REWARDS.map(r => {
            const earned  = totalSwaps >= r.swaps;
            const nft     = r.nft ? NFT_COLLECTION.find(n => n.id === r.nft) : null;
            const tier    = nft ? RARITY_TIERS[nft.rarity] : null;
            const svgUrl  = nft ? `data:image/svg+xml;base64,${btoa(renderPixelSVG(nft, 48))}` : null;

            return (
              <div key={r.swaps} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                earned ? "bg-primary/5 border-primary/20" : "bg-black/20 border-border/30 opacity-60"
              }`}>
                {svgUrl ? (
                  <img src={svgUrl} alt={nft?.name} style={{ width:40, height:40, imageRendering:"pixelated", borderRadius:8 }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Zap size={16} className="text-accent" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif", color: tier ? tier.color : "#FFDC00" }}>{r.reward}</div>
                  <div className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{r.swaps} referred swaps</div>
                </div>
                <div>
                  {earned
                    ? <span className="text-xs text-primary" style={{ fontFamily:"'Space Mono',monospace" }}>✓ Earned</span>
                    : <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{r.swaps - totalSwaps} to go</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent" style={{ fontFamily:"'Space Mono',monospace" }}>
          ⚠️ NFTs will be distributed to eligible wallets after the SwapZone Genesis collection mints on Monad mainnet.
        </div>
      </div>
    </div>
  );
}
