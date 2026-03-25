import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, Loader2, Zap, TrendingUp, TrendingDown, RefreshCw, Flame, AlertCircle } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS, getReadProvider, getContract, ensureAllowance } from "../../utils/contracts";

const DS = "https://api.dexscreener.com";

// Fetch latest token profiles (newly listed)
async function fetchLatestProfiles() {
  const res = await fetch(DS + "/token-profiles/latest/v1");
  const d   = await res.json();
  // Filter for monad chain
  const monad = (Array.isArray(d) ? d : []).filter(t => t.chainId === "monad");
  return monad.slice(0, 30);
}

// Fetch trending (most boosted) tokens
async function fetchTrendingTokens() {
  const res = await fetch(DS + "/token-boosts/top/v1");
  const d   = await res.json();
  const monad = (Array.isArray(d) ? d : []).filter(t => t.chainId === "monad");
  return monad.slice(0, 30);
}

// Search pairs on monad
async function searchTokens(q) {
  const res = await fetch(DS + "/latest/dex/search?q=" + encodeURIComponent(q));
  const d   = await res.json();
  return (d.pairs || []).filter(p => p.chainId === "monad").slice(0, 30);
}

// Enrich profiles with pair data
async function enrichWithPairData(profiles) {
  if (!profiles.length) return [];
  const addresses = profiles.map(p => p.tokenAddress).join(",");
  try {
    const res = await fetch(DS + "/latest/dex/tokens/" + addresses.split(",")[0]);
    // Fetch one by one to be safe
    const enriched = await Promise.all(
      profiles.slice(0, 15).map(async (profile) => {
        try {
          const r = await fetch(DS + "/latest/dex/tokens/" + profile.tokenAddress);
          const d = await r.json();
          const pair = (d.pairs || []).find(p => p.chainId === "monad") || null;
          return { ...profile, pair };
        } catch { return { ...profile, pair: null }; }
      })
    );
    return enriched;
  } catch { return profiles.map(p => ({ ...p, pair: null })); }
}

