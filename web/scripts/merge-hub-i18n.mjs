/**
 * One-off merger: augments locale JSON files with Seo / hub / education / NotFound keys.
 * Run: node scripts/merge-hub-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

/** @type {Record<string, object>} */
const PACKS = {
  "pt-BR": ptBrPack(),
  en: enPack(),
  es: esPack(),
  fr: frPack(),
  it: itPack(),
  "zh-CN": zhPack(),
};

function ptBrPack() {
  const bullChecks = [
    "Liquidez global expansiva com inflação em convergência para meta — favorece valuation de ativos de risco.",
    "Curva de juros longa ancora expectativa de cortes — compressão de prêmio de risco Brasil.",
    "Revisões positivas de lucros em blue chips e fluxo estrangeiro líquido positivo na bolsa brasileira.",
    "Cripto: regime risk-on com dominância de BTC estável ou em queda — favorece beta em altcoins líquidas.",
    "Commodities estruturais (ex.: energia transição / metais) sustentando exportações e FX.",
  ];
  const bearChecks = [
    "Política monetária restritiva persistente — custo de capital alto por mais tempo que o precificado.",
    "Curva invertida + spreads de crédito corporativo subindo — alerta para ciclo e earnings.",
    "Choques geopolíticos ou disrupção logística pressionando commodities e inflação core.",
    "Risco fiscal/percepção soberana elevando prêmio país — pressiona bolsa e fortalece hedge FX.",
    "Cripto: liquidez institucional retraiu, correlação BTC–Nasdaq alta em vendas amplas — cautela com alavancagem.",
  ];
  return {
    Seo: {
      siteDescription:
        "O mercado não espera — você também não deveria. Onde mercados, finanças pessoais e educação se encontram numa mesma mesa: dados em tempo útil, fontes visíveis, IA sob disciplina e linguagem institucional — precisão sem hype, transparência por desenho.",
      home: {
        absoluteTitle: "PRONUXFIN — Mesa cognitiva global para mercados",
        description:
          "O mercado não espera — você também não deveria. Onde mercados, finanças pessoais e educação se encontram numa mesma mesa: dados em tempo útil, fontes visíveis, IA sob disciplina e linguagem institucional — precisão sem hype, transparência por desenho.",
        ogTitle: "PRONUXFIN — Mesa cognitiva para mercados e finanças",
        ogDescription:
          "O mercado não espera — você também não deveria. Mercados ao vivo com fonte, projeções em cenários, IA disciplinada e painel privado — clareza institucional sem hype.",
      },
      bolsa: {
        title: "Mesa de mercados ao vivo",
        description:
          "Cotações da bolsa brasileira e criptoativos em BRL em ciclo curto — referência rápida quando o tempo é o ativo mais escasso.",
        ogTitle: "Mesa de mercados ao vivo | PRONUXFIN",
        ogDescription:
          "Painel institucional com ações, proxies de índice e cripto — latência reduzida por design.",
      },
      projecao: {
        title: "Projeção e cenários",
        description:
          "Quadros de cenário institucional (alta e baixa) para ações e cripto — metodologia PRONUXFIN, sem promessas de retorno.",
        ogTitle: "Projeção e cenários | PRONUXFIN",
        ogDescription:
          "Infraestrutura cognitiva para estruturar hipóteses de mercado com rigor de mesa global.",
      },
      noticias: {
        title: "Notícias financeiras ao vivo",
        description:
          "Radar PRONUXFIN: agregação de RSS de veículos reconhecidos — atualização frequente, fonte sempre visível.",
        ogTitle: "Notícias financeiras ao vivo | PRONUXFIN",
        ogDescription:
          "Menos ruído, mais contexto. Manchetes e fluxo contínuo para quem leva educação financeira a sério.",
      },
      forgot: {
        title: "Recuperar senha",
        description:
          "Fluxo de recuperação de acesso PRONUXFIN — mesmo padrão visual e segurança das demais jornadas.",
      },
      assistant: {
        title: "Central de inteligência",
        description:
          "Linhas de trabalho para PF e instituição — chat PRONUX (Ollama) e atalhos externos.",
      },
      login: {
        title: "Entrar",
        description:
          "Acesse seu painel PRONUXFIN — autenticação segura, JWT e experiência institucional.",
      },
      register: {
        title: "Criar conta",
        description:
          "Cadastro PRONUXFIN em segundos — stack NestJS + PostgreSQL, validação em camadas.",
      },
    },
    BolsaHub: {
      badgeGlobal:
        "Departamento global · bolsa brasileira e ativos digitais",
      h1Lead: "Mesa institucional —",
      h1Accent: "Brasil em tempo real + liquidez digital global",
      intro:
        "A PRONUXFIN prioriza baixa latência editorial: ciclo curto de atualização para equities brasileiras e cripto em BRL, proxies de índice explicitamente rotulados e linguagem de sala de guerra — infraestrutura pensada para quando cada segundo conta na decisão.",
      lastUpdated: "Última atualização",
      newsRadar: "Radar de notícias",
      riskDisclaimer:
        "Investimentos envolvem risco de perda de capital. As cotações são meramente informativas, podem sofrer atraso ou divergir da sua corretora. ETFs indicados como proxies não reproduzem oficialmente benchmarks regulatórios. A PRONUXFIN não emite recomendação de compra ou venda nesta camada — nosso mandato é educação, método e infraestrutura cognitiva.",
      indicesEyebrow: "Índices · proxies cotados",
      indicesHint:
        "Visão sintética para ancora visual — não substitui benchmarks oficiais.",
      equitiesBook: "Livro de referência · blue chips",
      thTicker: "Ativo",
      thDesc: "Descrição",
      thLast: "Último",
      thDeltaBrl: "Δ R$",
      thDeltaPct: "Var %",
      cryptoTitle: "Mesa global · criptoativos (BRL)",
      thPair: "Par",
      thName: "Nome",
      cryptoFootLead: "Cotações de criptoativos via",
      cryptoFootTrail:
        ". Respeite os termos de uso da API; valores são informativos e podem divergir das suas exchanges.",
      ctaDesk: "Precisa desta mesa dentro do painel com alertas personalizados?",
      ctaRegister: "Abrir conta PRONUXFIN",
    },
    ProjecaoHub: {
      eyebrow: "PRONUXFIN · scenario desk",
      h1Lead: "Projeção e cenários —",
      h1Accent: "metodologia institucional",
      lead:
        "Neste mercado, latência elimina oportunidade. A PRONUXFIN está construindo uma infraestrutura onde preços, fluxos e notícias convergem em segundos — aqui você trabalha com quadros de cenário (alta / baixa), não com promessas mágicas ou alvos fictícios.",
      warnTitle: "Aviso regulatório e epistemológico",
      warnBody:
        "Nenhuma linha desta página constitui recomendação personalizada, ordem, ou previsão garantida de retorno. \"Projeção\" refere-se a organização de hipóteses macro e de mercado para estudo — os mesmos frameworks usados em mesas profissionais, porém sem substituir sua própria diligência e perfil de risco.",
      sensHeading: "Sensibilidade do produto a dados em tempo real",
      sensBr:
        "Régua equities BR — mesa com polling curto (~8s) e API em modo dinâmico (sem cache CDN nas cotações).",
      sensCrypto:
        "Cripto global — tape em BRL via CoinGecko no mesmo ciclo; função serverless próxima ao usuário na Vercel (região gru1).",
      sensNews:
        "Notícias BR + mundo — agregação RSS multi-fonte sem ISR na rota; refresh automático ~10s neste cliente.",
      boardEyebrow: "Quadro de cenários",
      boardLead:
        "Alterne o viés para estruturar leituras — ações e cripto respondem a regimes distintos de liquidez.",
      biasHigh: "Viés alta",
      biasLow: "Viés baixa",
      checklistBull: "Checklist construtivo",
      checklistBear: "Checklist defensivo",
      checklistHint:
        "Prompts usados por mesas macro — não são sinais automáticos de trade.",
      roadmapTitle: "Roadmap PRONUXFIN",
      roadmapBody:
        "Camadas quantitativas (surface de probabilidade, stress-testing de carteiras, alertas de regime) entram à medida que consolidamos o domínio e o ambiente de produção. Ao registrar-se, você antecipa alertas personalizados quando essas engrenagens estiverem disponíveis para usuários.",
      ctaRegister: "Criar conta",
      ctaLiveDesk: "Ir para mesa ao vivo",
      ctaEducation: "Educação (login)",
      deployFoot:
        "Deploy público: configure NEXT_PUBLIC_SITE_URL com o seu domínio definitivo antes do go-live para metadata, Open Graph e futuros webhooks de infraestrutura.",
      bullPoints: bullChecks,
      bearPoints: bearChecks,
    },
    NewsHub: {
      eyebrow: "PRONUXWIRE · intelligence desk",
      aggregationBadge: "Agregação institucional",
      h1Lead: "Fluxo de notícias —",
      h1Accent: "compliance editorial PRONUX",
      subtitle:
        "Curadoria RSS de veículos reconhecidos: menos ruído operacional, mais tempo para decidir com método. Ciclo de atualização frequente (~10s neste cliente); fonte original sempre visível — Brasil e mundo na mesma régua temporal.",
      syncLabel: "Última sincronização",
      readFull: "Ler na íntegra",
      viewDesk: "Ver mesa ao vivo",
      loadingHint:
        "Carregando manchetes… Se persistir, verifique sua rede ou tente novamente em instantes.",
      editorialFoot:
        "PRONUXFIN organiza e apresenta conteúdo de terceiros via RSS público. O texto integral e a responsabilidade editorial permanecem com cada veículo. Isso não é recomendação de investimento.",
      regionBr: "Brasil",
      regionGlobal: "Mundo",
    },
    Education: {
      metaTitle: "Educação financeira",
      metaDescription:
        "Trilhas gamificadas PRONUXFIN — fundamentos, investimentos e uso responsável de dados.",
      pageTitle: "Educação financeira",
      pageSubtitle:
        "Artigos, trilhas e gamificação — esta área evoluirá com progressão, XP e recompensas.",
      badge: "Em construção premium",
      progress: "Progresso",
      trails: [
        {
          title: "Fundamentos PRONUX",
          desc: "Orçamento, reserva e hábitos — trilha base gamificada.",
          level: "Nível 1",
          progressPct: "40",
        },
        {
          title: "Investimentos inteligentes",
          desc: "Risco, diversificação e cenários — preparação para o marketplace futuro.",
          level: "Nível 2",
          progressPct: "12",
        },
        {
          title: "IA & dados pessoais",
          desc: "Como a PRONUXFIN usa dados com privacidade e valor.",
          level: "Avançado",
          progressPct: "0",
        },
      ],
    },
    NotFound: {
      title: "Página não encontrada",
      errorCode: "Erro 404",
      headline: "Esta página não existe na PRONUXFIN",
      body: "O endereço pode estar incorreto ou o recurso foi movido. Volte ao painel ou à página inicial.",
      home: "Página inicial",
      dashboard: "Painel",
    },
    ForgotPassword: {
      title: "Recuperar senha",
      description:
        "Em breve: fluxo seguro com e-mail tokenizado (SMTP / provedor). Esta tela segue o mesmo padrão visual das demais jornadas.",
      emailLabel: "E-mail",
      sentHint:
        "Simulação: você receberia um link de redefinição neste e-mail.",
      submit: "Enviar instruções",
      backLogin: "Voltar ao login",
    },
  };
}

