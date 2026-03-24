import { useState, useEffect } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import {
  ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI,
  getContract, ensureAllowance, fmt
} from "../../utils/contracts";

export default function LiquidityManager() {
  const { signer, address, isConnected, connect } = useWallet();
  const [tab, setTab]           = useState("add");
  const [token0Addr, setT0]     = useState("");
  const [token1Addr, setT1]     = useState("");
  const [amount0, setAmount0]   = useState("");
  const [amount1, setAmount1]   = useState("");
  const [lpAmount, setLpAmount] = useState("");
  const [poolInfo, setPoolInfo] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [tx, setTx]             = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (token0Addr && token1Addr) loadPoolInfo();
    // eslint-disable-next-line
  }, [token0Addr, token1Addr]);

  async function loadPoolInfo() {
    if (!ADDRESSES.ammFactory) return;
    try {
      const provider = signer?.provider || (await import("../../utils/contracts")).getReadProvider();
      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, provider);
      const poolAddr = await factory.getPool(token0Addr, token1Addr);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        setPoolInfo({ exists: false }); return;
      }
      const pool = getContract(poolAddr, AMM_POOL_ABI, provider);
      const [r0, r1, supply, price] = await Promise.all([
        pool.getReserves(),
        pool.getReserves(),
        pool.totalSupply(),
        pool.getPrice().catch(() => 0n),
      ]);
      setPoolInfo({ exists: true, address: poolAddr, reserve0: r0[0], reserve1: r0[1], supply, price });
    } catch (err) {
      setPoolInfo(null);
    }
  }

  async function addLiquidity() {
    if (!isConnected) { connect(); return; }
    setLoading(true); setError(null); setTx(null);
    try {
      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      let poolAddr   = await factory.getPool(token0Addr, token1Addr);

      // Create pool if doesn't exist
      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        const createTx = await factory.createPool(token0Addr, token1Addr);
        const receipt  = await createTx.wait();
        const event    = receipt.logs.find(l => l.fragment?.name === "PoolCreated");
        poolAddr       = event ? event.args[2] : await factory.getPool(token0Addr, token1Addr);
      }

      const amt0 = ethers.parseUnits(amount0, 18);
      const amt1 = ethers.parseUnits(amount1, 18);
      const min0 = amt0 * 95n / 100n;
      const min1 = amt1 * 95n / 100n;

      await ensureAllowance(token0Addr, address, poolAddr, amt0, signer);
      await ensureAllowance(token1Addr, address, poolAddr, amt1, signer);

      const pool   = getContract(poolAddr, AMM_POOL_ABI, signer);
      const addTx  = await pool.addLiquidity(amt0, amt1, min0, min1, address);
      const rcpt   = await addTx.wait();
      setTx(rcpt.hash);
      loadPoolInfo();
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeLiquidity() {
    if (!isConnected) { connect(); return; }
    setLoading(true); setError(null); setTx(null);
    try {
      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(token0Addr, token1Addr);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) throw new Error("Pool not found");

      const lp   = ethers.parseUnits(lpAmount, 18);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      await ensureAllowance(poolAddr, address, poolAddr, lp, signer);
      const removeTx = await pool.removeLiquidity(lp, 0n, 0n, address);
      const rcpt     = await removeTx.wait();
      setTx(rcpt.hash);
      loadPoolInfo();
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-lg w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.05em" }}>
          LIQUIDITY
        </h2>
        <div className="flex gap-2">
          {["add","remove"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab === t ? "bg-primary/15 text-primary border border-primary/30" : "text-muted hover:text-text border border-transparent"}`}
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Token addresses */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Token A Address</label>
          <input className="sz-input" placeholder="0x..." value={token0Addr} onChange={e => setT0(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Token B Address</label>
          <input className="sz-input" placeholder="0x..." value={token1Addr} onChange={e => setT1(e.target.value)} />
        </div>
      </div>

      {/* Pool info */}
      {poolInfo && (
        <div className="p-3 rounded-xl bg-black/30 border border-border/60 mb-4 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
          {poolInfo.exists ? (
            <>
              <div className="text-primary mb-1">✅ Pool exists</div>
              <div className="text-muted">Reserve A: <span className="text-text">{fmt(poolInfo.reserve0)}</span></div>
              <div className="text-muted">Reserve B: <span className="text-text">{fmt(poolInfo.reserve1)}</span></div>
              <div className="text-muted">Total LP:  <span className="text-text">{fmt(poolInfo.supply)}</span></div>
            </>
          ) : (
            <div className="text-accent">⚠️ No pool yet — adding liquidity will create one</div>
          )}
        </div>
      )}

      {tab === "add" ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Amount A</label>
            <input className="sz-input" type="number" placeholder="0.0" value={amount0} onChange={e => setAmount0(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Amount B</label>
            <input className="sz-input" type="number" placeholder="0.0" value={amount1} onChange={e => setAmount1(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading} onClick={addLiquidity}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><Plus size={16} /> Add Liquidity</>}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>LP Tokens to Burn</label>
            <input className="sz-input" type="number" placeholder="0.0" value={lpAmount} onChange={e => setLpAmount(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading} onClick={removeLiquidity}
            style={{ background: "linear-gradient(135deg, #8458FF, #FF4D6D)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><Minus size={16} /> Remove Liquidity</>}
          </button>
        </div>
      )}

      {error && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>{error}</div>}
      {tx    && <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>✅ Tx: <a href={`https://testnet.monadexplorer.com/tx/${tx}`} target="_blank" rel="noreferrer" className="underline">{tx.slice(0,18)}…</a></div>}
    </div>
  );
}
