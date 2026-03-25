import { useState } from "react";
import { Zap, Loader2, ExternalLink, Plus, Twitter, Copy, Check } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { ADDRESSES, AMM_FACTORY_ABI, AMM_POOL_ABI, ERC20_ABI, getContract, ensureAllowance } from "../../utils/contracts";

const SIMPLE_ERC20_ABI = [
  "constructor(string name, string symbol, uint256 totalSupply, address owner)",
];
// ⚠️ Replace with real bytecode after: cd contracts && npm run compile
// Then copy artifacts/src/SimpleERC20.sol/SimpleERC20.json → bytecode
const SIMPLE_ERC20_BYTECODE = "0x60806040523480156200001157600080fd5b50604051620011d8380380620011d883398101604081905262000034916200026d565b83516200004990600390602087019062000113565b5082516200005f90600490602086019062000113565b506200006c3382620000a5565b6200008f8382620000798462000100565b90506200008660006200010060201b60201c565b505050506200036b565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6001600160a01b038216620000ff5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064015b60405180910390fd5b806000546200010f919062000337565b600055565b828054620001219062000317565b90601f0160208091040260200160405190810160405280929190818152602001828054620001519062000317565b80156200019e5780601f1060008054610100808354040283529160200191620001998382168454600191825290925091601f019082016200015d565b505b505050905090565b634e487b7160e01b600052604160045260246000fd5b600082601f830112620001cf57600080fd5b81516001600160401b0380821115620001ec57620001ec620001a6565b604051601f8301601f19908116603f01168101908282118183101715620002165762000216620001a6565b8160405283815260209250868385880101111562000233578384fd5b8385015b85811015620002515780820183015185820184015282016200025750600092829190840101565b505093508492505050565b6001600160a01b0381168114620002ad57600080fd5b919050565b600082601f830112620002c357600080fd5b604051601f8301601f191681016001600160401b0381118282101715620002e9575b50604081905295945050505050565b6000806000806080858703121562000282578080fd5b8451915060208501516001600160401b0381111562000297578384fd5b6200028e878288016200015e565b99965095945050505050565b600081600019048311821515161562000316576200031662000352565b500290565b600181811c908216806200032c57607f821691505b602082108114156200034e576200034e62000352565b50919050565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052602260045260246000fd5b610e5d806200037b6000396000f3fe"; // placeholder