function enPack() {
  return {
    Seo: {
      siteDescription:
        "The market won't wait—and neither should you. Where markets, personal finance and education share one desk: timely data, visible sources, disciplined AI and institutional wording—precision without hype, transparency by design.",
      home: {
        absoluteTitle: "PRONUXFIN — Global cognitive desk for markets",
        description:
          "The market won't wait—and neither should you. Where markets, personal finance and education share one desk: timely data, visible sources, disciplined AI and institutional wording—precision without hype, transparency by design.",
        ogTitle: "PRONUXFIN — Cognitive desk for markets & finance",
        ogDescription:
          "Live markets with cited sources, scenario outlooks, disciplined AI and a private dashboard — institutional clarity without hype.",
      },
      bolsa: {
        title: "Live markets desk",
        description:
          "Brazilian equities and crypto in BRL on a short poll loop — fast reference when time is scarce.",
        ogTitle: "Live markets desk | PRONUXFIN",
        ogDescription:
          "Institutional board with equities, index proxies and crypto — engineered for freshness.",
      },
      projecao: {
        title: "Outlook & scenarios",
        description:
          "Institutional bull/bear boards for equities and crypto — PRONUXFIN methodology without return promises.",
        ogTitle: "Outlook & scenarios | PRONUXFIN",
        ogDescription:
          "Cognitive infrastructure to frame market hypotheses with global desk-grade rigour.",
      },
      noticias: {
        title: "Live financial news",
        description:
          "PRONUXFIN radar: RSS aggregation from recognised outlets — frequent refreshes with sources always visible.",
        ogTitle: "Live financial news | PRONUXFIN",
        ogDescription:
          "Less noise, more context — headlines built for disciplined readers.",
      },
      forgot: {
        title: "Reset password",
        description:
          "PRONUXFIN account recovery flow — same UX and safeguards as sign-in journeys.",
      },
      assistant: {
        title: "Intelligence hub",
        description:
          "Worklanes for retail and institution — PRONUX chat (Ollama) plus shortcuts to external tooling.",
      },
      login: {
        title: "Sign in",
        description:
          "Open your PRONUXFIN dashboard — secure auth, JWT flows and institutional UX.",
      },
      register: {
        title: "Create account",
        description:
          "Join PRONUXFIN in seconds — NestJS + PostgreSQL stack with layered validation.",
      },
    },
    BolsaHub: {
      badgeGlobal: "Global desk · Brazilian equities & digital assets",
      h1Lead: "Institutional desk —",
      h1Accent: "Brazil live + global digital liquidity",
      intro:
        "PRONUXFIN optimises editorial latency: short refresh cycles for Brazilian equities and crypto in BRL, explicitly labelled index proxies and war-room language — built for ticks that matter.",
      lastUpdated: "Last update",
      newsRadar: "News radar",
      riskDisclaimer:
        "Investments carry loss risk. Quotes are indicative, may lag and differ from your broker. ETF proxies shown here are not official regulatory benchmarks. PRONUXFIN does not publish buy/sell advice on this layer — education, method and cognitive infrastructure.",
      indicesEyebrow: "Indices · quoted proxies",
      indicesHint:
        "Synthetic view for anchoring visuals — does not replace official benchmarks.",
      equitiesBook: "Reference book · blue chips",
      thTicker: "Ticker",
      thDesc: "Description",
      thLast: "Last",
      thDeltaBrl: "Δ BRL",
      thDeltaPct: "Var %",
      cryptoTitle: "Global desk · crypto (BRL)",
      thPair: "Pair",
      thName: "Name",
      cryptoFootLead: "Cryptocurrency prices via",
      cryptoFootTrail:
        ". Respect the API terms — figures are illustrative and may differ from your exchanges.",
      ctaDesk: "Want this desk in your dashboard with custom alerts?",
      ctaRegister: "Open PRONUXFIN account",
    },
    ProjecaoHub: {
      eyebrow: "PRONUXFIN · scenario desk",
      h1Lead: "Outlook & scenarios —",
      h1Accent: "institutional methodology",
      lead:
        "When latency destroys edge, infrastructure matters. PRONUXFIN is building a desk where prices, flows and headlines converge fast — structured bull/bear boards instead of vague targets.",
      warnTitle: "Regulatory & epistemic disclaimer",
      warnBody:
        "Nothing here is personalised advice, orders or guaranteed returns. \"Outlook\" means organising macro/market hypotheses for study — the same scaffolding professional desks use, without replacing diligence or your risk appetite.",
      sensHeading: "How real-time feeds shape our product",
      sensBr:
        "Brazil equities rails — desk polling (~8s) and dynamic CDN-free quote routes.",
      sensCrypto:
        "Global crypto — BRL tape via CoinGecko in the same loop; regional serverless footprint (e.g. gru1).",
      sensNews:
        "Brazil & world headlines — RSS multi-source path without ISR, ~10s client refresh.",
      boardEyebrow: "Scenario board",
      boardLead:
        "Toggle bias — equities & crypto behave under different liquidity regimes.",
      biasHigh: "Upside bias",
      biasLow: "Downside bias",
      checklistBull: "Constructive checklist",
      checklistBear: "Defensive checklist",
      checklistHint: "Desk prompts — not auto trade signals.",
      roadmapTitle: "PRONUXFIN roadmap",
      roadmapBody:
        "Probability overlays, portfolio stress tooling and regime alerts unlock as domains mature. Signing up queues personalised alerts once production wiring is green.",
      ctaRegister: "Create account",
      ctaLiveDesk: "Open live desk",
      ctaEducation: "Education (login)",
      deployFoot:
        "Public deployments: point NEXT_PUBLIC_SITE_URL to your final domain ahead of launch for SEO, OG and infra webhooks.",
      bullPoints: [
        "Liquidity abundant with inflation drifting to target — lifts risk valuations.",
        "Long-end curve pricing cuts — tighter Brazil risk premia.",
        "Earnings revisions up on blue chips and net foreign flows into Brazilian equities.",
        "Crypto risk-on regime with BTC dominance flat/falling — room for liquid alt-beta.",
        "Structural commodities (transition energy / metals) supporting exports & FX.",
      ],
      bearPoints: [
        "Restrictive monetary policy lasts longer — cost of capital higher than priced.",
        "Inverted curves + widening credit spreads — caution for cycle & earnings.",
        "Geopolitical or logistic shocks tightening core inflation.",
        "Fiscal risk pushing country premia higher — equities & FX hedge pressure.",
        "Crypto liquidity withdrawn, BTC/Nasdaq correlation high amid broad sells — beware leverage.",
      ],
    },
    NewsHub: {
      eyebrow: "PRONUXWIRE · intelligence desk",
      aggregationBadge: "Institutional aggregation",
      h1Lead: "News flow —",
      h1Accent: "PRONUX editorial compliance",
      subtitle:
        "Curated RSS from recognised outlets — less churn, more disciplined reading. Roughly 10s client refresh cadence here; originals always surfaced — Brazil and global on the same temporal rail.",
      syncLabel: "Last sync",
      readFull: "Read full article",
      viewDesk: "View live desk",
      loadingHint:
        "Loading headlines… If it persists check your connection or retry shortly.",
      editorialFoot:
        "PRONUXFIN organises third-party headlines via open RSS feeds. Responsibility for wording stays with publishers. Nothing here is personalised investment advice.",
      regionBr: "Brazil",
      regionGlobal: "Global",
    },
    Education: {
      metaTitle: "Financial education",
      metaDescription:
        "Gamified PRONUXFIN paths — fundamentals, investing and accountable data literacy.",
      pageTitle: "Financial education",
      pageSubtitle:
        "Articles, paths and XP — progression and rewards evolve here.",
      badge: "Premium build in flight",
      progress: "Progress",
      trails: [
        {
          title: "PRONUX fundamentals",
          desc: "Budgets, rainy-day funds & habits — base gamified path.",
          level: "Level 1",
          progressPct: "40",
        },
        {
          title: "Smarter investing",
          desc: "Risk, diversification and scenarios — prepping future marketplace tooling.",
          level: "Level 2",
          progressPct: "12",
        },
        {
          title: "AI & personal data",
          desc: "How PRONUXFIN treats privacy and value responsibly.",
          level: "Advanced",
          progressPct: "0",
        },
      ],
    },
    NotFound: {
      title: "Page not found",
      errorCode: "Error 404",
      headline: "This PRONUXFIN page doesn't exist",
      body: "The URL may be wrong or the asset moved. Head back home or open your dashboard.",
      home: "Home",
      dashboard: "Dashboard",
    },
    ForgotPassword: {
      title: "Reset password",
      description:
        "Coming soon: tokenised e-mail flow (SMTP / provider). This screen matches other auth journeys.",
      emailLabel: "Email",
      sentHint: "Demo: you would receive a reset link at this address.",
      submit: "Email reset link",
      backLogin: "Back to sign in",
    },
  };
}

