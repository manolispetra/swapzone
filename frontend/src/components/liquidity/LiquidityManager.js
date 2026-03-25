import { useState, useEffect } from "react";
import { Plus, Minus, Loader2, ChevronDown, X, Search } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { logActivity } from "../ui/ActivitySidebar";
import {
  ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI,
  MONAD_TOKENS, getReadProvider, getContract, ensureAllowance, fmt
} from "../../utils/contracts";
import { TokenLogo } from "../swap/SwapWidget";

const POPULAR_PAIRS = [
  { a: MONAD_TOKENS[1], b: MONAD_TOKENS[2] }, // WMON/USDC
  { a: MONAD_TOKENS[1], b: MONAD_TOKENS[3] }, // WMON/USDT
  { a: MONAD_TOKENS[1], b: MONAD_TOKENS[4] }, // WMON/WETH
  { a: MONAD_TOKENS[4], b: MONAD_TOKENS[2] }, // WETH/USDC
  { a: MONAD_TOKENS[5], b: MONAD_TOKENS[2] }, // WBTC/USDC
];

export default function LiquidityManager() {
  const { signer, address, isConnected, connect, provider } = useWallet();
  const [tab,      setTab]      = useState("add");
  const [tokenA,   setTokenA]   = useState(MONAD_TOKENS[1]);
  const [tokenB,   setTokenB]   = useState(MONAD_TOKENS[2]);
  const [amount0,  setAmount0]  = useState("");
  const [amount1,  setAmount1]  = useState("");
  const [lpAmount, setLpAmount] = useState("");
  const [balA,     setBalA]     = useState("—");
  const [balB,     setBalB]     = useState("—");
  const [lpBal,    setLpBal]    = useState("—");
  const [poolInfo, setPoolInfo] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [tx,       setTx]       = useState(null);
  const [error,    setError]    = useState(null);
  const [pickerA,  setPickerA]  = useState(false);
  const [pickerB,  setPickerB]  = useState(false);
  const [allPools, setAllPools] = useState([]);

  useEffect(() => { loadPool(); fetchBalances(); }, [tokenA, tokenB, address]);
  useEffect(() => { loadAllPools(); }, []);

  async function fetchBalances() {
    if (!address) return;
    const p = provider || getReadProvider();
    const getBal = async (t) => {
      try {
        if (t.address === "native") return parseFloat(ethers.formatEther(await p.getBalance(address))).toFixed(4);
        const c = getContract(t.address, ERC20_ABI, p);
        return parseFloat(ethers.formatUnits(await c.balanceOf(address), t.decimals)).toFixed(4);
      } catch { return "—"; }
    };
    setBalA(await getBal(tokenA));
    setBalB(await getBal(tokenB));
  }

  async function loadPool() {
    if (!ADDRESSES.ammFactory) return;
    try {
      const p  = getReadProvider();
      const tA = tokenA.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenA.address;
      const tB = tokenB.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenB.address;
      const factory = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, p);
      const poolAddr = await factory.getPool(tA, tB).catch(() => null);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) { setPoolInfo({ exists: false }); setLpBal("—"); return; }
      const pool = getContract(poolAddr, AMM_POOL_ABI, p);
      const [r0, r1, supply, price] = await Promise.all([
        pool.getReserves(), pool.getReserves(), pool.totalSupply(), pool.getPrice().catch(() => 0n),
      ]);
      const info = { exists:true, address:poolAddr, reserve0:r0[0], reserve1:r0[1], supply, price };
      setPoolInfo(info);
      if (address) {
        const lp = await pool.balanceOf(address);
        setLpBal(parseFloat(ethers.formatUnits(lp, 18)).toFixed(6));
      }
    } catch { setPoolInfo(null); }
  }

  async function loadAllPools() {
    if (!ADDRESSES.ammFactory) return;
    try {
      const p       = getReadProvider();
      const factory = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, p);
      const len     = await factory.allPoolsLength();
      const pools   = [];
      for (let i = 0; i < Math.min(Number(len), 20); i++) {
        const addr = await factory.allPools(i);
        const pool = getContract(addr, AMM_POOL_ABI, p);
        const [t0, t1, r, supply] = await Promise.all([pool.token0(), pool.token1(), pool.getReserves(), pool.totalSupply()]);
        const tk0 = MONAD_TOKENS.find(t => t.address.toLowerCase() === t0.toLowerCase()) || { symbol:"?", logoColor:"#888", address:t0 };
        const tk1 = MONAD_TOKENS.find(t => t.address.toLowerCase() === t1.toLowerCase()) || { symbol:"?", logoColor:"#888", address:t1 };
        pools.push({ address:addr, token0:tk0, token1:tk1, reserve0:r[0], reserve1:r[1], supply });
      }
      setAllPools(pools);
    } catch {}
  }

  async function addLiquidity() {
    if (!isConnected) { connect(); return; }
    setLoading(true); setError(null); setTx(null);
    try {
      const tA = tokenA.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenA.address;
      const tB = tokenB.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenB.address;
      const factory = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);

      let poolAddr = await factory.getPool(tA, tB).catch(() => null);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        const ct = await factory.createPool(tA, tB);
        await ct.wait();
        poolAddr = await factory.getPool(tA, tB);
      }

      const a0 = ethers.parseUnits(amount0, tokenA.decimals);
      const a1 = ethers.parseUnits(amount1, tokenB.decimals);
      await ensureAllowance(tA, address, poolAddr, a0, signer);
      await ensureAllowance(tB, address, poolAddr, a1, signer);

      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const t    = await pool.addLiquidity(a0, a1, a0*95n/100n, a1*95n/100n, address);
      const r    = await t.wait();
      setTx(r.hash);
      logActivity("add_liquidity", { tokenA: tokenA.symbol, tokenB: tokenB.symbol, txHash: r.hash, wallet: address });
      loadPool(); fetchBalances(); loadAllPools();
      setAmount0(""); setAmount1("");
    } catch (e) { setError(e.reason || e.message); }
    finally { setLoading(false); }
  }

  async function removeLiquidity() {
    if (!isConnected) { connect(); return; }
    setLoading(true); setError(null); setTx(null);
    try {
      const tA = tokenA.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenA.address;
      const tB = tokenB.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : tokenB.address;
      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(tA, tB);
      const lp   = ethers.parseUnits(lpAmount, 18);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      await ensureAllowance(poolAddr, address, poolAddr, lp, signer);
      const t = await pool.removeLiquidity(lp, 0n, 0n, address);
      const r = await t.wait();
      setTx(r.hash);
      logActivity("add_liquidity", { tokenA: tokenA.symbol, tokenB: tokenB.symbol, txHash: r.hash, wallet: address });
      loadPool(); fetchBalances();
      setLpAmount("");
    } catch (e) { setError(e.reason || e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add/Remove */}
        <div className="lg:col-span-2 card">
          <div className="flex gap-2 mb-5">
            {["add","remove"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs transition-all border ${tab===t ? "bg-primary/15 text-primary border-primary/30" : "text-muted border-transparent hover:text-text"}`}
                style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                {t === "add" ? "Add Liquidity" : "Remove"}
              </button>
            ))}
          </div>

          {/* Popular pairs */}
          <div className="mb-4">
            <p className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>Popular pairs</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_PAIRS.map(({ a, b }) => (
                <button key={a.symbol+b.symbol} onClick={() => { setTokenA(a); setTokenB(b); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all ${tokenA.symbol===a.symbol&&tokenB.symbol===b.symbol ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted hover:text-text"}`}
                  style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
                  <TokenLogo token={a} size={14} />{a.symbol}/{b.symbol}<TokenLogo token={b} size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Token selectors */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <TokenSelect label="Token A" token={tokenA} onOpen={() => setPickerA(true)} balance={balA} />
            <TokenSelect label="Token B" token={tokenB} onOpen={() => setPickerB(true)} balance={balB} />
          </div>

          {/* Pool info */}
          {poolInfo && (
            <div className="p-3 rounded-xl bg-black/30 border border-border/50 mb-4 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
              {poolInfo.exists ? (
                <>
                  <div className="text-primary mb-1">✅ Pool exists</div>
                  <div className="text-muted">Reserve A: <span className="text-text">{fmt(poolInfo.reserve0)}</span></div>
                  <div className="text-muted">Reserve B: <span className="text-text">{fmt(poolInfo.reserve1)}</span></div>
                  <div className="text-muted">Your LP:   <span className="text-text">{lpBal}</span></div>
                </>
              ) : <div className="text-accent">⚠️ No pool yet — will be created</div>}
            </div>
          )}

          {tab === "add" ? (
            <div className="space-y-3">
              <AmtInput label={`Amount ${tokenA.symbol}`} value={amount0} onChange={setAmount0} onMax={() => setAmount0(balA)} />
              <AmtInput label={`Amount ${tokenB.symbol}`} value={amount1} onChange={setAmount1} onMax={() => setAmount1(balB)} />
              <button className="btn-primary w-full" disabled={loading} onClick={addLiquidity}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><Loader2 size={16} className="animate-spin" />Processing…</> : <><Plus size={16} />Add Liquidity</>}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AmtInput label="LP Tokens to burn" value={lpAmount} onChange={setLpAmount} onMax={() => setLpAmount(lpBal)} />
              <button onClick={removeLiquidity} disabled={loading} className="btn-primary w-full"
                style={{ background:"linear-gradient(135deg,#8458FF,#FF4D6D)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><Loader2 size={16} className="animate-spin" />Processing…</> : <><Minus size={16} />Remove</>}
              </button>
            </div>
          )}

          {error && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}
          {tx    && <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>✅ Tx: <a href={`https://monadexplorer.com/tx/${tx}`} target="_blank" rel="noreferrer" className="underline">{tx.slice(0,14)}…</a></div>}
        </div>

        {/* All Pools */}
        <div className="lg:col-span-3 card">
          <h3 className="font-bold mb-4" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:18, letterSpacing:"0.05em" }}>ALL POOLS</h3>
          {allPools.length === 0 ? (
            <div className="py-10 text-center text-muted text-sm" style={{ fontFamily:"'Space Mono',monospace" }}>No pools yet</div>
          ) : (
            <div className="space-y-2">
              {allPools.map(pool => (
                <button key={pool.address} onClick={() => { setTokenA(pool.token0); setTokenB(pool.token1); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/3 transition-all text-left">
                  <div className="flex -space-x-2">
                    <TokenLogo token={pool.token0} size={28} />
                    <TokenLogo token={pool.token1} size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
                      {fmt(pool.reserve0, 18, 2)} / {fmt(pool.reserve1, 18, 2)}
                    </div>
                  </div>
                  <div className="text-xs text-primary" style={{ fontFamily:"'Space Mono',monospace" }}>
                    LP: {fmt(pool.supply, 18, 2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {pickerA && <MiniPicker exclude={tokenB} onSelect={t => { setTokenA(t); setPickerA(false); }} onClose={() => setPickerA(false)} />}
      {pickerB && <MiniPicker exclude={tokenA} onSelect={t => { setTokenB(t); setPickerB(false); }} onClose={() => setPickerB(false)} />}
    </div>
  );
}

function TokenSelect({ label, token, onOpen, balance }) {
  return (
    <div>
      <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</label>
      <button onClick={onOpen} className="w-full flex items-center gap-2 bg-black/30 border border-border rounded-xl px-3 py-2 hover:border-primary/30 transition-all">
        <TokenLogo token={token} size={20} />
        <span className="font-bold text-text flex-1 text-left" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>{token.symbol}</span>
        <ChevronDown size={13} className="text-muted" />
      </button>
      <div className="text-xs text-muted mt-1" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>Bal: {balance}</div>
    </div>
  );
}

function AmtInput({ label, value, onChange, onMax }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{label}</label>
        {onMax && <button onClick={onMax} className="text-xs text-primary hover:underline" style={{ fontFamily:"'Space Mono',monospace" }}>MAX</button>}
      </div>
      <input className="sz-input" type="number" placeholder="0.0" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function MiniPicker({ onSelect, onClose, exclude }) {
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");
  const [found,  setFound]  = useState(null);
  const list = MONAD_TOKENS.filter(t => t.address !== exclude?.address && (!search || t.symbol.toLowerCase().includes(search.toLowerCase())));

  async function lookup() {
    if (!ethers.isAddress(custom)) return;
    try {
      const p = getReadProvider();
      const c = getContract(custom, ERC20_ABI, p);
      const [name, symbol, decimals] = await Promise.all([c.name().catch(()=>"?"), c.symbol().catch(()=>"?"), c.decimals().catch(()=>18)]);
      setFound({ address:custom, name, symbol, decimals:Number(decimals), logoColor:"#00FFD1" });
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)" }}>
      <div className="card w-full max-w-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16 }}>Select Token</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="relative mb-3"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="sz-input pl-9 text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
          {list.map(t => (
            <button key={t.address} onClick={() => onSelect(t)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <TokenLogo token={t} size={28} />
              <div className="text-left"><div className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{t.symbol}</div>
                <div className="text-xs text-muted">{t.name}</div></div>
            </button>
          ))}
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>Custom address</p>
          <div className="flex gap-2">
            <input className="sz-input flex-1 text-xs" placeholder="0x…" value={custom} onChange={e => setCustom(e.target.value)} />
            <button className="btn-secondary text-xs" onClick={lookup} style={{ padding:"8px 12px" }}>Find</button>
          </div>
          {found && <button onClick={() => onSelect(found)} className="w-full flex items-center gap-2 p-2 mt-2 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10">
            <TokenLogo token={found} size={24} /><span className="text-primary font-bold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{found.symbol}</span>
          </button>}
        </div>
      </div>
    </div>
  );
}
