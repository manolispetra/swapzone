// SwapZone Genesis Collection — 10 Pixel Art NFTs
// Each NFT has unique traits, rarity score, and pixel art SVG

export const COLLECTION_NAME    = "SwapZone Genesis";
export const COLLECTION_SYMBOL  = "SZGEN";
export const COLLECTION_DESC    = "The founding collection of SwapZone DEX. 10 unique pixel art characters, each representing a different facet of DeFi on Monad. Holders gain early access to protocol features and referral rewards.";
export const TOTAL_SUPPLY       = 10;

export const RARITY_TIERS = {
  LEGENDARY: { label: "Legendary", color: "#FFD700", glow: "0 0 20px #FFD70066" },
  EPIC:      { label: "Epic",      color: "#8458FF", glow: "0 0 20px #8458FF66" },
  RARE:      { label: "Rare",      color: "#00FFD1", glow: "0 0 20px #00FFD166" },
  UNCOMMON:  { label: "Uncommon",  color: "#4FC3F7", glow: "0 0 12px #4FC3F744" },
  COMMON:    { label: "Common",    color: "#888888", glow: "none" },
};

export const NFT_COLLECTION = [
  {
    id: 1,
    name: "The Validator",
    rarity: "LEGENDARY",
    rarityScore: 98,
    description: "The backbone of Monad. Wears a golden crown of consensus, carrying the chain forward block by block. Only one exists in its full golden form.",
    traits: [
      { trait: "Background", value: "Cosmic Black" },
      { trait: "Armor",      value: "Gold Validator Plate" },
      { trait: "Eyes",       value: "Binary White" },
      { trait: "Crown",      value: "Consensus Crown" },
      { trait: "Aura",       value: "Golden Glow" },
    ],
    palette: ["#FFD700", "#FFA500", "#111111", "#FFFFFF", "#836EF9"],
    pixel: generatePixel("validator"),
  },
  {
    id: 2,
    name: "The Liquidity Phantom",
    rarity: "LEGENDARY",
    rarityScore: 95,
    description: "Materializes from the depths of liquidity pools. Half visible, half shadow. Those who provide liquidity see its true form.",
    traits: [
      { trait: "Background", value: "Deep Teal" },
      { trait: "Body",       value: "Phantom Translucent" },
      { trait: "Eyes",       value: "Neon Cyan" },
      { trait: "Cape",       value: "Liquidity Flow" },
      { trait: "Aura",       value: "Teal Shimmer" },
    ],
    palette: ["#00FFD1", "#004D4D", "#111111", "#FFFFFF", "#0A2A2A"],
    pixel: generatePixel("phantom"),
  },
  {
    id: 3,
    name: "The AMM Wizard",
    rarity: "EPIC",
    rarityScore: 87,
    description: "Master of the x·y=k formula. Conjures swap routes from thin air, balancing reserves with mathematical precision.",
    traits: [
      { trait: "Background", value: "Purple Void" },
      { trait: "Hat",        value: "Wizard Hat" },
      { trait: "Staff",      value: "Formula Staff" },
      { trait: "Eyes",       value: "Purple Glow" },
      { trait: "Robe",       value: "Equation Robe" },
    ],
    palette: ["#8458FF", "#3A1F7A", "#111111", "#FFFFFF", "#C3A0FF"],
    pixel: generatePixel("wizard"),
  },
  {
    id: 4,
    name: "The Fee Collector",
    rarity: "EPIC",
    rarityScore: 82,
    description: "Silent guardian of protocol revenue. Appears after every swap, taking a small cut and disappearing into the treasury.",
    traits: [
      { trait: "Background", value: "Gold Dust" },
      { trait: "Suit",       value: "Treasury Suit" },
      { trait: "Briefcase",  value: "Fee Vault" },
      { trait: "Eyes",       value: "Dollar Signs" },
      { trait: "Hat",        value: "Top Hat" },
    ],
    palette: ["#FFDC00", "#7A5F00", "#111111", "#FFFFFF", "#FFE97A"],
    pixel: generatePixel("collector"),
  },
  {
    id: 5,
    name: "The Arbitrageur",
    rarity: "RARE",
    rarityScore: 74,
    description: "Moves faster than blocks. Spots price discrepancies across pools and corrects them in a single transaction.",
    traits: [
      { trait: "Background", value: "Matrix Green" },
      { trait: "Outfit",     value: "Speed Suit" },
      { trait: "Shoes",      value: "Turbo Boots" },
      { trait: "Eyes",       value: "Scanning Visor" },
      { trait: "Badge",      value: "Arb Master" },
    ],
    palette: ["#00FF41", "#003300", "#111111", "#FFFFFF", "#00CC33"],
    pixel: generatePixel("arb"),
  },
  {
    id: 6,
    name: "The LP Provider",
    rarity: "RARE",
    rarityScore: 71,
    description: "The patient one. Deposits tokens into pools and watches them grow. Earns fees while others sleep.",
    traits: [
      { trait: "Background", value: "Ocean Blue" },
      { trait: "Vest",       value: "LP Vest" },
      { trait: "Tokens",     value: "Dual Token Hold" },
      { trait: "Eyes",       value: "Calm Blue" },
      { trait: "Badge",      value: "LP Champion" },
    ],
    palette: ["#0077FF", "#002266", "#111111", "#FFFFFF", "#66B2FF"],
    pixel: generatePixel("lp"),
  },
  {
    id: 7,
    name: "The Token Deployer",
    rarity: "RARE",
    rarityScore: 68,
    description: "Creator of tokens. Carries a deployment kit and leaves a trail of new contract addresses in their wake.",
    traits: [
      { trait: "Background", value: "Rust Orange" },
      { trait: "Jacket",     value: "Dev Jacket" },
      { trait: "Laptop",     value: "Deploy Terminal" },
      { trait: "Eyes",       value: "Code Green" },
      { trait: "Badge",      value: "Token Creator" },
    ],
    palette: ["#FF6600", "#662900", "#111111", "#FFFFFF", "#FFB366"],
    pixel: generatePixel("deployer"),
  },
  {
    id: 8,
    name: "The Chain Watcher",
    rarity: "UNCOMMON",
    rarityScore: 55,
    description: "Always watching. Monitors every block for opportunities and threats. Has never missed a transaction.",
    traits: [
      { trait: "Background", value: "Dark Gray" },
      { trait: "Coat",       value: "Watcher Coat" },
      { trait: "Telescope",  value: "Block Explorer" },
      { trait: "Eyes",       value: "Night Vision" },
      { trait: "Badge",      value: "Chain Scout" },
    ],
    palette: ["#4FC3F7", "#1A4A5C", "#111111", "#FFFFFF", "#A0D8EF"],
    pixel: generatePixel("watcher"),
  },
  {
    id: 9,
    name: "The Gas Saver",
    rarity: "UNCOMMON",
    rarityScore: 52,
    description: "Obsessed with efficiency. Optimizes every transaction to use minimum gas. Wears a calculator as a necklace.",
    traits: [
      { trait: "Background", value: "Pale Green" },
      { trait: "Outfit",     value: "Efficiency Gear" },
      { trait: "Calculator", value: "Gas Optimizer" },
      { trait: "Eyes",       value: "Analytical" },
      { trait: "Badge",      value: "Gas Master" },
    ],
    palette: ["#66BB6A", "#1B4D1E", "#111111", "#FFFFFF", "#A5D6A7"],
    pixel: generatePixel("gas"),
  },
  {
    id: 10,
    name: "The Genesis Node",
    rarity: "COMMON",
    rarityScore: 40,
    description: "The first node. Simple, reliable, always online. The foundation upon which all of SwapZone was built.",
    traits: [
      { trait: "Background", value: "Pure Black" },
      { trait: "Body",       value: "Node Body" },
      { trait: "Light",      value: "Blinking Green" },
      { trait: "Eyes",       value: "Default White" },
      { trait: "Badge",      value: "Genesis" },
    ],
    palette: ["#AAAAAA", "#333333", "#111111", "#FFFFFF", "#666666"],
    pixel: generatePixel("node"),
  },
];

