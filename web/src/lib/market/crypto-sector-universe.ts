import { getCryptoSectorBookMaxTickers } from "@/lib/market/sector-book-cap";

export type CryptoSectorId =
  | "store_value"
  | "layer1"
  | "scaling"
  | "payments"
  | "defi"
  | "ai_data"
  | "gaming"
  | "meme";

export type CryptoAssetMeta = {
  id: string;
  symbol: string;
  shortName: string;
};

export const CRYPTO_SECTOR_ORDER: CryptoSectorId[] = [
  "store_value",
  "layer1",
  "scaling",
  "payments",
  "defi",
  "ai_data",
  "gaming",
  "meme",
];

export const CORE_CRYPTO_ASSETS: readonly CryptoAssetMeta[] = [
  { id: "bitcoin", symbol: "BTC", shortName: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", shortName: "Ethereum" },
  { id: "solana", symbol: "SOL", shortName: "Solana" },
  { id: "ripple", symbol: "XRP", shortName: "XRP" },
  { id: "binancecoin", symbol: "BNB", shortName: "BNB" },
  { id: "cardano", symbol: "ADA", shortName: "Cardano" },
  { id: "chainlink", symbol: "LINK", shortName: "Chainlink" },
  { id: "dogecoin", symbol: "DOGE", shortName: "Dogecoin" },
  { id: "avalanche-2", symbol: "AVAX", shortName: "Avalanche" },
  { id: "tron", symbol: "TRX", shortName: "TRON" },
  { id: "the-open-network", symbol: "TON", shortName: "Toncoin" },
  { id: "sui", symbol: "SUI", shortName: "Sui" },
] as const;

const dedupeAssets = (assets: readonly CryptoAssetMeta[]): CryptoAssetMeta[] => {
  const seen = new Set<string>();
  const out: CryptoAssetMeta[] = [];
  for (const asset of assets) {
    if (seen.has(asset.id)) continue;
    seen.add(asset.id);
    out.push(asset);
  }
  return out;
};

const CRYPTO_SECTOR_MAP: Record<CryptoSectorId, CryptoAssetMeta[]> = {
  store_value: dedupeAssets([
    { id: "bitcoin", symbol: "BTC", shortName: "Bitcoin" },
    { id: "wrapped-bitcoin", symbol: "WBTC", shortName: "Wrapped Bitcoin" },
    { id: "pax-gold", symbol: "PAXG", shortName: "PAX Gold" },
    { id: "tether-gold", symbol: "XAUT", shortName: "Tether Gold" },
    { id: "litecoin", symbol: "LTC", shortName: "Litecoin" },
    { id: "monero", symbol: "XMR", shortName: "Monero" },
    { id: "bitcoin-cash", symbol: "BCH", shortName: "Bitcoin Cash" },
    { id: "zcash", symbol: "ZEC", shortName: "Zcash" },
    { id: "dash", symbol: "DASH", shortName: "Dash" },
    { id: "kaspa", symbol: "KAS", shortName: "Kaspa" },
    { id: "ravencoin", symbol: "RVN", shortName: "Ravencoin" },
    { id: "ecash", symbol: "XEC", shortName: "eCash" },
    { id: "decred", symbol: "DCR", shortName: "Decred" },
    { id: "qtum", symbol: "QTUM", shortName: "Qtum" },
    { id: "digibyte", symbol: "DGB", shortName: "DigiByte" },
    { id: "ergo", symbol: "ERG", shortName: "Ergo" },
    { id: "bitcoin-gold", symbol: "BTG", shortName: "Bitcoin Gold" },
    { id: "nano", symbol: "XNO", shortName: "Nano" },
    { id: "nem", symbol: "XEM", shortName: "NEM" },
    { id: "waves", symbol: "WAVES", shortName: "Waves" },
    { id: "nervos-network", symbol: "CKB", shortName: "Nervos" },
  ]),
  layer1: dedupeAssets([
    { id: "ethereum", symbol: "ETH", shortName: "Ethereum" },
    { id: "solana", symbol: "SOL", shortName: "Solana" },
    { id: "cardano", symbol: "ADA", shortName: "Cardano" },
    { id: "avalanche-2", symbol: "AVAX", shortName: "Avalanche" },
    { id: "polkadot", symbol: "DOT", shortName: "Polkadot" },
    { id: "near", symbol: "NEAR", shortName: "NEAR" },
    { id: "aptos", symbol: "APT", shortName: "Aptos" },
    { id: "sui", symbol: "SUI", shortName: "Sui" },
    { id: "algorand", symbol: "ALGO", shortName: "Algorand" },
    { id: "tezos", symbol: "XTZ", shortName: "Tezos" },
    { id: "internet-computer", symbol: "ICP", shortName: "Internet Computer" },
    { id: "cosmos", symbol: "ATOM", shortName: "Cosmos" },
    { id: "the-open-network", symbol: "TON", shortName: "Toncoin" },
    { id: "fantom", symbol: "FTM", shortName: "Fantom" },
    { id: "eos", symbol: "EOS", shortName: "EOS" },
    { id: "injective-protocol", symbol: "INJ", shortName: "Injective" },
    { id: "stacks", symbol: "STX", shortName: "Stacks" },
    { id: "hedera-hashgraph", symbol: "HBAR", shortName: "Hedera" },
    { id: "vechain", symbol: "VET", shortName: "VeChain" },
    { id: "flow", symbol: "FLOW", shortName: "Flow" },
    { id: "mina-protocol", symbol: "MINA", shortName: "Mina" },
    { id: "chia", symbol: "XCH", shortName: "Chia" },
  ]),
  scaling: dedupeAssets([
    { id: "arbitrum", symbol: "ARB", shortName: "Arbitrum" },
    { id: "optimism", symbol: "OP", shortName: "Optimism" },
    { id: "polygon-ecosystem-token", symbol: "POL", shortName: "Polygon" },
    { id: "immutable-x", symbol: "IMX", shortName: "Immutable" },
    { id: "starknet", symbol: "STRK", shortName: "Starknet" },
    { id: "mantle", symbol: "MNT", shortName: "Mantle" },
    { id: "loopring", symbol: "LRC", shortName: "Loopring" },
    { id: "metis-token", symbol: "METIS", shortName: "Metis" },
    { id: "zksync", symbol: "ZK", shortName: "zkSync" },
    { id: "skale", symbol: "SKL", shortName: "SKALE" },
    { id: "celestia", symbol: "TIA", shortName: "Celestia" },
    { id: "sei-network", symbol: "SEI", shortName: "Sei" },
    { id: "boba-network", symbol: "BOBA", shortName: "Boba Network" },
    { id: "cartesi", symbol: "CTSI", shortName: "Cartesi" },
    { id: "celer-network", symbol: "CELR", shortName: "Celer Network" },
    { id: "altlayer", symbol: "ALT", shortName: "AltLayer" },
    { id: "manta-network", symbol: "MANTA", shortName: "Manta Network" },
    { id: "dymension", symbol: "DYM", shortName: "Dymension" },
    { id: "flux", symbol: "FLUX", shortName: "Flux" },
  ]),
  payments: dedupeAssets([
    { id: "ripple", symbol: "XRP", shortName: "XRP" },
    { id: "stellar", symbol: "XLM", shortName: "Stellar" },
    { id: "tron", symbol: "TRX", shortName: "TRON" },
    { id: "hedera-hashgraph", symbol: "HBAR", shortName: "Hedera" },
    { id: "xdc-network", symbol: "XDC", shortName: "XDC Network" },
    { id: "celo", symbol: "CELO", shortName: "Celo" },
    { id: "nano", symbol: "XNO", shortName: "Nano" },
    { id: "iota", symbol: "IOTA", shortName: "IOTA" },
    { id: "telcoin", symbol: "TEL", shortName: "Telcoin" },
    { id: "coti", symbol: "COTI", shortName: "COTI" },
    { id: "alchemy-pay", symbol: "ACH", shortName: "Alchemy Pay" },
    { id: "amp-token", symbol: "AMP", shortName: "Amp" },
    { id: "reserve-rights-token", symbol: "RSR", shortName: "Reserve Rights" },
    { id: "request-network", symbol: "REQ", shortName: "Request" },
    { id: "pundi-x-2", symbol: "PUNDIX", shortName: "Pundi X" },
    { id: "litecoin", symbol: "LTC", shortName: "Litecoin" },
    { id: "dash", symbol: "DASH", shortName: "Dash" },
    { id: "bitcoin-cash", symbol: "BCH", shortName: "Bitcoin Cash" },
    { id: "dogecoin", symbol: "DOGE", shortName: "Dogecoin" },
  ]),
  defi: dedupeAssets([
    { id: "chainlink", symbol: "LINK", shortName: "Chainlink" },
    { id: "uniswap", symbol: "UNI", shortName: "Uniswap" },
    { id: "aave", symbol: "AAVE", shortName: "Aave" },
    { id: "maker", symbol: "MKR", shortName: "Maker" },
    { id: "lido-dao", symbol: "LDO", shortName: "Lido DAO" },
    { id: "curve-dao-token", symbol: "CRV", shortName: "Curve" },
    { id: "synthetix-network-token", symbol: "SNX", shortName: "Synthetix" },
    { id: "compound-governance-token", symbol: "COMP", shortName: "Compound" },
    { id: "yearn-finance", symbol: "YFI", shortName: "Yearn" },
    { id: "pendle", symbol: "PENDLE", shortName: "Pendle" },
    { id: "ethena", symbol: "ENA", shortName: "Ethena" },
    { id: "thorchain", symbol: "RUNE", shortName: "THORChain" },
    { id: "jupiter-exchange-solana", symbol: "JUP", shortName: "Jupiter" },
    { id: "raydium", symbol: "RAY", shortName: "Raydium" },
    { id: "1inch", symbol: "1INCH", shortName: "1inch" },
    { id: "sushi", symbol: "SUSHI", shortName: "Sushi" },
    { id: "balancer", symbol: "BAL", shortName: "Balancer" },
    { id: "convex-finance", symbol: "CVX", shortName: "Convex" },
    { id: "rocket-pool", symbol: "RPL", shortName: "Rocket Pool" },
    { id: "gmx", symbol: "GMX", shortName: "GMX" },
    { id: "pancakeswap-token", symbol: "CAKE", shortName: "PancakeSwap" },
  ]),
  ai_data: dedupeAssets([
    { id: "bittensor", symbol: "TAO", shortName: "Bittensor" },
    {
      id: "artificial-superintelligence-alliance",
      symbol: "ASI",
      shortName: "ASI Alliance",
    },
    { id: "render-token", symbol: "RENDER", shortName: "Render" },
    { id: "the-graph", symbol: "GRT", shortName: "The Graph" },
    { id: "filecoin", symbol: "FIL", shortName: "Filecoin" },
    { id: "arweave", symbol: "AR", shortName: "Arweave" },
    { id: "livepeer", symbol: "LPT", shortName: "Livepeer" },
    { id: "akash-network", symbol: "AKT", shortName: "Akash" },
    { id: "worldcoin-wld", symbol: "WLD", shortName: "Worldcoin" },
    { id: "origintrail", symbol: "TRAC", shortName: "OriginTrail" },
    { id: "ocean-protocol", symbol: "OCEAN", shortName: "Ocean Protocol" },
    { id: "iexec-rlc", symbol: "RLC", shortName: "iExec RLC" },
    { id: "aioz-network", symbol: "AIOZ", shortName: "AIOZ" },
    { id: "io", symbol: "IO", shortName: "io.net" },
    { id: "arkham", symbol: "ARKM", shortName: "Arkham" },
    { id: "paal-ai", symbol: "PAAL", shortName: "PAAL AI" },
    { id: "nosana", symbol: "NOS", shortName: "Nosana" },
    { id: "rss3", symbol: "RSS3", shortName: "RSS3" },
    { id: "phala-network", symbol: "PHA", shortName: "Phala" },
  ]),
  gaming: dedupeAssets([
    { id: "the-sandbox", symbol: "SAND", shortName: "The Sandbox" },
    { id: "decentraland", symbol: "MANA", shortName: "Decentraland" },
    { id: "axie-infinity", symbol: "AXS", shortName: "Axie Infinity" },
    { id: "gala", symbol: "GALA", shortName: "Gala" },
    { id: "beam-2", symbol: "BEAM", shortName: "Beam" },
    { id: "ronin", symbol: "RON", shortName: "Ronin" },
    { id: "enjincoin", symbol: "ENJ", shortName: "Enjin Coin" },
    { id: "illuvium", symbol: "ILV", shortName: "Illuvium" },
    { id: "pixels", symbol: "PIXEL", shortName: "Pixels" },
    { id: "superverse", symbol: "SUPER", shortName: "SuperVerse" },
    { id: "yield-guild-games", symbol: "YGG", shortName: "Yield Guild" },
    { id: "magic", symbol: "MAGIC", shortName: "Treasure" },
    { id: "stepn", symbol: "GMT", shortName: "STEPN" },
    { id: "apecoin", symbol: "APE", shortName: "ApeCoin" },
    { id: "wax", symbol: "WAXP", shortName: "WAX" },
    { id: "gods-unchained", symbol: "GODS", shortName: "Gods Unchained" },
    { id: "my-neighbor-alice", symbol: "ALICE", shortName: "My Neighbor Alice" },
    { id: "vulcan-forged", symbol: "PYR", shortName: "Vulcan Forged" },
    { id: "chromaway", symbol: "CHR", shortName: "Chromia" },
  ]),
  meme: dedupeAssets([
    { id: "dogecoin", symbol: "DOGE", shortName: "Dogecoin" },
    { id: "shiba-inu", symbol: "SHIB", shortName: "Shiba Inu" },
    { id: "pepe", symbol: "PEPE", shortName: "Pepe" },
    { id: "bonk", symbol: "BONK", shortName: "Bonk" },
    { id: "dogwifcoin", symbol: "WIF", shortName: "dogwifhat" },
    { id: "floki", symbol: "FLOKI", shortName: "Floki" },
    { id: "brett", symbol: "BRETT", shortName: "Brett" },
    { id: "popcat", symbol: "POPCAT", shortName: "Popcat" },
    { id: "mog-coin", symbol: "MOG", shortName: "Mog Coin" },
    { id: "cat-in-a-dogs-world", symbol: "MEW", shortName: "cat in a dogs world" },
    { id: "turbo", symbol: "TURBO", shortName: "Turbo" },
    { id: "book-of-meme", symbol: "BOME", shortName: "Book of Meme" },
    { id: "baby-doge-coin", symbol: "BABYDOGE", shortName: "Baby Doge Coin" },
    { id: "memecoin-2", symbol: "MEME", shortName: "Memecoin" },
    { id: "ponke", symbol: "PONKE", shortName: "Ponke" },
    { id: "gigachad-2", symbol: "GIGA", shortName: "Gigachad" },
    { id: "peanut-the-squirrel", symbol: "PNUT", shortName: "Peanut the Squirrel" },
    { id: "simons-cat", symbol: "CAT", shortName: "Simon's Cat" },
    { id: "cheems-token", symbol: "CHEEMS", shortName: "Cheems" },
  ]),
};

export function listCryptoSectorAssets(sector: CryptoSectorId): CryptoAssetMeta[] {
  return CRYPTO_SECTOR_MAP[sector].slice(0, getCryptoSectorBookMaxTickers());
}

export function isCryptoSectorId(input: string): input is CryptoSectorId {
  return (CRYPTO_SECTOR_ORDER as readonly string[]).includes(input);
}
