import { useState, useEffect } from "react";
import { Plus, Loader2, BookOpen, ArrowRight, Search, TrendingUp, TrendingDown, ExternalLink, X } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI, MONAD_TOKENS, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS, getReadProvider, getContract, ensureAllowance } from "../../utils/contracts";
import { TokenLogo } from "../swap/SwapWidget";

const ORDERS_KEY = "swapzone_orders_v2";
function loadOrders() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)||"[]"); } catch { return []; } }
function saveOrders(o) { try { localStorage.setItem(ORDERS_KEY,JSON.stringify(o)); } catch {} }
const STATUS_COLOR = { Open:"text-primary", Filled:"text-green-400", Cancelled:"text-muted" };
const PERIODS = ["5m","1h","24h"];

// GeckoTerminal API (supports Monad mainnet)
const GECKO_NETWORK = "monad";
async function dexSearch(query) {
  try {
    if (ethers.isAddress(query)) {
      const r = await fetch(`https://api.geckoterminal.com/api/v2/networks/${GECKO_NETWORK}/tokens/${query}`, { headers:{"Accept":"application/json"} });
      if (!r.ok) throw new Error("not found");
      const d = await r.json();
      const pools = d.data?.relationships?.top_pools?.data;
      if (pools?.length) {
        const poolId = pools[0].id.split("_")[1];
        return { pairAddress: poolId, baseToken:{ address: query, symbol: d.data?.attributes?.symbol || "???", name: d.data?.attributes?.name || "Unknown" }, priceUsd: d.data?.attributes?.price_usd, priceChange:{ h24: d.data?.attributes?.price_change_percentage?.h24 || 0 }, volume:{ h24: d.data?.attributes?.volume_usd?.h24 || 0 }, liquidity:{ usd: d.data?.attributes?.total_reserve_in_usd || 0 }, txns:{ h24:{ buys:0, sells:0 } }, pairCreatedAt: null };
      }
    }
    // Search by name
    const r = await fetch(`https://api.geckoterminal.com/api/v2/search/pools?query=${encodeURIComponent(query)}&network=${GECKO_NETWORK}`, { headers:{"Accept":"application/json"} });
    if (!r.ok) throw new Error("search failed");
    const d = await r.json();
    const pool = d.data?.[0];
    if (!pool) return null;
    const attrs = pool.attributes;
    return { pairAddress: attrs.address, baseToken:{ address: attrs.base_token_address, symbol: attrs.name?.split("/")[0]?.trim() || "???", name: attrs.name || "Unknown" }, priceUsd: attrs.base_token_price_usd, priceChange:{ h24: attrs.price_change_percentage?.h24 || 0 }, volume:{ h24: attrs.volume_usd?.h24 || 0 }, liquidity:{ usd: attrs.reserve_in_usd || 0 }, txns:{ h24:{ buys: attrs.transactions?.h24?.buys || 0, sells: attrs.transactions?.h24?.sells || 0 } }, pairCreatedAt: attrs.pool_created_at ? new Date(attrs.pool_created_at).getTime() : null };
  } catch(e) { console.warn("GeckoTerminal search failed:", e.message); return null; }
}

