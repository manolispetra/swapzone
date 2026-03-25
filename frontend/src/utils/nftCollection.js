export const COLLECTION_NAME   = "SwapZone Genesis";
export const COLLECTION_SYMBOL = "SZGEN";
export const COLLECTION_DESC   = "10 unique CryptoPunks-style pixel characters born on Monad. Each one represents a DeFi archetype. Earn them through the SwapZone Referral Program.";
export const TOTAL_SUPPLY      = 10;

export const RARITY_TIERS = {
  LEGENDARY: { label:"Legendary", color:"#FFD700", glow:"0 0 24px #FFD70055", bg:"#1A1400" },
  EPIC:      { label:"Epic",      color:"#8458FF", glow:"0 0 20px #8458FF44", bg:"#110A1F" },
  RARE:      { label:"Rare",      color:"#00FFD1", glow:"0 0 16px #00FFD133", bg:"#001A16" },
  UNCOMMON:  { label:"Uncommon",  color:"#4FC3F7", glow:"none",               bg:"#0A1520" },
  COMMON:    { label:"Common",    color:"#888888", glow:"none",               bg:"#111111" },
};

// 24x24 pixel art — each row is a string of hex chars: 0=transparent, else palette index
// Palette: [bg, skin, hair/hat, eyes, mouth, clothes, accent]
// We use a compact format: each character = 1 pixel, value 0-6

const P = (rows) => rows; // identity, just for readability

