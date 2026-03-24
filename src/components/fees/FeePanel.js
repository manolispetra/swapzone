import { useState, useEffect } from "react";
import { DollarSign, Settings, Download, Loader2, RefreshCw } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ADDRESSES, FEE_MANAGER_ABI, getContract, getReadProvider } from "../../utils/contracts";
import { ethers } from "ethers";

export default function FeePanel() {
  const { signer, address, isConnected } = useWallet();
  const [stats,     setStats]   = useState(null);
  const [loading,   setLoading] = useState(false);
  const [updating,  setUpdating]= useState(false);
  const [withdrawing,setW]      = useState(false);
  const [error,     setError]   = useState(null);
  const [success,   setSuccess] = useState(null);
  const [adminKey,  setAdminKey]= useState("");
  const [withdrawToken, setWt]  = useState("");
  const [editFee,   setEditFee] = useState({ tradingFeeBps: "", protocolFeePercent: "", protocolFeeWallet: "" });

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    setLoading(true); setError(null);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/fees/stats`);
      const data = await res.json();
      setStats(data);
      setEditFee({
        tradingFeeBps:      data.tradingFeeBps || "",
        protocolFeePercent: data.protocolFeePercent || "",
        protocolFeeWallet:  data.protocolFeeWallet || "",
      });
    } catch {
      // fallback on-chain
      if (ADDRESSES.feeManager) {
        const fm = getContract(ADDRESSES.feeManager, FEE_MANAGER_ABI, getReadProvider());
        const [tbps, ppct, wallet] = await Promise.all([
          fm.defaultTradingFeeBps(),
          fm.protocolFeePercent(),
          fm.protocolFeeWallet(),
        ]);
        setStats({
          address: ADDRESSES.feeManager,
          tradingFeeBps: tbps.toString(),
          tradingFeePercent: (Number(tbps)/100).toFixed(2) + "%",
          protocolFeePercent: ppct.toString(),
          protocolFeeWallet: wallet,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateFeeSettings() {
    setUpdating(true); setError(null); setSuccess(null);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/fees/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          tradingFeeBps:      editFee.tradingFeeBps      ? parseInt(editFee.tradingFeeBps)      : undefined,
          protocolFeePercent: editFee.protocolFeePercent ? parseInt(editFee.protocolFeePercent) : undefined,
          protocolFeeWallet:  editFee.protocolFeeWallet  || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess("Fee settings updated!");
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function withdrawFees() {
    if (!withdrawToken) { setError("Enter token address to withdraw"); return; }
    setW(true); setError(null); setSuccess(null);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/fees/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ token: withdrawToken }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(`Fees withdrawn! Tx: ${data.txHash}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setW(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.05em" }}>
            FEE OVERVIEW
          </h2>
          <button onClick={loadStats} className="text-muted hover:text-primary transition-colors">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Trading Fee",        value: stats.tradingFeePercent || `${stats.tradingFeeBps} bps` },
              { label: "Protocol Cut",       value: `${stats.protocolFeePercent}%` },
              { label: "Fee Wallet",         value: stats.protocolFeeWallet ? `${stats.protocolFeeWallet.slice(0,8)}…` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-black/30 border border-border/60">
                <div className="text-xs text-muted mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>{label}</div>
                <div className="font-bold neon-text" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18 }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted text-sm text-center py-4" style={{ fontFamily: "'Space Mono', monospace" }}>
            FeeRewardManager not deployed yet
          </div>
        )}
      </div>

      {/* Admin key */}
      <div className="card">
        <h3 className="mb-4" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.06em" }}>
          ADMIN AUTHENTICATION
        </h3>
        <input
          className="sz-input"
          type="password"
          placeholder="Admin API key (from .env ADMIN_API_KEY)"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
        />
        <p className="text-xs text-muted mt-2" style={{ fontFamily: "'Space Mono', monospace" }}>Required for fee updates and withdrawals</p>
      </div>

      {/* Update fees */}
      <div className="card">
        <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.06em" }}>
          <Settings size={16} /> UPDATE FEE SETTINGS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Trading Fee (bps)</label>
            <input className="sz-input" type="number" placeholder="e.g. 30" value={editFee.tradingFeeBps} onChange={e => setEditFee(f => ({...f, tradingFeeBps: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Protocol Cut (%)</label>
            <input className="sz-input" type="number" placeholder="e.g. 20" value={editFee.protocolFeePercent} onChange={e => setEditFee(f => ({...f, protocolFeePercent: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Fee Wallet</label>
            <input className="sz-input" placeholder="0x..." value={editFee.protocolFeeWallet} onChange={e => setEditFee(f => ({...f, protocolFeeWallet: e.target.value}))} />
          </div>
        </div>
        <button className="btn-primary" disabled={updating} onClick={updateFeeSettings}
          style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {updating ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : <><Settings size={16} /> Update Settings</>}
        </button>
      </div>

      {/* Withdraw */}
      <div className="card">
        <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.06em" }}>
          <Download size={16} /> WITHDRAW PROTOCOL FEES
        </h3>
        <p className="text-xs text-muted mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
          Withdraws accumulated fees to the configured protocol fee wallet.
        </p>
        <div className="flex gap-3">
          <input className="sz-input flex-1" placeholder="Token address to withdraw fees for" value={withdrawToken} onChange={e => setWt(e.target.value)} />
          <button className="btn-accent whitespace-nowrap" disabled={withdrawing} onClick={withdrawFees}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {withdrawing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Withdraw
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error   && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>{error}</div>}
      {success && <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>✅ {success}</div>}
    </div>
  );
}
