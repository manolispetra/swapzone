import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeftRight, Search, X, Loader2, ExternalLink, Copy, Check } from "lucide-react";

// ── Exact same API as gcretanswap ─────────────────────────────────────────────
const SS_API    = "https://sideshift.ai/api/v2";
const AFFILIATE = "G4nvHmbdX";

const COINS_FALLBACK = [
  { sym:"BTC",  network:"bitcoin",    name:"Bitcoin",       ico:"₿",  id:"btc"          },
  { sym:"ETH",  network:"ethereum",   name:"Ethereum",      ico:"⟠",  id:"eth"          },
  { sym:"SOL",  network:"solana",     name:"Solana",        ico:"◎",  id:"sol"          },
  { sym:"USDC", network:"ethereum",   name:"USDC (ETH)",    ico:"💵", id:"usdc"         },
  { sym:"USDT", network:"tron",       name:"USDT (TRX)",    ico:"💲", id:"usdt"         },
  { sym:"BNB",  network:"bsc",        name:"BNB Chain",     ico:"🟡", id:"bnb"          },
  { sym:"MATIC",network:"polygon",    name:"Polygon",       ico:"🔷", id:"matic"        },
  { sym:"AVAX", network:"avax",       name:"Avalanche",     ico:"🔺", id:"avax"         },
  { sym:"MON",  network:"monad",      name:"Monad",         ico:"🟣", id:"mon"          },
  { sym:"DOGE", network:"dogecoin",   name:"Dogecoin",      ico:"🐕", id:"doge"         },
  { sym:"LTC",  network:"litecoin",   name:"Litecoin",      ico:"Ł",  id:"ltc"          },
  { sym:"XRP",  network:"ripple",     name:"XRP",           ico:"💧", id:"xrp"          },
  { sym:"DOT",  network:"polkadot",   name:"Polkadot",      ico:"●",  id:"dot"          },
  { sym:"ADA",  network:"cardano",    name:"Cardano",       ico:"♦",  id:"ada"          },
  { sym:"ARB",  network:"arbitrum",   name:"Arbitrum",      ico:"🔵", id:"arb"          },
  { sym:"OP",   network:"optimism",   name:"Optimism",      ico:"🔴", id:"op"           },
  { sym:"TRX",  network:"tron",       name:"TRON",          ico:"🔺", id:"trx"          },
  { sym:"XMR",  network:"monero",     name:"Monero",        ico:"🔶", id:"xmr"          },
  { sym:"LINK", network:"ethereum",   name:"Chainlink",     ico:"⛓",  id:"link"         },
  { sym:"WBTC", network:"ethereum",   name:"Wrapped BTC",   ico:"🟠", id:"wbtc"         },
  { sym:"USDC", network:"solana",     name:"USDC (Solana)", ico:"💵", id:"usdc-solana"  },
  { sym:"NEAR", network:"near",       name:"NEAR Protocol", ico:"🌐", id:"near"         },
  { sym:"ATOM", network:"cosmos",     name:"Cosmos",        ico:"⚛",  id:"atom"         },
  { sym:"ALGO", network:"algorand",   name:"Algorand",      ico:"◆",  id:"algo"         },
  { sym:"BCH",  network:"bitcoincash",name:"Bitcoin Cash",  ico:"🟢", id:"bch"          },
];