function esPack() {
  const p = enPack();
  return {
    Seo: {
      siteDescription:
        "El mercado no espera — ni tú tampoco. Donde mercados, finanzas personales y educación comparten la misma mesa: datos a tiempo útil, fuentes visibles, IA con disciplina y lenguaje institucional.",
      home: {
        absoluteTitle: "PRONUXFIN — Mesa cognitiva global para mercados",
        description:
          "El mercado no espera — ni tú tampoco. Donde mercados, financias personales y educación comparten mesa única.",
        ogTitle: "PRONUXFIN — Mesa cognitiva para mercados y finanzas",
        ogDescription:
          "Mercado en vivo con fuente, escenarios, IA contenida y panel privado — claridad institucional sin hype.",
      },
      bolsa: {
        title: "Mesa de mercados en vivo",
        description:
          "Acciones brasileñas + cripto en BRL con ciclo corto — lectura rápida cuando falta tiempo.",
        ogTitle: "Mesa de mercados en vivo | PRONUXFIN",
        ogDescription:
          "Panel institucional con índices proxy y cripto — enfocado en frescura.",
      },
      projecao: {
        title: "Proyección y escenarios",
        description:
          "Tableros alta/baja para acciones y cripto — metodología PRONUXFIN sin promesas de retorno.",
        ogTitle: "Proyección y escenarios | PRONUXFIN",
        ogDescription:
          "Infraestructura cognitiva para hipótesis de mercado con rigor institucional.",
      },
      noticias: {
        title: "Noticias financieras en vivo",
        description:
          "Radar PRONUXFIN: RSS de medios reconocidos — refresco frecuente y fuentes visibles.",
        ogTitle: "Noticias financieras en vivo | PRONUXFIN",
        ogDescription:
          "Menos ruido, más contexto — titulares para lectores disciplinados.",
      },
      forgot: {
        title: "Recuperar contraseña",
        description:
          "Recuperación de acceso PRONUXFIN — misma seguridad UX que login.",
      },
      assistant: {
        title: "Centro de inteligencia",
        description:
          "Líneas de trabajo PF / institución — chat PRONUX (Ollama) y enlaces externos.",
      },
      login: {
        title: "Entrar",
        description:
          "Abre tu panel PRONUXFIN — JWT seguro y experiencia institucional.",
      },
      register: {
        title: "Crear cuenta",
        description:
          "Registro PRONUXFIN en segundos — NestJS + PostgreSQL y validación en capas.",
      },
    },
    BolsaHub: {
      badgeGlobal: "Mesa global · bolsa brasileña y activos digitales",
      h1Lead: "Mesa institucional —",
      h1Accent: "Brasil en vivo + liquidez digital global",
      intro:
        "PRONUXFIN prioriza baja latencia editorial: refresco corto para acciones brasileñas y cripto en BRL, proxies de índice rotulados y lenguaje de sala — infraestructura para segundos críticos.",
      lastUpdated: "Última actualización",
      newsRadar: "Radar de noticias",
      riskDisclaimer:
        "Las inversiones conllevan riesgo de pérdida. Las cotizaciones son informativas, pueden sufrir demora y la correduría puede diferi. Esta capa no asesora recomendaciones de compra/venta — educación y método.",
      indicesEyebrow: "Índices · proxies cotizados",
      indicesHint: "Vista sintética para anclaje visual.",
      equitiesBook: "Libro referencia · blue chips",
      thTicker: "Activo",
      thDesc: "Descripción",
      thLast: "Último",
      thDeltaBrl: "Δ BRL",
      thDeltaPct: "Var %",
      cryptoTitle: "Mesa global · cripto (BRL)",
      thPair: "Par",
      thName: "Nombre",
      cryptoFootLead: "Cotizaciones cripto vía",
      cryptoFootTrail:
        ". Respete los términos de uso de la API; valores pueden divergir de sus exchanges.",
      ctaDesk: "¿Necesitas esta mesa en el panel con alertas?",
      ctaRegister: "Abrir cuenta PRONUXFIN",
    },
    ProjecaoHub: {
      eyebrow: "PRONUXFIN · scenario desk",
      h1Lead: "Proyección y escenarios —",
      h1Accent: "metodología institucional",
      lead:
        "La latencia mata ventaja — aquí converge precio, flujo y titulares. Tableros de sesgo alta/baja, no objetivos fantasmas.",
      warnTitle: "Aviso regulatorio y epistémico",
      warnBody:
        "Nada es asesoría personalizada ni retorno garantizado. \"Proyección\" ordena hipótesis macro/mercado para estudio — sin sustituir su diligencia ni perfil de riesgo.",
      sensHeading: "Sensibilidad a datos tiempo real",
      sensBr:
        "Riel acciones BR — polling ~8s y API dinámica (sin CDN en cotizaciones).",
      sensCrypto:
        "Cripto global — tape BRL CoinGecko; serverless cercano en región gru1.",
      sensNews:
        "Noticias BR + mundo — RSS multi‑fuente, refresh cliente ~10s.",
      boardEyebrow: "Cuadro de escenarios",
      boardLead:
        "Cambia sesgo para leer mejor — regímenes de liquidez distintos.",
      biasHigh: "Sesgo alcista",
      biasLow: "Sesgo bajista",
      checklistBull: "Checklist constructivo",
      checklistBear: "Checklist defensivo",
      checklistHint: "Prompts de sala — no señales auto.",
      roadmapTitle: "Roadmap PRONUXFIN",
      roadmapBody:
        "Capas cuant y alertas de régimen llegan al consolidar producción — registro anticipa alertas personalizadas.",
      ctaRegister: "Crear cuenta",
      ctaLiveDesk: "Ir al mercado vivo",
      ctaEducation: "Educación (login)",
      deployFoot:
        "Producción: NEXT_PUBLIC_SITE_URL con dominio final antes del go-live (SEO / OG).",
      bullPoints: p.ProjecaoHub.bullPoints,
      bearPoints: p.ProjecaoHub.bearPoints,
    },
    NewsHub: {
      eyebrow: "PRONUXWIRE · intelligence desk",
      aggregationBadge: "Agregación institucional",
      h1Lead: "Flujo de noticias —",
      h1Accent: "cumplimiento editorial PRONUX",
      subtitle:
        "RSS de medios reconocidos — menos ruido, más método. Ciclo cliente ~10s; fuentes visibles Brasil + mundo.",
      syncLabel: "Última sincronización",
      readFull: "Leer íntegra",
      viewDesk: "Ver mesa vivo",
      loadingHint: "Cargando titulares… Revise red o intente después.",
      editorialFoot:
        "PRONUXFIN muestra contenido terceros vía RSS público — responsabilidad editorial del medio. Sin recomendar inversión.",
      regionBr: "Brasil",
      regionGlobal: "Global",
    },
    Education: {
      metaTitle: "Educación financiera",
      metaDescription: "Trayectorias gamificadas PRONUXFIN — uso responsable de datos.",
      pageTitle: "Educación financiera",
      pageSubtitle: "Artículos, rutas y XP.",
      badge: "Construcción premium",
      progress: "Progreso",
      trails: [
        {
          title: "Fundamentos PRONUX",
          desc: "Presupuesto y hábitos — tronco gamificado.",
          level: "Nivel 1",
          progressPct: "40",
        },
        {
          title: "Inversiones inteligentes",
          desc: "Riesgo, diversificación y escenarios.",
          level: "Nivel 2",
          progressPct: "12",
        },
        {
          title: "IA y datos personales",
          desc: "Privacidad y valor.",
          level: "Avanzado",
          progressPct: "0",
        },
      ],
    },
    NotFound: {
      title: "Página no encontrada",
      errorCode: "Error 404",
      headline: "Esta página no existe en PRONUXFIN",
      body: "URL incorrecto o recurso movido.",
      home: "Inicio",
      dashboard: "Panel",
    },
    ForgotPassword: {
      title: "Recuperar contraseña",
      description:
        "Pronto: flujo por correo tokenizado (SMTP/proveedor). Esta pantalla comparte UX con el resto del auth.",
      emailLabel: "Correo electrónico",
      sentHint:
        "Demo: recibirías un enlace de restablecimiento en este correo.",
      submit: "Enviar instrucciones",
      backLogin: "Volver al inicio de sesión",
    },
  };
}