export default function OrderBook() {
  const { signer, address, isConnected, connect } = useWallet();
  const [chartToken,   setChartToken]   = useState(MONAD_TOKENS[1]);
  const [pairData,     setPairData]     = useState(null);
  const [chartPeriod,  setChartPeriod]  = useState("1h");
  const [chartUrl,     setChartUrl]     = useState("");
  const [loadingPair,  setLoadingPair]  = useState(false);
  const [searchQ,      setSearchQ]      = useState("");
  const [searchLoading,setSearchLoading]= useState(false);
  const [searchErr,    setSearchErr]    = useState(null);
  const [foundToken,   setFoundToken]   = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [form,         setForm]         = useState({ tokenIn:MONAD_TOKENS[1], tokenOut:MONAD_TOKENS[2], amountIn:"", limitPrice:"" });
  const [balIn,        setBalIn]        = useState("—");
  const [balOut,       setBalOut]       = useState("—");
  const [placing,      setPlacing]      = useState(false);
  const [filling,      setFilling]      = useState(null);
  const [error,        setError]        = useState(null);
  const [tx,           setTx]           = useState(null);

  useEffect(() => { setOrders(loadOrders()); loadPair(chartToken.address); }, []);

  useEffect(() => {
    if (!address) return;
    const fetchBal = async (token, setter) => {
      try {
        const p = getReadProvider();
        if (token.address === "native") { const b = await p.getBalance(address); setter(parseFloat(require("ethers").ethers?.formatEther?.(b) || 0).toFixed(4)); return; }
        const c = getContract(token.address, ERC20_ABI, p);
        const b = await c.balanceOf(address);
        const { ethers } = require("ethers");
        setter(parseFloat(ethers.formatUnits(b, token.decimals)).toFixed(4));
      } catch { setter("—"); }
    };
    fetchBal(form.tokenIn,  setBalIn);
    fetchBal(form.tokenOut, setBalOut);
  }, [address, form.tokenIn, form.tokenOut]);

  async function loadPair(addr) {
    if (addr==="native") addr="0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
    setLoadingPair(true);
    try {
      const pair = await dexSearch(addr);
      setPairData(pair);
      if (pair?.pairAddress) setChartUrl(`https://www.geckoterminal.com/monad/pools/${pair.pairAddress}?embed=1&light_chart=0`);
      else setChartUrl("");
    } catch { setPairData(null); setChartUrl(""); }
    finally { setLoadingPair(false); }
  }

  async function doSearch() {
    if (!searchQ.trim()) return;
    setSearchLoading(true); setSearchErr(null); setFoundToken(null);
    try {
      const pair = await dexSearch(searchQ);
      if (!pair) { setSearchErr("No results on Monad"); return; }
      const tok = { address:pair.baseToken.address, symbol:pair.baseToken.symbol, name:pair.baseToken.name, decimals:18, logoColor:"#00FFD1" };
      setFoundToken(tok);
      setPairData(pair);
      setChartUrl(`https://dexscreener.com/monad/${pair.pairAddress}?embed=1&theme=dark&trades=1&info=0`);
    } catch(e) { setSearchErr(e.message); }
    finally { setSearchLoading(false); }
  }

  async function placeOrder() {
    if (!isConnected) { connect(); return; }
    if (!form.amountIn||!form.limitPrice) { setError("Fill all fields"); return; }
    setPlacing(true); setError(null);
    try {
      const order = { id:Date.now().toString(), maker:address, tokenIn:form.tokenIn, tokenOut:form.tokenOut, amountIn:form.amountIn, limitPrice:form.limitPrice, status:"Open", createdAt:Date.now() };
      const u = [order,...orders]; setOrders(u); saveOrders(u);
      setForm(f=>({...f,amountIn:"",limitPrice:""}));
    } catch(e) { setError(e.message); }
    finally { setPlacing(false); }
  }

  async function fillOrder(order) {
    if (!isConnected) { connect(); return; }
    setFilling(order.id); setError(null); setTx(null);
    try {
      const tIn  = order.tokenIn.address==="native"?"0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701":order.tokenIn.address;
      const tOut = order.tokenOut.address==="native"?"0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701":order.tokenOut.address;
      const amtIn = ethers.parseUnits(order.amountIn, order.tokenIn.decimals);
      const minOut = ethers.parseUnits((parseFloat(order.amountIn)*parseFloat(order.limitPrice)*0.995).toFixed(order.tokenOut.decimals), order.tokenOut.decimals);
      const factory = getContract(ADDRESSES.ammFactory,AMM_FACTORY_ABI,signer);
      const poolAddr = await factory.getPool(tIn,tOut);
      if (!poolAddr||poolAddr===ethers.ZeroAddress) throw new Error("No pool");
      await ensureAllowance(tIn,address,poolAddr,amtIn,signer);
      const pool = getContract(poolAddr,AMM_POOL_ABI,signer);
      const t = await pool.swap(tIn,amtIn,minOut,address);
      const r = await t.wait(); setTx(r.hash);
      try { const fee=(amtIn*PROTOCOL_FEE_BPS)/10000n; if(fee>0n){const e=getContract(tIn,ERC20_ABI,signer);await e.transfer(PROTOCOL_FEE_WALLET,fee);} } catch {}
      const u = orders.map(o=>o.id===order.id?{...o,status:"Filled",txHash:r.hash}:o); setOrders(u); saveOrders(u);
    } catch(e) { setError(e.reason||e.message); }
    finally { setFilling(null); }
  }

  function cancelOrder(id) { const u=orders.map(o=>o.id===id?{...o,status:"Cancelled"}:o); setOrders(u); saveOrders(u); }
  const myOrders = orders.filter(o=>o.maker?.toLowerCase()===address?.toLowerCase());
  const priceUp  = parseFloat(pairData?.priceChange?.h24||0)>=0;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Search bar */}
      <div className="card" style={{padding:16}}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input className="sz-input pl-9" placeholder="Search by name, symbol or contract address…"
              value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
          </div>
          <button className="btn-primary" onClick={doSearch} disabled={searchLoading}
            style={{padding:"10px 20px",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            {searchLoading?<Loader2 size={14} className="animate-spin"/>:<Search size={14}/>} Search
          </button>
        </div>
        {searchErr && <p className="text-red-400 text-xs mt-2" style={{fontFamily:"'Space Mono',monospace"}}>{searchErr}</p>}
        {foundToken && (
          <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold" style={{fontFamily:"'Rajdhani',sans-serif"}}>{foundToken.symbol[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-primary" style={{fontFamily:"'Rajdhani',sans-serif"}}>{foundToken.symbol}</span>
              <span className="text-muted text-xs ml-2 truncate">{foundToken.name}</span>
            </div>
            <button className="btn-secondary text-xs" onClick={()=>{setChartToken(foundToken);setForm(f=>({...f,tokenIn:foundToken}));setFoundToken(null);setSearchQ("");}} style={{padding:"6px 12px",whiteSpace:"nowrap"}}>
              Use Token
            </button>
          </div>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          {MONAD_TOKENS.slice(1).map(t=>(
            <button key={t.address} onClick={()=>{setChartToken(t);loadPair(t.address);}}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-all ${chartToken.address===t.address?"border-primary/40 bg-primary/10 text-primary":"border-border text-muted hover:text-text"}`}
              style={{fontFamily:"'Space Mono',monospace",fontSize:10}}>
              <TokenLogo token={t} size={12}/>{t.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div className="flex flex-wrap items-center justify-between p-4 border-b border-border gap-3">
          <div className="flex items-center gap-3">
            <TokenLogo token={chartToken} size={34}/>
            <div>
              <div className="font-bold" style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20}}>{chartToken.symbol}/USD</div>
              {pairData&&(
                <div className="flex items-center gap-3 text-xs" style={{fontFamily:"'Space Mono',monospace"}}>
                  <span className="text-text font-bold text-sm">${parseFloat(pairData.priceUsd||0).toFixed(8)}</span>
                  <span className={priceUp?"text-green-400 flex items-center gap-1":"text-red-400 flex items-center gap-1"}>
                    {priceUp?<TrendingUp size={11}/>:<TrendingDown size={11}/>}
                    {pairData.priceChange?.h24>0?"+":""}{parseFloat(pairData.priceChange?.h24||0).toFixed(2)}%
                  </span>
                  {pairData.pairAddress&&<a href={`https://dexscreener.com/monad/${pairData.pairAddress}`} target="_blank" rel="noreferrer" className="text-muted hover:text-primary flex items-center gap-1">DexScreener<ExternalLink size={9}/></a>}
                </div>
              )}
            </div>
          </div>
          {pairData&&(
            <div className="hidden sm:flex gap-5 text-xs" style={{fontFamily:"'Space Mono',monospace"}}>
              {[{l:"24h Vol",v:`$${parseFloat(pairData.volume?.h24||0).toLocaleString()}`},{l:"Liquidity",v:`$${parseFloat(pairData.liquidity?.usd||0).toLocaleString()}`},{l:"Txns",v:String((pairData.txns?.h24?.buys||0)+(pairData.txns?.h24?.sells||0))}].map(({l,v})=>(
                <div key={l} className="text-center"><div className="text-muted">{l}</div><div className="text-text font-bold">{v}</div></div>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            {PERIODS.map(p=>(
              <button key={p} onClick={()=>setChartPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${chartPeriod===p?"bg-primary/15 text-primary border-primary/30":"text-muted border-border/40 hover:text-text"}`}
                style={{fontFamily:"'Space Mono',monospace"}}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{height:360,background:"#080808",position:"relative"}}>
          {loadingPair&&<div className="absolute inset-0 flex items-center justify-center"><div className="spinner"/></div>}
          {chartUrl?(
            <iframe src={chartUrl} width="100%" height="100%" frameBorder="0" style={{display:"block",border:"none"}} title="Chart"/>
          ):(
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <TrendingUp size={32} className="mb-3 opacity-20"/>
              <p className="text-sm" style={{fontFamily:"'Space Mono',monospace"}}>No chart data available</p>
              <p className="text-xs mt-1 opacity-60" style={{fontFamily:"'Space Mono',monospace"}}>Search a token or select one above</p>
            </div>
          )}
        </div>
      </div>

      {/* Order form + list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="mb-1 font-bold" style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,letterSpacing:"0.05em"}}>LIMIT ORDER</h2>
          <p className="text-xs text-muted mb-4" style={{fontFamily:"'Space Mono',monospace"}}>Off-chain · AMM execution · Auto protocol fee</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block" style={{fontFamily:"'Space Mono',monospace"}}>Sell</label>
                <select className="sz-input" value={form.tokenIn.address} onChange={e=>setForm(f=>({...f,tokenIn:MONAD_TOKENS.find(t=>t.address===e.target.value)||form.tokenIn}))}>
                  {MONAD_TOKENS.map(t=><option key={t.address} value={t.address}>{t.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block" style={{fontFamily:"'Space Mono',monospace"}}>Buy</label>
                <select className="sz-input" value={form.tokenOut.address} onChange={e=>setForm(f=>({...f,tokenOut:MONAD_TOKENS.find(t=>t.address===e.target.value)||form.tokenOut}))}>
                  {MONAD_TOKENS.map(t=><option key={t.address} value={t.address}>{t.symbol}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-muted" style={{fontFamily:"'Space Mono',monospace"}}>Amount</label>
                <span className="text-xs text-muted" style={{fontFamily:"'Space Mono',monospace"}}>Bal: <span className="text-text">{balIn}</span></span>
              </div>
              <input className="sz-input" type="number" placeholder="0.0" value={form.amountIn} onChange={e=>setForm(f=>({...f,amountIn:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block" style={{fontFamily:"'Space Mono',monospace"}}>
                Limit Price
                {pairData&&<span className="ml-2 text-primary">Market: ${parseFloat(pairData.priceUsd||0).toFixed(6)}</span>}
              </label>
              <input className="sz-input" type="number" placeholder="0.0" value={form.limitPrice} onChange={e=>setForm(f=>({...f,limitPrice:e.target.value}))}/>
            </div>
            <button className="btn-primary w-full" disabled={placing} onClick={placeOrder}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {placing?<><Loader2 size={15} className="animate-spin"/>Placing…</>:<><Plus size={15}/>Place Order</>}
            </button>
          </div>
          {error&&<div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{fontFamily:"'Space Mono',monospace"}}>{error}</div>}
          {tx&&<div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs" style={{fontFamily:"'Space Mono',monospace"}}>✅ {tx.slice(0,16)}…</div>}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,letterSpacing:"0.05em"}}>MY ORDERS</h2>
            <span className="text-xs text-muted" style={{fontFamily:"'Space Mono',monospace"}}>{myOrders.length}</span>
          </div>
          {!isConnected?(
            <div className="py-10 text-center"><button className="btn-primary" onClick={connect}>Connect Wallet</button></div>
          ):myOrders.length===0?(
            <div className="py-12 text-center text-muted"><BookOpen size={28} className="mx-auto mb-3 opacity-20"/><p className="text-xs" style={{fontFamily:"'Space Mono',monospace"}}>No orders yet</p></div>
          ):(
            <div className="space-y-2 overflow-y-auto" style={{maxHeight:340}}>
              {myOrders.map(o=>(
                <div key={o.id} className={`p-3 rounded-xl border text-xs ${o.status==="Open"?"border-primary/20 bg-primary/3":"border-border/30 opacity-50"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold" style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13}}>{o.tokenIn.symbol}</span>
                      <ArrowRight size={10} className="text-muted"/>
                      <span className="font-bold" style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13}}>{o.tokenOut.symbol}</span>
                    </div>
                    <span className={STATUS_COLOR[o.status]} style={{fontFamily:"'Space Mono',monospace",fontSize:10}}>{o.status}</span>
                  </div>
                  <div className="text-muted mb-2" style={{fontFamily:"'Space Mono',monospace"}}>{o.amountIn} @ {o.limitPrice}</div>
                  {o.status==="Open"&&(
                    <div className="flex gap-2">
                      <button className="btn-primary flex-1 text-xs" disabled={!!filling} onClick={()=>fillOrder(o)} style={{padding:"5px 8px"}}>
                        {filling===o.id?<Loader2 size={11} className="animate-spin mx-auto"/>:"Execute"}
                      </button>
                      <button className="btn-secondary text-xs" onClick={()=>cancelOrder(o.id)} style={{padding:"5px 8px"}}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
