import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { ethers } from "ethers";
import { ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, getReadProvider, getContract } from "../../utils/contracts";
import { MONAD_TOKENS } from "../../utils/contracts";

const PERIODS = [
  { label:"5m",  blocks:10,  interval:1   },
  { label:"1h",  blocks:120, interval:12  },
  { label:"24h", blocks:480, interval:48  },
];

// Generate synthetic OHLC from reserve ratio snapshots
async function fetchPriceHistory(tokenIn, tokenOut, numPoints, blockStep) {
  const provider = getReadProvider();
  const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, provider);

  const tIn  = tokenIn.address  === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenIn.address;
  const tOut = tokenOut.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenOut.address;

  const poolAddr = await factory.getPool(tIn, tOut).catch(() => null);
  if (!poolAddr || poolAddr === ethers.ZeroAddress) return null;

  const pool        = getContract(poolAddr, AMM_POOL_ABI, provider);
  const latestBlock = await provider.getBlockNumber();
  const [token0]    = await Promise.all([pool.token0()]);
  const isToken0In  = tIn.toLowerCase() === token0.toLowerCase();

  const points = [];
  const step   = Math.max(1, blockStep);

  for (let i = numPoints; i >= 0; i--) {
    const blockNum = Math.max(1, latestBlock - i * step);
    try {
      const [r0, r1] = await pool.getReserves({ blockTag: blockNum });
      const reserve0 = parseFloat(ethers.formatUnits(r0, tokenIn.decimals));
      const reserve1 = parseFloat(ethers.formatUnits(r1, tokenOut.decimals));
      const price    = isToken0In
        ? (reserve1 / reserve0)
        : (reserve0 / reserve1);

      if (price > 0 && isFinite(price)) {
        points.push({
          block: blockNum,
          price: parseFloat(price.toFixed(8)),
          time:  formatBlockTime(latestBlock, blockNum),
        });
      }
    } catch {}
  }
  return points.length >= 2 ? points : null;
}

function formatBlockTime(latest, block) {
  // Monad ~1s per block
  const secondsAgo = (latest - block) * 1;
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0");
}

export default function PriceChart({ tokenIn, tokenOut }) {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [period,     setPeriod]     = useState(PERIODS[1]);
  const [error,      setError]      = useState(null);
  const [noPool,     setNoPool]     = useState(false);
  const [lastPrice,  setLastPrice]  = useState(null);
  const [priceChange,setPriceChange]= useState(null);

  const load = useCallback(async () => {
    if (!tokenIn || !tokenOut || !ADDRESSES.ammFactory) return;
    setLoading(true); setError(null); setNoPool(false);
    try {
      const points = await fetchPriceHistory(
        tokenIn, tokenOut, 30, period.blocks / 30
      );
      if (!points) { setNoPool(true); setData([]); return; }
      setData(points);
      if (points.length >= 2) {
        const first = points[0].price;
        const last  = points[points.length - 1].price;
        setLastPrice(last);
        setPriceChange(((last - first) / first) * 100);
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [tokenIn, tokenOut, period]);

  useEffect(() => { load(); }, [load]);

  const priceUp   = (priceChange || 0) >= 0;
  const minPrice  = data.length ? Math.min(...data.map(d => d.price)) * 0.9995 : 0;
  const maxPrice  = data.length ? Math.max(...data.map(d => d.price)) * 1.0005 : 1;
  const gradColor = priceUp ? "#00FFD1" : "#FF4D6D";

  if (!ADDRESSES.ammFactory) return (
    <div className="flex items-center justify-center h-40 text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
      AMM Factory not configured
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18 }}>
              {tokenIn?.symbol}/{tokenOut?.symbol}
            </div>
            {lastPrice !== null && (
              <div className="flex items-center gap-2 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
                <span className="text-text font-bold text-sm">{lastPrice.toFixed(8)}</span>
                <span className={priceUp ? "text-green-400 flex items-center gap-0.5" : "text-red-400 flex items-center gap-0.5"}>
                  {priceUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                  {priceChange > 0 ? "+" : ""}{priceChange?.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => setPeriod(p)}
              className={"px-3 py-1 rounded-lg text-xs border transition-all " + (period.label===p.label ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-border/40 hover:text-text")}
              style={{ fontFamily:"'Space Mono',monospace" }}>{p.label}</button>
          ))}
          <button onClick={load} className="text-muted hover:text-primary transition-colors p-1">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div style={{ height:280, position:"relative", background:"#080808" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="spinner"/>
          </div>
        )}
        {noPool && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <TrendingUp size={28} className="mb-2 opacity-20"/>
            <p className="text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>No pool for this pair yet</p>
            <p className="text-xs opacity-50 mt-1" style={{ fontFamily:"'Space Mono',monospace" }}>Add liquidity to enable trading</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center justify-center h-full text-muted">
            <p className="text-xs text-red-400" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</p>
          </div>
        )}
        {data.length >= 2 && !loading && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:10, right:12, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={gradColor} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={gradColor} stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fill:"#555", fontSize:10, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis domain={[minPrice, maxPrice]} tick={{ fill:"#555", fontSize:9, fontFamily:"'Space Mono',monospace" }}
                tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(6)} width={70}/>
              <Tooltip
                contentStyle={{ background:"#111", border:"1px solid #1E1E1E", borderRadius:10, fontFamily:"'Space Mono',monospace", fontSize:11 }}
                labelStyle={{ color:"#888" }}
                itemStyle={{ color: gradColor }}
                formatter={(v) => [v.toFixed(8), tokenIn?.symbol + "/" + tokenOut?.symbol]}
              />
              <Area type="monotone" dataKey="price" stroke={gradColor} strokeWidth={2}
                fill="url(#chartGrad)" dot={false} activeDot={{ r:4, fill:gradColor, strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