function frPack() {
  const base = enPack();
  return {
    Seo: {
      siteDescription:
        "Le marché n'attend pas — et vous non plus. Marchés, finances personnelles et éducation autour d'un même desk : données utiles, sources visibles, IA encadrée et ton institutionnel.",
      home: {
        absoluteTitle: "PRONUXFIN — Desk cognitif global pour les marchés",
        description:
          "Le marché n'attend pas — et vous non plus. Marchés, finances personnelles et éducation autour d'un même desk : données utiles, sources visibles, IA encadrée et ton institutionnel.",
        ogTitle: "PRONUXFIN — Desk cognitif pour marchés & finance",
        ogDescription:
          "Marchés en direct avec sources, scénarios, IA disciplinée et console privée — clarté institutionnelle sans hype.",
      },
      bolsa: {
        title: "Desk marchés en direct",
        description:
          "Actions brésiliennes + crypto en BRL rafraîchies souvent — lecture rapide quand le temps manque.",
        ogTitle: "Desk marchés en direct | PRONUXFIN",
        ogDescription:
          "Panneau actions, proxies d'indice & crypto — priorité à la fraîcheur.",
      },
      projecao: {
        title: "Perspectives & scénarios",
        description:
          "Tableaux haussier/baissier pour actions & crypto — méthode PRONUXFIN sans promesse de rendement.",
        ogTitle: "Perspectives & scénarios | PRONUXFIN",
        ogDescription:
          "Infra cognitive pour formuler des hypothèses de marché avec rigueur de desk.",
      },
      noticias: {
        title: "Actualités financières en direct",
        description:
          "Radar PRONUXFIN : agrégation RSS de médias reconnus — sources toujours visibles.",
        ogTitle: "Actualités financières en direct | PRONUXFIN",
        ogDescription:
          "Moins de bruit, plus de contexte — titres pour lecteurs exigeants.",
      },
      forgot: {
        title: "Mot de passe oublié",
        description:
          "Récupération d'accès PRONUXFIN — même sécurité et UX que les autres parcours.",
      },
      assistant: {
        title: "Hub intelligence",
        description:
          "Lignes de travail perso & institution — chat PRONUX (Ollama) et raccourcis externes.",
      },
      login: {
        title: "Connexion",
        description:
          "Ouvrez votre console PRONUXFIN — authentification JWT et expérience institutionnelle.",
      },
      register: {
        title: "Créer un compte",
        description:
          "Inscription PRONUXFIN en quelques secondes — NestJS, PostgreSQL et validation en couches.",
      },
    },
    BolsaHub: {
      badgeGlobal:
        "Desk global · Bourse BR & actifs numériques",
      h1Lead: "Desk institutionnel —",
      h1Accent: "Brasil live + liquidité mondiale",
      intro:
        "PRONUX optimise latence rédactionnelle : refresh court actions BR & crypto en BRL, proxies étiquettés langage mesa.",
      lastUpdated: "Dernière MAJ",
      newsRadar: "Radar infos",
      riskDisclaimer:
        "Investissement comporte perte capital. Quotations indicative — pas reco achat vente.",
      indicesEyebrow: "Indices · proxies",
      indicesHint: "Vue synthétique",
      equitiesBook: "Livre ref · blue chips",
      thTicker: "Ticker",
      thDesc: "Description",
      thLast: "Dernier",
      thDeltaBrl: "Δ BRL",
      thDeltaPct: "Var %",
      cryptoTitle: "Desk mondial · crypto (BRL)",
      thPair: "Paire",
      thName: "Nom",
      cryptoFootLead: "Prix crypto via",
      cryptoFootTrail: ". Conditions API.",
      ctaDesk: "Desk dans dashboard avec alertes ?",
      ctaRegister: "Ouvrir compte PRONUXFIN",
    },
    ProjecaoHub: {
      eyebrow: "PRONUXFIN · scenario desk",
      h1Lead: "Perspective & scénarios —",
      h1Accent: "méthodologie instit.",
      lead: base.ProjecaoHub.lead,
      warnTitle: "Avis rég.",
      warnBody: base.ProjecaoHub.warnBody,
      sensHeading: "Sensibilité data temps reel",
      sensBr: base.ProjecaoHub.sensBr,
      sensCrypto: base.ProjecaoHub.sensCrypto,
      sensNews: base.ProjecaoHub.sensNews,
      boardEyebrow: "Cadre scenarios",
      boardLead: base.ProjecaoHub.boardLead,
      biasHigh: "Biais hausse",
      biasLow: "Biais baisse",
      checklistBull: base.ProjecaoHub.checklistBull,
      checklistBear: base.ProjecaoHub.checklistBear,
      checklistHint: base.ProjecaoHub.checklistHint,
      roadmapTitle: base.ProjecaoHub.roadmapTitle,
      roadmapBody: base.ProjecaoHub.roadmapBody,
      ctaRegister: "Créer compte",
      ctaLiveDesk: "Voir desk vivant",
      ctaEducation: "Éducation (login)",
      deployFoot:
        "Déploiement public : définissez NEXT_PUBLIC_SITE_URL sur votre domaine final avant le go-live (SEO, Open Graph, webhooks infra).",
      bullPoints: base.ProjecaoHub.bullPoints,
      bearPoints: base.ProjecaoHub.bearPoints,
    },
    NewsHub: {
      eyebrow: "PRONUXWIRE · intelligence desk",
      aggregationBadge: "Agrégation institutionnelle",
      h1Lead: "Flux d'actualités —",
      h1Accent: "compliance editorial PRONUX",
      subtitle: base.NewsHub.subtitle,
      syncLabel: "Dernière sync",
      readFull: "Lire l'intégralité",
      viewDesk: "Voir desk vivant",
      loadingHint: "Chargement…",
      editorialFoot:
        "PRONUXFIN agrège tiers via RSS ouvert — sans conseiller investissement.",
      regionBr: "Brésil",
      regionGlobal: "Monde",
    },
    Education: {
      metaTitle: base.Education.metaTitle,
      metaDescription: base.Education.metaDescription,
      pageTitle: "Éducation financière",
      pageSubtitle: "Parcours & XP.",
      badge: base.Education.badge,
      progress: "Progression",
      trails: base.Education.trails.map((tr, i) => ({
        ...tr,
        title:
          [
            "Fondamentaux PRONUX",
            "Investir intelligemment",
            "IA & données perso",
          ][i] ?? tr.title,
        desc:
          ["Budget épargne discipline", "Risques diversifs", "Vie privée"][i] ??
          tr.desc,
        level: ["Niveau 1", "Niveau 2", "Avancé"][i] ?? tr.level,
      })),
    },
    NotFound: {
      title: "Page introuvable",
      errorCode: "Erreur 404",
      headline: "Cette page n'existe pas",
      body: base.NotFound.body,
      home: "Accueil",
      dashboard: base.NotFound.dashboard,
    },
    ForgotPassword: {
      title: "Mot de passe oublié",
      description:
        "Bientôt : flux e-mail tokenisé (SMTP / fournisseur). Même UX que les autres parcours.",
      emailLabel: "E-mail",
      sentHint:
        "Démo : vous recevriez un lien de réinitialisation à cette adresse.",
      submit: "Envoyer les instructions",
      backLogin: "Retour à la connexion",
    },
  };
}

