import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";

const DS_BASE = "https://api.dexscreener.com/latest/dex";
const PERIODS = [
  { label:"5m",  key:"m5"  },
  { label:"1h",  key:"h1"  },
  { label:"24h", key:"h24" },
];

// Known pair addresses for Monad tokens (fallback hardcoded from DexScreener)
// These are the actual Uniswap v3 / Kuru / other DEX pair addresses on Monad
const KNOWN_PAIRS = {
  "0x760afe86e5de5fa0ee542fc7b7b713e1c5425701": null, // WMON — will be fetched
  "0xf817257fed379853cde0fa4f97ab987181b1e5ea": null, // USDC
  "0x5d876d73f4441d5f2438b1a3e2a51771b337f27a": null, // USDT
  "0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37": null, // WETH
  "0xcf5a6076cfa32686c0df13abada2b40dec133f1d": null, // WBTC
  "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50": null, // shMON
};

async function fetchPairForToken(tokenAddress) {
  try {
    const addr = tokenAddress.toLowerCase();
    const res  = await fetch(DS_BASE + "/tokens/" + addr, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) return null;
    const d = await res.json();
    const pairs = (d.pairs || []);
    // Prefer monad chain, fallback to any
    const pair = pairs.find(p => p.chainId === "monad") || pairs[0] || null;
    return pair;
  } catch { return null; }
}

function buildChartPoints(pair, periodKey) {
  if (!pair) return [];
  const price     = parseFloat(pair.priceUsd || 0);
  const change    = parseFloat(pair.priceChange?.[periodKey] || 0) / 100;
  const now       = Date.now();
  const DURATIONS = { m5: 5*60000, h1: 60*60000, h24: 24*60*60000 };
  const duration  = DURATIONS[periodKey] || DURATIONS.h1;
  const POINTS    = 30;
  const points    = [];

  for (let i = 0; i <= POINTS; i++) {
    const frac    = i / POINTS;
    const msAgo   = duration * (1 - frac);
    const t       = new Date(now - msAgo);
    // Interpolate price from old to current
    const oldPrice = price / (1 + change);
    const p        = oldPrice + (price - oldPrice) * frac;
    const label    = periodKey === "h24"
      ? t.getHours().toString().padStart(2,"0") + ":00"
      : t.getHours().toString().padStart(2,"0") + ":" + t.getMinutes().toString().padStart(2,"0");
    points.push({ time: label, price: parseFloat(p.toFixed(10)) });
  }
  return points;
}

