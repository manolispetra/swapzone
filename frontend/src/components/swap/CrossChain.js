import { useState, useEffect } from "react";
import { ArrowLeftRight, ArrowUpDown, Loader2, ExternalLink, RefreshCw, Info, ChevronDown } from "lucide-react";

const AFFILIATE_ID = "G4nvHmbdX";
const API = "https://sideshift.ai/api/v2";

const POPULAR = [
  { symbol:"BTC",  name:"Bitcoin",  network:"bitcoin",   icon:"₿", color:"#F7931A" },
  { symbol:"ETH",  name:"Ethereum", network:"ethereum",  icon:"Ξ", color:"#627EEA" },
  { symbol:"SOL",  name:"Solana",   network:"solana",    icon:"◎", color:"#9945FF" },
  { symbol:"USDC", name:"USD Coin", network:"ethereum",  icon:"$", color:"#2775CA" },
  { symbol:"USDT", name:"Tether",   network:"ethereum",  icon:"₮", color:"#26A17B" },
  { symbol:"XMR",  name:"Monero",   network:"monero",    icon:"Ξ", color:"#FF6600" },
  { symbol:"MON",  name:"Monad",    network:"monad",     icon:"M",      color:"#836EF9" },
  { symbol:"LTC",  name:"Litecoin", network:"litecoin",  icon:"Ł", color:"#BFBBBB" },
];

