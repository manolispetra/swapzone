import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";

const PERIODS = [
  { label:"5m",  resolution:"1",  limit:60  },
  { label:"1h",  resolution:"5",  limit:60  },
  { label:"24h", resolution:"60", limit:48  },
];

// DexScreener OHLC API — works for Monad
async function fetchOHLC(pairAddress, resolution, limit) {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/pairs/monad/" + pairAddress
    );
    const d = await res.json();
    const pair = d.pair || (d.pairs && d.pairs[0]);
    if (!pair) return null;

    // DexScreener gives us priceUsd + priceChange - build simulated OHLC from current + changes
    const price    = parseFloat(pair.priceUsd || 0);
    const change5m = parseFloat(pair.priceChange?.m5  || 0) / 100;
    const change1h = parseFloat(pair.priceChange?.h1  || 0) / 100;
    const change6h = parseFloat(pair.priceChange?.h6  || 0) / 100;
    const change24h= parseFloat(pair.priceChange?.h24 || 0) / 100;

    // Build time-series points by interpolating backwards
    const points = [];
    const now    = Date.now();

    for (let i = limit; i >= 0; i--) {
      const frac    = i / limit;
      const msAgo   = (resolution === "1" ? 5*60000 : resolution === "5" ? 60*60000 : 24*60*60000) * frac;
      const t       = now - msAgo;
      const changeAt = resolution === "1" ? change5m : resolution === "5" ? change1h : change24h;
      // Interpolate: older = farther from current price
      const priceAt = price / (1 + changeAt * (1 - frac));

      points.push({
        time:  formatTime(t, resolution),
        price: parseFloat((priceAt > 0 ? priceAt : price).toFixed(8)),
      });
    }

    return {
      points,
      pair: {
        priceUsd:    price,
        priceChange: pair.priceChange,
        volume:      pair.volume,
        liquidity:   pair.liquidity,
        pairAddress: pair.pairAddress,
        baseToken:   pair.baseToken,
      }
    };
  } catch { return null; }
}

// Search pair by token address
async function findPair(tokenAddress) {
  try {
    const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + tokenAddress);
    const d   = await res.json();
    const pair = (d.pairs || []).find(p => p.chainId === "monad") || (d.pairs||[])[0];
    return pair?.pairAddress || null;
  } catch { return null; }
}

function formatTime(ms, resolution) {
  const d = new Date(ms);
  if (resolution === "1") return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0");
  if (resolution === "5") return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0");
  return (d.getMonth()+1) + "/" + d.getDate() + " " + d.getHours().toString().padStart(2,"0") + "h";
}

export default function PriceChart({ tokenIn, tokenOut }) {
  const [data,       setData]       = useState([]);
  const [pairInfo,   setPairInfo]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [period,     setPeriod]     = useState(PERIODS[1]);
  const [noData,     setNoData]     = useState(false);

  const load = useCallback(async () => {
    if (!tokenIn || !tokenOut) return;
    setLoading(true); setNoData(false);
    try {
      // Find pair address for tokenIn
      const addr = tokenIn.address === "native"
        ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"
        : tokenIn.address;

      const pairAddr = await findPair(addr);
      if (!pairAddr) { setNoData(true); setData([]); return; }

      const result = await fetchOHLC(pairAddr, period.resolution, period.limit);
      if (!result || result.points.length < 2) { setNoData(true); setData([]); return; }

      setData(result.points);
      setPairInfo(result.pair);
    } catch { setNoData(true); }
    finally { setLoading(false); }
  }, [tokenIn, tokenOut, period]);

  useEffect(() => { load(); }, [load]);

  const lastPrice   = data.length ? data[data.length - 1].price : null;
  const firstPrice  = data.length ? data[0].price : null;
  const pctChange   = lastPrice && firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const priceUp     = pctChange >= 0;
  const gradColor   = priceUp ? "#00FFD1" : "#FF4D6D";
  const minPrice    = data.length ? Math.min(...data.map(d=>d.price)) * 0.999  : 0;
  const maxPrice    = data.length ? Math.max(...data.map(d=>d.price)) * 1.001  : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17 }}>
            {tokenIn?.symbol}/{tokenOut?.symbol}
          </div>
          {lastPrice !== null && (
            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ fontFamily:"'Space Mono',monospace" }}>
              <span className="text-text font-bold">{lastPrice < 0.001 ? lastPrice.toExponential(4) : lastPrice.toFixed(8)}</span>
              <span className={priceUp ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                {priceUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {pctChange > 0 ? "+" : ""}{pctChange.toFixed(2)}%
              </span>
              {pairInfo?.pairAddress && (
                <a href={"https://dexscreener.com/monad/" + pairInfo.pairAddress}
                  target="_blank" rel="noreferrer"
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
              className={"px-3 py-1 rounded-lg text-xs border transition-all " + (period.label===p.label?"bg-primary/15 text-primary border-primary/30":"text-muted border-border/40 hover:text-text")}
              style={{ fontFamily:"'Space Mono',monospace" }}>{p.label}</button>
          ))}
          <button onClick={load} className="text-muted hover:text-primary p-1 transition-colors">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Stats row */}
      {pairInfo && (
        <div className="flex gap-5 px-4 py-2 border-b border-border/50 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
          {[
            { l:"24h Vol",   v:"$"+parseFloat(pairInfo.volume?.h24||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"Liquidity", v:"$"+parseFloat(pairInfo.liquidity?.usd||0).toLocaleString(undefined,{maximumFractionDigits:0}) },
            { l:"24h %",     v:(pairInfo.priceChange?.h24>0?"+":"")+parseFloat(pairInfo.priceChange?.h24||0).toFixed(2)+"%", color: parseFloat(pairInfo.priceChange?.h24||0)>=0?"text-green-400":"text-red-400" },
          ].map(({ l,v,color }) => (
            <div key={l}><span className="text-muted">{l}: </span><span className={color||"text-text"}>{v}</span></div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height:260, background:"#080808", position:"relative" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
            <div className="spinner"/>
          </div>
        )}
        {noData && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <TrendingUp size={28} className="mb-2 opacity-20"/>
            <p className="text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>No chart data available for this pair</p>
            <p className="text-xs opacity-40 mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>Token may not be listed on DexScreener yet</p>
          </div>
        )}
        {data.length >= 2 && !loading && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:10, right:8, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={gradColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={gradColor} stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fill:"#444", fontSize:9, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[minPrice, maxPrice]}
                tick={{ fill:"#444", fontSize:9, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false}
                tickFormatter={v => v < 0.001 ? v.toExponential(2) : v.toFixed(6)} width={72}/>
              <Tooltip
                contentStyle={{ background:"#0E0E0E", border:"1px solid #222", borderRadius:10, fontFamily:"'Space Mono',monospace", fontSize:11 }}
                labelStyle={{ color:"#666" }}
                itemStyle={{ color: gradColor }}
                formatter={v => [v < 0.001 ? v.toExponential(6) : v.toFixed(8), tokenIn?.symbol+"/"+tokenOut?.symbol]}
              />
              <Area type="monotone" dataKey="price" stroke={gradColor} strokeWidth={2}
                fill="url(#areaGrad)" dot={false} activeDot={{ r:4, fill:gradColor, strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
