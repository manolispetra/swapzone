import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Logo from "./Logo";
import { useWallet } from "../../hooks/useWallet";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/",          label: "Swap"      },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/orderbook", label: "Orders"    },
  { href: "/tokens",    label: "Tokens"    },
  { href: "/nfts",      label: "NFTs"      },
  { href: "/referral",  label: "Referral"  },
  { href: "/create",    label: "Create"    },
];

export default function Navbar() {
  const { pathname } = useRouter();
  const { shortAddress, connect, disconnect, isConnected } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Logo size={32} />
          <span className="neon-text" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:22 }}>
            SwapZone
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-xs no-underline transition-all ${
                pathname === href
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted hover:text-text hover:bg-white/5"
              }`}
              style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <button onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 border border-primary/30 rounded-xl text-primary hover:bg-primary/5 transition-all"
              style={{ fontFamily:"'Space Mono',monospace", fontSize:12 }}>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {shortAddress}
            </button>
          ) : (
            <button onClick={connect} className="btn-primary flex items-center gap-2" style={{ padding:"8px 18px", fontSize:13 }}>
              Connect Wallet
            </button>
          )}
          <button className="md:hidden text-muted hover:text-text" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg/95">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`block px-5 py-3 text-sm border-b border-border/50 no-underline ${
                pathname === href ? "text-primary bg-primary/5" : "text-muted hover:text-text"
              }`}
              style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, textTransform:"uppercase" }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
