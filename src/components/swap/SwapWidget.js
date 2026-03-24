import { useState, useEffect } from "react";
import { ArrowUpDown, Info, Loader2 } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import {
  ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI,
  getReadProvider, getContract, ensureAllowance, fmt
} from "../../utils/contracts";

const DEMO_TOKENS = [
  { address: "0x0000000000000000000000000000000000000000", symbol: "MON",  name: "Monad",        decimals: 18 },
  { address: "0x1111111111111111111111111111111111111111", symbol: "USDC", name: "USD Coin",     decimals: 6  },
  { address: "0x2222222222222222222222222222222222222222", symbol: "WBTC", name: "Wrapped BTC",  decimals: 8  },
];

export default function SwapWidget() {
  const { signer, address, isConnected, connect } = useWallet();

  const [tokenIn,     setTokenIn]     = useState(DEMO_TOKENS[0]);
  const [tokenOut,    setTokenOut]    = useState(DEMO_TOKENS[1]);
  const [amountIn,    setAmountIn]    = useState("");
  const [amountOut,   setAmountOut]   = useState("");
  const [lpFee,       setLpFee]       = useState("");
  const [protoFee,    setProtoFee]    = useState("");
  const [quoting,     setQuoting]     = useState(false);
  const [swapping,    setSwapping]    = useState(false);
  const [txHash,      setTxHash]      = useState(null);
  const [error,       setError]       = useState(null);
  const [slippage,    setSlippage]    = useState("0.5");
  const [showSettings,setShowSettings]= useState(false);

  // ── Auto-quote ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchQuote(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIn, tokenIn, tokenOut]);

  async function fetchQuote() {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut(""); setLpFee(""); setProtoFee(""); return;
    }
    setQuoting(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backend}/api/swap/quote?tokenIn=${tokenIn.address}&tokenOut=${tokenOut.address}&amountIn=${amountIn}`
      );
      if (res.ok) {
        const q = await res.json();
        if (q.error) throw new Error(q.error);
        setAmountOut(parseFloat(q.amountOut).toFixed(6));
        setLpFee(parseFloat(q.lpFee).toFixed(6));
        setProtoFee(parseFloat(q.protocolFee).toFixed(6));
      }
    } catch {
      setAmountOut("—");
    } finally {
      setQuoting(false);
    }
  }

  // ── Flip tokens ─────────────────────────────────────────────────────────────
  function flip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut || "");
    setAmountOut("");
  }

  // ── Execute swap ─────────────────────────────────────────────────────────────
  async function executeSwap() {
    if (!isConnected) { connect(); return; }
    if (!amountIn || !amountOut) return;
    setSwapping(true);
    setError(null);
    setTxHash(null);
    try {
      const factoryAddr = ADDRESSES.ammFactory;
      if (!factoryAddr) throw new Error("AMM Factory not configured in .env");

      const factory = getContract(factoryAddr, AMM_FACTORY_ABI, signer);
      const poolAddr = await factory.getPool(tokenIn.address, tokenOut.address);
      if (!poolAddr || poolAddr === ethers.ZeroAddress) throw new Error("No pool found for this pair");

      const amtIn = ethers.parseUnits(amountIn, tokenIn.decimals);
      const slippageMul = 1 - parseFloat(slippage) / 100;
      const minOut = ethers.parseUnits(
        (parseFloat(amountOut) * slippageMul).toFixed(tokenOut.decimals),
        tokenOut.decimals
      );

      // Approve tokenIn
      await ensureAllowance(tokenIn.address, address, poolAddr, amtIn, signer);

      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const tx = await pool.swap(tokenIn.address, amtIn, minOut, address);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setAmountIn("");
      setAmountOut("");
    } catch (err) {
      setError(err.reason || err.message || "Swap failed");
    } finally {
      setSwapping(false);
    }
  }

  return (
    <div className="card max-w-md w-full mx-auto" style={{ background: "linear-gradient(160deg, #111111 0%, #0D0D0D 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.05em" }}>
          SWAP
        </h2>
        <button onClick={() => setShowSettings(!showSettings)} className="text-muted hover:text-text transition-colors">
          <Info size={16} />
        </button>
      </div>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-xl bg-black/30 border border-border">
          <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Slippage tolerance</label>
          <div className="flex gap-2">
            {["0.1","0.5","1.0"].map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${slippage === s ? "bg-primary/20 text-primary border border-primary/40" : "bg-white/5 text-muted hover:text-text border border-transparent"}`}
                style={{ fontFamily: "'Space Mono', monospace" }}>
                {s}%
              </button>
            ))}
            <input
              type="number"
              value={slippage}
              onChange={e => setSlippage(e.target.value)}
              className="sz-input text-xs"
              style={{ width: 70, padding: "4px 8px" }}
              placeholder="Custom"
            />
          </div>
        </div>
      )}

      {/* Token In */}
      <TokenAmountInput
        label="You pay"
        token={tokenIn}
        amount={amountIn}
        onAmountChange={setAmountIn}
        onTokenChange={setTokenIn}
        tokens={DEMO_TOKENS}
      />

      {/* Flip button */}
      <div className="flex justify-center my-2">
        <button
          onClick={flip}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-all group"
        >
          <ArrowUpDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* Token Out */}
      <TokenAmountInput
        label="You receive"
        token={tokenOut}
        amount={amountOut}
        onAmountChange={() => {}}
        onTokenChange={setTokenOut}
        tokens={DEMO_TOKENS}
        readOnly
        loading={quoting}
      />

      {/* Fee info */}
      {lpFee && (
        <div className="mt-4 p-3 rounded-xl bg-black/20 border border-border/50 space-y-1">
          <div className="flex justify-between text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>LP Fee</span><span className="text-text">{lpFee} {tokenIn.symbol}</span>
          </div>
          <div className="flex justify-between text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>Protocol Fee</span><span className="text-text">{protoFee} {tokenIn.symbol}</span>
          </div>
          <div className="flex justify-between text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>Slippage</span><span className="text-accent">{slippage}%</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
          {error}
        </div>
      )}

      {/* Success */}
      {txHash && (
        <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
          ✅ Swap confirmed! <a href={`https://testnet.monadexplorer.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline">{txHash.slice(0, 18)}…</a>
        </div>
      )}

      {/* Swap button */}
      <button
        className="btn-primary w-full mt-4"
        disabled={swapping || !amountIn}
        onClick={executeSwap}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {swapping ? <><Loader2 size={16} className="animate-spin" /> Swapping…</> : isConnected ? "Swap" : "Connect Wallet"}
      </button>
    </div>
  );
}

function TokenAmountInput({ label, token, amount, onAmountChange, onTokenChange, tokens, readOnly, loading }) {
  return (
    <div className="p-4 rounded-xl bg-black/30 border border-border/60 hover:border-border transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={token.address}
          onChange={e => onTokenChange(tokens.find(t => t.address === e.target.value))}
          className="bg-white/5 border border-border rounded-lg px-3 py-2 text-text text-sm font-semibold"
          style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, minWidth: 90 }}
        >
          {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
        </select>
        <div className="flex-1 relative">
          {loading && <div className="spinner absolute right-3 top-1/2 -translate-y-1/2" />}
          <input
            type="number"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            readOnly={readOnly}
            placeholder="0.00"
            className="sz-input text-right text-lg"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, background: "transparent", border: "none", padding: "0" }}
          />
        </div>
      </div>
    </div>
  );
}
