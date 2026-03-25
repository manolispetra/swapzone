import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Plus, Minus, Zap, ExternalLink, RefreshCw, Activity } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";

// ── Local activity log (persisted in localStorage) ────────────────────────────
const STORAGE_KEY = "swapzone_activity";

export function logActivity(type, data) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const entry = {
      id:        Date.now().toString(),
      type,      // swap | add_liquidity | remove_liquidity | create_token | order | referral
      timestamp: Date.now(),
      ...data,
    };
    const updated = [entry, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function loadActivity(address) {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!address) return all;
    return all.filter(e => !e.wallet || e.wallet?.toLowerCase() === address.toLowerCase());
  } catch { return []; }
}

// ── Type config ────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  swap:             { icon: ArrowLeftRight, color:"#00FFD1", label:"Swap",           bg:"rgba(0,255,209,0.08)" },
  add_liquidity:    { icon: Plus,           color:"#00FF88", label:"Add Liquidity",  bg:"rgba(0,255,136,0.08)" },
  remove_liquidity: { icon: Minus,          color:"#FF6B6B", label:"Remove Liq",     bg:"rgba(255,107,107,0.08)" },
  create_token:     { icon: Zap,            color:"#FFDC00", label:"Create Token",   bg:"rgba(255,220,0,0.08)" },
  order:            { icon: Activity,       color:"#8458FF", label:"Limit Order",    bg:"rgba(132,88,255,0.08)" },
  referral:         { icon: Activity,       color:"#FF69B4", label:"Referral",       bg:"rgba(255,105,180,0.08)" },
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)   return Math.floor(diff/1000) + "s ago";
  if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
  if (diff < 86400000)return Math.floor(diff/3600000) + "h ago";
  return Math.floor(diff/86400000) + "d ago";
}

// ── Activity Sidebar Component ─────────────────────────────────────────────────
export default function ActivitySidebar() {
  const { address, isConnected } = useWallet();
  const [items,    setItems]    = useState([]);
  const [open,     setOpen]     = useState(true);
  const [loading,  setLoading]  = useState(false);
  const intervalRef = useRef(null);

  function refresh() {
    setItems(loadActivity(address));
  }

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 5000);
    return () => clearInterval(intervalRef.current);
  }, [address]);

  const total = items.length;

  return (
    <div style={{
      position: "fixed",
      right:    0,
      top:      64,
      bottom:   0,
      width:    open ? 260 : 40,
      zIndex:   40,
      display:  "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      borderLeft: "1px solid #1E1E1E",
      background: "rgba(8,8,12,0.95)",
      backdropFilter: "blur(12px)",
    }}>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:   "absolute",
          left:       -32,
          top:        "50%",
          transform:  "translateY(-50%)",
          width:      32,
          height:     72,
          background: "rgba(8,8,12,0.95)",
          border:     "1px solid #1E1E1E",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          cursor:     "pointer",
          display:    "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap:        4,
          color:      "#555",
        }}
        title={open ? "Hide activity" : "Show activity"}
      >
        <Activity size={14} style={{ color:"#00FFD1" }}/>
        {total > 0 && (
          <span style={{
            fontSize: 9, fontFamily:"'Space Mono',monospace",
            color: "#00FFD1", fontWeight:700,
          }}>{total > 9 ? "9+" : total}</span>
        )}
        <span style={{
          fontSize: 8, fontFamily:"'Space Mono',monospace",
          color: "#444", writingMode:"vertical-rl", letterSpacing:"0.1em",
          marginTop: 2,
        }}>TXS</span>
      </button>

      {open && (
        <>
          {/* Header */}
          <div style={{
            padding:    "12px 14px 10px",
            borderBottom: "1px solid #1E1E1E",
            display:    "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:"0.08em", color:"#E8E8E8" }}>
                ACTIVITY
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#555", marginTop:1 }}>
                {isConnected ? "Your transactions" : "Connect wallet"}
              </div>
            </div>
            <button onClick={refresh} style={{ background:"none", border:"none", cursor:"pointer", color:"#444", padding:4 }}>
              <RefreshCw size={12} style={{ color:"#444" }} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>

          {/* Activity list */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
            {!isConnected ? (
              <div style={{ padding:"20px 14px", textAlign:"center" }}>
                <Activity size={24} style={{ color:"#333", margin:"0 auto 8px", display:"block" }}/>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#444", lineHeight:1.6 }}>
                  Connect wallet to see your SwapZone activity
                </p>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding:"20px 14px", textAlign:"center" }}>
                <Activity size={24} style={{ color:"#333", margin:"0 auto 8px", display:"block" }}/>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#444", lineHeight:1.6 }}>
                  No activity yet.{" "}<br/>
                  Start swapping!
                </p>
              </div>
            ) : (
              items.map(item => <ActivityItem key={item.id} item={item}/>)
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:    "8px 14px",
            borderTop:  "1px solid #1E1E1E",
            flexShrink: 0,
          }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#333", textAlign:"center" }}>
              Last {items.length} transactions via SwapZone
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ActivityItem({ item }) {
  const cfg   = TYPE_CONFIG[item.type] || TYPE_CONFIG.swap;
  const Icon  = cfg.icon;

  return (
    <div style={{
      padding:    "8px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
      display:    "flex",
      gap:        8,
      alignItems: "flex-start",
      transition: "background 0.15s",
      cursor:     "default",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

      {/* Icon */}
      <div style={{
        width:       28, height:28, borderRadius:8, flexShrink:0,
        background:  cfg.bg, border:"1px solid " + cfg.color + "33",
        display:     "flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon size={13} style={{ color: cfg.color }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12,
          color: cfg.color, letterSpacing:"0.04em",
        }}>{cfg.label}</div>

        {item.type === "swap" && item.fromSym && item.toSym && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", marginTop:1 }}>
            {item.fromAmt} {item.fromSym} → {item.toSym}
          </div>
        )}
        {item.type === "add_liquidity" && item.tokenA && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", marginTop:1 }}>
            {item.tokenA}/{item.tokenB}
          </div>
        )}
        {item.type === "create_token" && item.symbol && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", marginTop:1 }}>
            {item.name} ({item.symbol})
          </div>
        )}
        {item.type === "order" && item.fromSym && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", marginTop:1 }}>
            {item.fromSym} → {item.toSym} @ {item.price}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:3 }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"#444" }}>
            {timeAgo(item.timestamp)}
          </span>
          {item.txHash && (
            <a href={"https://monadexplorer.com/tx/" + item.txHash} target="_blank" rel="noreferrer"
              style={{ color:"#333", display:"flex", alignItems:"center", gap:2 }}
              onMouseEnter={e => e.currentTarget.style.color="#00FFD1"}
              onMouseLeave={e => e.currentTarget.style.color="#333"}>
              <ExternalLink size={9}/>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
