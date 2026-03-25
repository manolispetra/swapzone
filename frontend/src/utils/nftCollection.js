export const COLLECTION_NAME   = "SwapZone Genesis";
export const COLLECTION_SYMBOL = "SZGEN";
export const COLLECTION_DESC   = "10 legendary pixel warriors born from the Monad blockchain. Each one is unique, with distinct traits, rarity, and a story. Earn them through the SwapZone Referral Program — or wait for the public mint.";
export const TOTAL_SUPPLY      = 10;

export const RARITY_TIERS = {
  LEGENDARY: { label:"Legendary ✦", color:"#FFD700", glow:"0 0 30px #FFD70066, 0 0 60px #FFD70022", bg:"linear-gradient(160deg,#1A1200 0%,#0A0800 100%)" },
  EPIC:      { label:"Epic ◈",      color:"#8458FF", glow:"0 0 24px #8458FF55, 0 0 48px #8458FF22", bg:"linear-gradient(160deg,#120A22 0%,#0A0514 100%)" },
  RARE:      { label:"Rare ◆",      color:"#00FFD1", glow:"0 0 18px #00FFD144",                     bg:"linear-gradient(160deg,#001A14 0%,#040D0A 100%)" },
  UNCOMMON:  { label:"Uncommon",    color:"#4FC3F7", glow:"none",                                    bg:"linear-gradient(160deg,#081520 0%,#050A10 100%)" },
  COMMON:    { label:"Common",      color:"#888888", glow:"none",                                    bg:"linear-gradient(160deg,#111111 0%,#080808 100%)" },
};

// 22x22 pixel grid — CryptoPunks inspired faces
// Each row = string, each char = palette index (0=bg, 1-9=colors)
// Palette per NFT: [bg, skin, hair, eyes, accessory, clothes, accent, detail, shadow, highlight]

