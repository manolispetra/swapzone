
export const COLLECTION_NAME   = "SwapZone Genesis";
export const COLLECTION_SYMBOL = "SZGEN";
export const COLLECTION_DESC   = "10 generative geometric NFTs from the SwapZone protocol. Each piece is a unique abstract composition — circles, prisms, vortices, orbits. Earn them through the Referral Program.";
export const TOTAL_SUPPLY      = 10;

export const RARITY_TIERS = {
  LEGENDARY: { label:"Legendary ✦", color:"#FFD700", glow:"0 0 30px #FFD70066,0 0 60px #FFD70022", bg:"#0A0814" },
  EPIC:      { label:"Epic ◈",      color:"#8458FF", glow:"0 0 24px #8458FF55",                    bg:"#080614" },
  RARE:      { label:"Rare ◆",      color:"#00FFD1", glow:"0 0 16px #00FFD144",                    bg:"#060C10" },
  UNCOMMON:  { label:"Uncommon",    color:"#4FC3F7", glow:"none",                                   bg:"#060810" },
  COMMON:    { label:"Common",      color:"#888888", glow:"none",                                   bg:"#080808" },
};

// Render geometric SVG — each NFT is a unique abstract composition
export function renderPixelSVG(nft, size = 240) {
  return nft.render(size);
}

// ── Z Logo (center of each NFT) ────────────────────────────────────────────
function zLogo(cx, cy, r, color, stroke = 1.5) {
  const s = r * 0.55;
  return `<text x="${cx}" y="${cy + s*0.38}" text-anchor="middle" font-family="monospace" font-weight="900" font-size="${r*1.1}" fill="none" stroke="${color}" stroke-width="${stroke}" letter-spacing="-2">Z</text>`;
}

function baseStyle(size, bg) {
  return `<rect width="${size}" height="${size}" fill="${bg}"/>`;
}

