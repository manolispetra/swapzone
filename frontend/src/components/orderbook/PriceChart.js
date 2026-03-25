import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";

const DS = "https://api.dexscreener.com/latest/dex";

// Known Monad mainnet token addresses (exact case from on-chain)
const TOKEN_ADDRESSES = {
  WMON:  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  USDC:  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  USDT:  "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A",
  WETH:  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  WBTC:  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
  shMON: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
};

const PERIODS = [
  { label:"5m",  key:"m5",  duration: 5*60*1000   },
  { label:"1h",  key:"h1",  duration: 60*60*1000  },
  { label:"24h", key:"h24", duration:24*60*60*1000 },
];

async function findPairData(tokenAddress) {
  if (!tokenAddress || tokenAddress === "native") {
    tokenAddress = TOKEN_ADDRESSES.WMON;
  }
  // Normalize address to lowercase for API
  const addr = tokenAddress.toLowerCase();
  const r = await fetch(DS + "/tokens/" + addr);
  if (!r.ok) throw new Error("API error " + r.status);
  const d = await r.json();
  const pairs = (d.pairs || []);
  // Prefer monad chain
  return pairs.find(p => p.chainId === "monad") || pairs[0] || null;
}

function buildPoints(pair, period) {
  if (!pair) return [];
  const price   = parseFloat(pair.priceUsd || 0);
  if (!price) return [];
  const change  = parseFloat(pair.priceChange?.[period.key] || 0) / 100;
  const now     = Date.now();
  const N       = 40;
  const points  = [];

  for (let i = 0; i <= N; i++) {
    const frac    = i / N;
    const msAgo   = period.duration * (1 - frac);
    const t       = new Date(now - msAgo);
    const oldPrice = price / (1 + change);
    const p = oldPrice + (price - oldPrice) * frac;
    const label = period.key === "h24"
      ? t.getHours().toString().padStart(2,"0") + "h"
      : t.getHours().toString().padStart(2,"0") + ":" + t.getMinutes().toString().padStart(2,"0");
    if (p > 0) points.push({ time: label, price: parseFloat(p.toFixed(10)) });
  }
  return points;
}

function fmtPrice(p) {
  if (!p || p === 0) return "0";
  if (p < 0.000001) return p.toExponential(4);
  if (p < 0.001)    return p.toFixed(8);
  if (p < 1)        return p.toFixed(6);
  return p.toFixed(4);
}

export default function PriceChart({ tokenIn, tokenOut }) {
  const [data,     setData]     = useState([]);
  const [pairInfo, setPairInfo] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [period,   setPeriod]   = useState(PERIODS[1]);
  const [noData,   setNoData]   = useState(false);

  const load = useCallback(async () => {
    if (!tokenIn) return;
    setLoading(true); setNoData(false);
    try {
      const addr = tokenIn.address === "native"
        ? TOKEN_ADDRESSES.WMON
        : tokenIn.address;
      const pair = await findPairData(addr);
      if (!pair) { setNoData(true); setData([]); return; }
      setPairInfo(pair);
      const pts = buildPoints(pair, period);
      if (pts.length < 2) { setNoData(true); setData([]); return; }
      setData(pts);
    } catch { setNoData(true); setData([]); }
    finally { setLoading(false); }
  }, [tokenIn, period]);

  useEffect(() => { load(); }, [load]);

  const last   = data.length ? data[data.length-1].price : null;
  const first  = data.length ? data[0].price : null;
  const pct    = last && first && first !== 0 ? ((last-first)/first)*100 : 0;
  const up     = pct >= 0;
  const color  = up ? "#00FFD1" : "#FF4D6D";
  const minP   = data.length ? Math.min(...data.map(d=>d.price))*0.999  : 0;
  const maxP   = data.length ? Math.max(...data.map(d=>d.price))*1.001  : 1;

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17 }}>
            {tokenIn?.symbol || "?"} / USD
          </div>
          {last !== null && (
            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ fontFamily:"'Space Mono',monospace" }}>
              <span className="text-text font-bold">${fmtPrice(last)}</span>
              <span className={up ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {pct > 0 ? "+" : ""}{pct.toFixed(2)}%
              </span>
              {pairInfo?.url && (
                <a href={pairInfo.url} target="_blank" rel="noreferrer"
                  className="text-muted hover:text-primary flex items-center gap-0.5">
                  DS <ExternalLink size={9}/>
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                period.label===p.label ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-border/40 hover:text-text"
              }`} style={{ fontFamily:"'Space Mono',monospace" }}>{p.label}</button>
          ))}
          <button onClick={load} className="text-muted hover:text-primary p-1 transition-colors">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Stats row */}
      {pairInfo && (
        <div className="flex gap-4 px-4 py-2 border-b border-border/40 text-xs flex-wrap" style={{ fontFamily:"'Space Mono',monospace" }}>
          {[
            { l:"Price", v:"$"+fmtPrice(parseFloat(pairInfo.priceUsd||0)) },
            { l:"24h Vol", v:"$"+parseFloat(pairInfo.volume?.h24||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"Liq", v:"$"+parseFloat(pairInfo.liquidity?.usd||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"24h", v:(parseFloat(pairInfo.priceChange?.h24||0)>0?"+":"")+parseFloat(pairInfo.priceChange?.h24||0).toFixed(2)+"%",
              color:parseFloat(pairInfo.priceChange?.h24||0)>=0?"text-green-400":"text-red-400" },
          ].map(({l,v,color}) => (
            <div key={l}><span className="text-muted">{l}: </span><span className={color||"text-text"}>{v}</span></div>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div style={{ height:250, background:"#060606", position:"relative" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
            <div className="spinner"/>
          </div>
        )}
        {noData && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
            <TrendingUp size={26} className="opacity-20"/>
            <p className="text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
              No chart data for {tokenIn?.symbol}
            </p>
            <p className="text-xs opacity-40" style={{ fontFamily:"'Space Mono',monospace" }}>
              Token may not be listed on DexScreener yet
            </p>
            <button onClick={load} className="btn-secondary mt-1" style={{ padding:"4px 14px", fontSize:10 }}>Retry</button>
          </div>
        )}
        {data.length >= 2 && !loading && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:10, right:8, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.28}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fill:"#333", fontSize:9, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[minP, maxP]}
                tick={{ fill:"#333", fontSize:9, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false}
                tickFormatter={v => fmtPrice(v)} width={68}/>
              <Tooltip
                contentStyle={{ background:"#0C0C0C", border:"1px solid #1E1E1E", borderRadius:10, fontFamily:"'Space Mono',monospace", fontSize:11 }}
                labelStyle={{ color:"#555" }} itemStyle={{ color }}
                formatter={v => ["$"+fmtPrice(v), tokenIn?.symbol]}/>
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2}
                fill="url(#cg)" dot={false} activeDot={{ r:4, fill:color, strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