// ── Coin Picker Modal ─────────────────────────────────────────────────────────
function CoinModal({ coins, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = coins.filter(c =>
    c.sym.toLowerCase().includes(q.toLowerCase()) ||
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.network.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.88)" }} onClick={onClose}>
      <div className="card w-full max-w-sm" style={{ maxHeight:"78vh", display:"flex", flexDirection:"column" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:17 }}>Select Coin</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18}/></button>
        </div>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="sz-input pl-9" placeholder="Search coin, network…"
            value={q} onChange={e => setQ(e.target.value)} autoFocus/>
        </div>
        <div className="overflow-y-auto flex-1 space-y-0.5">
          {filtered.map((c, i) => (
            <button key={c.id + i} onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
              <span style={{ fontSize:22, width:28, textAlign:"center", flexShrink:0 }}>{c.ico}</span>
              <div className="min-w-0">
                <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{c.sym}</div>
                <div className="text-muted truncate" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
                  {c.name} · {c.network}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted py-8 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>No coins found</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CrossChain Component ─────────────────────────────────────────────────
export default function CrossChain() {
  const [coins,      setCoins]      = useState(COINS_FALLBACK.map(c => ({ ...c })));
  const [fromCoin,   setFromCoin]   = useState(COINS_FALLBACK[0]);   // BTC
  const [toCoin,     setToCoin]     = useState(COINS_FALLBACK[8]);   // MON
  const [rateType,   setRateType]   = useState("variable");          // variable | fixed
  const [pairInfo,   setPairInfo]   = useState(null);
  const [amountIn,   setAmountIn]   = useState("");
  const [amountOut,  setAmountOut]  = useState("—");
  const [destAddr,   setDestAddr]   = useState("");
  const [status,     setStatus]     = useState(null);  // { msg, type }
  const [creating,   setCreating]   = useState(false);
  const [shift,      setShift]      = useState(null);
  const [picker,     setPicker]     = useState(null);  // "from" | "to"
  const [copied,     setCopied]     = useState(false);
  const pollRef   = useRef(null);

  // Load all coins from SideShift on mount
  useEffect(() => {
    fetch(SS_API + "/coins")
      .then(r => r.ok ? r.json() : null)
      .then(list => {
        if (!Array.isArray(list) || list.length === 0) return;
        const iconMap = { btc:"₿",eth:"⟠",sol:"◎",usdc:"💵",usdt:"💲",bnb:"🟡",matic:"🔷",avax:"🔺",doge:"🐕",ltc:"Ł",xrp:"💧",dot:"●",ada:"♦",arb:"🔵",op:"🔴",trx:"🔺",xmr:"🔶",link:"⛓",wbtc:"🟠",near:"🌐",atom:"⚛",mon:"🟣",bch:"🟢",algo:"◆" };
        const mapped = list.slice(0, 300).map(c => {
          const coin = (c.coin || c.symbol || "").toLowerCase();
          const net  = c.network || coin;
          return {
            sym:     (c.coin || c.symbol || "?").toUpperCase(),
            network: net,
            name:    c.name || c.coin || "",
            ico:     iconMap[coin] || "🪙",
            id:      coin + (net && net !== coin ? "-" + net : ""),
          };
        });
        setCoins(mapped);
      })
      .catch(() => {}); // keep fallback
  }, []);

  // Fetch pair info when coins or rateType change
  const fetchPair = useCallback(async () => {
    setPairInfo(null);
    setAmountOut("—");
    try {
      const r = await fetch(`${SS_API}/pair/${fromCoin.id}/${toCoin.id}`);
      if (!r.ok) return;
      const d = await r.json();
      setPairInfo(d);
      // Recalc output if amount already entered
      const amt = parseFloat(amountIn);
      if (amt > 0) {
        const rate = parseFloat(d.rate || d.depositCoinRate || 0);
        if (rate > 0) setAmountOut((amt * rate).toFixed(6) + " " + toCoin.sym);
      }
    } catch {}
  }, [fromCoin, toCoin, rateType]);

  useEffect(() => { fetchPair(); }, [fetchPair]);

  // Recalc output on amount change
  function onAmountIn(val) {
    setAmountIn(val);
    const amt = parseFloat(val);
    if (!amt || amt <= 0 || !pairInfo) { setAmountOut("—"); return; }
    const rate = parseFloat(pairInfo.rate || pairInfo.depositCoinRate || 0);
    if (rate > 0) setAmountOut((amt * rate).toFixed(6) + " " + toCoin.sym);
    else setAmountOut("—");
  }

  function flipCoins() {
    const tmp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(tmp);
    setAmountIn(amountOut && amountOut !== "—" ? amountOut.split(" ")[0] : "");
    setAmountOut("—");
    setPairInfo(null);
    setShift(null);
    setStatus(null);
  }

  function selectCoin(coin) {
    if (picker === "from") setFromCoin(coin);
    else setToCoin(coin);
    setPicker(null);
    setPairInfo(null);
    setAmountOut("—");
    setShift(null);
    setStatus(null);
  }

  // Button state
  const minAmt  = parseFloat(pairInfo?.min || pairInfo?.minimumAmount || 0);
  const maxAmt  = parseFloat(pairInfo?.max || pairInfo?.maximumAmount || 0);
  const amt     = parseFloat(amountIn);
  let btnLabel  = "Enter amount & address";
  let btnActive = false;
  if (amt > 0 && pairInfo && destAddr.trim().length > 5) {
    if (minAmt > 0 && amt < minAmt) btnLabel = `Below minimum (${minAmt} ${fromCoin.sym})`;
    else if (maxAmt > 0 && amt > maxAmt) btnLabel = `Above maximum (${maxAmt} ${fromCoin.sym})`;
    else { btnLabel = `Create Shift: ${fromCoin.sym} → ${toCoin.sym}`; btnActive = true; }
  } else if (!pairInfo && amt > 0) btnLabel = "Pair not available";
  else if (!destAddr.trim()) btnLabel = "Enter destination address";

  async function createShift() {
    if (!btnActive) return;
    setCreating(true);
    setStatus({ msg:"⏳ Creating shift…", type:"info" });
    try {
      const ep   = rateType === "fixed" ? "/shifts/fixed" : "/shifts/variable";
      const body = JSON.stringify({
        depositCoin:   fromCoin.id,
        settleCoin:    toCoin.id,
        settleAddress: destAddr.trim(),
        affiliateId:   AFFILIATE,
      });
      const r = await fetch(SS_API + ep, {
        method:  "POST",
        headers: { "Content-Type":"application/json", "Accept":"application/json" },
        body,
      });
      const data = await r.json();
      if (!r.ok || !data.id || data.error) {
        const em = data.error?.message || data.error || ("HTTP " + r.status);
        setStatus({ msg:"❌ " + em, type:"error" });
        return;
      }
      setShift(data);
      setStatus(null);
      startPoll(data.id);
    } catch(e) {
      setStatus({ msg:"❌ " + (e.message || "Network error"), type:"error" });
    } finally { setCreating(false); }
  }

  function startPoll(id) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(SS_API + "/shifts/" + id);
        if (!r.ok) return;
        const d = await r.json();
        const map = { waiting:"⏳ Waiting for deposit", pending:"🔄 Processing", processing:"🔄 Processing", settling:"🔄 Settling", settled:"✅ Settled!", refunded:"↩️ Refunded" };
        setShift(prev => ({ ...prev, status: d.status, statusText: map[d.status] || d.status }));
        if (d.status === "settled") clearInterval(pollRef.current);
      } catch {}
    }, 8000);
  }

  function copyAddr() {
    const addr = shift?.depositAddress?.address || shift?.depositAddress;
    if (addr) { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  const depAddr = shift?.depositAddress?.address || shift?.depositAddress || "Pending…";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="card" style={{ background:"linear-gradient(160deg,#111 0%,#0D0D0D 100%)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>
              🌐 CROSS-CHAIN
            </h2>
            <p className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
              Powered by SideShift.ai · {coins.length} coins available
            </p>
          </div>
          <a href={"https://sideshift.ai/a/" + AFFILIATE} target="_blank" rel="noreferrer"
            className="text-xs text-muted hover:text-primary flex items-center gap-1" style={{ fontFamily:"'Space Mono',monospace" }}>
            SideShift ↗
          </a>
        </div>

        {/* Rate type toggle */}
        <div className="flex gap-2 mb-4">
          {[["variable","⚡ Variable Rate"],["fixed","🔒 Fixed Rate"]].map(([val,label]) => (
            <button key={val} onClick={() => { setRateType(val); fetchPair(); }}
              className={`flex-1 py-2 rounded-xl border text-xs transition-all ${rateType===val ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-border hover:text-text"}`}
              style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.04em" }}>
              {label}
            </button>
          ))}
        </div>

        {/* FROM */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>FROM</span>
            {minAmt > 0 && <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>min {minAmt} {fromCoin.sym}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPicker("from")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all min-w-[120px]">
              <span style={{ fontSize:20 }}>{fromCoin.ico}</span>
              <div className="text-left">
                <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{fromCoin.sym}</div>
                <div className="text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{fromCoin.network}</div>
              </div>
              <span className="text-muted text-xs ml-auto">▾</span>
            </button>
            <input type="number" value={amountIn} onChange={e => onAmountIn(e.target.value)}
              placeholder="0.0" className="flex-1 bg-transparent text-right outline-none text-xl text-text"
              style={{ fontFamily:"'Space Mono',monospace" }}/>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center my-1.5">
          <button onClick={flipCoins}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group">
            <ArrowLeftRight size={15} className="group-hover:scale-110 transition-transform"/>
          </button>
        </div>

        {/* TO */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>TO (estimated)</span>
            {pairInfo?.rate && <span className="text-xs text-primary" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
              1 {fromCoin.sym} = {parseFloat(pairInfo.rate || pairInfo.depositCoinRate || 0).toFixed(6)} {toCoin.sym}
            </span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPicker("to")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all min-w-[120px]">
              <span style={{ fontSize:20 }}>{toCoin.ico}</span>
              <div className="text-left">
                <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{toCoin.sym}</div>
                <div className="text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>{toCoin.network}</div>
              </div>
              <span className="text-muted text-xs ml-auto">▾</span>
            </button>
            <div className="flex-1 text-right text-xl text-text" style={{ fontFamily:"'Space Mono',monospace" }}>{amountOut}</div>
          </div>
        </div>

        {/* Pair info box */}
        {pairInfo && (
          <div className="p-3 rounded-xl bg-black/20 border border-border/40 mb-4 space-y-1.5">
            {[
              { l:"Rate",    v: pairInfo.rate ? parseFloat(pairInfo.rate).toFixed(6) + " " + toCoin.sym : "—" },
              { l:"Min deposit", v: (pairInfo.min || pairInfo.minimumAmount || "—") + " " + fromCoin.sym },
              { l:"Max deposit", v: (pairInfo.max || pairInfo.maximumAmount) ? (pairInfo.max || pairInfo.maximumAmount) + " " + fromCoin.sym : "Unlimited" },
              { l:"Network fee", v: "~0.3%", color:"text-accent" },
            ].map(({ l, v, color }) => (
              <div key={l} className="flex justify-between text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
                <span className="text-muted">{l}</span>
                <span className={color || "text-text"}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Destination address */}
        <div className="mb-4">
          <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
            DESTINATION ADDRESS — where you receive {toCoin.sym}
          </label>
          <input className="sz-input" placeholder={"Enter " + toCoin.sym + " " + toCoin.network + " address…"}
            value={destAddr} onChange={e => setDestAddr(e.target.value)}/>
        </div>

        {/* Status */}
        {status && (
          <div className={`mb-4 p-3 rounded-xl text-xs ${status.type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-primary/10 border border-primary/20 text-primary"}`}
            style={{ fontFamily:"'Space Mono',monospace" }}>{status.msg}</div>
        )}

        {/* Create button */}
        {!shift && (
          <button className="btn-primary w-full" disabled={!btnActive || creating}
            onClick={createShift}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {creating ? <><Loader2 size={16} className="animate-spin"/>Creating shift…</> : btnLabel}
          </button>
        )}

        {/* Shift result */}
        {shift && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 space-y-3">
            <div className="font-bold text-primary" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18 }}>
              ✅ Shift Created!
            </div>
            <div className="space-y-2 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
              {[
                { k:"Shift ID",   v: shift.id },
                { k:"From",       v: fromCoin.ico + " " + fromCoin.sym + " (" + fromCoin.network + ")" },
                { k:"To",         v: toCoin.ico + " " + toCoin.sym + " (" + toCoin.network + ")" },
                { k:"You receive",v: amountOut, color:"text-green-400" },
                { k:"Destination",v: destAddr.slice(0,22) + "…" },
                { k:"Rate type",  v: rateType === "fixed" ? "Fixed 🔒" : "Variable ⚡", color:"text-accent" },
                { k:"Status",     v: shift.statusText || "⏳ Waiting for deposit" },
              ].map(({ k, v, color }) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted">{k}</span>
                  <span className={color || "text-text truncate max-w-[55%] text-right"}>{v}</span>
                </div>
              ))}
            </div>

            {/* Deposit address */}
            <div className="p-3 rounded-xl bg-black/40 border border-primary/20">
              <div className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>
                SEND EXACTLY YOUR {fromCoin.sym} AMOUNT TO:
              </div>
              <div className="font-bold text-primary break-all text-sm mb-3"
                style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>{depAddr}</div>
              <button onClick={copyAddr} className="btn-primary w-full" style={{ padding:"9px", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {copied ? <><Check size={14}/>Copied!</> : <><Copy size={14}/>Copy Deposit Address</>}
              </button>
            </div>

            <div className="text-center text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
              Click to copy · Shift processes automatically after deposit
            </div>

            <div className="flex gap-2">
              <a href={"https://sideshift.ai/orders/" + shift.id} target="_blank" rel="noreferrer"
                className="btn-secondary flex-1 text-center flex items-center justify-center gap-1.5" style={{ fontSize:11 }}>
                Track on SideShift <ExternalLink size={11}/>
              </a>
              <button onClick={() => { setShift(null); setAmountIn(""); setAmountOut("—"); setDestAddr(""); setStatus(null); clearInterval(pollRef.current); }}
                className="btn-primary flex-1" style={{ fontSize:11 }}>New Shift</button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted/30 mt-3" style={{ fontFamily:"'Space Mono',monospace" }}>
          Non-custodial · No account needed · Powered by SideShift.ai
        </p>
      </div>

      {picker && <CoinModal coins={coins} onSelect={selectCoin} onClose={() => setPicker(null)}/>}
    </div>
  );
}
