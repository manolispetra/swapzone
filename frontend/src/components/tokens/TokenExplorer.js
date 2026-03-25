import { useState, useEffect, useRef } from "react";
import { Search, Shield, AlertTriangle, ExternalLink, Plus, Loader2, Zap, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI, MONAD_TOKENS, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS, getReadProvider, getContract, ensureAllowance } from "../../utils/contracts";
import { TokenLogo } from "../swap/SwapWidget";

// ── DexScreener: new tokens with MON liquidity in last 10 min ─────────────────
async function fetchNewTokens() {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/search?q=monad");
    const d = await r.json();
    const now = Date.now();
    const tenMin = 10 * 60 * 1000;
    return (d.pairs || [])
      .filter(p => p.chainId === "monad" && (now - (p.pairCreatedAt || 0)) < tenMin && parseFloat(p.liquidity?.usd || 0) > 0)
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
      .slice(0, 30);
  } catch { return []; }
}

async function fetchTrendingTokens() {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/search?q=monad");
    const d = await r.json();
    return (d.pairs || [])
      .filter(p => p.chainId === "monad" && parseFloat(p.liquidity?.usd || 0) > 100)
      .sort((a, b) => parseFloat(b.volume?.h24 || 0) - parseFloat(a.volume?.h24 || 0))
      .slice(0, 30);
  } catch { return []; }
}

export default function TokenExplorer() {
  const { signer, address, isConnected, connect } = useWallet();
  const [tab,         setTab]         = useState("live");   // live | trending | all
  const [newTokens,   setNewTokens]   = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [buying,      setBuying]      = useState(null);
  const [buyAmt,      setBuyAmt]      = useState("0.1");
  const [txHash,      setTxHash]      = useState(null);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(loadData, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [n, t] = await Promise.all([fetchNewTokens(), fetchTrendingTokens()]);
      setNewTokens(n);
      setTrending(t);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }

  async function buyToken(pair) {
    if (!isConnected) { connect(); return; }
    setBuying(pair.pairAddress); setError(null); setTxHash(null);
    try {
      const wmon    = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
      const tokenOut = pair.baseToken.address;
      const amtIn   = ethers.parseEther(buyAmt);

      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(wmon, tokenOut).catch(() => null);

      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        throw new Error("No SwapZone pool yet — use DexScreener to trade");
      }
      await ensureAllowance(wmon, address, poolAddr, amtIn, signer);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const t = await pool.swap(wmon, amtIn, 0n, address);
      const r = await t.wait();
      setTxHash(r.hash);
      // Protocol fee
      try {
        const fee = (amtIn * PROTOCOL_FEE_BPS) / 10000n;
        const erc20 = getContract(wmon, ERC20_ABI, signer);
        await erc20.transfer(PROTOCOL_FEE_WALLET, fee);
      } catch {}
    } catch (e) { setError(e.reason || e.message); }
    finally { setBuying(null); }
  }

  const displayed = (tab === "live" ? newTokens : trending).filter(p =>
    !search ||
    p.baseToken?.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    p.baseToken?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.baseToken?.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="card" style={{ padding:16 }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex gap-2">
            {[
              { key:"live",     label:"🔴 Live (10m)", badge: newTokens.length },
              { key:"trending", label:"🔥 Trending",   badge: null },
            ].map(({ key, label, badge }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all ${tab===key?"bg-primary/15 text-primary border-primary/30":"text-muted border-border hover:text-text"}`}
                style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>
                {label}
                {badge !== null && badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5" style={{ fontSize:9 }}>{badge}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
            <button onClick={loadData} className="text-muted hover:text-primary transition-colors">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="sz-input pl-9" placeholder="Filter by name, symbol or address…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tab === "live" && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>Buy amount (MON):</span>
            {["0.1","0.5","1","5"].map(a => (
              <button key={a} onClick={() => setBuyAmt(a)}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${buyAmt===a?"bg-primary/15 text-primary border-primary/30":"text-muted border-border hover:text-text"}`}
                style={{ fontFamily:"'Space Mono',monospace" }}>{a}</button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback */}
      {error  && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}
      {txHash && <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-between" style={{ fontFamily:"'Space Mono',monospace" }}>
        <span>✅ Swap confirmed!</span>
        <a href={`https://monadexplorer.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">{txHash.slice(0,14)}… <ExternalLink size={10}/></a>
      </div>}

      {/* Token list */}
      {loading && displayed.length === 0 ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-16 text-muted">
          <Zap size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm" style={{ fontFamily:"'Space Mono',monospace" }}>
            {tab === "live" ? "No new tokens in the last 10 minutes" : "No trending tokens found"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(pair => (
            <TokenRow key={pair.pairAddress} pair={pair} onBuy={() => buyToken(pair)} buying={buying === pair.pairAddress} buyAmt={buyAmt} isConnected={isConnected} />
          ))}
        </div>
      )}
    </div>
  );
}

function TokenRow({ pair, onBuy, buying, buyAmt, isConnected }) {
  const priceUp  = parseFloat(pair.priceChange?.h24 || 0) >= 0;
  const ageMin   = pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 60000) : null;

  return (
    <div className="card hover:border-border/80 transition-all" style={{ padding:"12px 16px" }}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Token info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="font-bold neon-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16 }}>
              {(pair.baseToken?.symbol || "?")[0]}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16 }}>{pair.baseToken?.symbol}</span>
              <span className="text-xs text-muted truncate max-w-[120px]">{pair.baseToken?.name}</span>
              {ageMin !== null && ageMin < 10 && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full" style={{ fontFamily:"'Space Mono',monospace", fontSize:9 }}>
                  NEW {ageMin}m
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
              <span className="text-text">${parseFloat(pair.priceUsd || 0).toFixed(8)}</span>
              <span className={priceUp ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                {priceUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                {pair.priceChange?.h24 > 0 ? "+" : ""}{parseFloat(pair.priceChange?.h24 || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
          <div className="text-center">
            <div className="text-muted text-xs" style={{ fontSize:9 }}>Liquidity</div>
            <div className="text-text font-bold">${parseFloat(pair.liquidity?.usd || 0).toLocaleString(undefined, { maximumFractionDigits:0 })}</div>
          </div>
          <div className="text-center">
            <div className="text-muted text-xs" style={{ fontSize:9 }}>Vol 24h</div>
            <div className="text-text font-bold">${parseFloat(pair.volume?.h24 || 0).toLocaleString(undefined, { maximumFractionDigits:0 })}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a href={`https://dexscreener.com/monad/${pair.pairAddress}`} target="_blank" rel="noreferrer"
            className="text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/5">
            <ExternalLink size={14} />
          </a>
          <button className="btn-primary" disabled={buying} onClick={onBuy}
            style={{ padding:"8px 16px", fontSize:12, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
            {buying ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {isConnected ? `Buy ${buyAmt} MON` : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