export default function TokenExplorer() {
  const { signer, address, isConnected, connect } = useWallet();
  const [tab,        setTab]        = useState("new");
  const [items,      setItems]      = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [buyAmt,     setBuyAmt]     = useState("0.1");
  const [buying,     setBuying]     = useState(null);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiError,   setApiError]   = useState(null);
  const intervalRef  = useRef(null);
  const searchTimer  = useRef(null);

  useEffect(() => {
    if (!search) loadData();
    intervalRef.current = setInterval(() => { if (!search) loadData(); }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [tab]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!search) { loadData(); return; }
    searchTimer.current = setTimeout(doSearch, 500);
  }, [search]);

  async function loadData() {
    setLoading(true); setApiError(null);
    try {
      if (tab === "new") {
        const profiles = await fetchLatestProfiles();
        if (profiles.length > 0) {
          const enriched = await enrichWithPairData(profiles);
          setItems(enriched);
        } else {
          // Fallback: search for monad tokens
          const pairs = await searchTokens("monad WMON");
          setItems(pairs.map(p => ({ tokenAddress: p.baseToken?.address, pair: p, icon: null })));
        }
      } else {
        const boosted = await fetchTrendingTokens();
        if (boosted.length > 0) {
          const enriched = await enrichWithPairData(boosted);
          setItems(enriched);
        } else {
          const pairs = await searchTokens("monad");
          setItems(pairs.map(p => ({ tokenAddress: p.baseToken?.address, pair: p })));
        }
      }
      setLastUpdate(new Date());
    } catch(e) {
      setApiError("Could not load data: " + e.message);
    } finally { setLoading(false); }
  }

  async function doSearch() {
    setLoading(true); setApiError(null);
    try {
      const pairs = await searchTokens(search);
      setItems(pairs.map(p => ({ tokenAddress: p.baseToken?.address, pair: p, icon: null, description: "" })));
    } catch(e) { setApiError(e.message); }
    finally { setLoading(false); }
  }

  async function buyToken(item) {
    if (!isConnected) { connect(); return; }
    const tokenAddr = item.tokenAddress || item.pair?.baseToken?.address;
    if (!tokenAddr) return;
    setBuying(tokenAddr); setError(null); setTxHash(null);
    try {
      const wmon = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
      const amtIn = ethers.parseEther(buyAmt);
      const factory = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(wmon, tokenAddr).catch(() => null);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        // No SwapZone pool — redirect to DexScreener
        const dsUrl = item.pair?.url || `https://dexscreener.com/monad/${tokenAddr}`;
        window.open(dsUrl, "_blank");
        return;
      }
      await ensureAllowance(wmon, address, poolAddr, amtIn, signer);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const tx   = await pool.swap(wmon, amtIn, 0n, address);
      const r    = await tx.wait();
      setTxHash(r.hash);
      try {
        const fee = (amtIn * PROTOCOL_FEE_BPS) / 10000n;
        const erc20 = getContract(wmon, ERC20_ABI, signer);
        await erc20.transfer(PROTOCOL_FEE_WALLET, fee);
      } catch {}
    } catch(e) { setError(e.reason || e.message); }
    finally { setBuying(null); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="card" style={{ padding:"14px 16px" }}>
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <div className="flex gap-2">
            <button onClick={() => { setTab("new"); setSearch(""); }}
              className={"flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs transition-all " +
                (tab==="new" ? "bg-red-500/15 text-red-400 border-red-500/30" : "text-muted border-border hover:text-text")}
              style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              <span className={"w-2 h-2 rounded-full " + (tab==="new" ? "bg-red-400 animate-pulse" : "bg-border")}/>
              New Listings
            </button>
            <button onClick={() => { setTab("trending"); setSearch(""); }}
              className={"flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs transition-all " +
                (tab==="trending" ? "bg-accent/15 text-accent border-accent/30" : "text-muted border-border hover:text-text")}
              style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              <Flame size={13}/> Trending
            </button>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && <span className="text-xs text-muted" style={{ fontFamily:"Space Mono,monospace", fontSize:9 }}>{lastUpdate.toLocaleTimeString()}</span>}
            <button onClick={loadData} className="text-muted hover:text-primary transition-colors">
              <RefreshCw size={14} className={loading?"animate-spin":""}/>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="sz-input pl-9" placeholder="Search by name, symbol or contract address on Monad…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted" style={{ fontFamily:"Space Mono,monospace" }}>Quick buy:</span>
          {["0.1","0.5","1","5"].map(a => (
            <button key={a} onClick={() => setBuyAmt(a)}
              className={"px-3 py-1 rounded-lg text-xs border transition-all " +
                (buyAmt===a ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-border hover:text-text")}
              style={{ fontFamily:"Space Mono,monospace" }}>{a} MON</button>
          ))}
        </div>
      </div>

      {apiError && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-start gap-2" style={{ fontFamily:"Space Mono,monospace" }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
          <span>{apiError}</span>
        </div>
      )}
      {error  && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"Space Mono,monospace" }}>{error}</div>}
      {txHash && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex justify-between" style={{ fontFamily:"Space Mono,monospace" }}>
          <span>✅ Swap confirmed!</span>
          <a href={"https://monadexplorer.com/tx/"+txHash} target="_blank" rel="noreferrer" className="underline">{txHash.slice(0,14)}…</a>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16"><div className="spinner"/></div>
      ) : items.length === 0 && !loading ? (
        <div className="card text-center py-14 text-muted">
          <Zap size={28} className="mx-auto mb-3 opacity-20"/>
          <p className="text-sm" style={{ fontFamily:"Space Mono,monospace" }}>
            {search ? `No results for "${search}" on Monad` : "No tokens found"}
          </p>
          <p className="text-xs mt-2 opacity-40" style={{ fontFamily:"Space Mono,monospace" }}>Powered by DexScreener · auto-refreshes every 30s</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const pair  = item.pair;
            const sym   = pair?.baseToken?.symbol || item.tokenAddress?.slice(0,8) || "?";
            const name  = pair?.baseToken?.name  || "";
            const price = parseFloat(pair?.priceUsd || 0);
            const chg   = parseFloat(pair?.priceChange?.h24 || 0);
            const up    = chg >= 0;
            const liq   = parseFloat(pair?.liquidity?.usd || 0);
            const vol   = parseFloat(pair?.volume?.h24 || 0);
            const tAddr = item.tokenAddress || pair?.baseToken?.address;

            return (
              <div key={i} className="card hover:border-border/80 transition-all" style={{ padding:"12px 16px" }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold overflow-hidden"
                    style={{ background:"linear-gradient(135deg,rgba(0,255,209,0.15),rgba(132,88,255,0.15))", border:"1px solid rgba(0,255,209,0.1)" }}>
                    {item.icon ? (
                      <img src={item.icon} alt={sym} style={{ width:40, height:40, objectFit:"cover" }}
                        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}/>
                    ) : null}
                    <span className="neon-text font-bold" style={{ fontFamily:"Rajdhani,sans-serif", fontSize:16 }}>{sym[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-text" style={{ fontFamily:"Rajdhani,sans-serif", fontSize:16 }}>{sym}</span>
                      <span className="text-xs text-muted truncate max-w-[130px]">{name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap" style={{ fontFamily:"Space Mono,monospace" }}>
                      <span className="text-text">${price < 0.000001 ? price.toExponential(3) : price < 0.001 ? price.toFixed(8) : price.toFixed(4)}</span>
                      {pair && <span className={up ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                        {up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                        {chg > 0 ? "+" : ""}{chg.toFixed(2)}%
                      </span>}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-5 text-xs" style={{ fontFamily:"Space Mono,monospace" }}>
                    {liq > 0 && <div className="text-center"><div className="text-muted" style={{ fontSize:9 }}>Liquidity</div><div className="text-text font-bold">${liq.toLocaleString(undefined,{maximumFractionDigits:0})}</div></div>}
                    {vol > 0 && <div className="text-center"><div className="text-muted" style={{ fontSize:9 }}>Vol 24h</div><div className="text-text font-bold">${vol.toLocaleString(undefined,{maximumFractionDigits:0})}</div></div>}
                  </div>

                  <div className="flex items-center gap-2">
                    {pair?.url && <a href={pair.url} target="_blank" rel="noreferrer" className="text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/5"><ExternalLink size={14}/></a>}
                    <button className="btn-primary" disabled={!!buying} onClick={() => buyToken(item)}
                      style={{ padding:"8px 14px", fontSize:12, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                      {buying === tAddr ? <Loader2 size={13} className="animate-spin"/> : <Zap size={13}/>}
                      {isConnected ? "Buy " + buyAmt : "Connect"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
