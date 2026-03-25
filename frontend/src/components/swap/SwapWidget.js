import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Loader2, Info, ChevronDown, X, Search, CheckCircle } from "lucide-react";
import { ethers } from "ethers";
import { logActivity } from "../ui/ActivitySidebar";
import { useWallet } from "../../hooks/useWallet";
import { MONAD_TOKENS, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS, getReadProvider } from "../../utils/contracts";

// ── Uniswap V3 on Monad (from gcretanswap) ──────────────────────────────────
const UNI_ROUTER = "0xfE31F71C1b106EAc32F1A19239c9a9A72ddfb900";
const UNI_QUOTER = "0x661e93cca42afacb172121ef892830ca3b70f08d";
const WMON_ADDR  = "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A";
const FEE_TIERS  = [500, 3000, 10000];
const SLIPPAGES  = [0.1, 0.5, 1];

const ABI_QUOTER = [
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
  "function quoteExactInput(bytes path,uint256 amountIn) returns (uint256 amountOut,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
];
const ABI_ROUTER = [
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
  "function exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum) params) payable returns (uint256 amountOut)",
];
const ABI_ERC20 = ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"];

// Encode multi-hop path: tokenA (20b) + fee1 (3b) + tokenB (20b) + fee2 (3b) + tokenC (20b)
function encPath(a, f1, b, f2, c) {
  const addr = x => x.slice(2).toLowerCase().padStart(40, "0");
  const fee  = f => f.toString(16).padStart(6, "0");
  return "0x" + addr(a) + fee(f1) + addr(b) + fee(f2) + addr(c);
}

async function tryDirect(quoter, tIn, tOut, amtIn, fee) {
  try {
    const [out] = await quoter.quoteExactInputSingle.staticCall({ tokenIn:tIn, tokenOut:tOut, amountIn:amtIn, fee, sqrtPriceLimitX96:0n });
    return out;
  } catch { return null; }
}

async function tryHop(quoter, tIn, tOut, amtIn, f1, f2) {
  try {
    const path = encPath(tIn, f1, WMON_ADDR, f2, tOut);
    const [out] = await quoter.quoteExactInput.staticCall(path, amtIn);
    return out;
  } catch { return null; }
}

async function fetchBestQuote(tIn, tOut, amtIn) {
  const provider = getReadProvider();
  const quoter   = new ethers.Contract(UNI_QUOTER, ABI_QUOTER, provider);

  // 1) Direct across all fee tiers
  const directs = await Promise.all(
    FEE_TIERS.map(fee => tryDirect(quoter, tIn, tOut, amtIn, fee).then(out => out ? { out, fee, route:"direct" } : null))
  );
  // 2) Multi-hop via WMON (skip if either side is already WMON)
  let hops = [];
  if (tIn.toLowerCase() !== WMON_ADDR.toLowerCase() && tOut.toLowerCase() !== WMON_ADDR.toLowerCase()) {
    const combos = [[3000,3000],[500,3000],[3000,500],[10000,3000],[3000,10000],[500,500]];
    hops = await Promise.all(
      combos.map(([f1,f2]) => tryHop(quoter, tIn, tOut, amtIn, f1, f2).then(out => out ? { out, fee:f1, fee2:f2, route:"hop" } : null))
    );
  }
  const all = [...directs, ...hops].filter(Boolean);
  if (!all.length) return null;
  return all.reduce((a, b) => b.out > a.out ? b : a); // best = most output
}

function fmtBal(n) { const f = parseFloat(n); return f < 0.0001 ? f.toExponential(4) : f.toFixed(4); }