export const NFT_COLLECTION = [
  {
    id:1, name:"The Golden Validator", rarity:"LEGENDARY", rarityScore:98,
    description:"The rarest of all. Crowned in consensus gold, this validator has never missed a block. Carries the full weight of Monad's finality.",
    traits:[{t:"Background",v:"Cosmic Void"},{t:"Skin",v:"Golden"},{t:"Crown",v:"Consensus Crown"},{t:"Eyes",v:"Binary White"},{t:"Clothes",v:"Validator Plate"},{t:"Aura",v:"Golden Glow"}],
    palette:["#0A0A0A","#FFD700","#FF8C00","#FFFFFF","#FF4444","#836EF9","#FFF3A0"],
    art:P([
      "0000000111111000000000",
      "0000001111111100000000",
      "0000011112211110000000",
      "0000011122221110000000",
      "0000001111111100000000",
      "0000001133331100000000",
      "0000001143341100000000",
      "0000001133331100000000",
      "0000001111111100000000",
      "0000011155511110000000",
      "0000111155511111000000",
      "0001111155511111100000",
      "0001115555555111100000",
      "0001115555555111100000",
      "0000011155511110000000",
      "0000001111111100000000",
    ]),
  },
  {
    id:2, name:"The Phantom LP", rarity:"LEGENDARY", rarityScore:95,
    description:"Half teal, half shadow. Materializes from liquidity pools. Those who provide enough liquidity claim they have seen its full form.",
    traits:[{t:"Background",v:"Deep Teal"},{t:"Skin",v:"Phantom"},{t:"Hood",v:"Shadow Hood"},{t:"Eyes",v:"Neon Cyan"},{t:"Clothes",v:"Ghost Cloak"},{t:"Aura",v:"Teal Shimmer"}],
    palette:["#041A1A","#00FFD1","#004D4D","#FFFFFF","#00FF9F","#0A3A3A","#80FFF0"],
    art:P([
      "0000002222222200000000",
      "0000022211112220000000",
      "0000221111111220000000",
      "0000221144411220000000",
      "0000221141411220000000",
      "0000221111111220000000",
      "0000022155512200000000",
      "0000002211122000000000",
      "0000011111111100000000",
      "0001111155511110000000",
      "0011155555555111000000",
      "0011155555555111000000",
      "0001111555511110000000",
      "0000001155511000000000",
      "0000001111111000000000",
      "0000000111110000000000",
    ]),
  },
  {
    id:3, name:"The AMM Wizard", rarity:"EPIC", rarityScore:87,
    description:"x·y=k is not a formula to this one — it's a spell. Conjures swap routes from thin air and balances reserves with a wave of their staff.",
    traits:[{t:"Background",v:"Purple Void"},{t:"Skin",v:"Pale"},{t:"Hat",v:"Wizard Hat"},{t:"Eyes",v:"Purple Glow"},{t:"Clothes",v:"Equation Robe"},{t:"Staff",v:"Formula Staff"}],
    palette:["#0A0514","#C9A87C","#8458FF","#FFFFFF","#FF6B6B","#5A3BAA","#E0C8FF"],
    art:P([
      "0000002222222000000000",
      "0000222222222200000000",
      "0002222222222220000000",
      "0001113333311110000000",
      "0001133113311110000000",
      "0001113333311110000000",
      "0000011144411000000000",
      "0000011111111000000000",
      "0000055555555000000000",
      "0001155555555110000000",
      "0011155555555111000000",
      "0011155555555111000000",
      "0001111555511110000000",
      "0000001115111000000000",
      "0000001111111000000000",
      "0000006111116000000000",
    ]),
  },
  {
    id:4, name:"The Fee Collector", rarity:"EPIC", rarityScore:82,
    description:"Appears silently after every swap. Top hat, briefcase, dollar-sign eyes. Nobody knows where the fees go — only that they arrive.",
    traits:[{t:"Background",v:"Gold Dust"},{t:"Skin",v:"Pale"},{t:"Hat",v:"Top Hat"},{t:"Eyes",v:"Gold Dollar"},{t:"Clothes",v:"Treasury Suit"},{t:"Item",v:"Fee Vault"}],
    palette:["#0A0800","#C9A87C","#111111","#FFDC00","#FF6B6B","#1A1A1A","#FFEE88"],
    art:P([
      "0000002222222000000000",
      "0000222222222200000000",
      "0000233333332000000000",
      "0001133333331100000000",
      "0001113333311100000000",
      "0001113114311100000000",
      "0000011141110000000000",
      "0000011111110000000000",
      "0000055555550000000000",
      "0001555555555100000000",
      "0015555555555510000000",
      "0015556666655510000000",
      "0001555666655100000000",
      "0000155555551000000000",
      "0000015555510000000000",
      "0000006666600000000000",
    ]),
  },
  {
    id:5, name:"The Arbitrageur", rarity:"RARE", rarityScore:74,
    description:"Faster than the block. Spots price gaps across pools and closes them in a single transaction. Wears turbo boots.",
    traits:[{t:"Background",v:"Matrix Green"},{t:"Skin",v:"Tanned"},{t:"Hair",v:"Green Mohawk"},{t:"Eyes",v:"Visor"},{t:"Clothes",v:"Speed Suit"},{t:"Shoes",v:"Turbo Boots"}],
    palette:["#001A00","#B8864E","#00FF41","#00FFCC","#FF4444","#003300","#80FF90"],
    art:P([
      "0000003330333000000000",
      "0000033330333000000000",
      "0000133333333100000000",
      "0000113333331100000000",
      "0000113144311100000000",
      "0000113414311100000000",
      "0000111444111000000000",
      "0000011111110000000000",
      "0000555555555000000000",
      "0005555555555500000000",
      "0005556555655500000000",
      "0005556565655500000000",
      "0000555555555000000000",
      "0000055505550000000000",
      "0000055505550000000000",
      "0000066606660000000000",
    ]),
  },
  {
    id:6, name:"The LP Provider", rarity:"RARE", rarityScore:71,
    description:"Patient, methodical. Deposits tokens into pools before sunrise. Earns fees while others sleep. Holds two coins at all times.",
    traits:[{t:"Background",v:"Ocean Blue"},{t:"Skin",v:"Dark"},{t:"Hair",v:"Blue Waves"},{t:"Eyes",v:"Calm Blue"},{t:"Clothes",v:"LP Vest"},{t:"Item",v:"Dual Coins"}],
    palette:["#001022","#7B5C42","#0066FF","#88CCFF","#FF6B6B","#003366","#AADDFF"],
    art:P([
      "0000003333333000000000",
      "0000333111113300000000",
      "0000311111111300000000",
      "0000111144411100000000",
      "0000111414411100000000",
      "0000011144110000000000",
      "0000011111110000000000",
      "0000055555550000000000",
      "0000555555555000000000",
      "0005556555655500000000",
      "0005556555655500000000",
      "0005555666655500000000",
      "0000555655655000000000",
      "0000055655650000000000",
      "0000055000550000000000",
      "0000066000660000000000",
    ]),
  },
  {
    id:7, name:"The Token Deployer", rarity:"RARE", rarityScore:68,
    description:"Carries a deploy terminal everywhere. Leaves a trail of new contract addresses. Has deployed more tokens than anyone alive.",
    traits:[{t:"Background",v:"Rust Orange"},{t:"Skin",v:"Pale"},{t:"Hair",v:"Orange Spiky"},{t:"Eyes",v:"Code Green"},{t:"Clothes",v:"Dev Jacket"},{t:"Item",v:"Terminal"}],
    palette:["#1A0800","#C9A87C","#FF6600","#00FF41","#FF4444","#330F00","#FFAA55"],
    art:P([
      "0000033303330000000000",
      "0000333303333000000000",
      "0000113333311000000000",
      "0000113113311000000000",
      "0000114414411000000000",
      "0000114444411000000000",
      "0000011411110000000000",
      "0000011111110000000000",
      "0000555555555000000000",
      "0005555666555500000000",
      "0005556666655500000000",
      "0005556666655500000000",
      "0005555665555500000000",
      "0000555555555000000000",
      "0000555000555000000000",
      "0000666000666000000000",
    ]),
  },
  {
    id:8, name:"The Chain Watcher", rarity:"UNCOMMON", rarityScore:55,
    description:"Always watching. Monitors every block. Has a telescope for an eye and never sleeps. Reports anomalies before they happen.",
    traits:[{t:"Background",v:"Dark Gray"},{t:"Skin",v:"Pale"},{t:"Hat",v:"Scout Cap"},{t:"Eyes",v:"Telescope"},{t:"Clothes",v:"Watcher Coat"},{t:"Badge",v:"Chain Scout"}],
    palette:["#0A0A0A","#C9A87C","#333333","#4FC3F7","#FF6B6B","#1A1A1A","#88DDFF"],
    art:P([
      "0000002222222000000000",
      "0000222222222200000000",
      "0000211111112000000000",
      "0000111111111000000000",
      "0000111441411000000000",
      "0000111414111000000000",
      "0000011111110000000000",
      "0000011551110000000000",
      "0000555555555000000000",
      "0005555555555500000000",
      "0005556655655500000000",
      "0005556655655500000000",
      "0005555555555500000000",
      "0000555555555000000000",
      "0000555000555000000000",
      "0000666000666000000000",
    ]),
  },
  {
    id:9, name:"The Gas Saver", rarity:"UNCOMMON", rarityScore:52,
    description:"Obsessed with efficiency. Every transaction is optimized to the last gwei. Wears a calculator as a necklace and has a spreadsheet for a brain.",
    traits:[{t:"Background",v:"Pale Green"},{t:"Skin",v:"Pale"},{t:"Hair",v:"Brown"},{t:"Eyes",v:"Analytical"},{t:"Clothes",v:"Efficiency Gear"},{t:"Necklace",v:"Calculator"}],
    palette:["#041A06","#C9A87C","#7B5C42","#AAFFAA","#FF6B6B","#0D3310","#66BB6A"],
    art:P([
      "0000003333333000000000",
      "0000031111113000000000",
      "0000111111111000000000",
      "0000111441411000000000",
      "0000111414111000000000",
      "0000011444110000000000",
      "0000011111110000000000",
      "0000011661110000000000",
      "0000555555555000000000",
      "0005556555655500000000",
      "0005556666655500000000",
      "0005556666655500000000",
      "0005555555555500000000",
      "0000555555555000000000",
      "0000055000550000000000",
      "0000066000660000000000",
    ]),
  },
  {
    id:10, name:"The Genesis Node", rarity:"COMMON", rarityScore:40,
    description:"The first node. Simple, reliable, always online. The foundation of SwapZone. Not flashy — but without it, nothing else exists.",
    traits:[{t:"Background",v:"Pure Black"},{t:"Skin",v:"Gray"},{t:"Hair",v:"None"},{t:"Eyes",v:"Default"},{t:"Clothes",v:"Node Body"},{t:"Light",v:"Blinking Green"}],
    palette:["#080808","#888888","#444444","#FFFFFF","#00FF41","#222222","#AAAAAA"],
    art:P([
      "0000002222222000000000",
      "0000222222222200000000",
      "0000211111112000000000",
      "0000111111111000000000",
      "0000111331311000000000",
      "0000111313311000000000",
      "0000011111110000000000",
      "0000011451110000000000",
      "0000555555555000000000",
      "0005555555555500000000",
      "0005556555655500000000",
      "0005556555655500000000",
      "0005555555555500000000",
      "0000555555555000000000",
      "0000555000555000000000",
      "0000666000666000000000",
    ]),
  },
];

// ── Render pixel art as SVG ────────────────────────────────────────────────────
export function renderPixelSVG(nft, size = 192) {
  const grid  = nft.art;
  const cols  = grid[0].length;
  const rows  = grid.length;
  const cell  = size / cols;
  const bg    = nft.palette[0];

  let rects = "";
  grid.forEach((row, y) => {
    row.split("").forEach((v, x) => {
      if (v !== "0") {
        const idx = parseInt(v, 10) - 1;
        const col = nft.palette[idx] || nft.palette[0];
        rects += `<rect x="${(x*cell).toFixed(1)}" y="${(y*cell).toFixed(1)}" width="${(cell+0.5).toFixed(1)}" height="${(cell+0.5).toFixed(1)}" fill="${col}"/>`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/>${rects}</svg>`;
}