export default function PriceChart({ tokenIn, tokenOut }) {
  const [data,      setData]      = useState([]);
  const [pairInfo,  setPairInfo]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [period,    setPeriod]    = useState(PERIODS[1]);
  const [noData,    setNoData]    = useState(false);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    if (!tokenIn) return;
    setLoading(true); setNoData(false); setError(null);
    try {
      const addr = tokenIn.address === "native"
        ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"
        : tokenIn.address;

      const pair = await fetchPairForToken(addr);

      if (!pair) {
        setNoData(true);
        setData([]);
        setPairInfo(null);
        return;
      }

      setPairInfo(pair);
      const points = buildChartPoints(pair, period.key);
      setData(points);
    } catch(e) {
      setError(e.message);
      setNoData(true);
    }
    finally { setLoading(false); }
  }, [tokenIn, period]);

  useEffect(() => { load(); }, [load]);

  const lastPrice  = data.length ? data[data.length - 1].price : null;
  const firstPrice = data.length ? data[0].price : null;
  const pctChange  = lastPrice && firstPrice && firstPrice !== 0
    ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const priceUp    = pctChange >= 0;
  const gradColor  = priceUp ? "#00FFD1" : "#FF4D6D";
  const minP       = data.length ? Math.min(...data.map(d=>d.price)) * 0.9995 : 0;
  const maxP       = data.length ? Math.max(...data.map(d=>d.price)) * 1.0005 : 1;

  const fmtPrice = (p) => {
    if (!p) return "0";
    if (p < 0.000001) return p.toExponential(4);
    if (p < 0.001)    return p.toFixed(8);
    if (p < 1)        return p.toFixed(6);
    return p.toFixed(4);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="font-bold" style={{ fontFamily:"Rajdhani,sans-serif", fontSize:17 }}>
            {tokenIn?.symbol || "?"}/{tokenOut?.symbol || "USD"}
          </div>
          {lastPrice !== null && (
            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ fontFamily:"Space Mono,monospace" }}>
              <span className="text-text font-bold">${fmtPrice(lastPrice)}</span>
              <span className={priceUp ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                {priceUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {pctChange > 0 ? "+" : ""}{pctChange.toFixed(2)}%
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
              className={"px-3 py-1 rounded-lg text-xs border transition-all " +
                (period.label===p.label ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-border/40 hover:text-text")}
              style={{ fontFamily:"Space Mono,monospace" }}>{p.label}</button>
          ))}
          <button onClick={load} className="text-muted hover:text-primary p-1 transition-colors">
            <RefreshCw size={13} className={loading?"animate-spin":""}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      {pairInfo && (
        <div className="flex gap-5 px-4 py-2 border-b border-border/40 text-xs flex-wrap" style={{ fontFamily:"Space Mono,monospace" }}>
          {[
            { l:"Price USD",  v:"$"+fmtPrice(parseFloat(pairInfo.priceUsd||0)) },
            { l:"24h Vol",    v:"$"+parseFloat(pairInfo.volume?.h24||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"Liquidity",  v:"$"+parseFloat(pairInfo.liquidity?.usd||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"24h %",      v:(parseFloat(pairInfo.priceChange?.h24||0)>0?"+":"")+parseFloat(pairInfo.priceChange?.h24||0).toFixed(2)+"%",
              color: parseFloat(pairInfo.priceChange?.h24||0)>=0?"text-green-400":"text-red-400" },
          ].map(({l,v,color}) => (
            <div key={l}><span className="text-muted">{l}: </span><span className={color||"text-text"}>{v}</span></div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height:260, background:"#060606", position:"relative" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
            <div className="spinner"/>
          </div>
        )}
        {(noData || error) && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
            <TrendingUp size={26} className="opacity-20"/>
            <p className="text-xs" style={{ fontFamily:"Space Mono,monospace" }}>
              {error ? "API error — try again" : "No chart data for " + (tokenIn?.symbol||"this token")}
            </p>
            <p className="text-xs opacity-40" style={{ fontFamily:"Space Mono,monospace" }}>
              Token may not be listed on DexScreener yet
            </p>
            <button onClick={load} className="btn-secondary mt-1" style={{ padding:"4px 12px", fontSize:10 }}>Retry</button>
          </div>
        )}
        {data.length >= 2 && !loading && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:10, right:8, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={gradColor} stopOpacity={0.28}/>
                  <stop offset="95%" stopColor={gradColor} stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fill:"#3a3a3a", fontSize:9, fontFamily:"Space Mono,monospace" }}
                tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[minP, maxP]}
                tick={{ fill:"#3a3a3a", fontSize:9, fontFamily:"Space Mono,monospace" }}
                tickLine={false} axisLine={false}
                tickFormatter={v => fmtPrice(v)} width={70}/>
              <Tooltip
                contentStyle={{ background:"#0C0C0C", border:"1px solid #1E1E1E", borderRadius:10, fontFamily:"Space Mono,monospace", fontSize:11 }}
                labelStyle={{ color:"#555" }} itemStyle={{ color:gradColor }}
                formatter={v => [("$"+fmtPrice(v)), tokenIn?.symbol]}/>
              <Area type="monotone" dataKey="price" stroke={gradColor} strokeWidth={2}
                fill="url(#ag)" dot={false} activeDot={{ r:4, fill:gradColor, strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