// ── Pixel Art SVG Generator ────────────────────────────────────────────────────
function generatePixel(type) {
  const designs = {
    validator: [
      "000111000","011111110","111111111","010101010",
      "011111110","001111100","000111000","001010100","001010100"
    ],
    phantom: [
      "000010000","000111000","001111100","011111110",
      "111111111","011101110","001000100","000101000","001111100"
    ],
    wizard: [
      "000010000","000111000","001111100","011111110",
      "011111110","011111110","001111100","011111110","011111110"
    ],
    collector: [
      "001111100","011111110","111111111","011111110",
      "011111110","001111100","001111100","011111110","011111110"
    ],
    arb: [
      "010000010","011000110","011111110","001111100",
      "001111100","011111110","011000110","010000010","000000000"
    ],
    lp: [
      "000111000","001111100","011111110","111111111",
      "011111110","001111100","011111110","111111111","011111110"
    ],
    deployer: [
      "001111100","011111110","110000011","111111111",
      "111111111","110000011","111111111","011111110","001111100"
    ],
    watcher: [
      "000010000","001111100","011111110","111010111",
      "111111111","011111110","001111100","000111000","000010000"
    ],
    gas: [
      "011111110","111111111","100000001","101111101",
      "101111101","100000001","111111111","011111110","000000000"
    ],
    node: [
      "001111100","011111110","110000011","101111101",
      "101000101","101111101","110000011","011111110","001111100"
    ],
  };

  return designs[type] || designs.node;
}

// Render pixel art as SVG string
export function renderPixelSVG(nft, size = 160) {
  const grid   = nft.pixel;
  const cols   = grid[0].length;
  const rows   = grid.length;
  const cell   = size / cols;
  const bg     = nft.palette[4] || "#111111";
  const colors = [nft.palette[0], nft.palette[1], nft.palette[2], nft.palette[3]];

  let rects = "";
  grid.forEach((row, y) => {
    row.split("").forEach((v, x) => {
      if (v !== "0") {
        const idx = parseInt(v) - 1;
        const col = colors[idx] || colors[0];
        rects += `<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="${col}" />`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="${bg}" />
    ${rects}
  </svg>`;
}