export default function CrossChain() {
  const [fromCoin,   setFromCoin]   = useState(POPULAR[0]);
  const [toCoin,     setToCoin]     = useState(POPULAR[6]);
  const [fromAmt,    setFromAmt]    = useState("");
  const [toAmt,      setToAmt]      = useState("");
  const [toAddr,     setToAddr]     = useState("");
  const [refundAddr, setRefundAddr] = useState("");
  const [quoting,    setQuoting]    = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [order,      setOrder]      = useState(null);
  const [error,      setError]      = useState(null);
  const [rateInfo,   setRateInfo]   = useState(null);
  const [pickerFor,  setPickerFor]  = useState(null); // "from"|"to"

  useEffect(() => {
    const t = setTimeout(getQuote, 600);
    return () => clearTimeout(t);
  }, [fromAmt, fromCoin, toCoin]);

  async function getQuote() {
    if (!fromAmt || parseFloat(fromAmt) <= 0) { setToAmt(""); setRateInfo(null); return; }
    setQuoting(true); setError(null);
    try {
      const res = await fetch(
        API + "/quotes?depositCoin=" + fromCoin.symbol + "&settleCoin=" + toCoin.symbol +
        "&depositAmount=" + fromAmt + "&affiliateId=" + AFFILIATE_ID
      );
      const d = await res.json();
      if (d.error) throw new Error(d.error.message || d.error);
      setToAmt(parseFloat(d.settleAmount || 0).toFixed(6));
      setRateInfo({ rate: d.rate, min: d.min, max: d.max, id: d.id });
    } catch(e) {
      setToAmt("");
      setError(e.message.includes("minimum") ? e.message : null);
      // Fallback: fetch pair info
      try {
        const r2 = await fetch(API + "/pairs/" + fromCoin.symbol + "/" + toCoin.symbol);
        const d2 = await r2.json();
        if (d2.rate) setRateInfo({ rate: d2.rate, min: d2.min, max: d2.max, id: null });
      } catch {}
    }
    finally { setQuoting(false); }
  }

  async function createOrder() {
    if (!toAddr || !fromAmt || !rateInfo?.id) {
      setError("Fill in the destination address and amount first");
      return;
    }
    setCreating(true); setError(null);
    try {
      const body = {
        depositCoin:   fromCoin.symbol,
        settleCoin:    toCoin.symbol,
        depositAmount: fromAmt,
        settleAddress: toAddr,
        affiliateId:   AFFILIATE_ID,
        quoteId:       rateInfo.id,
      };
      if (refundAddr) body.refundAddress = refundAddr;

      const res = await fetch(API + "/shifts/fixed", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify(body),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
      setOrder(d);
    } catch(e) { setError(e.message); }
    finally { setCreating(false); }
  }

  function flip() {
    const tmp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(tmp);
    setFromAmt(toAmt || "");
    setToAmt("");
    setRateInfo(null);
  }

  if (order) return <OrderConfirmed order={order} fromCoin={fromCoin} toCoin={toCoin} onReset={() => { setOrder(null); setFromAmt(""); setToAmt(""); setToAddr(""); setRefundAddr(""); setRateInfo(null); }} />;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="card" style={{ background:"linear-gradient(160deg,#111 0%,#0D0D0D 100%)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>
            CROSS-CHAIN SWAP
          </h2>
          <div className="flex items-center gap-1 text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
            <span>via</span>
            <a href={"https://sideshift.ai/a/" + AFFILIATE_ID} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
              SideShift.ai <ExternalLink size={9}/>
            </a>
          </div>
        </div>

        {/* From */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>You send</span>
            {rateInfo?.min && <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>Min: {rateInfo.min}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPickerFor("from")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all min-w-[110px]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: fromCoin.color + "22", color: fromCoin.color }}>{fromCoin.icon}</div>
              <span className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15 }}>{fromCoin.symbol}</span>
              <ChevronDown size={12} className="text-muted ml-auto"/>
            </button>
            <input type="number" value={fromAmt} onChange={e => setFromAmt(e.target.value)}
              placeholder="0.00" className="flex-1 bg-transparent text-right outline-none text-xl text-text"
              style={{ fontFamily:"'Space Mono',monospace" }}/>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center my-1">
          <button onClick={flip}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group">
            <ArrowUpDown size={15} className="group-hover:rotate-180 transition-transform duration-300"/>
          </button>
        </div>

        {/* To */}
        <div className="p-4 rounded-xl bg-black/30 border border-border/60 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>You receive (est.)</span>
            {rateInfo?.rate && <span className="text-xs text-primary" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>Rate: {parseFloat(rateInfo.rate).toFixed(6)}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPickerFor("to")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all min-w-[110px]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: toCoin.color + "22", color: toCoin.color }}>{toCoin.icon}</div>
              <span className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15 }}>{toCoin.symbol}</span>
              <ChevronDown size={12} className="text-muted ml-auto"/>
            </button>
            <div className="flex-1 relative">
              {quoting && <div className="spinner absolute right-2 top-1/2 -translate-y-1/2" style={{ width:14, height:14 }}/>}
              <input readOnly value={toAmt} placeholder="0.00"
                className="w-full bg-transparent text-right outline-none text-xl text-text"
                style={{ fontFamily:"'Space Mono',monospace" }}/>
            </div>
          </div>
        </div>

        {/* Destination address */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
              Your {toCoin.symbol} address ({toCoin.network})
            </label>
            <input className="sz-input" placeholder={"Destination " + toCoin.symbol + " address"}
              value={toAddr} onChange={e => setToAddr(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
              Refund address ({fromCoin.symbol}) <span className="opacity-50">optional</span>
            </label>
            <input className="sz-input" placeholder={"Your " + fromCoin.symbol + " address for refunds"}
              value={refundAddr} onChange={e => setRefundAddr(e.target.value)}/>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}

        <button className="btn-primary w-full" disabled={creating || !toAddr || !fromAmt || quoting}
          onClick={createOrder} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {creating ? <><Loader2 size={16} className="animate-spin"/>Creating Order…</> : <><ArrowLeftRight size={16}/>Swap {fromCoin.symbol} → {toCoin.symbol}</>}
        </button>

        <p className="text-center text-xs text-muted/40 mt-3" style={{ fontFamily:"'Space Mono',monospace" }}>
          Powered by SideShift.ai · No account needed
        </p>
      </div>

      {/* Coin picker modal */}
      {pickerFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)" }}>
          <div className="card w-full max-w-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16 }}>Select Coin</h3>
              <button onClick={() => setPickerFor(null)} className="text-muted hover:text-text text-xl leading-none">×</button>
            </div>
            <div className="space-y-1">
              {POPULAR.map(coin => (
                <button key={coin.symbol} onClick={() => { pickerFor==="from"?setFromCoin(coin):setToCoin(coin); setPickerFor(null); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{ background: coin.color + "22", color: coin.color, fontFamily:"'Rajdhani',sans-serif" }}>{coin.icon}</div>
                  <div>
                    <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15 }}>{coin.symbol}</div>
                    <div className="text-xs text-muted">{coin.name} · {coin.network}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderConfirmed({ order, fromCoin, toCoin, onReset }) {
  const [copied, setCopied] = useState(false);
  function copy(text) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  return (
    <div className="max-w-md mx-auto">
      <div className="card border-primary/30">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🔁</div>
          <h2 className="font-bold neon-text text-xl" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>Order Created!</h2>
          <p className="text-xs text-muted mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>Send your {fromCoin.symbol} to the address below</p>
        </div>

        {/* Deposit address */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <div className="text-xs text-muted mb-1" style={{ fontFamily:"'Space Mono',monospace" }}>Send {fromCoin.symbol} to:</div>
          <div className="font-bold text-primary text-sm break-all mb-2" style={{ fontFamily:"'Space Mono',monospace", fontSize:12 }}>{order.depositAddress?.address}</div>
          <button onClick={() => copy(order.depositAddress?.address)}
            className="btn-primary w-full text-sm" style={{ padding:"8px 16px" }}>
            {copied ? "Copied! ✓" : "Copy Address"}
          </button>
        </div>

        <div className="space-y-2 text-xs mb-4" style={{ fontFamily:"'Space Mono',monospace" }}>
          {[
            { label:"Order ID",     value: order.id },
            { label:"Send amount",  value: order.depositAmount + " " + fromCoin.symbol },
            { label:"You receive",  value: order.settleAmount  + " " + toCoin.symbol   },
            { label:"Status",       value: order.status },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between p-2 rounded-lg bg-black/30 border border-border/40">
              <span className="text-muted">{label}</span>
              <span className="text-text truncate max-w-[55%] text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <a href={"https://sideshift.ai/orders/" + order.id} target="_blank" rel="noreferrer"
            className="btn-secondary flex-1 text-center flex items-center justify-center gap-2 text-xs">
            Track Order <ExternalLink size={12}/>
          </a>
          <button onClick={onReset} className="btn-primary flex-1 text-xs" style={{ padding:"10px" }}>New Swap</button>
        </div>
      </div>
    </div>
  );
}
