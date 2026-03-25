import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, ChevronDown, Search, X, Loader2, ExternalLink, Settings } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { logActivity } from "../ui/ActivitySidebar";
import {
  ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI,
  MONAD_TOKENS, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS,
  getReadProvider, getContract, ensureAllowance
} from "../../utils/contracts";

export default function SwapWidget() {
  const { signer, address, isConnected, connect, provider } = useWallet();
  const [tokenIn,       setTokenIn]       = useState(MONAD_TOKENS[0]);
  const [tokenOut,      setTokenOut]      = useState(MONAD_TOKENS[2]);
  const [amountIn,      setAmountIn]      = useState("");
  const [amountOut,     setAmountOut]     = useState("");
  const [balanceIn,     setBalanceIn]     = useState("—");
  const [balanceOut,    setBalanceOut]    = useState("—");
  const [quoting,       setQuoting]       = useState(false);
  const [swapping,      setSwapping]      = useState(false);
  const [txHash,        setTxHash]        = useState(null);
  const [error,         setError]         = useState(null);
  const [slippage,      setSlippage]      = useState("0.5");
  const [showSettings,  setShowSettings]  = useState(false);
  const [showPickerIn,  setShowPickerIn]  = useState(false);
  const [showPickerOut, setShowPickerOut] = useState(false);
  const [route,         setRoute]         = useState("amm");
  const [feeInfo,       setFeeInfo]       = useState(null);

  // ── Fetch balance ────────────────────────────────────────────────────────
  const fetchBal = useCallback(async (token) => {
    if (!address) return "—";
    try {
      const p = provider || getReadProvider();
      if (token.address === "native") {
        const b = await p.getBalance(address);
        return parseFloat(ethers.formatEther(b)).toFixed(4);
      }
      const c = getContract(token.address, ERC20_ABI, p);
      const b = await c.balanceOf(address);
      return parseFloat(ethers.formatUnits(b, token.decimals)).toFixed(4);
    } catch { return "—"; }
  }, [address, provider]);

  useEffect(() => {
    fetchBal(tokenIn).then(setBalanceIn);
    fetchBal(tokenOut).then(setBalanceOut);
  }, [tokenIn, tokenOut, address, fetchBal]);

  // ── Quote ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(quote, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [amountIn, tokenIn, tokenOut]);

  async function quote() {
    if (!amountIn || parseFloat(amountIn) <= 0) { setAmountOut(""); setFeeInfo(null); return; }
    setQuoting(true);
    try {
      const p    = getReadProvider();
      const tIn  = tokenIn.address  === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenIn.address;
      const tOut = tokenOut.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenOut.address;
      const amtIn = ethers.parseUnits(amountIn, tokenIn.decimals);

      if (ADDRESSES.ammFactory) {
        const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, p);
        const poolAddr = await factory.getPool(tIn, tOut).catch(() => null);
        if (poolAddr && poolAddr !== ethers.ZeroAddress) {
          const pool = getContract(poolAddr, AMM_POOL_ABI, p);
          const [out, lpFee, protoFee] = await pool.getAmountOut(tIn, amtIn);
          setAmountOut(parseFloat(ethers.formatUnits(out, tokenOut.decimals)).toFixed(6));
          setFeeInfo({ lp: ethers.formatUnits(lpFee, tokenIn.decimals), proto: ethers.formatUnits(protoFee, tokenIn.decimals) });
          setRoute("amm");
          return;
        }
      }
      // No pool found
      setAmountOut("No pool");
      setFeeInfo(null);
      setRoute("none");
    } catch (e) {
      setAmountOut("Error");
    } finally {
      setQuoting(false);
    }
  }

  function flip() {
    setTokenIn(tokenOut); setTokenOut(tokenIn);
    setAmountIn(amountOut && !["No pool","Error","—"].includes(amountOut) ? amountOut : "");
    setAmountOut(""); setBalanceIn(balanceOut); setBalanceOut(balanceIn);
  }

  async function doSwap() {
    if (!isConnected) { connect(); return; }
    if (!amountIn || !amountOut || ["No pool","Error","—"].includes(amountOut)) return;
    setSwapping(true); setError(null); setTxHash(null);
    try {
      const tIn  = tokenIn.address  === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenIn.address;
      const tOut = tokenOut.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenOut.address;
      const amtIn  = ethers.parseUnits(amountIn, tokenIn.decimals);
      const slip   = 1 - parseFloat(slippage) / 100;
      const minOut = ethers.parseUnits((parseFloat(amountOut) * slip).toFixed(tokenOut.decimals), tokenOut.decimals);

      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(tIn, tOut);
      await ensureAllowance(tIn, address, poolAddr, amtIn, signer);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const tx   = await pool.swap(tIn, amtIn, minOut, address);
      const r    = await tx.wait();
      setTxHash(r.hash);
      logActivity("swap", { fromSym: tokenIn.symbol, toSym: tokenOut.symbol, fromAmt: amountIn, txHash: r.hash, wallet: address });

      // ── Auto protocol fee — direct to fee wallet ──────────────────────────
      try {
        const fee = (amtIn * PROTOCOL_FEE_BPS) / 10000n;
        if (fee > 0n && tIn !== "native") {
          const erc20 = getContract(tIn, ERC20_ABI, signer);
          await erc20.transfer(PROTOCOL_FEE_WALLET, fee);
        }
      } catch { /* non-blocking */ }

      setAmountIn(""); setAmountOut("");
      fetchBal(tokenIn).then(setBalanceIn);
      fetchBal(tokenOut).then(setBalanceOut);
    } catch (e) {
      setError(e.reason || e.message || "Swap failed");
    } finally {
      setSwapping(false);
    }
  }

  const canSwap = isConnected && amountIn && amountOut && !["No pool","Error","—",""].includes(amountOut) && !swapping;

  return (
    <div className="card max-w-md w-full mx-auto" style={{ background:"linear-gradient(160deg,#111 0%,#0D0D0D 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>SWAP</h2>
        <div className="flex items-center gap-2">
          {route !== "none" && (
            <span className="text-xs px-2 py-0.5 rounded-full border text-primary border-primary/30 bg-primary/5"
              style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>SwapZone AMM</span>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="text-muted hover:text-primary transition-colors">
            <Settings size={15} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 rounded-xl bg-black/30 border border-border">
          <p className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>Slippage</p>
          <div className="flex gap-2">
            {["0.1","0.5","1.0"].map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className={`px-3 py-1 rounded-lg text-xs ${slippage===s ? "bg-primary/20 text-primary border border-primary/40" : "bg-white/5 text-muted border border-transparent"}`}
                style={{ fontFamily:"'Space Mono',monospace" }}>{s}%</button>
            ))}
          </div>
        </div>
      )}

      <TokenBox label="You pay" token={tokenIn} amount={amountIn} balance={balanceIn}
        onAmountChange={setAmountIn} onMax={() => setAmountIn(balanceIn !== "—" ? balanceIn : "")}
        onOpenPicker={() => setShowPickerIn(true)} />
      <div className="flex justify-center my-2">
        <button onClick={flip} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group">
          <ArrowUpDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>
      <TokenBox label="You receive" token={tokenOut} amount={amountOut} balance={balanceOut}
        onAmountChange={() => {}} onOpenPicker={() => setShowPickerOut(true)} readOnly loading={quoting} />

      {feeInfo && (
        <div className="mt-3 p-3 rounded-xl bg-black/20 border border-border/50 space-y-1">
          <Row label="LP Fee"       value={`${parseFloat(feeInfo.lp).toFixed(6)} ${tokenIn.symbol}`} />
          <Row label="Protocol Fee" value={`${parseFloat(feeInfo.proto).toFixed(6)} ${tokenIn.symbol}`} />
          <Row label="Slippage"     value={`${slippage}%`} color="text-accent" />
        </div>
      )}

      {error  && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}
      {txHash && (
        <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex justify-between items-center" style={{ fontFamily:"'Space Mono',monospace" }}>
          <span>✅ Confirmed!</span>
          <a href={`https://monadexplorer.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">
            {txHash.slice(0,12)}… <ExternalLink size={10} />
          </a>
        </div>
      )}

      <button className="btn-primary w-full mt-4" disabled={!canSwap} onClick={doSwap}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {swapping ? <><Loader2 size={16} className="animate-spin" />Swapping…</> : !isConnected ? "Connect Wallet" : !amountIn ? "Enter Amount" : route === "none" ? "No Liquidity" : "Swap"}
      </button>

      {showPickerIn  && <TokenPicker exclude={tokenOut} onSelect={t => { setTokenIn(t);  setShowPickerIn(false);  }} onClose={() => setShowPickerIn(false)} />}
      {showPickerOut && <TokenPicker exclude={tokenIn}  onSelect={t => { setTokenOut(t); setShowPickerOut(false); }} onClose={() => setShowPickerOut(false)} />}
    </div>
  );
}

function Row({ label, value, color = "text-text" }) {
  return (
    <div className="flex justify-between text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
      <span>{label}</span><span className={color}>{value}</span>
    </div>
  );
}

export function TokenLogo({ token, size = 28 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${token.logoColor}22`, border:`1px solid ${token.logoColor}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:size*0.42, color:token.logoColor }}>{token.symbol[0]}</span>
    </div>
  );
}

function TokenBox({ label, token, amount, balance, onAmountChange, onMax, onOpenPicker, readOnly, loading }) {
  return (
    <div className="p-4 rounded-xl bg-black/30 border border-border/60 hover:border-border transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</span>
        <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
          Balance: <span className="text-text">{balance}</span>
          {onMax && balance !== "—" && parseFloat(balance) > 0 && (
            <button onClick={onMax} className="ml-2 text-primary hover:underline">MAX</button>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onOpenPicker} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 transition-all min-w-[115px]">
          <TokenLogo token={token} size={22} />
          <span className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15 }}>{token.symbol}</span>
          <ChevronDown size={13} className="text-muted ml-auto" />
        </button>
        <div className="flex-1 relative">
          {loading && <div className="spinner absolute right-2 top-1/2 -translate-y-1/2" style={{ width:14, height:14 }} />}
          <input type="number" value={amount} onChange={e => onAmountChange(e.target.value)}
            readOnly={readOnly} placeholder="0.00"
            className="w-full bg-transparent text-right outline-none text-text"
            style={{ fontFamily:"'Space Mono',monospace", fontSize:20 }} />
        </div>
      </div>
    </div>
  );
}

function TokenPicker({ onSelect, onClose, exclude }) {
  const [search,  setSearch]  = useState("");
  const [custom,  setCustom]  = useState("");
  const [loading, setLoading] = useState(false);
  const [found,   setFound]   = useState(null);
  const [err,     setErr]     = useState(null);

  const list = MONAD_TOKENS.filter(t =>
    t.address !== exclude?.address &&
    (!search || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  async function lookup() {
    if (!ethers.isAddress(custom)) { setErr("Invalid address"); return; }
    setLoading(true); setErr(null); setFound(null);
    try {
      const p = getReadProvider();
      const c = getContract(custom, ERC20_ABI, p);
      const [name, symbol, decimals] = await Promise.all([
        c.name().catch(() => "Unknown"),
        c.symbol().catch(() => "???"),
        c.decimals().catch(() => 18),
      ]);
      setFound({ address: custom, name, symbol, decimals: Number(decimals), logoColor: "#00FFD1" });
    } catch { setErr("Token not found"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)" }}>
      <div className="card w-full max-w-sm" style={{ maxHeight:"80vh", display:"flex", flexDirection:"column" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:17 }}>SELECT TOKEN</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="sz-input pl-9" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-y-auto flex-1 space-y-1 mb-3">
          {list.map(t => (
            <button key={t.address} onClick={() => onSelect(t)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
              <TokenLogo token={t} size={32} />
              <div>
                <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15 }}>{t.symbol}</div>
                <div className="text-xs text-muted">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
        {/* Custom token */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>Custom token address</p>
          <div className="flex gap-2">
            <input className="sz-input flex-1 text-xs" placeholder="0x..." value={custom} onChange={e => setCustom(e.target.value)} style={{ fontSize:11 }} />
            <button className="btn-secondary" onClick={lookup} disabled={loading} style={{ padding:"8px 12px", fontSize:11 }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : "Find"}
            </button>
          </div>
          {err   && <p className="text-red-400 text-xs mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>{err}</p>}
          {found && (
            <button onClick={() => onSelect(found)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mt-2 hover:bg-primary/10 transition-colors">
              <TokenLogo token={found} size={32} />
              <div className="text-left">
                <div className="font-bold text-primary" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{found.symbol}</div>
                <div className="text-xs text-muted">{found.name}</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