// ── Token Picker ─────────────────────────────────────────────────────────────
function TokenPicker({ tokens, selected, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="card w-full max-w-xs" style={{ maxHeight:"70vh", display:"flex", flexDirection:"column" }} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16 }}>Select Token</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={16}/></button>
        </div>
        <div className="relative mb-3">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="sz-input pl-8 text-xs" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} autoFocus/>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(t => (
            <button key={t.address} onClick={() => onSelect(t)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs"
                style={{ background: t.logoColor+"22", border:"1px solid "+t.logoColor+"55", color:t.logoColor, fontFamily:"'Rajdhani',sans-serif" }}>
                {t.symbol[0]}
              </div>
              <div>
                <div className="font-bold text-text text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{t.symbol}</div>
                <div className="text-muted text-xs">{t.name}</div>
              </div>
              {selected?.symbol === t.symbol && <CheckCircle size={14} className="ml-auto text-primary"/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main SwapWidget ───────────────────────────────────────────────────────────
export default function SwapWidget() {
  const { signer, address, isConnected, connect } = useWallet();
  const [tokenIn,    setTokenIn]    = useState(MONAD_TOKENS[0]); // MON (native)
  const [tokenOut,   setTokenOut]   = useState(MONAD_TOKENS[1]); // USDC
  const [amountIn,   setAmountIn]   = useState("");
  const [amountOut,  setAmountOut]  = useState("");
  const [balIn,      setBalIn]      = useState("—");
  const [balOut,     setBalOut]     = useState("—");
  const [slippage,   setSlippage]   = useState(0.5);
  const [quoting,    setQuoting]    = useState(false);
  const [swapping,   setSwapping]   = useState(false);
  const [quote,      setQuote]      = useState(null); // { out, fee, fee2, route }
  const [noLiq,      setNoLiq]      = useState(false);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);
  const [picker,     setPicker]     = useState(null); // "in"|"out"
  const quoteTimer = useRef(null);

  // Fetch balances
  useEffect(() => {
    if (!address) return;
    const load = async () => {
      const p = getReadProvider();
      const getBal = async (tok) => {
        try {
          if (tok.address === "native") {
            return fmtBal(ethers.formatEther(await p.getBalance(address)));
          }
          const c = new ethers.Contract(tok.address, ABI_ERC20, p);
          return fmtBal(ethers.formatUnits(await c.balanceOf(address), tok.decimals));
        } catch { return "—"; }
      };
      setBalIn(await getBal(tokenIn));
      setBalOut(await getBal(tokenOut));
    };
    load();
  }, [address, tokenIn, tokenOut, txHash]);

  // Auto-quote
  useEffect(() => {
    clearTimeout(quoteTimer.current);
    if (!amountIn || parseFloat(amountIn) <= 0) { setAmountOut(""); setQuote(null); setNoLiq(false); return; }
    quoteTimer.current = setTimeout(doQuote, 500);
    return () => clearTimeout(quoteTimer.current);
  }, [amountIn, tokenIn, tokenOut]);

  async function doQuote() {
    setQuoting(true); setNoLiq(false); setError(null);
    try {
      const tIn  = tokenIn.address  === "native" ? WMON_ADDR : tokenIn.address;
      const tOut = tokenOut.address === "native" ? WMON_ADDR : tokenOut.address;
      const dec  = tokenIn.address  === "native" ? 18 : tokenIn.decimals;
      const amtIn = ethers.parseUnits(amountIn, dec);
      const best = await fetchBestQuote(tIn, tOut, amtIn);
      if (!best) { setAmountOut(""); setNoLiq(true); setQuote(null); return; }
      setQuote(best);
      const outDec = tokenOut.address === "native" ? 18 : tokenOut.decimals;
      setAmountOut(parseFloat(ethers.formatUnits(best.out, outDec)).toFixed(6));
    } catch(e) { setAmountOut(""); setNoLiq(true); setQuote(null); }
    finally { setQuoting(false); }
  }

  async function doSwap() {
    if (!isConnected || !quote || !amountIn) return;
    setSwapping(true); setError(null); setTxHash(null);
    try {
      const tIn    = tokenIn.address  === "native" ? WMON_ADDR : tokenIn.address;
      const tOut   = tokenOut.address === "native" ? WMON_ADDR : tokenOut.address;
      const dec    = tokenIn.address  === "native" ? 18 : tokenIn.decimals;
      const amtIn  = ethers.parseUnits(amountIn, dec);
      const slip   = BigInt(Math.floor((1 - slippage/100)*10000));
      const minOut = (quote.out * slip) / 10000n;
      const router = new ethers.Contract(UNI_ROUTER, ABI_ROUTER, signer);
      const value  = tokenIn.address === "native" ? amtIn : 0n;

      // Approve if needed (ERC20)
      if (tokenIn.address !== "native") {
        const erc20   = new ethers.Contract(tokenIn.address, ABI_ERC20, signer);
        const allowed = await erc20.allowance(address, UNI_ROUTER);
        if (allowed < amtIn) {
          const tx = await erc20.approve(UNI_ROUTER, ethers.MaxUint256);
          await tx.wait();
        }
      }

      let tx;
      if (quote.route === "hop") {
        const path = encPath(tIn, quote.fee, WMON_ADDR, quote.fee2||3000, tOut);
        tx = await router.exactInput({ path, recipient:address, amountIn:amtIn, amountOutMinimum:minOut }, { value });
      } else {
        tx = await router.exactInputSingle({ tokenIn:tIn, tokenOut:tOut, fee:quote.fee, recipient:address, amountIn:amtIn, amountOutMinimum:minOut, sqrtPriceLimitX96:0n }, { value });
      }
      const r = await tx.wait();
      setTxHash(r.hash);
      setAmountIn(""); setAmountOut(""); setQuote(null);
      logActivity("swap", { fromSym:tokenIn.symbol, toSym:tokenOut.symbol, fromAmt:amountIn, txHash:r.hash, wallet:address });

      // Protocol fee (small % to SwapZone wallet)
      try {
        const feeBps = BigInt(PROTOCOL_FEE_BPS);
        const feeAmt = (amtIn * feeBps) / 10000n;
        if (feeAmt > 0n) {
          if (tokenIn.address === "native") {
            await signer.sendTransaction({ to: PROTOCOL_FEE_WALLET, value: feeAmt });
          } else {
            const erc20 = new ethers.Contract(tokenIn.address, ABI_ERC20, signer);
            await erc20.transfer(PROTOCOL_FEE_WALLET, feeAmt);
          }
        }
      } catch {}
    } catch(e) { setError(e.reason || e.message?.slice(0,80) || "Swap failed"); }
    finally { setSwapping(false); }
  }

  function flip() {
    const tmp = tokenIn; setTokenIn(tokenOut); setTokenOut(tmp);
    setAmountIn(amountOut && amountOut !== "" ? amountOut : "");
    setAmountOut(""); setQuote(null); setNoLiq(false);
  }

  const feeLbl = quote ? (quote.fee===500?"0.05%":quote.fee===3000?"0.3%":"1%") : null;
  const routeLbl = quote?.route === "hop" ? tokenIn.symbol+" → WMON → "+tokenOut.symbol : tokenIn.symbol+" → "+tokenOut.symbol;

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:18, letterSpacing:"0.06em" }}>SWAP</h2>
          <div className="flex gap-1">
            {SLIPPAGES.map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className={`px-2 py-1 rounded-lg text-xs border transition-all ${slippage===s?"bg-primary/15 text-primary border-primary/30":"text-muted border-border/40"}`}
                style={{ fontFamily:"'Space Mono',monospace" }}>{s}%</button>
            ))}
          </div>
        </div>

        {/* From */}
        <div className="p-3 rounded-xl bg-black/30 border border-border/60 mb-1">
          <div className="flex justify-between items-center mb-2 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            <span className="text-muted">YOU PAY</span>
            <span className="text-muted cursor-pointer hover:text-primary" onClick={() => { if(balIn!=="—") setAmountIn(balIn); }}>
              Bal: <span className="text-text">{balIn}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPicker("in")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all flex-shrink-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background:tokenIn.logoColor+"22", color:tokenIn.logoColor, fontFamily:"'Rajdhani',sans-serif" }}>{tokenIn.symbol[0]}</div>
              <span className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{tokenIn.symbol}</span>
              <ChevronDown size={12} className="text-muted"/>
            </button>
            <input type="number" value={amountIn} onChange={e=>setAmountIn(e.target.value)}
              placeholder="0.0" className="flex-1 bg-transparent text-right outline-none text-xl font-bold text-text"
              style={{ fontFamily:"'Space Mono',monospace" }}/>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center my-1">
          <button onClick={flip} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group">
            <ArrowUpDown size={14} className="group-hover:rotate-180 transition-transform duration-300"/>
          </button>
        </div>

        {/* To */}
        <div className="p-3 rounded-xl bg-black/30 border border-border/60 mb-4">
          <div className="flex justify-between items-center mb-2 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            <span className="text-muted">YOU RECEIVE</span>
            <span className="text-muted">Bal: <span className="text-text">{balOut}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPicker("out")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all flex-shrink-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background:tokenOut.logoColor+"22", color:tokenOut.logoColor, fontFamily:"'Rajdhani',sans-serif" }}>{tokenOut.symbol[0]}</div>
              <span className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{tokenOut.symbol}</span>
              <ChevronDown size={12} className="text-muted"/>
            </button>
            <div className="flex-1 relative">
              {quoting && <div className="spinner absolute right-1 top-1/2 -translate-y-1/2" style={{width:14,height:14}}/>}
              <div className="text-right text-xl font-bold text-text" style={{ fontFamily:"'Space Mono',monospace" }}>{amountOut||"0.0"}</div>
            </div>
          </div>
        </div>

        {/* Route info */}
        {quote && (
          <div className="mb-4 p-2.5 rounded-xl bg-black/20 border border-border/40 space-y-1 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            {[
              { l:"Route",   v:routeLbl },
              { l:"Fee",     v:feeLbl },
              { l:"Slippage",v:slippage+"%"},
            ].map(({l,v})=>(
              <div key={l} className="flex justify-between">
                <span className="text-muted">{l}</span><span className="text-text">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* No liquidity */}
        {noLiq && (
          <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs flex items-start gap-2" style={{ fontFamily:"'Space Mono',monospace" }}>
            <Info size={13} className="text-accent flex-shrink-0 mt-0.5"/>
            <span className="text-accent">No liquidity found for this pair on Uniswap V3 (Monad). Try a different amount or token.</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}

        {/* Tx success */}
        {txHash && (
          <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex justify-between" style={{ fontFamily:"'Space Mono',monospace" }}>
            <span>✅ Swap confirmed!</span>
            <a href={"https://monadexplorer.com/tx/"+txHash} target="_blank" rel="noreferrer" className="underline">{txHash.slice(0,16)}…</a>
          </div>
        )}

        {/* Button */}
        {!isConnected ? (
          <button className="btn-primary w-full" onClick={connect}>Connect Wallet</button>
        ) : (
          <button className="btn-primary w-full" disabled={!quote || swapping || quoting}
            onClick={doSwap} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {swapping ? <><Loader2 size={15} className="animate-spin"/>Swapping…</> : `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`}
          </button>
        )}

        <p className="text-center text-xs text-muted/30 mt-2" style={{ fontFamily:"'Space Mono',monospace" }}>
          Powered by Uniswap V3 on Monad
        </p>
      </div>

      {picker && <TokenPicker tokens={MONAD_TOKENS} selected={picker==="in"?tokenIn:tokenOut}
        onSelect={t => { picker==="in"?setTokenIn(t):setTokenOut(t); setPicker(null); setAmountOut(""); setQuote(null); }}
        onClose={() => setPicker(null)}/>}
    </div>
  );
}
