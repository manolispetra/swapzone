import { useState, useEffect } from "react";
import { Search, Shield, AlertTriangle, ExternalLink, Plus, Loader2 } from "lucide-react";
import { ADDRESSES, TOKEN_REGISTRY_ABI, getContract, getReadProvider } from "../../utils/contracts";

export default function TokenExplorer() {
  const [tokens,  setTokens]   = useState([]);
  const [loading, setLoading]  = useState(false);
  const [search,  setSearch]   = useState("");
  const [custom,  setCustom]   = useState("");
  const [registering, setReg]  = useState(false);
  const [regMsg,  setRegMsg]   = useState(null);

  useEffect(() => { loadTokens(); }, []);

  async function loadTokens() {
    setLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/tokens?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch {
      // fallback to on-chain
      if (ADDRESSES.tokenRegistry) {
        const reg   = getContract(ADDRESSES.tokenRegistry, TOKEN_REGISTRY_ABI, getReadProvider());
        const total = await reg.totalTokens();
        const items = await reg.getTokensPaginated(0, Math.min(100, Number(total)));
        setTokens(items.map(t => ({
          address:  t.tokenAddress,
          name:     t.name,
          symbol:   t.symbol,
          decimals: Number(t.decimals),
          verified: t.verified,
        })));
      }
    } finally {
      setLoading(false);
    }
  }

  async function registerCustom() {
    if (!custom) return;
    setReg(true); setRegMsg(null);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/tokens/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: custom }),
      });
      const data = await res.json();
      if (data.success) {
        setRegMsg({ ok: true, msg: `${data.token?.symbol || custom} registered!` });
        loadTokens();
        setCustom("");
      } else {
        setRegMsg({ ok: false, msg: data.error });
      }
    } catch (err) {
      setRegMsg({ ok: false, msg: err.message });
    } finally {
      setReg(false);
    }
  }

  const filtered = tokens.filter(t =>
    !search ||
    t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header + Register */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.05em" }}>
            TOKEN EXPLORER
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted" style={{ fontFamily: "'Space Mono', monospace" }}>
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {tokens.length} tokens indexed
          </div>
        </div>

        {/* Register custom token */}
        <div className="flex gap-3">
          <input className="sz-input flex-1" placeholder="Register token address: 0x..." value={custom} onChange={e => setCustom(e.target.value)} />
          <button className="btn-secondary whitespace-nowrap" disabled={registering} onClick={registerCustom}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {registering ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Register
          </button>
        </div>
        {regMsg && (
          <div className={`mt-2 text-xs p-2 rounded-lg ${regMsg.ok ? "text-primary bg-primary/10" : "text-red-400 bg-red-500/10"}`} style={{ fontFamily: "'Space Mono', monospace" }}>
            {regMsg.msg}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="sz-input pl-10"
          placeholder="Search by name, symbol, or address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Token grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TokenCard key={t.address} token={t} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              No tokens found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TokenCard({ token }) {
  return (
    <div className="card hover:border-border cursor-default" style={{ padding: 16 }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold neon-text" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {(token.symbol || "?")[0]}
          </span>
        </div>
        <span className={token.verified ? "tag-verified" : "tag-unverified"}>
          {token.verified ? "✓ Verified" : "Unverified"}
        </span>
      </div>
      <div className="mb-1">
        <span className="font-bold text-text" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16 }}>{token.symbol}</span>
        <span className="ml-2 text-xs text-muted">{token.name}</span>
      </div>
      <div className="text-xs text-muted mt-1 flex items-center gap-1" style={{ fontFamily: "'Space Mono', monospace" }}>
        <span>{token.address ? `${token.address.slice(0,8)}…${token.address.slice(-6)}` : "—"}</span>
        {token.address && (
          <a href={`https://testnet.monadexplorer.com/address/${token.address}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div className="text-xs text-muted mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
        Decimals: <span className="text-text">{token.decimals ?? 18}</span>
      </div>
    </div>
  );
}
