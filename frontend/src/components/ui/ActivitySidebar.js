import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Plus, Minus, Zap, ExternalLink, RefreshCw, Activity, ChevronRight, ChevronLeft } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";

const STORAGE_KEY = "swapzone_activity";

export function logActivity(type, data) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const entry = { id: Date.now().toString(), type, timestamp: Date.now(), ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
    // Dispatch event so sidebar updates immediately
    window.dispatchEvent(new Event("swapzone_activity"));
  } catch {}
}

function loadActivity() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

const TYPE_CFG = {
  swap:             { icon: "⇄",  color:"#00FFD1", label:"Swap"           },
  add_liquidity:    { icon: "+",   color:"#00FF88", label:"Add Liquidity"  },
  remove_liquidity: { icon: "−",   color:"#FF6B6B", label:"Remove Liq"     },
  create_token:     { icon: "⚡",  color:"#FFDC00", label:"Create Token"   },
  order:            { icon: "◈",   color:"#8458FF", label:"Limit Order"    },
  referral:         { icon: "♦",   color:"#FF69B4", label:"Referral"       },
};

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)    return Math.floor(d/1000)+"s";
  if (d < 3600000)  return Math.floor(d/60000)+"m";
  if (d < 86400000) return Math.floor(d/3600000)+"h";
  return Math.floor(d/86400000)+"d";
}

export default function ActivitySidebar() {
  const { isConnected } = useWallet();
  const [items, setItems]   = useState([]);
  const [open,  setOpen]    = useState(true);

  function refresh() { setItems(loadActivity()); }

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("swapzone_activity", handler);
    const t = setInterval(refresh, 5000);
    return () => { clearInterval(t); window.removeEventListener("swapzone_activity", handler); };
  }, []);

  const W = open ? 260 : 36;

  return (
    <div style={{
      position:      "fixed",
      right:         0,
      top:           0,
      bottom:        0,
      width:         W,
      zIndex:        45,
      display:       "flex",
      flexDirection: "column",
      background:    "rgba(7,7,10,0.97)",
      borderLeft:    "1px solid #1A1A1A",
      backdropFilter:"blur(16px)",
      transition:    "width 0.22s ease",
      overflow:      "hidden",
    }}>

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position:       "absolute",
          left:           open ? -1 : 0,
          top:            "50%",
          transform:      "translateY(-50%)",
          width:          18,
          height:         56,
          background:     "rgba(7,7,10,0.97)",
          border:         "1px solid #1A1A1A",
          borderRight:    open ? "none" : "1px solid #1A1A1A",
          borderRadius:   open ? "6px 0 0 6px" : "0",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          "#444",
          transition:     "left 0.22s ease",
          zIndex:         1,
        }}>
        {open ? <ChevronRight size={10}/> : <ChevronLeft size={10}/>}
      </button>

      {open && <>
        {/* Header */}
        <div style={{
          padding:      "58px 12px 8px",
          borderBottom: "1px solid #1A1A1A",
          flexShrink:   0,
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.1em", color:"#888" }}>
              ACTIVITY
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {items.length > 0 && (
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#00FFD1", background:"rgba(0,255,209,0.1)", border:"1px solid rgba(0,255,209,0.2)", borderRadius:4, padding:"1px 5px" }}>
                  {items.length}
                </span>
              )}
              <button onClick={refresh} style={{ background:"none", border:"none", cursor:"pointer", color:"#333", padding:2 }}>
                <RefreshCw size={11} style={{ color:"#333" }}/>
              </button>
            </div>
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#333", marginTop:2 }}>
            {isConnected ? "Your SwapZone transactions" : "Connect wallet to track txs"}
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {items.length === 0 ? (
            <div style={{ padding:"24px 12px", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:8, opacity:0.3 }}>◈</div>
              <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#333", lineHeight:1.7 }}>
                {isConnected ? "No activity yet.\nStart swapping!" : "Connect wallet\nto see activity"}
              </p>
            </div>
          ) : items.map(item => {
            const cfg = TYPE_CFG[item.type] || TYPE_CFG.swap;
            return (
              <div key={item.id}
                style={{
                  padding:      "8px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  display:      "flex",
                  gap:          8,
                  alignItems:   "flex-start",
                }}>
                {/* Icon */}
                <div style={{
                  width:25, height:25, borderRadius:7, flexShrink:0,
                  background: cfg.color+"14",
                  border:     "1px solid "+cfg.color+"30",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, color:cfg.color,
                }}>{cfg.icon}</div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, color:cfg.color, letterSpacing:"0.04em" }}>
                    {cfg.label}
                  </div>
                  {item.type==="swap" && item.fromSym && (
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#555", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {item.fromAmt} {item.fromSym} → {item.toSym}
                    </div>
                  )}
                  {item.type==="create_token" && item.symbol && (
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#555", marginTop:1 }}>
                      {item.symbol}
                    </div>
                  )}
                  {item.type==="order" && item.fromSym && (
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#555", marginTop:1 }}>
                      {item.fromSym}→{item.toSym}
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"#2A2A2A" }}>{timeAgo(item.timestamp)} ago</span>
                    {item.txHash && (
                      <a href={"https://monadexplorer.com/tx/"+item.txHash} target="_blank" rel="noreferrer"
                        style={{ fontSize:8, color:"#2A2A2A", textDecoration:"none" }}
                        onMouseEnter={e=>e.target.style.color="#00FFD1"}
                        onMouseLeave={e=>e.target.style.color="#2A2A2A"}>
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:"6px 12px", borderTop:"1px solid #1A1A1A", flexShrink:0 }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"#222", textAlign:"center" }}>
            Last {items.length} txs via SwapZone
          </div>
        </div>
      </>}
    </div>
  );
}