export const NFT_COLLECTION = [
  {
    id:1, name:"Golden Validator", rarity:"LEGENDARY", rarityScore:99,
    description:"The rarest of all 10. This validator has never missed a block since genesis. The golden crown is forged from consensus proofs. Only 1 exists.",
    traits:[{t:"Background",v:"Deep Space"},{t:"Skin",v:"Gold Plated"},{t:"Crown",v:"Consensus Crown"},{t:"Eyes",v:"Binary White"},{t:"Mouth",v:"Smirk"},{t:"Aura",v:"Validator Glow"}],
    palette:["#050505","#D4A017","#FFD700","#FFFFFF","#FF6B35","#836EF9","#FFF4A0","#B8860B","#8B6914","#FFFDE0"],
    art:[
      "0000002222222220000000",
      "0000022222222222000000",
      "0000233333333322000000",
      "0002233233323322200000",
      "0022232332233232200000",
      "0022222222222222200000",
      "0022271127112722200000",
      "0022277777777722200000",
      "0022277777777722200000",
      "0022271127112722200000",
      "0022222444222222200000",
      "0022222444222222200000",
      "0002222254422222000000",
      "0002222225522222000000",
      "0000222222222220000000",
      "0000555555555550000000",
      "0005555666566555000000",
      "0005556666666555000000",
      "0005556666666555000000",
      "0000555555555550000000",
    ],
  },
  {
    id:2, name:"Phantom Liquidity", rarity:"LEGENDARY", rarityScore:96,
    description:"Born from a million swaps. Materializes from deep liquidity pools at night. Half visible, half shadow. The most mysterious of the Genesis 10.",
    traits:[{t:"Background",v:"Void Teal"},{t:"Skin",v:"Phantom Blue"},{t:"Hood",v:"Shadow Hood"},{t:"Eyes",v:"Glowing Cyan"},{t:"Mouth",v:"Ethereal"},{t:"Effect",v:"Shimmer"}],
    palette:["#020C0C","#00B4A0","#00FFD1","#FFFFFF","#004D4D","#0A3030","#80FFF0","#006655","#003322","#E0FFFA"],
    art:[
      "0000004444444440000000",
      "0000044444444444000000",
      "0000411111111140000000",
      "0004411441144114400000",
      "0004411414411414400000",
      "0004411441144114400000",
      "0004411111111114400000",
      "0004413773377114400000",
      "0004413777777114400000",
      "0004413773377114400000",
      "0004411111111114400000",
      "0004412222222114400000",
      "0004412222222114400000",
      "0000411111111140000000",
      "0000055555555500000000",
      "0005555666566555000000",
      "0005556666666555000000",
      "0005556666666555000000",
      "0000555555555500000000",
      "0000000555555000000000",
    ],
  },
  {
    id:3, name:"AMM Wizard", rarity:"EPIC", rarityScore:88,
    description:"Master of x·y=k. Wears a pointed hat covered in swap formulas. Staff glows with accumulated fees. Speaks only in basis points.",
    traits:[{t:"Background",v:"Purple Nebula"},{t:"Skin",v:"Pale"},{t:"Hat",v:"Formula Hat"},{t:"Eyes",v:"Purple Glow"},{t:"Beard",v:"Long White"},{t:"Staff",v:"Fee Staff"}],
    palette:["#08040F","#C8A882","#8458FF","#FFFFFF","#FF6B6B","#5A3BAA","#D4B8FF","#6B4CC0","#3A1F7A","#F0E8FF"],
    art:[
      "0000003330333000000000",
      "0000033330333300000000",
      "0000333333333000000000",
      "0001113333311100000000",
      "0001113113311100000000",
      "0001113333311100000000",
      "0000011111110000000000",
      "0000011771170000000000",
      "0000011777770000000000",
      "0000011771170000000000",
      "0000011111110000000000",
      "0000011441110000000000",
      "0000011444110000000000",
      "0000011111110000000000",
      "0007755555557000000000",
      "0077555666555770000000",
      "0075556666665570000000",
      "0075556666665570000000",
      "0007755555557000000000",
      "0000770000077000000000",
    ],
  },
  {
    id:4, name:"Diamond Hands Degen", rarity:"EPIC", rarityScore:84,
    description:"Never sold. Not once. Laser eyes activated since the first Monad block. Wears diamond rings on every finger and a 'GM' tattoo on the neck.",
    traits:[{t:"Background",v:"Red Alert"},{t:"Skin",v:"Tan"},{t:"Hair",v:"Messy Black"},{t:"Eyes",v:"Laser Red"},{t:"Accessory",v:"Diamond Chain"},{t:"Clothes",v:"Degen Hoodie"}],
    palette:["#100505","#B8864E","#1A1A1A","#FF3300","#FFDC00","#222222","#FF6600","#888888","#444444","#FFFFFF"],
    art:[
      "0000002222222000000000",
      "0000222222222200000000",
      "0000211111112000000000",
      "0001111221111100000000",
      "0001122112211100000000",
      "0001111221111100000000",
      "0001111111111100000000",
      "0000113443411000000000",
      "0000113334311000000000",
      "0000113443411000000000",
      "0000111111111000000000",
      "0000111551111000000000",
      "0000111515111000000000",
      "0000011111100000000000",
      "0000555555555000000000",
      "0005556655655500000000",
      "0005556666655500000000",
      "0005558888855500000000",
      "0000555555555000000000",
      "0000055555550000000000",
    ],
  },
  {
    id:5, name:"Speed Arbitrageur", rarity:"RARE", rarityScore:75,
    description:"Faster than block time. Wears a racing helmet and sees price discrepancies in slow motion. Has never paid more than 1 gwei.",
    traits:[{t:"Background",v:"Neon Green"},{t:"Skin",v:"Dark"},{t:"Helmet",v:"Racing Helmet"},{t:"Visor",v:"HUD Visor"},{t:"Clothes",v:"Speed Suit"},{t:"Badge",v:"1000 TPS"}],
    palette:["#020D02","#7B5C42","#00FF41","#00FFCC","#FF4444","#003300","#80FF90","#005500","#002200","#CCFFCC"],
    art:[
      "0000033333333000000000",
      "0003333333333300000000",
      "0031113333311300000000",
      "0311111331111300000000",
      "0311113331113300000000",
      "0311114444113300000000",
      "0031114444113000000000",
      "0031111441111000000000",
      "0031111111111000000000",
      "0000311111130000000000",
      "0000311511130000000000",
      "0000311551130000000000",
      "0000001111100000000000",
      "0000555555555000000000",
      "0005556755657500000000",
      "0005556666655500000000",
      "0005556666655500000000",
      "0005558888855500000000",
      "0000555555555000000000",
      "0000005550000000000000",
    ],
  },
  {
    id:6, name:"LP Queen", rarity:"RARE", rarityScore:72,
    description:"Rules the liquidity pools with an iron fist. Has provided liquidity to 47 pools. Wears a crown made of LP tokens and has never experienced impermanent loss.",
    traits:[{t:"Background",v:"Royal Blue"},{t:"Skin",v:"Light"},{t:"Crown",v:"LP Crown"},{t:"Eyes",v:"Royal Blue"},{t:"Earrings",v:"Token Drops"},{t:"Clothes",v:"Queen Dress"}],
    palette:["#020510","#E8C9A0","#0066FF","#88CCFF","#FF69B4","#003399","#AADDFF","#FFD700","#001166","#FFFFFF"],
    art:[
      "0000007070707000000000",
      "0000070707070700000000",
      "0000733333337000000000",
      "0007311111137700000000",
      "0073111331113700000000",
      "0071111331111700000000",
      "0071114444117000000000",
      "0071114774117000000000",
      "0071114447117000000000",
      "0071114444117000000000",
      "0071111551117000000000",
      "0007111551117000000000",
      "0000711111700000000000",
      "0000071117000000000000",
      "0005555555555000000000",
      "0055556665655500000000",
      "0055556666655500000000",
      "0055558888555500000000",
      "0005555555555000000000",
      "0000055555550000000000",
    ],
  },
  {
    id:7, name:"Rekt Survivor", rarity:"RARE", rarityScore:69,
    description:"Survived 3 rug pulls, 2 market crashes, and one time when gas was 10,000 gwei. Still here. Still building. Bandaged but unbroken.",
    traits:[{t:"Background",v:"Blood Orange"},{t:"Skin",v:"Scarred"},{t:"Bandage",v:"Eye Patch"},{t:"Eyes",v:"Survivor Orange"},{t:"Scar",v:"Battle Scar"},{t:"Clothes",v:"Rekt Jacket"}],
    palette:["#120500","#C8906A","#FF6600","#FF9900","#FF3300","#2A1000","#FFAA55","#8B4513","#4A2000","#FFFFFF"],
    art:[
      "0000002222222000000000",
      "0000222222222200000000",
      "0000211111112000000000",
      "0001111221111100000000",
      "0001122882211100000000",
      "0001188882211100000000",
      "0001111221111100000000",
      "0000113333411000000000",
      "0000113433311000000000",
      "0000111333111000000000",
      "0000011111100000000000",
      "0000011551110000000000",
      "0000011515100000000000",
      "0000001111000000000000",
      "0000555555555000000000",
      "0005557665765500000000",
      "0005556666655500000000",
      "0005559999555500000000",
      "0000555555555000000000",
      "0000055555550000000000",
    ],
  },
  {
    id:8, name:"Node Runner", rarity:"UNCOMMON", rarityScore:56,
    description:"Runs nodes on three different chains simultaneously. Has a server rack tattoo and names their pets after consensus mechanisms. Online 24/7.",
    traits:[{t:"Background",v:"Server Gray"},{t:"Skin",v:"Pale"},{t:"Hair",v:"Short Dark"},{t:"Eyes",v:"Focused Gray"},{t:"Headset",v:"Node Headset"},{t:"Clothes",v:"Tech Shirt"}],
    palette:["#080808","#C8A882","#333333","#AAAAAA","#00FF41","#1A1A1A","#888888","#555555","#222222","#FFFFFF"],
    art:[
      "0000002222222000000000",
      "0000222222222200000000",
      "0000333333333000000000",
      "0003311111133300000000",
      "0003111111113000000000",
      "0003111771113000000000",
      "0000317777130000000000",
      "0000317777130000000000",
      "0000317777130000000000",
      "0000311111130000000000",
      "0000311551130000000000",
      "0000311515130000000000",
      "0000001111000000000000",
      "0004455555544000000000",
      "0045556666554000000000",
      "0045556666554000000000",
      "0045558888554000000000",
      "0004455555544000000000",
      "0000445555440000000000",
      "0000004554000000000000",
    ],
  },
  {
    id:9, name:"Gas Minimizer", rarity:"UNCOMMON", rarityScore:53,
    description:"Legendary for optimizing contracts to use exactly 21000 gas. Carries a calculator. Has strong opinions about EIP-1559. Wears a 'GWEI' hoodie.",
    traits:[{t:"Background",v:"Matrix Green"},{t:"Skin",v:"Olive"},{t:"Hair",v:"Green Dyed"},{t:"Eyes",v:"Analytical"},{t:"Glasses",v:"Data Specs"},{t:"Clothes",v:"GWEI Hoodie"}],
    palette:["#020802","#9B8060","#00AA22","#AAFFAA","#FFDC00","#003300","#66BB6A","#005500","#001100","#CCFFCC"],
    art:[
      "0000003333333000000000",
      "0000333333333300000000",
      "0000311111113000000000",
      "0003111221113300000000",
      "0003111221113300000000",
      "0003115555113300000000",
      "0000315454130000000000",
      "0000314545130000000000",
      "0000315454130000000000",
      "0000311111130000000000",
      "0000311441130000000000",
      "0000311414130000000000",
      "0000001111100000000000",
      "0000666666666000000000",
      "0006667776776600000000",
      "0006667777776600000000",
      "0006669999776600000000",
      "0000666666666000000000",
      "0000066666660000000000",
      "0000006666000000000000",
    ],
  },
  {
    id:10, name:"Genesis Block", rarity:"COMMON", rarityScore:42,
    description:"The first. Block #0. Simple, foundational, indestructible. Everything that SwapZone is built upon. Sometimes the most common things are the most important.",
    traits:[{t:"Background",v:"Pure Black"},{t:"Skin",v:"Stone Gray"},{t:"Eyes",v:"Default"},{t:"Expression",v:"Stoic"},{t:"Clothes",v:"Plain Tee"},{t:"Accessory",v:"None"}],
    palette:["#060606","#999999","#555555","#DDDDDD","#00FF41","#222222","#AAAAAA","#333333","#111111","#EEEEEE"],
    art:[
      "0000002222222000000000",
      "0000222222222200000000",
      "0000211111112000000000",
      "0001111221111100000000",
      "0001111221111100000000",
      "0001111221111100000000",
      "0001113443411100000000",
      "0001113333311100000000",
      "0001113443411100000000",
      "0001111111111100000000",
      "0001111441111100000000",
      "0001111414111100000000",
      "0000111111111000000000",
      "0000555555555000000000",
      "0005556665655500000000",
      "0005556666655500000000",
      "0005558888855500000000",
      "0000555555555000000000",
      "0000055555550000000000",
      "0000005555000000000000",
    ],
  },
];

export function renderPixelSVG(nft, size = 200) {
  const grid  = nft.art;
  const cols  = grid[0].length;
  const rows  = grid.length;
  const cellW = size / cols;
  const cellH = size / rows;
  const bg    = nft.palette[0];

  let rects = "";
  grid.forEach((row, y) => {
    row.split("").forEach((v, x) => {
      if (v === "0") return;
      const idx = parseInt(v, 10) - 1;
      const col = nft.palette[idx] || "#888";
      rects += `<rect x="${(x*cellW).toFixed(2)}" y="${(y*cellH).toFixed(2)}" width="${(cellW+0.5).toFixed(2)}" height="${(cellH+0.5).toFixed(2)}" fill="${col}"/>`;
    });
  });

  // Add scanline overlay for authenticity
  let scanlines = "";
  for (let i = 0; i < rows; i++) {
    if (i % 2 === 0) {
      scanlines += `<rect x="0" y="${(i*cellH).toFixed(2)}" width="${size}" height="${(cellH*0.4).toFixed(2)}" fill="rgba(0,0,0,0.08)"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  ${rects}
  ${scanlines}
</svg>`;
}
