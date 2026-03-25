import { useState } from "react";
import { NFT_COLLECTION, COLLECTION_NAME, COLLECTION_DESC, RARITY_TIERS, renderPixelSVG, TOTAL_SUPPLY } from "../../utils/nftCollection";
import { X, Star, Zap, Twitter, Gift } from "lucide-react";

export default function NFTGallery() {
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("ALL");
  const tiers   = ["ALL","LEGENDARY","EPIC","RARE","UNCOMMON","COMMON"];
  const visible = filter==="ALL" ? NFT_COLLECTION : NFT_COLLECTION.filter(n=>n.rarity===filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border" style={{ background:"linear-gradient(135deg,#0A0A0A 0%,#111111 50%,#0A0A0A 100%)" }}>
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,209,0.015) 2px,rgba(0,255,209,0.015) 4px)" }}/>
        <div className="relative p-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs mb-4" style={{ fontFamily:"'Space Mono',monospace" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>UPCOMING DROP
          </div>
          <h1 className="neon-text text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>
            {COLLECTION_NAME}
          </h1>
          <p className="text-muted text-sm max-w-2xl mx-auto mb-6" style={{ fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>
            {COLLECTION_DESC}
          </p>
          {/* Preview row */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {NFT_COLLECTION.slice(0,5).map(nft => {
              const svg = renderPixelSVG(nft, 64);
              const url = `data:image/svg+xml;base64,${btoa(svg)}`;
              const tier = RARITY_TIERS[nft.rarity];
              return (
                <div key={nft.id} className="relative cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelected(nft)}>
                  <img src={url} alt={nft.name} style={{ width:56, height:56, imageRendering:"pixelated", borderRadius:8, border:`2px solid ${tier.color}44`, boxShadow:tier.glow }} />
                </div>
              );
            })}
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted text-lg">+{TOTAL_SUPPLY - 5}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            {[{l:"Total Supply",v:TOTAL_SUPPLY},{l:"Legendary",v:"2"},{l:"Network",v:"Monad"},{l:"Mint",v:"Via Referral"}].map(({l,v})=>(
              <div key={l} className="text-center">
                <div className="text-xs text-muted" style={{fontFamily:"'Space Mono',monospace"}}>{l}</div>
                <div className="font-bold neon-text text-lg" style={{fontFamily:"'Rajdhani',sans-serif"}}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs" style={{fontFamily:"'Space Mono',monospace"}}>
              <Gift size={12}/>Earn via Referral Program
            </div>
            <a href="https://twitter.com/intent/tweet?text=SwapZone+Genesis+NFTs+dropping+on+Monad!+%23Monad+%23DeFi+%23NFT&url=https://swapzone.vercel.app/nfts"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs"
              style={{fontFamily:"'Space Mono',monospace"}}>
              <Twitter size={12}/>Share on X
            </a>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap justify-center">
        {tiers.map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs transition-all border ${filter===t?"bg-primary/15 text-primary border-primary/40":"text-muted border-border hover:text-text"}`}
            style={{fontFamily:"'Space Mono',monospace"}}>
            {t==="ALL"?"All ✦":RARITY_TIERS[t]?.label}
            {t!=="ALL"&&<span className="ml-1 opacity-50">({NFT_COLLECTION.filter(n=>n.rarity===t).length})</span>}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {visible.map(nft=><NFTCard key={nft.id} nft={nft} onClick={()=>setSelected(nft)}/>)}
      </div>

      {selected && <NFTModal nft={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

function NFTCard({ nft, onClick }) {
  const tier   = RARITY_TIERS[nft.rarity];
  const svg    = renderPixelSVG(nft, 140);
  const svgUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return (
    <button onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 text-left rounded-2xl overflow-hidden border"
      style={{ background:`linear-gradient(160deg,${tier.bg} 0%,#0A0A0A 100%)`, borderColor:`${tier.color}22`, boxShadow: nft.rarity==="LEGENDARY" ? tier.glow : "none" }}>
      <div className="relative overflow-hidden" style={{ aspectRatio:"1", background:"#000" }}>
        <img src={svgUrl} alt={nft.name} style={{ width:"100%", height:"100%", imageRendering:"pixelated", display:"block" }}/>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)" }}/>
      </div>
      <div className="p-3">
        <div className="font-bold truncate text-text mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13 }}>#{nft.id} {nft.name}</div>
        <div className="flex items-center justify-between">
          <span style={{ color:tier.color, fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.05em" }}>{tier.label}</span>
          <div className="flex items-center gap-1">
            <Star size={9} style={{ color:tier.color }} fill={tier.color}/>
            <span className="text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{nft.rarityScore}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function NFTModal({ nft, onClose }) {
  const tier   = RARITY_TIERS[nft.rarity];
  const svg    = renderPixelSVG(nft, 240);
  const svgUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.92)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background:`linear-gradient(160deg,${tier.bg} 0%,#0A0A0A 100%)`, borderColor:`${tier.color}44`, boxShadow:tier.glow }}
        onClick={e=>e.stopPropagation()}>
        {/* Close */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor:`${tier.color}22` }}>
          <div>
            <div className="text-xs mb-0.5" style={{ color:tier.color, fontFamily:"'Space Mono',monospace", letterSpacing:"0.1em" }}>
              ✦ {tier.label} · {nft.rarityScore}/100
            </div>
            <h2 className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:22 }}>#{nft.id} {nft.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-2 rounded-xl hover:bg-white/5"><X size={18}/></button>
        </div>
        {/* Art */}
        <div className="flex justify-center p-6" style={{ background:"#000" }}>
          <div className="relative" style={{ width:200, height:200 }}>
            {nft.rarity==="LEGENDARY"&&<div className="absolute inset-0 rounded-xl animate-pulse" style={{ boxShadow:`0 0 40px ${tier.color}66`, borderRadius:12 }}/>}
            <img src={svgUrl} alt={nft.name} style={{ width:"100%", height:"100%", imageRendering:"pixelated", borderRadius:8, position:"relative", zIndex:1 }}/>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted mb-5" style={{ fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>{nft.description}</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {nft.traits.map(tr=>(
              <div key={tr.t} className="p-2 rounded-xl border" style={{ background:"rgba(0,0,0,0.4)", borderColor:`${tier.color}22` }}>
                <div className="text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{tr.t}</div>
                <div className="font-medium text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12 }}>{tr.v}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-xl border text-center text-xs" style={{ background:"rgba(0,0,0,0.3)", borderColor:`${tier.color}22`, fontFamily:"'Space Mono',monospace", color:tier.color }}>
              <Gift size={14} className="mx-auto mb-1"/>Earn via Referral
            </div>
            <a href={`https://twitter.com/intent/tweet?text=Check+out+%23${nft.name.replace(/\s+/g,"+")}+from+SwapZone+Genesis+NFTs+on+Monad!&url=https://swapzone.vercel.app/nfts`}
              target="_blank" rel="noreferrer"
              className="flex-1 p-3 rounded-xl border text-center text-xs flex flex-col items-center gap-1"
              style={{ background:"rgba(29,161,242,0.1)", borderColor:"rgba(29,161,242,0.3)", color:"#1DA1F2", fontFamily:"'Space Mono',monospace" }}>
              <Twitter size={14}/>Share on X
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