function itPack() {
  const base = enPack();
  return {
    Seo: {
      siteDescription:
        "Il mercato non aspetta — e nemmeno tu. Mercati, finanza personale ed educazione sullo stesso desk: dati utili, fonti visibili, IA disciplinata e tono istituzionale.",
      home: {
        absoluteTitle:
          "PRONUXFIN — Desk cognitivo globale per mercati",
        description:
          "Il mercato non aspetta — e nemmeno tu. Mercati, finanza personale ed educazione sullo stesso desk: dati utili, fonti visibili, IA disciplinata e tono istituzionale.",
        ogTitle: "PRONUXFIN — Desk cognitivo per mercati & finanza",
        ogDescription:
          "Mercati live con fonti, scenari, IA contenuta e cruscotto privato — chiarezza istituzionale senza hype.",
      },
      bolsa: {
        title: "Desk mercati live",
        description:
          "Azioni brasiliane + crypto in BRL aggiornate spesso — lettura veloce quando manca tempo.",
        ogTitle: "Desk mercati live | PRONUXFIN",
        ogDescription:
          "Pannello azioni & crypto — priorità sulla freschezza.",
      },
      projecao: {
        title: "Prospettiva e scenari",
        description:
          "Tabelle bullish/bearish per azioni e crypto — metodo PRONUXFIN senza promesse di rendimento.",
        ogTitle: "Prospettiva e scenari | PRONUXFIN",
        ogDescription:
          "Infrastruttura cognitiva per ipotesi di mercato con rigore da desk.",
      },
      noticias: {
        title: "Notizie finanziarie live",
        description:
          "Radar PRONUXFIN: RSS aggregati da testate rinomate — le fonti restano sempre visibili.",
        ogTitle: "Notizie finanziarie live | PRONUXFIN",
        ogDescription:
          "Meno rumore, più contesto — titoli per lettori esigenti.",
      },
      forgot: {
        title: "Password dimenticata",
        description:
          "Ripristino accesso PRONUXFIN — sicurezza e UX uniformi ai restanti flussi.",
      },
      assistant: {
        title: "Hub intelligence",
        description:
          "Linee di lavoro personali & istituzionali — chat PRONUX (Ollama) e scorciatoie verso esterni.",
      },
      login: {
        title: "Accedi",
        description:
          "Apri il pannello PRONUXFIN — autenticazione sicura JWT ed esperienza istituzionale.",
      },
      register: {
        title: "Crea account",
        description:
          "Registrazione PRONUXFIN in pochi secondi — NestJS, PostgreSQL e validazione stratificata.",
      },
    },
    BolsaHub: {
      ...base.BolsaHub,
      badgeGlobal: base.BolsaHub.badgeGlobal.replace("Brazilian", "Brasiliane"),
      h1Accent: base.BolsaHub.h1Accent.replace("Brazil", "Brasile"),
      lastUpdated: "Ultimo aggiornamento",
      newsRadar: "Radar news",
      thTicker: "Ticker",
      thDesc: "Descrizione",
    },
    ProjecaoHub: {
      ...base.ProjecaoHub,
      h1Lead: "Proiezione e scenari —",
      roadmapTitle: "Roadmap PRONUXFIN",
    },
    NewsHub: {
      ...base.NewsHub,
      regionBr: "Brasile",
      regionGlobal: "Globale",
    },
    Education: {
      metaTitle: "Educazione finanziaria",
      metaDescription: base.Education.metaDescription,
      pageTitle: "Educazione finanziaria",
      pageSubtitle: base.Education.pageSubtitle,
      badge: "Build premium attivo",
      progress: base.Education.progress,
      trails: base.Education.trails.map((tr, i) => ({
        ...tr,
        title:
          [
            "Fondamenti PRONUX",
            "Investimenti intelligenti",
            "IA & dati personali",
          ][i] ?? tr.title,
        desc:
          [
            "Budget risparmio discipline",
            "Rischio e diversifica",
            "Privacy e valor",
          ][i] ?? tr.desc,
        level:
          ["Livello 1", "Livello 2", "Avanzato"][i] ?? tr.level,
      })),
    },
    NotFound: {
      ...base.NotFound,
      title: "Pagina non trovata",
      errorCode: "Errore 404",
      headline: "Pagina PRONUXFIN inesistente",
      dashboard: base.NotFound.dashboard,
    },
    ForgotPassword: {
      title: "Password dimenticata",
      description:
        "Presto: flusso via e-mail tokenizzato (SMTP / provider). Stessa UX delle altre schermate di accesso.",
      emailLabel: "Email",
      sentHint:
        "Demo: riceveresti un link di reimpostazione a questo indirizzo.",
      submit: "Invia istruzioni",
      backLogin: "Torna al login",
    },
  };
}

