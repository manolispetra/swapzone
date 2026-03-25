import { useState } from "react";
import { Zap, Loader2, ExternalLink } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";

// Minimal ERC20 bytecode + ABI for deployment
// In production, use a factory contract instead
const ERC20_CREATION_ABI = [
  "constructor(string name, string symbol, uint256 totalSupply, address owner)",
];

// Simple ERC20 contract (compiled bytecode placeholder)
// Replace with actual compiled bytecode from your ERC20 template
const SIMPLE_ERC20_BYTECODE = "0x"; // Placeholder — see contracts/src/SimpleERC20.sol

export default function TokenCreator() {
  const { signer, address, isConnected, connect } = useWallet();
  const [form, setForm] = useState({ name: "", symbol: "", supply: "1000000", decimals: "18" });
  const [deploying, setDeploying] = useState(false);
  const [deployed,  setDeployed]  = useState(null);
  const [error,     setError]     = useState(null);

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function deployToken() {
    if (!isConnected) { connect(); return; }
    setDeploying(true); setError(null); setDeployed(null);
    try {
      // Build factory from ABI + bytecode
      const factory = new ethers.ContractFactory(
        ["constructor(string,string,uint256,address)"],
        SIMPLE_ERC20_BYTECODE,
        signer
      );
      const totalSupply = ethers.parseUnits(form.supply, parseInt(form.decimals));
      const contract = await factory.deploy(form.name, form.symbol, totalSupply, address);
      const receipt  = await contract.deploymentTransaction().wait();
      const addr     = await contract.getAddress();
      setDeployed({ address: addr, txHash: receipt.hash, ...form });

      // Auto-register in token registry via backend
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      await fetch(`${backend}/api/tokens/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      }).catch(() => {});
    } catch (err) {
      setError(err.reason || err.message || "Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="card">
        <h2 className="mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.05em" }}>
          CREATE TOKEN
        </h2>
        <p className="text-xs text-muted mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          Deploy a new ERC-20 token on Monad. Auto-registered in SwapZone token registry.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Token Name</label>
              <input className="sz-input" placeholder="My Token" value={form.name} onChange={e => setField("name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Symbol</label>
              <input className="sz-input" placeholder="MTK" value={form.symbol} onChange={e => setField("symbol", e.target.value.toUpperCase())} maxLength={10} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Total Supply</label>
              <input className="sz-input" type="number" placeholder="1000000" value={form.supply} onChange={e => setField("supply", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Decimals</label>
              <select className="sz-input" value={form.decimals} onChange={e => setField("decimals", e.target.value)}>
                {[6,8,9,18].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.name && form.symbol && (
            <div className="p-4 rounded-xl bg-black/30 border border-primary/20">
              <div className="text-xs text-muted mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>Preview</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-center">
                  <span className="font-bold neon-text" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{form.symbol[0]}</span>
                </div>
                <div>
                  <div className="font-bold text-text" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16 }}>{form.symbol}</div>
                  <div className="text-xs text-muted">{form.name} · {Number(form.supply).toLocaleString()} supply · {form.decimals} decimals</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent" style={{ fontFamily: "'Space Mono', monospace" }}>
            ⚠️  Note: The SimpleERC20 bytecode must be compiled first (see contracts/src/SimpleERC20.sol). Update SIMPLE_ERC20_BYTECODE in this file with the compiled artifact.
          </div>

          <button className="btn-primary w-full" disabled={deploying || !form.name || !form.symbol} onClick={deployToken}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {deploying ? <><Loader2 size={16} className="animate-spin" /> Deploying…</> : <><Zap size={16} /> Deploy Token</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>{error}</div>
      )}

      {deployed && (
        <div className="card border-primary/30">
          <div className="text-primary font-bold mb-3" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18 }}>
            ✅ Token Deployed!
          </div>
          <div className="space-y-2 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
            <div className="flex justify-between">
              <span className="text-muted">Name</span>
              <span>{deployed.name} ({deployed.symbol})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Address</span>
              <span className="flex items-center gap-1">
                {deployed.address.slice(0,10)}…{deployed.address.slice(-8)}
                <a href={`https://testnet.monadexplorer.com/address/${deployed.address}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <ExternalLink size={11} />
                </a>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Tx Hash</span>
              <a href={`https://testnet.monadexplorer.com/tx/${deployed.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                {deployed.txHash.slice(0,12)}… <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary" style={{ fontFamily: "'Space Mono', monospace" }}>
            ✓ Auto-registered in token registry.<br/>
            You can now add liquidity at <strong>/liquidity</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
