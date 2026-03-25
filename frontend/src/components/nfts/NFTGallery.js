import { useState } from "react";
import { NFT_COLLECTION, COLLECTION_NAME, COLLECTION_DESC, RARITY_TIERS, renderPixelSVG, TOTAL_SUPPLY } from "../../utils/nftCollection";
import { X, Star, Zap } from "lucide-react";

export default function NFTGallery() {
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("ALL");

  const tiers   = ["ALL", "LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];
  const visible = filter === "ALL" ? NFT_COLLECTION : NFT_COLLECTION.filter(n => n.rarity === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="card text-center" style={{ background:"linear-gradient(135deg,#111 0%,#0D0D0D 100%)", border:"1px solid #1E1E1E" }}>
        <div className="text-xs text-primary mb-2" style={{ fontFamily:"'Space Mono',monospace", letterSpacing:"0.2em" }}>UPCOMING DROP</div>
        <h1 className="neon-text text-4xl font-bold mb-2" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>
          {COLLECTION_NAME}
        </h1>
        <p className="text-muted text-sm max-w-xl mx-auto mb-6" style={{ fontFamily:"'DM Sans',sans-serif" }}>{COLLECTION_DESC}</p>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { label:"Supply",    value: TOTAL_SUPPLY },
            { label:"Legendary", value: "2" },
            { label:"Network",   value: "Monad" },
            { label:"Status",    value: "Soon™" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</div>
              <div className="font-bold neon-text text-lg" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
          <Zap size={12} /> Earn NFTs via Referral Program
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap justify-center">
        {tiers.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs transition-all border ${filter===t ? "bg-primary/15 text-primary border-primary/40" : "text-muted border-border hover:text-text hover:border-border/80"}`}
            style={{ fontFamily:"'Space Mono',monospace" }}>
            {t === "ALL" ? "All" : RARITY_TIERS[t]?.label}
            {t !== "ALL" && <span className="ml-1 opacity-60">({NFT_COLLECTION.filter(n=>n.rarity===t).length})</span>}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {visible.map(nft => (
          <NFTCard key={nft.id} nft={nft} onClick={() => setSelected(nft)} />
        ))}
      </div>

      {/* Modal */}
      {selected && <NFTModal nft={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NFTCard({ nft, onClick }) {
  const tier    = RARITY_TIERS[nft.rarity];
  const svgData = renderPixelSVG(nft, 120);
  const svgUrl  = `data:image/svg+xml;base64,${btoa(svgData)}`;

  return (
    <button onClick={onClick}
      className="card group cursor-pointer hover:scale-105 transition-all duration-200 text-left"
      style={{ padding:12, borderColor: nft.rarity !== "COMMON" ? tier.color + "33" : undefined, boxShadow: nft.rarity === "LEGENDARY" ? tier.glow : undefined }}>
      <div className="rounded-xl overflow-hidden mb-3 bg-black/40" style={{ aspectRatio:"1", imageRendering:"pixelated" }}>
        <img src={svgUrl} alt={nft.name} style={{ width:"100%", height:"100%", imageRendering:"pixelated" }} />
      </div>
      <div className="text-xs font-bold truncate text-text mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13 }}>#{nft.id} {nft.name}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: tier.color, fontFamily:"'Space Mono',monospace", fontSize:9 }}>{tier.label}</span>
        <div className="flex items-center gap-1">
          <Star size={9} style={{ color: tier.color }} />
          <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{nft.rarityScore}</span>
        </div>
      </div>
    </button>
  );
}

function NFTModal({ nft, onClose }) {
  const tier    = RARITY_TIERS[nft.rarity];
  const svgData = renderPixelSVG(nft, 280);
  const svgUrl  = `data:image/svg+xml;base64,${btoa(svgData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.9)" }} onClick={onClose}>
      <div className="card max-w-md w-full" style={{ borderColor: tier.color + "44", boxShadow: tier.glow }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs mb-1" style={{ color: tier.color, fontFamily:"'Space Mono',monospace", letterSpacing:"0.1em" }}>
              ✦ {tier.label} · Score {nft.rarityScore}/100
            </div>
            <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:22 }}>#{nft.id} {nft.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={20} /></button>
        </div>

        <div className="rounded-2xl overflow-hidden mb-4 mx-auto" style={{ width:200, height:200, background:"#000", imageRendering:"pixelated" }}>
          <img src={svgUrl} alt={nft.name} style={{ width:"100%", height:"100%", imageRendering:"pixelated" }} />
        </div>

        <p className="text-sm text-muted mb-4" style={{ fontFamily:"'DM Sans',sans-serif" }}>{nft.description}</p>

        {/* Traits */}
        <div className="grid grid-cols-2 gap-2">
          {nft.traits.map(t => (
            <div key={t.trait} className="p-2 rounded-xl bg-black/40 border border-border/50">
              <div className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{t.trait}</div>
              <div className="text-xs text-text font-medium" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13 }}>{t.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent text-center" style={{ fontFamily:"'Space Mono',monospace" }}>
          🎁 Earn this NFT through the Referral Program
        </div>
      </div>
    </div>
  );
}