function zhPack() {
  const base = enPack();
  return {
    Seo: {
      siteDescription:
        "市场不等你——你也不该蹉跎。公开市场、私人财务与教育共享同一工作台。",
      home: {
        absoluteTitle: "PRONUXFIN — 面向全球市场的认知型工作台",
        description:
          "市场不等你——你也不该蹉跎。实时数据、可查来源、受约束的 AI 与机构化表述——拒绝 hype，设计即透明。",
        ogTitle: "PRONUXFIN — 面向市场与财富的认知工作台",
        ogDescription:
          "带来源的实盘、情境推演、受控 AI 与私人仪表盘——机构级的清晰。",
      },
      bolsa: {
        title: "实盘市场工作台",
        description: "巴西股票与 BRL 加密短周期刷新——赶时间也能读。",
        ogTitle: "实盘市场工作台 | PRONUXFIN",
        ogDescription: "兼顾指数 Proxy 与加密的交易台面。",
      },
      projecao: {
        title: "前瞻与情景",
        description: "股与加密的高低情景板——PRONUXFIN 方法，不设收益承诺。",
        ogTitle: "前瞻与情景 | PRONUXFIN",
        ogDescription: "用机构级脚手架组织市场假设。",
      },
      noticias: {
        title: "财经资讯直播",
        description: "PRONUXFIN 雷达：权威 RSS 聚合，高频刷新来源可见。",
        ogTitle: "财经资讯直播 | PRONUXFIN",
        ogDescription: "更少噪音，更重方法。",
      },
      forgot: {
        title: "找回密码",
        description:
          "PRONUXFIN 账户恢复流程——与其余登录路径相同的安全与交互方式。",
      },
      assistant: {
        title: "智能中心",
        description:
          "个人与机构的作业线——PRONUX 对话（Ollama）及外部工具的快捷入口。",
      },
      login: {
        title: "登录",
        description: "打开 PRONUXFIN 控制台——安全 JWT 与一致的机构级体验。",
      },
      register: {
        title: "创建账户",
        description:
          "数秒完成注册——NestJS + PostgreSQL，分层校验。",
      },
    },
    BolsaHub: {
      badgeGlobal: "全球工作台 · 巴西现货与加密",
      h1Lead: "机构工作台 —",
      h1Accent: "巴西实时 + 全球数字流动性",
      intro:
        "PRONUXFIN 强调编辑级低延迟：巴西股票与 BRL 加密短刷新、明示指数 Proxy——为关键秒而生。",
      lastUpdated: "最近更新",
      newsRadar: "资讯雷达",
      riskDisclaimer:
        "投资有风险。行情仅供参考，可能存在延迟或与券商不符。不构成买卖建议——专注教育与方法论。",
      indicesEyebrow: "指数 · Proxy 列表",
      indicesHint: "辅助视觉的合成视图，非官方基准。",
      equitiesBook: "参考簿 · 蓝筹",
      thTicker: "代码",
      thDesc: "说明",
      thLast: "最新",
      thDeltaBrl: "Δ BRL",
      thDeltaPct: "涨跌%",
      cryptoTitle: "全球工作台 · 加密（BRL）",
      thPair: "对",
      thName: "名称",
      cryptoFootLead: "加密行情经由",
      cryptoFootTrail:
        ". 遵守 API 条款；数值或为示意，与各交易所可能存在差异。",
      ctaDesk: "想要在仪表盘集成此工作台与告警？",
      ctaRegister: "开通 PRONUXFIN",
    },
    ProjecaoHub: {
      eyebrow: "PRONUXFIN · scenario desk",
      h1Lead: "前瞻与情景 —",
      h1Accent: "机构方法论",
      lead:
        "当延迟消解优势——价格、资金流与标题在这里快速汇合，用偏多/偏空棋盘代替空洞目标。",
      warnTitle: "监管与认知声明",
      warnBody:
        "本页不包含个性化投顾、下单指令或保底收益。「前瞻」意为整理宏观/市场假设供研究——专业 desk 同源框架仍需您自担尽调与风险偏好。",
      sensHeading: "实时数据敏感度",
      sensBr:
        "巴西股票轨——约 8 秒轮询，行情接口 CDN 不落缓存（设计如此）。",
      sensCrypto:
        "全球加密——经由 CoinGecko 的 BRL 报价同台刷新；近似用户部署 serverless（如 gru1）。",
      sensNews:
        "巴西 + 全球新闻——多端 RSS；客户端约 10 秒刷新。",
      boardEyebrow: "情景棋盘",
      boardLead:
        "切换偏置读懂结构——流动性制度股与加密反应不同。",
      biasHigh: "偏多",
      biasLow: "偏空",
      checklistBull: "建设清单",
      checklistBear: "防御清单",
      checklistHint: "Desk Prompt —— 并非自动下单信号。",
      roadmapTitle: "PRONUXFIN 路线图",
      roadmapBody:
        "概率面层、头寸压力场景与制度告警随域成熟分批上线——注册可优先排队自定义提醒。",
      ctaRegister: "创建账号",
      ctaLiveDesk: "打开实盘工作台",
      ctaEducation: "教育（需登录）",
      deployFoot:
        "生产部署：上线前请将 NEXT_PUBLIC_SITE_URL 设为正式域名，以便 SEO/OGraph/回调。",
      bullPoints: base.ProjecaoHub.bullPoints,
      bearPoints: base.ProjecaoHub.bearPoints,
    },
    NewsHub: {
      eyebrow: "PRONUXWIRE · intelligence desk",
      aggregationBadge: "机构级聚合",
      h1Lead: "资讯流 —",
      h1Accent: "PRONUX 编辑合规",
      subtitle:
        "权威媒体 RSS 精选——少噪音多看方法。此处客户端约十秒节律；总能看到来源——巴西与全球同一标尺。",
      syncLabel: "最近同步",
      readFull: "阅读原文",
      viewDesk: "查看实盘工作台",
      loadingHint: "加载标题… 若超时请检查网络或稍后重试。",
      editorialFoot:
        "PRONUXFIN 通过公开 RSS 展示第三方稿件；原文责任归出版方——不构成投顾建议。",
      regionBr: "巴西",
      regionGlobal: "全球",
    },
    Education: {
      metaTitle: base.Education.metaTitle.replace("Financial", "金融素养"),
      metaDescription:
        "PRONUXFIN 游戏化路径：基础投资与负责任地使用数据。",
      pageTitle: "金融素养",
      pageSubtitle: base.Education.pageSubtitle,
      badge: "高级功能建设中",
      progress: base.Education.progress,
      trails: [
        {
          title: "PRONUX 基础",
          desc: "预算、应急金与行为习惯。",
          level: "第一阶段",
          progressPct: "40",
        },
        {
          title: "进阶投资",
          desc: "风险、分散化与情境。",
          level: "第二阶段",
          progressPct: "12",
        },
        {
          title: "AI 与个人数据",
          desc: "隐私保护与价值对齐。",
          level: "高级",
          progressPct: "0",
        },
      ],
    },
    NotFound: {
      title: "找不到页面",
      errorCode: "404",
      headline: "PRONUXFIN 没有此页面",
      body: "链接可能错误或资源已迁移。返回首页或进入控制台。",
      home: "首页",
      dashboard: base.NotFound.dashboard,
    },
    ForgotPassword: {
      title: "找回密码",
      description:
        "即将推出：基于邮件令牌的安全流程（SMTP / 服务商）。界面与其他登录旅程一致。",
      emailLabel: "电子邮件",
      sentHint: "演示：您会在此邮箱收到重置链接。",
      submit: "发送说明邮件",
      backLogin: "返回登录",
    },
  };
}

function mergeLocales() {
  const locales = [
    "pt-BR.json",
    "en.json",
    "es.json",
    "fr.json",
    "it.json",
    "zh-CN.json",
  ];
  for (const filename of locales) {
    const key = filename.replace(".json", "");
    const pack = PACKS[key];
    if (!pack) throw new Error("Missing pack for " + key);
    const filepath = path.join(messagesDir, filename);
    /** @type {Record<string, unknown>} */
    const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
    for (const [ns, value] of Object.entries(pack)) {
      data[ns] = value;
    }
    if (filename === "pt-BR.json" && data.AiHub) {
      data.AiHub = {
        ...data.AiHub,
        metaDescription:
          pack.Seo?.assistant?.description ??
          String(data.AiHub.pageLead ?? ""),
      };
    }
    if (filename !== "pt-BR.json") {
      if (data.AiHub) {
        data.AiHub = {
          ...data.AiHub,
          metaDescription: pack.Seo?.assistant?.description ?? data.AiHub.pageLead,
        };
      }
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n");
    console.log("merged", filename);
  }
}

mergeLocales();