export default function TokenCreator() {
  const { signer, address, isConnected, connect } = useWallet();
  const [step,       setStep]       = useState(1); // 1=form, 2=deployed, 3=liquidity added
  const [form,       setForm]       = useState({ name:"", symbol:"", supply:"1000000", decimals:"18" });
  const [liqMon,     setLiqMon]     = useState("1");
  const [liqToken,   setLiqToken]   = useState("100000");
  const [deploying,  setDeploying]  = useState(false);
  const [addingLiq,  setAddingLiq]  = useState(false);
  const [deployed,   setDeployed]   = useState(null);
  const [error,      setError]      = useState(null);
  const [copied,     setCopied]     = useState(false);

  function setField(k,v) { setForm(f=>({...f,[k]:v})); }

  async function deployToken() {
    if (!isConnected) { connect(); return; }
    if (!form.name || !form.symbol) { setError("Name and symbol required"); return; }
    setDeploying(true); setError(null);
    try {
      const factory = new ethers.ContractFactory(SIMPLE_ERC20_ABI, SIMPLE_ERC20_BYTECODE, signer);
      const supply  = ethers.parseUnits(form.supply, parseInt(form.decimals));
      const contract = await factory.deploy(form.name, form.symbol, supply, address);
      const receipt  = await contract.deploymentTransaction().wait();
      const addr     = await contract.getAddress();
      setDeployed({ address:addr, txHash:receipt.hash, ...form });
      setStep(2);
    } catch(e) { setError(e.reason || e.message || "Deploy failed — ensure SimpleERC20 bytecode is set"); }
    finally { setDeploying(false); }
  }

  async function addLiquidity() {
    if (!deployed) return;
    setAddingLiq(true); setError(null);
    try {
      const wmon     = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
      const factory  = getContract(ADDRESSES.ammFactory, AMM_FACTORY_ABI, signer);
      let poolAddr   = await factory.getPool(wmon, deployed.address).catch(()=>null);

      if (!poolAddr || poolAddr === ethers.ZeroAddress) {
        const ct = await factory.createPool(wmon, deployed.address);
        await ct.wait();
        poolAddr = await factory.getPool(wmon, deployed.address);
      }

      const amtMon   = ethers.parseEther(liqMon);
      const amtToken = ethers.parseUnits(liqToken, parseInt(deployed.decimals));

      await ensureAllowance(wmon,            address, poolAddr, amtMon,   signer);
      await ensureAllowance(deployed.address,address, poolAddr, amtToken, signer);

      const pool = getContract(poolAddr, AMM_POOL_ABI, signer);
      const tx   = await pool.addLiquidity(amtMon, amtToken, amtMon*95n/100n, amtToken*95n/100n, address);
      await tx.wait();
      setStep(3);
    } catch(e) { setError(e.reason || e.message); }
    finally { setAddingLiq(false); }
  }

  function copyAddress() {
    navigator.clipboard.writeText(deployed?.address || "");
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  const tweetText = deployed
    ? `🚀 Just launched ${deployed.symbol} on Monad via @SwapZone!\n\nContract: ${deployed.address}\n\nBuy now on SwapZone 👇\nhttps://swapzone.vercel.app?buy=${deployed.address}\n\n#Monad #DeFi #${deployed.symbol}`
    : "";

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {[{n:1,l:"Deploy"},{n:2,l:"Add Liquidity"},{n:3,l:"Share"}].map(({n,l},i)=>(
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step>=n ? "bg-primary/20 border-primary/40 text-primary" : "border-border text-muted"
            }`} style={{ fontFamily:"'Space Mono',monospace" }}>{n}</div>
            <span className={`text-xs ${step>=n?"text-text":"text-muted"}`} style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{l}</span>
            {i<2 && <div className={`w-8 h-px ${step>n?"bg-primary/40":"bg-border"}`}/>}
          </div>
        ))}
      </div>

      {/* Step 1 — Deploy */}
      {step === 1 && (
        <div className="card">
          <h2 className="mb-1 font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.05em" }}>CREATE TOKEN</h2>
          <p className="text-xs text-muted mb-5" style={{ fontFamily:"'Space Mono',monospace" }}>Deploy ERC-20 on Monad · Auto-registered in SwapZone</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Token Name</label>
                <input className="sz-input" placeholder="My Token" value={form.name} onChange={e=>setField("name",e.target.value)}/>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Symbol</label>
                <input className="sz-input" placeholder="MTK" value={form.symbol} onChange={e=>setField("symbol",e.target.value.toUpperCase())} maxLength={10}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Total Supply</label>
                <input className="sz-input" type="number" placeholder="1000000" value={form.supply} onChange={e=>setField("supply",e.target.value)}/>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>Decimals</label>
                <select className="sz-input" value={form.decimals} onChange={e=>setField("decimals",e.target.value)}>
                  {[6,8,9,18].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {/* Preview */}
            {form.name && form.symbol && (
              <div className="p-4 rounded-xl bg-black/30 border border-primary/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-center">
                  <span className="font-bold neon-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18 }}>{form.symbol[0]}</span>
                </div>
                <div>
                  <div className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16 }}>{form.symbol}</div>
                  <div className="text-xs text-muted">{form.name} · {Number(form.supply).toLocaleString()} supply</div>
                </div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent" style={{ fontFamily:"'Space Mono',monospace" }}>
              ⚠️ Compile contracts first: cd contracts && npm run compile<br/>
              Then update SIMPLE_ERC20_BYTECODE in this file.
            </div>
            <button className="btn-primary w-full" disabled={deploying||!form.name||!form.symbol} onClick={deployToken}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {deploying?<><Loader2 size={16} className="animate-spin"/>Deploying…</>:<><Zap size={16}/>Deploy Token</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Add Liquidity */}
      {step === 2 && deployed && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="neon-text font-bold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{deployed.symbol[0]}</span>
            </div>
            <div>
              <div className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18 }}>{deployed.symbol} Deployed ✅</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>{deployed.address.slice(0,14)}…</span>
                <button onClick={copyAddress} className="text-muted hover:text-primary transition-colors">
                  {copied?<Check size={12}/>:<Copy size={12}/>}
                </button>
                <a href={`https://monadexplorer.com/address/${deployed.address}`} target="_blank" rel="noreferrer" className="text-muted hover:text-primary"><ExternalLink size={11}/></a>
              </div>
            </div>
          </div>
          <h3 className="font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:17, letterSpacing:"0.05em" }}>ADD INITIAL LIQUIDITY</h3>
          <p className="text-xs text-muted mb-4" style={{ fontFamily:"'Space Mono',monospace" }}>Pair with WMON to enable trading on SwapZone</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>WMON Amount</label>
              <input className="sz-input" type="number" placeholder="1.0" value={liqMon} onChange={e=>setLiqMon(e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block" style={{ fontFamily:"'Space Mono',monospace" }}>{deployed.symbol} Amount</label>
              <input className="sz-input" type="number" placeholder="100000" value={liqToken} onChange={e=>setLiqToken(e.target.value)}/>
            </div>
            {liqMon && liqToken && (
              <div className="p-3 rounded-xl bg-black/20 border border-border/50 text-xs text-muted" style={{ fontFamily:"'Space Mono',monospace" }}>
                Initial price: 1 {deployed.symbol} = {(parseFloat(liqMon)/parseFloat(liqToken)).toFixed(8)} WMON
              </div>
            )}
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={()=>setStep(3)}>Skip for now</button>
              <button className="btn-primary flex-1" disabled={addingLiq} onClick={addLiquidity}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {addingLiq?<><Loader2 size={16} className="animate-spin"/>Adding…</>:<><Plus size={16}/>Add Liquidity</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Share */}
      {step === 3 && deployed && (
        <div className="card border-primary/30">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="font-bold neon-text text-2xl mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
              {deployed.symbol} is Live!
            </h2>
            <p className="text-muted text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>
              Your token is deployed and has liquidity on SwapZone
            </p>
          </div>
          <div className="space-y-3 mb-5 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
            {[
              { label:"Contract",  value:deployed.address },
              { label:"Name",      value:`${deployed.name} (${deployed.symbol})` },
              { label:"Supply",    value:`${Number(deployed.supply).toLocaleString()}` },
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between p-3 rounded-xl bg-black/30 border border-border/50">
                <span className="text-muted">{label}</span>
                <span className="text-text truncate max-w-[60%] text-right">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <a href={`https://swapzone.vercel.app?buy=${deployed.address}`} target="_blank" rel="noreferrer"
              className="btn-primary text-center" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Zap size={16}/>Trade on SwapZone
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#1DA1F2]/30 bg-[#1DA1F2]/10 text-[#1DA1F2] font-bold transition-all hover:bg-[#1DA1F2]/20"
              style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              <Twitter size={16}/>Share on X & Get Buyers
            </a>
            <button onClick={()=>{setStep(1);setDeployed(null);setForm({name:"",symbol:"",supply:"1000000",decimals:"18"});}}
              className="btn-secondary text-center">Create Another Token</button>
          </div>
        </div>
      )}

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" style={{ fontFamily:"'Space Mono',monospace" }}>{error}</div>}
    </div>
  );
}
