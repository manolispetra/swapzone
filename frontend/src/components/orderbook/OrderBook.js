import { useState, useEffect } from "react";
import { Plus, X, Loader2, BookOpen, ArrowRight } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import {
  ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI,
  MONAD_TOKENS, PROTOCOL_FEE_WALLET, PROTOCOL_FEE_BPS,
  getReadProvider, getContract, ensureAllowance
} from "../../utils/contracts";
import { TokenLogo } from "../swap/SwapWidget";

const ORDERS_KEY = "swapzone_orders";

function loadOrders() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); }
  catch { return []; }
}
function saveOrders(orders) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

const STATUS = { OPEN: "Open", FILLED: "Filled", CANCELLED: "Cancelled" };
const STATUS_COLOR = { Open: "text-primary", Filled: "text-green-400", Cancelled: "text-muted" };

export default function OrderBook() {
  const { signer, address, isConnected, connect, provider } = useWallet();
  const [orders,   setOrders]   = useState([]);
  const [form,     setForm]     = useState({ tokenIn: MONAD_TOKENS[0], tokenOut: MONAD_TOKENS[2], amountIn: "", limitPrice: "" });
  const [placing,  setPlacing]  = useState(false);
  const [filling,  setFilling]  = useState(null);
  const [error,    setError]    = useState(null);
  const [tx,       setTx]       = useState(null);
  const [prices,   setPrices]   = useState({});

  useEffect(() => { setOrders(loadOrders()); }, []);
  useEffect(() => { fetchPrices(); }, []);

  async function fetchPrices() {
    if (!ADDRESSES.ammFactory) return;
    const p = getReadProvider();
    const newPrices = {};
    for (const t of MONAD_TOKENS.slice(1)) {
      try {
        const factory = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, p);
        const wmon    = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
        const pool    = await factory.getPool(wmon, t.address);
        if (pool && pool !== ethers.ZeroAddress) {
          const pc   = getContract(pool, AMM_POOL_ABI, p);
          const price = await pc.getPrice();
          newPrices[t.address] = ethers.formatUnits(price, 18);
        }
      } catch {}
    }
    setPrices(newPrices);
  }

  async function placeOrder() {
    if (!isConnected) { connect(); return; }
    if (!form.amountIn || !form.limitPrice) { setError("Fill all fields"); return; }
    setPlacing(true); setError(null);
    try {
      const tIn = form.tokenIn.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : form.tokenIn.address;
      const amtIn = ethers.parseUnits(form.amountIn, form.tokenIn.decimals);
      // Escrow: approve FeeRewardManager or self-custody in this demo
      await ensureAllowance(tIn, address, ADDRESSES.ammFactory, amtIn, signer);

      const order = {
        id:         Date.now().toString(),
        maker:      address,
        tokenIn:    form.tokenIn,
        tokenOut:   form.tokenOut,
        amountIn:   form.amountIn,
        limitPrice: form.limitPrice,
        status:     STATUS.OPEN,
        createdAt:  Date.now(),
      };
      const updated = [order, ...orders];
      setOrders(updated);
      saveOrders(updated);
      setForm(f => ({ ...f, amountIn: "", limitPrice: "" }));
    } catch (e) { setError(e.reason || e.message); }
    finally { setPlacing(false); }
  }

  async function fillOrder(order) {
    if (!isConnected) { connect(); return; }
    setFilling(order.id); setError(null); setTx(null);
    try {
      const tIn  = order.tokenIn.address  === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : order.tokenIn.address;
      const tOut = order.tokenOut.address === "native" ? "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" : order.tokenOut.address;
      const amtIn  = ethers.parseUnits(order.amountIn, order.tokenIn.decimals);
      const minOut = ethers.parseUnits(
        (parseFloat(order.amountIn) * parseFloat(order.limitPrice) * 0.995).toFixed(order.tokenOut.decimals),
        order.tokenOut.decimals
      );

      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(tIn, tOut);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) throw new Error("No pool for this pair");

      await ensureAllowance(tIn, order.maker === address ? address : tIn, poolAddr, amtIn, signer);
      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const t    = await pool.swap(tIn, amtIn, minOut, order.maker);
      const r    = await t.wait();
      setTx(r.hash);

      // Protocol fee
      try {
        const fee = (amtIn * PROTOCOL_FEE_BPS) / 10000n;
        if (fee > 0n) {
          const erc20 = getContract(tIn, ERC20_ABI, signer);
          await erc20.transfer(PROTOCOL_FEE_WALLET, fee);
        }
      } catch {}

      const updated = orders.map(o => o.id === order.id ? { ...o, status: STATUS.FILLED, txHash: r.hash } : o);
      setOrders(updated); saveOrders(updated);
    } catch (e) { setError(e.reason || e.message); }
    finally { setFilling(null); }
  }

  function cancelOrder(id) {
    const updated = orders.map(o => o.id === id ? { ...o, status: STATUS.CANCELLED } : o);
    setOrders(updated); saveOrders(updated);
  }

  const myOrders = orders.filter(o => o.maker?.toLowerCase() === address?.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Place Order */}
      <div className="card">
        <h2 className="mb-1 font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>LIMIT ORDER</h2>
        <p className="text-xs text-muted mb-5" style={{ fontFamily:"'Space Mono',monospace" }}>Off-chain order · Executed via SwapZone AMM · Fees auto-collected</p>

        <div className="space-y-3">
          {/* Token selects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Sell</label>
              <select className="sz-input"
                value={form.tokenIn.address}
                onChange={e => setForm(f => ({ ...f, tokenIn: MONAD_TOKENS.find(t => t.address === e.target.value) }))}>
                {MONAD_TOKENS.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Buy</label>
              <select className="sz-input"
                value={form.tokenOut.address}
                onChange={e => setForm(f => ({ ...f, tokenOut: MONAD_TOKENS.find(t => t.address === e.target.value) }))}>
                {MONAD_TOKENS.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Amount to Sell</label>
            <input className="sz-input" type="number" placeholder="0.0" value={form.amountIn} onChange={e => setForm(f => ({ ...f, amountIn: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>
              Limit Price ({form.tokenOut.symbol} per {form.tokenIn.symbol})
              {prices[form.tokenOut.address] && (
                <span className="ml-2 text-primary">Current: ~{parseFloat(prices[form.tokenOut.address]).toFixed(4)}</span>
              )}
            </label>
            <input className="sz-input" type="number" placeholder="0.0" value={form.limitPrice} onChange={e => setForm(f => ({ ...f, limitPrice: e.target.value }))} />
          </div>

          <button className="btn-primary w-full" disabled={placing} onClick={placeOrder}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {placing ? <><Loader2 size={16} className="animate-spin" />Placing…</> : <><Plus size={16} />Place Order</>}
          </button>
        </div>
        {error && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}
        {tx    && <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>✅ Filled! Tx: {tx.slice(0,14)}…</div>}
      </div>

      {/* My Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>MY ORDERS</h2>
          <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{myOrders.length} total</span>
        </div>

        {!isConnected ? (
          <div className="py-10 text-center"><button className="btn-primary" onClick={connect}>Connect Wallet</button></div>
        ) : myOrders.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm" style={{ fontFamily:"'Space Mono',monospace" }}>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight:400 }}>
            {myOrders.map(o => (
              <div key={o.id} className={`p-3 rounded-xl border transition-colors ${o.status === STATUS.OPEN ? "border-primary/20 bg-primary/3" : "border-border/30 bg-black/20 opacity-60"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TokenLogo token={o.tokenIn}  size={18} />
                    <ArrowRight size={12} className="text-muted" />
                    <TokenLogo token={o.tokenOut} size={18} />
                    <span className="text-xs font-bold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
                      {o.amountIn} {o.tokenIn.symbol}
                    </span>
                  </div>
                  <span className={`text-xs ${STATUS_COLOR[o.status]}`} style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
                    {o.status}
                  </span>
                </div>
                <div className="text-xs text-muted mb-2" style={{ fontFamily:"'Space Mono',monospace" }}>
                  @ {o.limitPrice} {o.tokenOut.symbol}/{o.tokenIn.symbol}
                </div>
                {o.status === STATUS.OPEN && (
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 flex items-center justify-center gap-1" disabled={!!filling}
                      onClick={() => fillOrder(o)} style={{ padding:"6px 10px", fontSize:11 }}>
                      {filling === o.id ? <Loader2 size={12} className="animate-spin" /> : "Execute"}
                    </button>
                    <button className="btn-secondary" onClick={() => cancelOrder(o.id)} style={{ padding:"6px 10px", fontSize:11 }}>
                      Cancel
                    </button>
                  </div>
                )}
                {o.txHash && (
                  <a href={`https://monadexplorer.com/tx/${o.txHash}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline" style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>
                    View tx →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
