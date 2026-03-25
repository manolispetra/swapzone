import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Loader2, ExternalLink, ChevronDown, Search, X, RefreshCw } from "lucide-react";

const AFFILIATE = "G4nvHmbdX";
const API       = "https://sideshift.ai/api/v2";

// ── Fetch all available coins from SideShift ──────────────────────────────────
async function fetchCoins() {
  const res  = await fetch(API + "/coins");
  const data = await res.json();
  return data || [];
}

// ── Fetch quote ───────────────────────────────────────────────────────────────
async function fetchQuote(fromCoin, toCoin, amount) {
  const res = await fetch(
    API + "/pairs/" + fromCoin + "/" + toCoin
  );
  const pair = await res.json();
  if (pair.error) throw new Error(pair.error);
  // Calculate estimate from rate
  const rate      = parseFloat(pair.rate || 0);
  const estimated = amount * rate;
  return { rate, estimated: estimated.toFixed(8), min: pair.min, max: pair.max, pairId: pair.id };
}

// ── Create order ──────────────────────────────────────────────────────────────
async function createFixedOrder(body) {
  const res = await fetch(API + "/shifts/fixed", {
    method:  "POST",
    headers: { "Content-Type":"application/json" },
    body:    JSON.stringify({ ...body, affiliateId: AFFILIATE }),
  });
  return res.json();
}

const COIN_COLORS = {
  BTC:"#F7931A", ETH:"#627EEA", SOL:"#9945FF", USDC:"#2775CA",
  USDT:"#26A17B", XMR:"#FF6600", MON:"#836EF9", LTC:"#BFBBBB",
  BNB:"#F0B90B", MATIC:"#8247E5", AVAX:"#E84142", DOT:"#E6007A",
  ATOM:"#2E3148", DOGE:"#C2A633", ADA:"#0033AD", TRX:"#FF0013",
  LINK:"#2A5ADA", UNI:"#FF007A", SHIB:"#FFA409", XRP:"#00AAE4",
};

function coinColor(symbol) {
  return COIN_COLORS[symbol?.toUpperCase()] || "#888888";
}