function svgWrap(size, bg, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${baseStyle(size,bg)}${content}</svg>`;
}

// Scanline overlay for atmosphere
function scanlines(size) {
  let lines = "";
  for (let y = 0; y < size; y += 4) {
    lines += `<line x1="0" y1="${y}" x2="${size}" y2="${y}" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>`;
  }
  return lines;
}

export const NFT_COLLECTION = [
  // ── 1. Genesis Circle ───────────────────────────────────────────────────
  {
    id:1, name:"Genesis #001", rarity:"LEGENDARY", rarityScore:99,
    description:"The origin. A single perfect circle orbited by directional arrows — the first swap, the first block, the genesis of SwapZone.",
    traits:[{t:"Shape",v:"Circle"},{t:"Style",v:"Orbit"},{t:"Color",v:"Cyan/Purple"},{t:"Arrows",v:"3 Directional"},{t:"Rarity",v:"1 of 1"}],
    render(size) {
      const cx = size/2, cy = size/2, R = size*0.36;
      const c1 = "#00FFD1", c2 = "#8458FF";
      let content = `
        <!-- Outer glow ring -->
        <circle cx="${cx}" cy="${cy}" r="${R+8}" fill="none" stroke="${c1}" stroke-width="0.5" opacity="0.2"/>
        <!-- Main arc (270 degrees) -->
        <path d="M${cx+R},${cy} A${R},${R} 0 1,1 ${cx},${cy-R}" fill="none" stroke="${c1}" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Arrow right -->
        <polygon points="${cx+R+2},${cy} ${cx+R-8},${cy-7} ${cx+R-8},${cy+7}" fill="${c1}"/>
        <!-- Purple arc fragment top-left -->
        <path d="M${cx-R*0.7},${cy-R*0.7} A${R},${R} 0 0,0 ${cx},${cy-R}" fill="none" stroke="${c2}" stroke-width="2" stroke-linecap="round" stroke-dasharray="8 4"/>
        <!-- Arrow top-left -->
        <polygon points="${cx-R*0.72},${cy-R*0.7} ${cx-R*0.56},${cy-R*0.58} ${cx-R*0.84},${cy-R*0.54}" fill="${c2}"/>
        <!-- Inner circle -->
        <circle cx="${cx}" cy="${cy}" r="${R*0.38}" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.7"/>
        <!-- Z center -->
        ${zLogo(cx, cy, R*0.26, c1, 1.8)}
        <!-- Dots on orbit -->
        <circle cx="${cx+R*0.7}" cy="${cy-R*0.7}" r="3" fill="${c2}" opacity="0.8"/>
        <circle cx="${cx-R*0.5}" cy="${cy+R*0.86}" r="2" fill="${c1}" opacity="0.6"/>
        <!-- Subtle grid lines -->
        <line x1="0" y1="${cy}" x2="${size}" y2="${cy}" stroke="rgba(0,255,209,0.06)" stroke-width="1"/>
        <line x1="${cx}" y1="0" x2="${cx}" y2="${size}" stroke="rgba(0,255,209,0.06)" stroke-width="1"/>
        ${scanlines(size)}
      `;
      return svgWrap(size, "#080C14", content);
    }
  },

  // ── 2. Vortex #002 ──────────────────────────────────────────────────────
  {
    id:2, name:"Vortex #002", rarity:"LEGENDARY", rarityScore:96,
    description:"Spinning compass of liquidity. Four cardinal arrows point to infinite pools. The Phantom's symbol.",
    traits:[{t:"Shape",v:"Compass"},{t:"Style",v:"Vortex"},{t:"Color",v:"Teal/Purple"},{t:"Arrows",v:"4 Cardinal"},{t:"Rings",v:"Concentric"}],
    render(size) {
      const cx = size/2, cy = size/2, R = size*0.36;
      const c1 = "#00FFD1", c2 = "#8458FF", c3 = "#6633BB";
      let content = `
        <!-- Outer ring -->
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c3}" stroke-width="1" opacity="0.4"/>
        <!-- Mid ring -->
        <circle cx="${cx}" cy="${cy}" r="${R*0.6}" fill="none" stroke="${c1}" stroke-width="1" opacity="0.3"/>
        <!-- 4 compass arrows -->
        <!-- Top -->
        <polygon points="${cx},${cy-R*0.88} ${cx-10},${cy-R*0.6} ${cx+10},${cy-R*0.6}" fill="${c1}"/>
        <!-- Bottom -->
        <polygon points="${cx},${cy+R*0.88} ${cx-10},${cy+R*0.6} ${cx+10},${cy+R*0.6}" fill="${c2}"/>
        <!-- Left -->
        <polygon points="${cx-R*0.88},${cy} ${cx-R*0.6},${cy-10} ${cx-R*0.6},${cy+10}" fill="${c2}"/>
        <!-- Right -->
        <polygon points="${cx+R*0.88},${cy} ${cx+R*0.6},${cy-10} ${cx+R*0.6},${cy+10}" fill="${c1}"/>
        <!-- Lines to arrows -->
        <line x1="${cx}" y1="${cy-R*0.38}" x2="${cx}" y2="${cy-R*0.6}" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>
        <line x1="${cx}" y1="${cy+R*0.38}" x2="${cx}" y2="${cy+R*0.6}" stroke="${c2}" stroke-width="1.5" opacity="0.6"/>
        <line x1="${cx-R*0.38}" y1="${cy}" x2="${cx-R*0.6}" y2="${cy}" stroke="${c2}" stroke-width="1.5" opacity="0.6"/>
        <line x1="${cx+R*0.38}" y1="${cy}" x2="${cx+R*0.6}" y2="${cy}" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>
        <!-- Inner circle Z -->
        <circle cx="${cx}" cy="${cy}" r="${R*0.36}" fill="none" stroke="${c1}" stroke-width="1.5"/>
        ${zLogo(cx, cy, R*0.24, c1, 1.8)}
        <!-- Diagonal accent lines -->
        <line x1="${cx-R*0.4}" y1="${cy-R*0.4}" x2="${cx+R*0.4}" y2="${cy+R*0.4}" stroke="${c3}" stroke-width="0.8" opacity="0.3"/>
        <line x1="${cx+R*0.4}" y1="${cy-R*0.4}" x2="${cx-R*0.4}" y2="${cy+R*0.4}" stroke="${c3}" stroke-width="0.8" opacity="0.3"/>
        ${scanlines(size)}
      `;
      return svgWrap(size, "#07060F", content);
    }
  },

  // ── 3. Prism #003 ───────────────────────────────────────────────────────
  {
    id:3, name:"Prism #003", rarity:"EPIC", rarityScore:88,
    description:"A rotated diamond prism refracts swap routes. Pure geometry — the AMM Wizard's sigil.",
    traits:[{t:"Shape",v:"Diamond"},{t:"Style",v:"Prism"},{t:"Color",v:"Cyan/Gold"},{t:"Lines",v:"Nested"},{t:"Effect",v:"Refraction"}],
    render(size) {
      const cx = size/2, cy = size/2, R = size*0.36;
      const c1 = "#00FFD1", c2 = "#FFD700", c3 = "#8458FF";
      const pts = (r) => `${cx},${cy-r} ${cx+r*0.7},${cy} ${cx},${cy+r} ${cx-r*0.7},${cy}`;
      let content = `
        <!-- Outer diamond -->
        <polygon points="${pts(R)}" fill="none" stroke="${c1}" stroke-width="2"/>
        <!-- Middle diamond -->
        <polygon points="${pts(R*0.68)}" fill="none" stroke="${c3}" stroke-width="1.2" opacity="0.7"/>
        <!-- Inner diamond -->
        <polygon points="${pts(R*0.4)}" fill="none" stroke="${c1}" stroke-width="1" opacity="0.5"/>
        <!-- Corner lines to center -->
        <line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy-R*0.4}" stroke="${c2}" stroke-width="0.8" opacity="0.5"/>
        <line x1="${cx+R*0.7}" y1="${cy}" x2="${cx+R*0.4*0.7}" y2="${cy}" stroke="${c2}" stroke-width="0.8" opacity="0.5"/>
        <line x1="${cx}" y1="${cy+R}" x2="${cx}" y2="${cy+R*0.4}" stroke="${c2}" stroke-width="0.8" opacity="0.5"/>
        <line x1="${cx-R*0.7}" y1="${cy}" x2="${cx-R*0.4*0.7}" y2="${cy}" stroke="${c2}" stroke-width="0.8" opacity="0.5"/>
        <!-- Glow dots at corners -->
        <circle cx="${cx}" cy="${cy-R}" r="3.5" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx+R*0.7}" cy="${cy}" r="3.5" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx}" cy="${cy+R}" r="3.5" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx-R*0.7}" cy="${cy}" r="3.5" fill="${c1}" opacity="0.9"/>
        <!-- Z center -->
        ${zLogo(cx, cy, R*0.26, c1, 1.8)}
        ${scanlines(size)}
      `;
      return svgWrap(size, "#080812", content);
    }
  },

  // ── 4. Orbit #004 ───────────────────────────────────────────────────────
  {
    id:4, name:"Orbit #004", rarity:"EPIC", rarityScore:84,
    description:"Three elliptical orbits — the degen's token portfolio spinning in perpetual motion.",
    traits:[{t:"Shape",v:"Ellipses"},{t:"Style",v:"Orbital"},{t:"Color",v:"Purple/Cyan"},{t:"Paths",v:"3 Orbits"},{t:"Nodes",v:"4 Dots"}],
    render(size) {
      const cx = size/2, cy = size/2;
      const c1 = "#00FFD1", c2 = "#8458FF", c3 = "#AA44FF";
      let content = `
        <!-- Outer ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${size*0.4}" ry="${size*0.22}" fill="none" stroke="${c2}" stroke-width="1.5" transform="rotate(-20 ${cx} ${cy})"/>
        <!-- Mid ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${size*0.32}" ry="${size*0.18}" fill="none" stroke="${c1}" stroke-width="1.2" opacity="0.7" transform="rotate(15 ${cx} ${cy})"/>
        <!-- Inner ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${size*0.22}" ry="${size*0.12}" fill="none" stroke="${c3}" stroke-width="1" opacity="0.5" transform="rotate(-10 ${cx} ${cy})"/>
        <!-- Arrow on outer orbit -->
        <polygon points="${cx+size*0.38},${cy-size*0.04} ${cx+size*0.3},${cy-size*0.08} ${cx+size*0.3},${cy}" fill="${c2}" opacity="0.9"/>
        <!-- Arrow on inner orbit -->
        <polygon points="${cx-size*0.2},${cy-size*0.06} ${cx-size*0.27},${cy-size*0.02} ${cx-size*0.25},${cy+size*0.08}" fill="${c1}" opacity="0.9"/>
        <!-- Center dot cluster -->
        <circle cx="${cx}" cy="${cy}" r="${size*0.08}" fill="none" stroke="${c1}" stroke-width="1.5"/>
        ${zLogo(cx, cy, size*0.075, c1, 1.6)}
        <!-- Orbit nodes -->
        <circle cx="${cx+size*0.39}" cy="${cy}" r="4" fill="${c1}" opacity="0.8"/>
        <circle cx="${cx-size*0.34}" cy="${cy-size*0.1}" r="3" fill="${c2}" opacity="0.8"/>
        <circle cx="${cx+size*0.1}" cy="${cy+size*0.2}" r="3" fill="${c3}" opacity="0.7"/>
        <circle cx="${cx-size*0.15}" cy="${cy+size*0.15}" r="2.5" fill="${c1}" opacity="0.6"/>
        ${scanlines(size)}
      `;
      return svgWrap(size, "#07050F", content);
    }
  },

  // ── 5. Matrix #005 ──────────────────────────────────────────────────────
  {
    id:5, name:"Matrix #005", rarity:"RARE", rarityScore:75,
    description:"Binary grid with a centered Z — the arbitrageur's map of the blockchain state.",
    traits:[{t:"Shape",v:"Grid"},{t:"Style",v:"Matrix"},{t:"Color",v:"Green"},{t:"Code",v:"Binary"},{t:"Effect",v:"Scan"}],
    render(size) {
      const cx = size/2, cy = size/2;
      const c1 = "#00FF41", c2 = "#006622";
      let grid = "";
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const x = 20 + i * (size-40)/8;
          const y = 20 + j * (size-40)/8;
          const v = Math.sin(i*0.8+j*0.6) > 0 ? "1" : "0";
          const op = 0.1 + Math.abs(Math.sin(i*j)) * 0.4;
          grid += `<text x="${x}" y="${y}" font-family="monospace" font-size="9" fill="${c1}" opacity="${op.toFixed(2)}">${v}</text>`;
        }
      }
      let content = `
        ${grid}
        <!-- Outer box -->
        <rect x="${cx-size*0.28}" y="${cy-size*0.28}" width="${size*0.56}" height="${size*0.56}" fill="rgba(0,255,65,0.04)" stroke="${c1}" stroke-width="1.5"/>
        <!-- Inner box -->
        <rect x="${cx-size*0.18}" y="${cy-size*0.18}" width="${size*0.36}" height="${size*0.36}" fill="rgba(0,255,65,0.06)" stroke="${c1}" stroke-width="1" opacity="0.6"/>
        <!-- Arrow -->
        <polygon points="${cx+size*0.3},${cy} ${cx+size*0.2},${cy-8} ${cx+size*0.2},${cy+8}" fill="${c1}" opacity="0.8"/>
        <!-- Z center -->
        ${zLogo(cx, cy, size*0.1, c1, 2)}
        <!-- Scan line -->
        <line x1="${cx-size*0.28}" y1="${cy+size*0.1}" x2="${cx+size*0.28}" y2="${cy+size*0.1}" stroke="${c1}" stroke-width="1.5" opacity="0.4" stroke-dasharray="4 3"/>
        ${scanlines(size)}
      `;
      return svgWrap(size, "#030A04", content);
    }
  },

  // ── 6. Crown #006 ───────────────────────────────────────────────────────
  {
    id:6, name:"Crown #006", rarity:"RARE", rarityScore:72,
    description:"Triple-point crown of the LP Queen. Three peaks represent three pools, eternally profitable.",
    traits:[{t:"Shape",v:"Crown"},{t:"Style",v:"Royal"},{t:"Color",v:"Gold/Pink"},{t:"Peaks",v:"3 Spires"},{t:"Effect",v:"Shimmer"}],
    render(size) {
      const cx = size/2, cy = size/2;
      const c1 = "#FFD700", c2 = "#FF69B4", c3 = "#FFAA00";
      let content = `
        <!-- Crown base -->
        <path d="M${cx-size*0.32},${cy+size*0.18} L${cx-size*0.32},${cy-size*0.05} L${cx-size*0.2},${cy-size*0.22} L${cx},${cy-size*0.08} L${cx+size*0.2},${cy-size*0.22} L${cx+size*0.32},${cy-size*0.05} L${cx+size*0.32},${cy+size*0.18} Z"
          fill="none" stroke="${c1}" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Crown fill subtle -->
        <path d="M${cx-size*0.32},${cy+size*0.18} L${cx-size*0.32},${cy-size*0.05} L${cx-size*0.2},${cy-size*0.22} L${cx},${cy-size*0.08} L${cx+size*0.2},${cy-size*0.22} L${cx+size*0.32},${cy-size*0.05} L${cx+size*0.32},${cy+size*0.18} Z"
          fill="rgba(255,215,0,0.05)"/>
        <!-- Inner crown smaller -->
        <path d="M${cx-size*0.22},${cy+size*0.12} L${cx-size*0.22},${cy} L${cx-size*0.13},${cy-size*0.14} L${cx},${cy-size*0.04} L${cx+size*0.13},${cy-size*0.14} L${cx+size*0.22},${cy} L${cx+size*0.22},${cy+size*0.12} Z"
          fill="none" stroke="${c2}" stroke-width="1.2" stroke-linejoin="round" opacity="0.6"/>
        <!-- Gem dots -->
        <circle cx="${cx-size*0.2}" cy="${cy-size*0.22}" r="5" fill="${c2}" opacity="0.9"/>
        <circle cx="${cx}" cy="${cy-size*0.22+size*0.14}" r="5" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx+size*0.2}" cy="${cy-size*0.22}" r="5" fill="${c2}" opacity="0.9"/>
        <!-- Z center -->
        ${zLogo(cx, cy+size*0.05, size*0.1, c1, 2)}
        ${scanlines(size)}
      `;
      return svgWrap(size, "#0C0808", content);
    }
  },

  // ── 7. Scar #007 ────────────────────────────────────────────────────────
  {
    id:7, name:"Scar #007", rarity:"RARE", rarityScore:69,
    description:"Fractured hexagon — the battle geometry of the Rekt Survivor. Each crack tells a rug pull story.",
    traits:[{t:"Shape",v:"Hexagon"},{t:"Style",v:"Fractured"},{t:"Color",v:"Orange/Red"},{t:"Cracks",v:"3 Fractures"},{t:"Effect",v:"Battle"}],
    render(size) {
      const cx = size/2, cy = size/2, R = size*0.36;
      const c1 = "#FF6600", c2 = "#FF3300", c3 = "#FFAA00";
      const hex = (r) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI/3)*i - Math.PI/6;
          pts.push(`${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`);
        }
        return pts.join(" ");
      };
      let content = `
        <!-- Outer hex -->
        <polygon points="${hex(R)}" fill="none" stroke="${c1}" stroke-width="2"/>
        <!-- Inner hex -->
        <polygon points="${hex(R*0.6)}" fill="none" stroke="${c3}" stroke-width="1.2" opacity="0.6"/>
        <!-- Fracture lines -->
        <line x1="${cx}" y1="${cy-R}" x2="${cx+R*0.3}" y2="${cy+R*0.2}" stroke="${c2}" stroke-width="1.8" opacity="0.7"/>
        <line x1="${cx-R*0.5}" y1="${cy+R*0.5}" x2="${cx+R*0.4}" y2="${cy-R*0.1}" stroke="${c2}" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+R*0.5}" y1="${cy+R*0.5}" x2="${cx-R*0.2}" y2="${cy+R*0.1}" stroke="${c2}" stroke-width="1.2" opacity="0.4"/>
        <!-- Corner dots -->
        <circle cx="${cx}" cy="${cy-R}" r="4" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx+R*0.87}" cy="${cy+R*0.5}" r="3" fill="${c3}" opacity="0.7"/>
        <circle cx="${cx-R*0.87}" cy="${cy+R*0.5}" r="3" fill="${c3}" opacity="0.7"/>
        <!-- Z center -->
        ${zLogo(cx, cy, size*0.1, c1, 2)}
        ${scanlines(size)}
      `;
      return svgWrap(size, "#0C0500", content);
    }
  },

  // ── 8. Radar #008 ───────────────────────────────────────────────────────
  {
    id:8, name:"Radar #008", rarity:"UNCOMMON", rarityScore:56,
    description:"Scanning the chain. The Node Runner's radar sweeps for new blocks, broadcasting from the edge.",
    traits:[{t:"Shape",v:"Radar"},{t:"Style",v:"Scan"},{t:"Color",v:"Cyan/Blue"},{t:"Rings",v:"4 Rings"},{t:"Sweep",v:"Active"}],
    render(size) {
      const cx = size/2, cy = size/2, R = size*0.38;
      const c1 = "#00FFD1", c2 = "#0088FF", c3 = "#004488";
      let rings = "";
      for (let i = 1; i <= 4; i++) {
        rings += `<circle cx="${cx}" cy="${cy}" r="${R*i/4}" fill="none" stroke="${i===4?c1:c2}" stroke-width="${i===4?1.5:0.8}" opacity="${0.2+i*0.15}"/>`;
      }
      let content = `
        ${rings}
        <!-- Cross hairs -->
        <line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="${c2}" stroke-width="0.8" opacity="0.3"/>
        <line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="${c2}" stroke-width="0.8" opacity="0.3"/>
        <line x1="${cx-R*0.7}" y1="${cy-R*0.7}" x2="${cx+R*0.7}" y2="${cy+R*0.7}" stroke="${c2}" stroke-width="0.5" opacity="0.2"/>
        <line x1="${cx+R*0.7}" y1="${cy-R*0.7}" x2="${cx-R*0.7}" y2="${cy+R*0.7}" stroke="${c2}" stroke-width="0.5" opacity="0.2"/>
        <!-- Sweep triangle -->
        <path d="M${cx},${cy} L${cx+R*0.92},${cy-R*0.4}" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>
        <path d="M${cx},${cy} L${cx+R*0.85},${cy+R*0.1}" stroke="${c1}" stroke-width="0.5" opacity="0.2"/>
        <!-- Blip dots -->
        <circle cx="${cx+R*0.55}" cy="${cy-R*0.3}" r="4" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx-R*0.4}" cy="${cy+R*0.5}" r="3" fill="${c1}" opacity="0.6"/>
        <circle cx="${cx+R*0.2}" cy="${cy+R*0.7}" r="2.5" fill="${c1}" opacity="0.4"/>
        <!-- Z -->
        ${zLogo(cx, cy, size*0.09, c1, 1.8)}
        ${scanlines(size)}
      `;
      return svgWrap(size, "#040810", content);
    }
  },

  // ── 9. Helix #009 ───────────────────────────────────────────────────────
  {
    id:9, name:"Helix #009", rarity:"UNCOMMON", rarityScore:53,
    description:"Twisted fee formula. The Gas Mizer's optimization loop spiraling toward zero.",
    traits:[{t:"Shape",v:"Helix"},{t:"Style",v:"Spiral"},{t:"Color",v:"Purple/Green"},{t:"Loops",v:"3 Coils"},{t:"Effect",v:"Twist"}],
    render(size) {
      const cx = size/2, cy = size/2;
      const c1 = "#AA44FF", c2 = "#00FF88", c3 = "#7722BB";
      let helix1 = "M";
      let helix2 = "M";
      for (let i = 0; i <= 80; i++) {
        const t = (i/80) * Math.PI * 3;
        const x = cx + Math.cos(t) * (size*0.36 - t*size*0.02);
        const y = cy + Math.sin(t) * (size*0.2  - t*size*0.01);
        const x2 = cx + Math.cos(t+Math.PI) * (size*0.34 - t*size*0.02);
        const y2 = cy + Math.sin(t+Math.PI) * (size*0.18 - t*size*0.01);
        helix1 += (i===0?"":",")+x.toFixed(1)+","+y.toFixed(1);
        helix2 += (i===0?"":",")+x2.toFixed(1)+","+y2.toFixed(1);
      }
      let content = `
        <polyline points="${helix1}" fill="none" stroke="${c1}" stroke-width="1.8" opacity="0.8"/>
        <polyline points="${helix2}" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.6"/>
        <!-- Center circle -->
        <circle cx="${cx}" cy="${cy}" r="${size*0.1}" fill="none" stroke="${c1}" stroke-width="1.5"/>
        ${zLogo(cx, cy, size*0.09, c1, 1.8)}
        <!-- Endpoint dots -->
        <circle cx="${cx+size*0.34}" cy="${cy}" r="4" fill="${c1}" opacity="0.9"/>
        <circle cx="${cx-size*0.32}" cy="${cy}" r="4" fill="${c2}" opacity="0.9"/>
        ${scanlines(size)}
      `;
      return svgWrap(size, "#0A0416", content);
    }
  },

  // ── 10. Block #000 ──────────────────────────────────────────────────────
  {
    id:10, name:"Block #000", rarity:"COMMON", rarityScore:42,
    description:"The genesis block. Pure, minimal, foundational. Everything SwapZone was built upon.",
    traits:[{t:"Shape",v:"Square"},{t:"Style",v:"Minimal"},{t:"Color",v:"Gray/Cyan"},{t:"Nesting",v:"4 Levels"},{t:"Effect",v:"None"}],
    render(size) {
      const cx = size/2, cy = size/2;
      const c1 = "#00FFD1", c2 = "#444444", c3 = "#888888";
      let content = `
        <!-- Nested squares -->
        <rect x="${cx-size*0.38}" y="${cy-size*0.38}" width="${size*0.76}" height="${size*0.76}" fill="none" stroke="${c2}" stroke-width="1.5"/>
        <rect x="${cx-size*0.28}" y="${cy-size*0.28}" width="${size*0.56}" height="${size*0.56}" fill="none" stroke="${c3}" stroke-width="1.2" opacity="0.7"/>
        <rect x="${cx-size*0.18}" y="${cy-size*0.18}" width="${size*0.36}" height="${size*0.36}" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>
        <rect x="${cx-size*0.1}" y="${cy-size*0.1}" width="${size*0.2}" height="${size*0.2}" fill="none" stroke="${c1}" stroke-width="1" opacity="0.4"/>
        <!-- Corner accents -->
        <line x1="${cx-size*0.38}" y1="${cy-size*0.38}" x2="${cx-size*0.28}" y2="${cy-size*0.28}" stroke="${c1}" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+size*0.38}" y1="${cy+size*0.38}" x2="${cx+size*0.28}" y2="${cy+size*0.28}" stroke="${c1}" stroke-width="1.5" opacity="0.5"/>
        <!-- Z center -->
        ${zLogo(cx, cy, size*0.1, c1, 1.8)}
        ${scanlines(size)}
      `;
      return svgWrap(size, "#080808", content);
    }
  },
];
