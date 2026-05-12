type AssetReferenceProfile = {
  companyName: string;
  foundedYear?: number;
  headquarters?: string;
  sector?: string;
  industry?: string;
  summary: string;
  keywords: string[];
  aliases?: string[];
};

const ASSET_REFERENCE_PROFILES: Record<string, AssetReferenceProfile> = {
  PETR4: {
    companyName: "Petrobras",
    foundedYear: 1953,
    headquarters: "Rio de Janeiro, Brasil",
    sector: "Energia",
    industry: "Petróleo, gás e refino",
    summary:
      "Petrobras é a principal companhia integrada de energia do Brasil, com atuação em exploração, produção, refino, logística e derivados.",
    keywords: ["petrobras", "petróleo brasileiro", "pre-sal", "brent", "refino"],
    aliases: ["petr4", "petr3", "petrobras pn", "petrobras on"],
  },
  PETR3: {
    companyName: "Petrobras",
    foundedYear: 1953,
    headquarters: "Rio de Janeiro, Brasil",
    sector: "Energia",
    industry: "Petróleo, gás e refino",
    summary:
      "Petrobras é a principal companhia integrada de energia do Brasil, com atuação em exploração, produção, refino, logística e derivados.",
    keywords: ["petrobras", "petróleo brasileiro", "pre-sal", "brent", "refino"],
    aliases: ["petr4", "petr3", "petrobras pn", "petrobras on"],
  },
  VALE3: {
    companyName: "Vale",
    foundedYear: 1942,
    headquarters: "Rio de Janeiro, Brasil",
    sector: "Materiais básicos",
    industry: "Mineração e metais",
    summary:
      "Vale é uma das maiores mineradoras do mundo, com foco em minério de ferro, níquel, logística e operações de metais para cadeias globais.",
    keywords: ["vale", "minério de ferro", "mineradora", "níquel", "pelotas"],
    aliases: ["vale sa", "companhia vale do rio doce"],
  },
  ITUB4: {
    companyName: "Itaú Unibanco",
    foundedYear: 2008,
    headquarters: "São Paulo, Brasil",
    sector: "Financeiro",
    industry: "Banco universal",
    summary:
      "Itaú Unibanco é um dos maiores bancos privados da América Latina, com presença relevante em crédito, serviços, cartões, investimentos e seguros.",
    keywords: ["itaú", "itau", "unibanco", "crédito", "banco"],
    aliases: ["itau unibanco", "itau"],
  },
  BBDC4: {
    companyName: "Bradesco",
    foundedYear: 1943,
    headquarters: "Osasco, Brasil",
    sector: "Financeiro",
    industry: "Banco universal",
    summary:
      "Bradesco combina banco comercial, seguros, cartões e investimentos, com forte presença em canais de varejo e serviços financeiros recorrentes.",
    keywords: ["bradesco", "banco", "seguros", "crédito", "cartões"],
    aliases: ["bradesco on", "bradesco pn"],
  },
  BBAS3: {
    companyName: "Banco do Brasil",
    foundedYear: 1808,
    headquarters: "Brasília, Brasil",
    sector: "Financeiro",
    industry: "Banco universal",
    summary:
      "Banco do Brasil é uma das instituições financeiras mais antigas do país, com presença ampla em crédito, agronegócio, varejo e atacado.",
    keywords: ["banco do brasil", "bb", "agronegócio", "crédito", "banco público"],
    aliases: ["bbas3", "bb", "banco do brasil sa"],
  },
  WEGE3: {
    companyName: "WEG",
    foundedYear: 1961,
    headquarters: "Jaraguá do Sul, Brasil",
    sector: "Industriais",
    industry: "Equipamentos elétricos",
    summary:
      "WEG é referência industrial brasileira em motores, automação, transmissão, energia e soluções para eficiência operacional global.",
    keywords: ["weg", "motores", "automação", "equipamentos elétricos", "indústria"],
    aliases: ["weg sa", "weg motores"],
  },
  EMBR3: {
    companyName: "Embraer",
    foundedYear: 1969,
    headquarters: "São José dos Campos, Brasil",
    sector: "Industriais",
    industry: "Aeronáutica e defesa",
    summary:
      "Embraer atua em aviação comercial, executiva, defesa e serviços, com posição estratégica em mobilidade aérea e tecnologia aeronáutica.",
    keywords: ["embraer", "aviação", "aeronáutica", "defesa", "e-jets"],
    aliases: ["embraer sa", "embraer on"],
  },
  RENT3: {
    companyName: "Localiza",
    foundedYear: 1973,
    headquarters: "Belo Horizonte, Brasil",
    sector: "Consumo",
    industry: "Mobilidade e aluguel de frotas",
    summary:
      "Localiza é uma das maiores plataformas de mobilidade do país, combinando aluguel de carros, gestão de frotas, seminovos e eficiência operacional.",
    keywords: ["localiza", "aluguel de carros", "frotas", "mobilidade", "seminovos"],
    aliases: ["localiza rent a car", "localiza&co"],
  },
  ELET3: {
    companyName: "Eletrobras",
    foundedYear: 1962,
    headquarters: "Rio de Janeiro, Brasil",
    sector: "Utilities",
    industry: "Energia elétrica",
    summary:
      "Eletrobras é uma das maiores companhias do setor elétrico brasileiro, com atuação em geração, transmissão e portfólio relevante em energia renovável.",
    keywords: ["eletrobras", "energia elétrica", "transmissão", "geração", "utilities"],
    aliases: ["centrais eletricas brasileiras", "eletrobras on"],
  },
  AAPL: {
    companyName: "Apple",
    foundedYear: 1976,
    headquarters: "Cupertino, Estados Unidos",
    sector: "Tecnologia",
    industry: "Hardware, software e serviços",
    summary:
      "Apple combina hardware premium, ecossistema fechado, serviços digitais e monetização recorrente em escala global.",
    keywords: ["apple", "iphone", "ipad", "mac", "ios"],
    aliases: ["apple inc", "aapl"],
  },
  MSFT: {
    companyName: "Microsoft",
    foundedYear: 1975,
    headquarters: "Redmond, Estados Unidos",
    sector: "Tecnologia",
    industry: "Software, nuvem e produtividade",
    summary:
      "Microsoft opera em software corporativo, infraestrutura em nuvem, produtividade, segurança e inteligência artificial para empresas e consumidores.",
    keywords: ["microsoft", "azure", "office", "windows", "copilot"],
    aliases: ["microsoft corp", "msft"],
  },
  NVDA: {
    companyName: "NVIDIA",
    foundedYear: 1993,
    headquarters: "Santa Clara, Estados Unidos",
    sector: "Tecnologia",
    industry: "Semicondutores e IA",
    summary:
      "NVIDIA lidera a cadeia de GPUs e infraestrutura para IA, com presença forte em data centers, computação acelerada e software associado.",
    keywords: ["nvidia", "gpu", "ia", "chips", "data center"],
    aliases: ["nvidia corp", "nvda", "geforce"],
  },
  AMZN: {
    companyName: "Amazon",
    foundedYear: 1994,
    headquarters: "Seattle, Estados Unidos",
    sector: "Consumo e tecnologia",
    industry: "E-commerce, nuvem e logística",
    summary:
      "Amazon combina varejo digital, logística, marketplace, publicidade e infraestrutura em nuvem por meio da AWS.",
    keywords: ["amazon", "aws", "e-commerce", "marketplace", "logística"],
    aliases: ["amazon.com", "amazon web services", "amzn"],
  },
  GOOGL: {
    companyName: "Alphabet",
    foundedYear: 1998,
    headquarters: "Mountain View, Estados Unidos",
    sector: "Tecnologia",
    industry: "Busca, publicidade e plataformas digitais",
    summary:
      "Alphabet opera busca, publicidade digital, vídeo, cloud e produtos de software em escala global por meio do ecossistema Google.",
    keywords: ["google", "alphabet", "youtube", "search", "advertising"],
    aliases: ["google", "googl", "google cloud"],
  },
  GOOG: {
    companyName: "Alphabet",
    foundedYear: 1998,
    headquarters: "Mountain View, Estados Unidos",
    sector: "Tecnologia",
    industry: "Busca, publicidade e plataformas digitais",
    summary:
      "Alphabet opera busca, publicidade digital, vídeo, cloud e produtos de software em escala global por meio do ecossistema Google.",
    keywords: ["google", "alphabet", "youtube", "search", "advertising"],
    aliases: ["google", "goog", "google cloud"],
  },
  META: {
    companyName: "Meta Platforms",
    foundedYear: 2004,
    headquarters: "Menlo Park, Estados Unidos",
    sector: "Tecnologia",
    industry: "Redes sociais e publicidade digital",
    summary:
      "Meta concentra ecossistemas sociais de larga escala, monetização por publicidade e investimentos estruturais em IA e realidade estendida.",
    keywords: ["meta", "facebook", "instagram", "whatsapp", "threads"],
    aliases: ["facebook", "meta platforms", "meta"],
  },
  TSLA: {
    companyName: "Tesla",
    foundedYear: 2003,
    headquarters: "Austin, Estados Unidos",
    sector: "Consumo e industriais",
    industry: "Veículos elétricos e energia",
    summary:
      "Tesla atua em veículos elétricos, software embarcado, baterias e soluções energéticas, com forte sensibilidade a execução industrial e narrativa de crescimento.",
    keywords: ["tesla", "veículos elétricos", "ev", "autonomia", "baterias"],
    aliases: ["tesla motors", "tsla", "ev maker"],
  },
  XOM: {
    companyName: "Exxon Mobil",
    foundedYear: 1999,
    headquarters: "Spring, Estados Unidos",
    sector: "Energia",
    industry: "Petróleo e gás",
    summary:
      "Exxon Mobil é uma das maiores majors globais de energia, com exposição relevante a upstream, downstream e petroquímica.",
    keywords: ["exxon", "oil", "energy", "petróleo", "refining"],
    aliases: ["exxon mobil", "xom"],
  },
};

export function getAssetReferenceProfile(symbol: string) {
  return ASSET_REFERENCE_PROFILES[symbol.trim().toUpperCase()];
}