function CoinBadge({ coin, onClick, size = "md" }) {
  if (!coin) return null;
  const color = coinColor(coin.symbol);
  const pad   = size === "sm" ? "px-2 py-1" : "px-3 py-2";
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl ${pad} transition-all min-w-[110px]`}>
      <div style={{ width:22, height:22, borderRadius:"50%", background: color+"33", border:"1px solid "+color+"55",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, color }}>{(coin.symbol||"?")[0]}</span>
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{coin.symbol}</div>
        {size !== "sm" && <div className="text-muted truncate" style={{ fontSize:9, fontFamily:"'Space Mono',monospace" }}>{coin.network}</div>}
      </div>
      <ChevronDown size={12} className="text-muted"/>
    </button>
  );
}

function CoinPicker({ coins, onSelect, onClose, exclude }) {
  const [q, setQ] = useState("");
  const filtered  = coins.filter(c =>
    c.symbol !== exclude &&
    (!q || c.symbol.toLowerCase().includes(q.toLowerCase()) || (c.name||"").toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.88)" }}>
      <div className="card w-full max-w-sm" style={{ maxHeight:"80vh", display:"flex", flexDirection:"column" }}>
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:17 }}>Select Coin</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18}/></button>
        </div>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="sz-input pl-9" placeholder="Search coin…" value={q} onChange={e => setQ(e.target.value)} autoFocus/>
        </div>
        <div className="overflow-y-auto flex-1 space-y-1">
          {filtered.slice(0, 60).map(c => (
            <button key={c.symbol + c.network} onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
              <div style={{ width:34, height:34, borderRadius:"50%", background: coinColor(c.symbol)+"22",
                border:"1px solid "+coinColor(c.symbol)+"44", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, color:coinColor(c.symbol) }}>{(c.symbol||"?")[0]}</span>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{c.symbol}</div>
                <div className="text-muted truncate" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>{c.name} · {c.network}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted py-6 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>No coins found</p>}
        </div>
      </div>
    </div>
  );
}

export default function CrossChain() {
  const [coins,      setCoins]      = useState([]);
  const [fromCoin,   setFromCoin]   = useState(null);
  const [toCoin,     setToCoin]     = useState(null);
  const [fromAmt,    setFromAmt]    = useState("");
  const [toAmt,      setToAmt]      = useState("");
  const [rate,       setRate]       = useState(null);
  const [minAmt,     setMinAmt]     = useState(null);
  const [maxAmt,     setMaxAmt]     = useState(null);
  const [toAddr,     setToAddr]     = useState("");
  const [refundAddr, setRefundAddr] = useState("");
  const [quoting,    setQuoting]    = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [order,      setOrder]      = useState(null);
  const [error,      setError]      = useState(null);
  const [picker,     setPicker]     = useState(null); // "from"|"to"
  const [loadingCoins,setLoadingCoins]=useState(true);
  const quoteTimer = useRef(null);

  // Load all coins on mount
  useEffect(() => {
    fetchCoins()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCoins(list);
        const btc = list.find(c => c.symbol === "BTC" && c.network === "bitcoin") || list[0];
        const mon = list.find(c => c.symbol === "MON") || list.find(c => c.symbol === "USDC") || list[1];
        setFromCoin(btc);
        setToCoin(mon);
      })
      .catch(() => {
        // Fallback coins if API fails
        const fallback = [
          { symbol:"BTC",  name:"Bitcoin",  network:"bitcoin"  },
          { symbol:"ETH",  name:"Ethereum", network:"ethereum" },
          { symbol:"MON",  name:"Monad",    network:"monad"    },
          { symbol:"USDC", name:"USD Coin", network:"ethereum" },
          { symbol:"SOL",  name:"Solana",   network:"solana"   },
        ];
        setCoins(fallback);
        setFromCoin(fallback[0]);
        setToCoin(fallback[2]);
      })
      .finally(() => setLoadingCoins(false));
  }, []);

  // Auto-quote when amount/coins change
  useEffect(() => {
    clearTimeout(quoteTimer.current);
    if (!fromCoin || !toCoin || !fromAmt || parseFloat(fromAmt) <= 0) {
      setToAmt(""); setRate(null); return;
    }
    quoteTimer.current = setTimeout(getQuote, 600);
    return () => clearTimeout(quoteTimer.current);
  }, [fromAmt, fromCoin, toCoin]);

  async function getQuote() {
    setQuoting(true); setError(null);
    try {
      const q = await fetchQuote(fromCoin.symbol, toCoin.symbol, parseFloat(fromAmt));
      setRate(q.rate);
      setMinAmt(q.min);
      setMaxAmt(q.max);
      setToAmt(q.estimated);
    } catch(e) {
      setToAmt("");
      setError("Pair not available: " + e.message);
    } finally { setQuoting(false); }
  }

  async function doCreate() {
    if (!toAddr || !fromAmt || !rate) { setError("Fill in destination address and amount"); return; }
    setCreating(true); setError(null);
    try {
      const body = {
        depositCoin:   fromCoin.symbol,
        settleCoin:    toCoin.symbol,
        depositAmount: fromAmt,
        settleAddress: toAddr,
      };
      if (refundAddr) body.refundAddress = refundAddr;
      const d = await createFixedOrder(body);
      if (d.error) throw new Error(typeof d.error === "string" ? d.error : JSON.stringify(d.error));
      setOrder(d);
    } catch(e) { setError(e.message); }
    finally { setCreating(false); }
  }

  function flip() {
    const tmp = fromCoin; setFromCoin(toCoin); setToCoin(tmp);
    setFromAmt(toAmt && !["","—"].includes(toAmt) ? toAmt : "");
    setToAmt(""); setRate(null); setError(null);
  }

  function reset() {
    setOrder(null); setFromAmt(""); setToAmt(""); setToAddr("");
    setRefundAddr(""); setRate(null); setError(null);
  }

  if (loadingCoins) return (
    <div className="flex items-center justify-center py-20"><div className="spinner"/></div>
  );

  if (order) return <OrderView order={order} fromCoin={fromCoin} toCoin={toCoin} onReset={reset}/>;

  return (
    <div className="max-w-md mx-auto">
      <div className="card" style={{ background:"linear-gradient(160deg,#111 0%,#0D0D0D 100%)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>CROSS-CHAIN</h2>
            <p className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{coins.length} coins available</p>
          </div>
          <a href={"https://sideshift.ai/a/"+AFFILIATE} target="_blank" rel="noreferrer"
            className="text-xs text-muted hover:text-primary flex items-center gap-1" style={{ fontFamily:"'Space Mono',monospace" }}>
            SideShift.ai <ExternalLink size={10}/>
          </a>
        </div>

        {/* From */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>You send</span>
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
              {minAmt && <span>Min: {minAmt}</span>}
              {maxAmt && <span className="ml-2">Max: {maxAmt}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CoinBadge coin={fromCoin} onClick={() => setPicker("from")}/>
            <input type="number" value={fromAmt} onChange={e => setFromAmt(e.target.value)}
              placeholder="0.00" className="flex-1 bg-transparent text-right outline-none text-xl text-text"
              style={{ fontFamily:"'Space Mono',monospace" }}/>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center my-1.5">
          <button onClick={flip}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group">
            <ArrowUpDown size={15} className="group-hover:rotate-180 transition-transform duration-300"/>
          </button>
        </div>

        {/* To */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>You receive</span>
            {rate && <span className="text-xs text-primary" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>Rate: 1 {fromCoin?.symbol} = {parseFloat(rate).toFixed(6)} {toCoin?.symbol}</span>}
          </div>
          <div className="flex items-center gap-3">
            <CoinBadge coin={toCoin} onClick={() => setPicker("to")}/>
            <div className="flex-1 relative">
              {quoting && <div className="spinner absolute right-2 top-1/2 -translate-y-1/2" style={{width:14,height:14}}/>}
              <input readOnly value={toAmt} placeholder="0.00"
                className="w-full bg-transparent text-right outline-none text-xl text-text"
                style={{ fontFamily:"'Space Mono',monospace" }}/>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
              Your {toCoin?.symbol} receive address
            </label>
            <input className="sz-input" placeholder={"Paste " + (toCoin?.symbol||"") + " address here"}
              value={toAddr} onChange={e => setToAddr(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
              Refund address ({fromCoin?.symbol}) <span className="opacity-40">— optional</span>
            </label>
            <input className="sz-input" placeholder={"Your " + (fromCoin?.symbol||"") + " address for refunds"}
              value={refundAddr} onChange={e => setRefundAddr(e.target.value)}/>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}

        <button className="btn-primary w-full" disabled={creating || !toAddr || !fromAmt || quoting || !rate}
          onClick={doCreate} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {creating
            ? <><Loader2 size={16} className="animate-spin"/>Creating order…</>
            : <>Swap {fromCoin?.symbol} → {toCoin?.symbol}</>}
        </button>

        <p className="text-center text-xs text-muted/30 mt-3" style={{ fontFamily:"'Space Mono',monospace" }}>
          No account needed · Non-custodial · Powered by SideShift.ai
        </p>
      </div>

      {picker && (
        <CoinPicker
          coins={coins}
          exclude={picker === "from" ? toCoin?.symbol : fromCoin?.symbol}
          onSelect={c => { picker === "from" ? setFromCoin(c) : setToCoin(c); setPicker(null); setToAmt(""); setRate(null); }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function OrderView({ order, fromCoin, toCoin, onReset }) {
  const [copied, setCopied] = useState(false);
  function copy(t) { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  const depositAddr = order.depositAddress?.address || order.depositAddress;

  return (
    <div className="max-w-md mx-auto">
      <div className="card border-primary/30">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🔁</div>
          <h2 className="font-bold neon-text text-xl" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>Order Created!</h2>
          <p className="text-xs text-muted mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>
            Send {fromCoin?.symbol} to the address below to complete the swap
          </p>
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 mb-4">
          <div className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>
            Send exactly {order.depositAmount} {fromCoin?.symbol} to:
          </div>
          <div className="font-bold text-primary break-all text-sm mb-3" style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>
            {depositAddr}
          </div>
          <button onClick={() => copy(depositAddr)} className="btn-primary w-full" style={{ padding:"9px", fontSize:13 }}>
            {copied ? "✓ Copied!" : "Copy Deposit Address"}
          </button>
        </div>

        <div className="space-y-2 text-xs mb-5" style={{ fontFamily:"'Space Mono',monospace" }}>
          {[
            { l:"Order ID",      v: order.id                                        },
            { l:"You send",      v: order.depositAmount + " " + fromCoin?.symbol    },
            { l:"You receive",   v: order.settleAmount  + " " + toCoin?.symbol      },
            { l:"Status",        v: order.status                                    },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between p-2.5 rounded-xl bg-black/30 border border-border/40">
              <span className="text-muted">{l}</span>
              <span className="text-text truncate max-w-[55%] text-right">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <a href={"https://sideshift.ai/orders/" + order.id} target="_blank" rel="noreferrer"
            className="btn-secondary flex-1 text-center flex items-center justify-center gap-2" style={{ fontSize:12 }}>
            Track <ExternalLink size={11}/>
          </a>
          <button onClick={onReset} className="btn-primary flex-1" style={{ fontSize:12 }}>New Swap</button>
        </div>
      </div>
    </div>
  );
}

// Need useState in OrderView