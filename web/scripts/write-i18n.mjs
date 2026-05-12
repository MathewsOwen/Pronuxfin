/**
 * One-shot helper to regenerate locale JSON (development).
 * Run: node scripts/write-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "messages");

const ptBR = {
  Language: {
    switchAria: "Alterar idioma",
    listAria: "Idiomas disponíveis",
    names: {
      "pt-BR": "Português (BR)",
      en: "English",
      es: "Español",
      "zh-CN": "简体中文",
      fr: "Français",
      it: "Italiano",
    },
  },
  SkipLink: { label: "Ir para o conteúdo" },
  Nav: {
    market: "Mercado",
    projecao: "Projeção",
    news: "Notícias",
    ia: "IA",
    benefits: "Benefícios",
    features: "Recursos",
    product: "Produto",
    login: "Entrar",
    start: "Começar grátis",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
  },
  Hero: {
    badge: "PRONUXFIN · sistema cognitivo de mercados",
    titleLead: "Clareza sob pressão —",
    titleAccent: "infraestrutura que respeita sua decisão",
    subtitle:
      "Psicologia de mercado ensina que <highlight>confiança nasce de precisão</highlight>, não de gritaria. A PRONUXFIN organiza dados, sessão e linguagem de mesa para você pensar com método — IA como amplificador cognitivo, não como promessa mágica.",
    ctaPrimary: "Iniciar na infraestrutura",
    ctaSecondary: "Ver superfície do produto",
    pillarRitmo: "Ritmo",
    pillarRitmoVal: "Priorizado",
    pillarRitmoDesc: "mesa & tape em ciclo curto — tempo virando vantagem operacional",
    pillarGov: "Governança",
    pillarGovVal: "Explícita",
    pillarGovDesc:
      "disclaimers e proxies rotulados — confiança sem storytelling falso",
    pillarStack: "Stack",
    pillarStackVal: "Prod-ready",
    pillarStackDesc: "Next.js · NestJS · PostgreSQL · camadas validadas",
    ethicsNote:
      "Marketing ético: transparência de demo, ausência de métricas fabricadas, foco em método.",
  },
  HeroPreview: {
    badge: "Preview · UI",
    disclaimerCorner:
      "Ilustração visual — valores fictícios para hierarquia de interface.",
    patrimony: "Patrimônio (demo)",
    maskedValue: "R$ ·······",
    deltaBadge: "Δ ilustrativo",
    cognitiveTitle: "Camada cognitiva",
    cognitiveBody:
      "Em produção, o assistente sintetiza padrões dos seus dados com linguagem neutra — você valida cada insight antes de agir. Sem alarmismo; fluxo pensado para reduzir carga mental, não para empurrar trades.",
  },
  Trust: {
    eyebrow: "Confiança perceptiva",
    lead:
      "Marcas que dominam mercados institucionais vendem <highlight>previsibilidade cognitiva</highlight>: menos ruído, mais estrutura. A PRONUXFIN foi desenhada para que cada tela reforce competência — o mesmo estímulo visual que traders associam a bloomberg-like clarity.",
    glassesNote:
      "Psicologia aplicada: hierarquia forte, tipografia legível, ausência de métricas falsas na superfície pública.",
    symmetryTitle: "Simetria informacional",
    symmetryHint:
      "o que você vê é o que existe — demo claramente marcada",
    securityTitle: "Segurança em camadas",
    securityHint: "JWT, validação server-side, caminho para OAuth",
    perfTitle: "Performance consciente",
    perfHint: "rotas dinâmicas onde o mercado exige frescor",
    aiTitle: "IA sob disciplina",
    aiHint: "explicabilidade e ritmo humano, não hype",
    footerRail:
      "Identidade tecnológica · mesma régua visual nas páginas públicas e no app",
  },
  Ia: {
    eyebrow: "Inteligência PRONUX",
    title: "Assistente que amplifica — não substitui — o seu julgamento",
    description:
      "Modelagem centrada em contexto: a IA organiza sinais, evidências e lacunas para você decidir com menores custos cognitivos. Produto sério evita prometer certezas onde há apenas probabilidade.",
    bullets:
      "Diagnóstico de hábitos sem julgamento moral na UI|Respostas em linguagem natural com trilha de raciocínio visível|Camada extensível para novos modelos sem travar o produto",
  },
  Benefits: {
    eyebrow: "Experiência",
    title: "Benefícios percebidos no primeiro contato",
    description:
      "Microinterações calibradas para autoridade: produtos financeiros de alto respeito priorizam previsibilidade visual — cada elemento reforça que você está em ambiente profissional.",
    b1t: "IA com cadência humana",
    b1d:
      "Respostas pensadas para fluência cognitiva — você entende o raciocínio antes de agir, reduzindo decisões impulsivas.",
    b2t: "Painéis com hierarquia institucional",
    b2d:
      "Dados densos onde precisam ser densos; respiro visual onde o cérebro descansa. Menos fadiga, mais foco.",
    b3t: "Confiança auditável",
    b3d:
      "Autenticação moderna e camadas de validação — segurança percebida como parte da marca, não como asterisco.",
    b4t: "Ambição sem diluir ética",
    b4d:
      "Roadmap global com disclaimers explícitos: escala não compete com transparência regulatória.",
  },
  Features: {
    eyebrow: "Roadmap",
    title: "Capacidades em expansão responsável",
    description:
      "Entrega contínua sem comprometer estabilidade perceptiva: cada sprint aumenta profundidade técnica mantendo clareza para quem opera sob pressão.",
    chip: "Ciclo de release disciplinado",
    items:
      "Mesa de equities brasileiras + cripto BRL + radar Brasil/mundo na mesma superfície cognitiva|Organização de fluxos financeiros com narrativa clara|Metas e simulações com linguagem neutra — sem alarmismo|Trilhas educacionais que respeitam ritmo de absorção|Insights mensais explicáveis — método antes de sugestão|Alertas configuráveis com limiar definido por você|Base modular preparada para agentes e novos provedores",
  },
  DashboardMock: {
    eyebrow: "Produto",
    title: "Superfície do painel — mock ilustrativo",
    description:
      "Layout inspirado em mesas profissionais: vidro, tipografia dual (humanista + mono) e dados tabulares. Os números abaixo são placeholders — não representam carteira real.",
    banner:
      "Demonstração visual apenas · nenhum valor é real neste mock",
    saldoLabel: "Saldo geral (demo)",
    maskedSaldo: "R$ ·······",
    varBadge: "Variação ilustrativa",
    fluxoTitle: "Fluxo mensal",
    iaSampleTitle: "Narrativa IA (exemplo)",
    iaSampleBody:
      "Em ambiente real, o sistema sugere hipóteses verificáveis — você decide o que entra no plano. Linguagem neutra reduz viés de confirmação e ansiedade operacional.",
    metaTitle: "Meta (ilustrativa)",
    metaFooter:
      "Barra apenas visual — não indica progresso real de usuário",
  },
  Cta: {
    title: "Compromisso com método — não com urgência artificial",
    description:
      "Cadastre-se para experimentar o fluxo completo com autenticação NestJS + PostgreSQL. O mesmo princípio de mercado que valoriza transparência na mesa pública vale dentro do app: você sempre sabe o que é dado vivo, o que é hipótese e o que é demonstração.",
    primary: "Abrir conta PRONUXFIN",
    secondary: "Já tenho conta",
  },
  Footer: {
    tagline:
      "Infraestrutura cognitiva para mercados e vida financeira. Marca construída para autoridade percebida: precisão verbal, densidade técnica sob controle e respeito ao tempo de decisão do usuário.",
    product: "Produto",
    linksFeatures: "Recursos",
    linksMarket: "Mercado ao vivo",
    linksNews: "Notícias",
    linksProjecao: "Projeção & cenários",
    linksDemo: "Demonstração",
    linksEducation: "Educação",
    account: "Conta",
    login: "Entrar",
    register: "Cadastro",
    forgot: "Recuperar senha",
    stack:
      "© {year} PRONUXFIN. Stack: Next.js · NestJS · PostgreSQL · Prisma.",
    disclaimer:
      "PRONUXFIN não constitui assessoria de investimentos; demos são ilustrativas quando assim marcadas.",
  },
  AuthLayout: {
    headlineLead: "Inteligência financeira com aparência de",
    headlineAccent: "produto global",
    subtitle:
      "Autenticação segura, painéis vivos e base preparada para IA — cada detalhe pensado para transmitir confiança e inovação.",
    footerTech: "Criptografia em trânsito · JWT · validação em camadas",
  },
  Login: {
    title: "Entrar",
    description: "Acesse seu painel financeiro inteligente.",
    email: "E-mail",
    password: "Senha",
    submit: "Entrar",
    submitting: "Entrando…",
    forgotLink: "Esqueci minha senha",
    registerLead: "Novo por aqui?",
    registerLink: "Criar conta grátis",
    errorGeneric: "Erro ao entrar",
  },
  Register: {
    title: "Criar conta",
    description: "Configure sua conta PRONUXFIN em segundos.",
    name: "Nome (opcional)",
    email: "E-mail",
    password: "Senha",
    passwordHint: "Mínimo 8 caracteres, com letras e números.",
    submit: "Cadastrar",
    submitting: "Criando…",
    loginLead: "Já tem conta?",
    loginLink: "Entrar",
    errorGeneric: "Erro ao cadastrar",
  },
  AppShell: {
    panel: "Painel",
    market: "Mercado",
    projecao: "Projeção",
    news: "Notícias",
    assistant: "Assistente IA",
    education: "Educação",
    logout: "Sair",
    accountLabel: "Conta",
  },
  Dashboard: {
    eyebrow: "Resumo inteligente",
    greeting: "Olá,",
    subtitle:
      "Dados de exemplo para visual premium — conecte transações reais quando as rotas de API estiverem prontas.",
    kpiConsolidated: "Saldo consolidado",
    kpiIncome: "Receitas (mês)",
    kpiExpense: "Despesas (mês)",
    kpiGoals: "Metas ativas",
    kpiGoalsHint: "2 perto do prazo",
    flowTitle: "Fluxo recente",
    flowSubtitle: "Últimas categorias com maior peso",
    aiTitle: "IA · insights",
    aiSubtitle: "Gerados automaticamente (demo)",
    aiP1:
      "Suas despesas fixas representam 38% da renda — dentro da zona saudável para o seu perfil.",
    aiP2:
      "Há espaço para aumentar aportes em 12% sem comprometer metas.",
    aiCta:
      "Abra o assistente para simular cenários com linguagem natural.",
  },
  MarketDesk: {
    sessionEyebrow: "PRONUXFIN · mesa global de mercados",
    clockLabel: "Relógio operacional",
    clockTz: "BRT",
    clockDetail: "America/Sao_Paulo · dados agregados PRONUX",
    stripEyebrow: "PRONUXFIN · ticker tape",
    stripLive: "Ao vivo",
    stripHint:
      "Ações BR + cripto (BRL) · cliente ~8s · API sem cache CDN ·",
    stripDemoEquities: "ações demo",
    stripLiveEquities: "ações brapi",
    stripDemoCrypto: "cripto demo",
    stripLiveCrypto: "cripto CoinGecko",
    stripCta: "Mesa completa",
  },
};

function splitBullets(s) {
  return s.split("|");
}

/** Deep clone & translate tree — locales produced inline */
function buildLocale(base, transforms) {
  const out = structuredClone(base);
  function walk(o, path = []) {
    for (const k of Object.keys(o)) {
      const p = [...path, k].join(".");
      const v = o[k];
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, [...path, k]);
      else if (typeof v === "string" && transforms[p]) o[k] = transforms[p];
    }
  }
  walk(out);
  return out;
}

const transformsEn = {
  "Language.switchAria": "Change language",
  "Language.listAria": "Available languages",
  "SkipLink.label": "Skip to content",
  "Nav.market": "Markets",
  "Nav.projecao": "Outlook",
  "Nav.news": "News",
  "Nav.ia": "AI",
  "Nav.benefits": "Benefits",
  "Nav.features": "Features",
  "Nav.product": "Product",
  "Nav.login": "Sign in",
  "Nav.start": "Get started",
  "Nav.menuOpen": "Open menu",
  "Nav.menuClose": "Close menu",
  "Hero.badge": "PRONUXFIN · cognitive markets stack",
  "Hero.titleLead": "Clarity under pressure —",
  "Hero.titleAccent": "infrastructure that respects your judgment",
  "Hero.subtitle":
    "Market psychology shows that <highlight>trust comes from precision</highlight>, not noise. PRONUXFIN structures data, session context, and desk-grade language so you think with method — AI as cognitive amplification, not magic.",
  "Hero.ctaPrimary": "Start with the infrastructure",
  "Hero.ctaSecondary": "View product surface",
  "Hero.pillarRitmo": "Cadence",
  "Hero.pillarRitmoVal": "Prioritized",
  "Hero.pillarRitmoDesc":
    "desk & ticker on short cycles — time becomes operational edge",
  "Hero.pillarGov": "Governance",
  "Hero.pillarGovVal": "Explicit",
  "Hero.pillarGovDesc":
    "disclaimers & labelled proxies — trust without fake narratives",
  "Hero.pillarStack": "Stack",
  "Hero.pillarStackVal": "Prod-ready",
  "Hero.pillarStackDesc": "Next.js · NestJS · PostgreSQL · hardened layers",
  "Hero.ethicsNote":
    "Ethical marketing: transparent demos, no fabricated headline metrics, focus on method.",
  "HeroPreview.badge": "Preview · UI",
  "HeroPreview.disclaimerCorner":
    "Visual illustration — fictional values for layout hierarchy.",
  "HeroPreview.patrimony": "Net worth (demo)",
  "HeroPreview.maskedValue": "$ ·······",
  "HeroPreview.deltaBadge": "Illustrative Δ",
  "HeroPreview.cognitiveTitle": "Cognitive layer",
  "HeroPreview.cognitiveBody":
    "In production, the assistant synthesizes patterns from your data in neutral language — you validate each insight before acting. No scare tactics; designed to reduce cognitive load, not push trades.",
  "Trust.eyebrow": "Perceived trust",
  "Trust.lead":
    "Institutional-grade brands sell <highlight>cognitive predictability</highlight>: less noise, more structure. PRONUXFIN is crafted so every surface signals competence — the same visual cue traders associate with terminal-grade clarity.",
  "Trust.glassesNote":
    "Applied psychology: strong hierarchy, readable type, no fake metrics on public surfaces.",
  "Trust.symmetryTitle": "Information symmetry",
  "Trust.symmetryHint":
    "what you see is what exists — demos clearly labelled",
  "Trust.securityTitle": "Layered security",
  "Trust.securityHint": "JWT, server-side validation, path to OAuth",
  "Trust.perfTitle": "Conscious performance",
  "Trust.perfHint": "dynamic routes where markets demand freshness",
  "Trust.aiTitle": "Disciplined AI",
  "Trust.aiHint": "explainability and human cadence, not hype",
  "Trust.footerRail":
    "Technical identity · same visual rule on marketing and app",
  "Ia.title":
    "Assistant that amplifies — never replaces — your judgment",
  "Ia.description":
    "Context-first modelling: AI organizes signals, evidence, and gaps so you decide with lower cognitive cost. Serious products avoid promising certainty where only probability exists.",
  "Ia.bullets":
    "Habit diagnostics without moral judgment in the UI|Natural-language answers with visible reasoning traces|Extensible model layer without locking the product",
  "Benefits.title": "Benefits felt on first contact",
  "Benefits.description":
    "Micro-interactions tuned for authority signals: respected finance products prioritize visual predictability — every element signals a professional environment.",
  "Benefits.b1t": "Human-paced AI",
  "Benefits.b1d":
    "Responses tuned for cognitive fluency — you grasp the reasoning before acting, reducing impulse.",
  "Benefits.b2t": "Institutional panel hierarchy",
  "Benefits.b2d":
    "Dense data where density belongs; breathing room where your brain rests. Less fatigue, more focus.",
  "Benefits.b3t": "Auditable trust",
  "Benefits.b3d":
    "Modern authentication and layered validation — security feels like brand, not fine print.",
  "Benefits.b4t": "Ambition without diluted ethics",
  "Benefits.b4d":
    "Global roadmap with explicit disclaimers: scale never trades off regulatory honesty.",
  "Features.title": "Capabilities expanding responsibly",
  "Features.description":
    "Continuous delivery without breaking perceptual stability: each sprint adds technical depth while staying clear for operators under pressure.",
  "Features.chip": "Disciplined release cadence",
  "Features.items":
    "Brazilian equities desk + crypto BRL + BR/global news on one cognitive surface|Cash-flow organization with clear narrative|Goals & simulations with neutral language — no scare tactics|Education tracks that respect absorption pace|Monthly insights explained — method before suggestion|Configurable alerts with thresholds you define|Modular base ready for agents & providers",
  "DashboardMock.title": "Panel surface — illustrative mock",
  "DashboardMock.description":
    "Layout inspired by professional desks: glass, dual typography (humanist + mono), and tabular data. Figures below are placeholders — not a real portfolio.",
  "DashboardMock.banner":
    "Visual demo only · no real balances in this mock",
  "DashboardMock.saldoLabel": "Balance (demo)",
  "DashboardMock.maskedSaldo": "$ ·······",
  "DashboardMock.varBadge": "Illustrative move",
  "DashboardMock.fluxoTitle": "Monthly flow",
  "DashboardMock.iaSampleTitle": "AI narrative (sample)",
  "DashboardMock.iaSampleBody":
    "In production the system proposes verifiable hypotheses — you choose what enters the plan. Neutral wording lowers confirmation bias and trading anxiety.",
  "DashboardMock.metaTitle": "Goal (illustrative)",
  "DashboardMock.metaFooter":
    "Bar is decorative — not real user progress",
  "Cta.title": "Commitment to method — not artificial urgency",
  "Cta.description":
    "Sign up to experience the full NestJS + PostgreSQL authenticated flow. The same transparency principle we use on public desks applies inside the app: you always know live data vs hypothesis vs demo.",
  "Cta.primary": "Open PRONUXFIN account",
  "Cta.secondary": "I already have an account",
  "Footer.tagline":
    "Cognitive infrastructure for markets and personal finance. Built for perceived authority: verbal precision, controlled technical density, respect for decision time.",
  "Footer.linksFeatures": "Features",
  "Footer.linksMarket": "Live markets",
  "Footer.linksNews": "News",
  "Footer.linksProjecao": "Outlook & scenarios",
  "Footer.linksDemo": "Demo",
  "Footer.linksEducation": "Education",
  "Footer.stack":
    "© {year} PRONUXFIN. Stack: Next.js · NestJS · PostgreSQL · Prisma.",
  "Footer.disclaimer":
    "PRONUXFIN is not investment advice; demos are illustrative when marked.",
  "AuthLayout.headlineLead": "Financial intelligence that feels like a",
  "AuthLayout.headlineAccent": "global product",
  "AuthLayout.subtitle":
    "Secure authentication, live dashboards, IA-ready foundations — every detail engineered for trust and innovation signals.",
  "AuthLayout.footerTech": "Encryption in transit · JWT · layered validation",
  "Login.title": "Sign in",
  "Login.description": "Access your intelligent finance dashboard.",
  "Login.email": "Email",
  "Login.password": "Password",
  "Login.submit": "Sign in",
  "Login.submitting": "Signing in…",
  "Login.forgotLink": "Forgot password",
  "Login.registerLead": "New here?",
  "Login.registerLink": "Create free account",
  "Login.errorGeneric": "Could not sign in",
  "Register.title": "Create account",
  "Register.description": "Set up your PRONUXFIN account in seconds.",
  "Register.name": "Name (optional)",
  "Register.email": "Email",
  "Register.password": "Password",
  "Register.passwordHint": "At least 8 characters with letters and numbers.",
  "Register.submit": "Register",
  "Register.submitting": "Creating…",
  "Register.loginLead": "Already registered?",
  "Register.loginLink": "Sign in",
  "Register.errorGeneric": "Could not register",
  "AppShell.panel": "Dashboard",
  "AppShell.market": "Markets",
  "AppShell.projecao": "Outlook",
  "AppShell.news": "News",
  "AppShell.assistant": "AI assistant",
  "AppShell.education": "Education",
  "AppShell.logout": "Sign out",
  "AppShell.accountLabel": "Account",
  "Dashboard.eyebrow": "Smart summary",
  "Dashboard.greeting": "Hello,",
  "Dashboard.subtitle":
    "Sample data for a premium UI — wire real transactions when APIs land.",
  "Dashboard.kpiConsolidated": "Consolidated balance",
  "Dashboard.kpiIncome": "Income (month)",
  "Dashboard.kpiExpense": "Expenses (month)",
  "Dashboard.kpiGoals": "Active goals",
  "Dashboard.kpiGoalsHint": "2 nearing deadline",
  "Dashboard.flowTitle": "Recent flow",
  "Dashboard.flowSubtitle": "Heaviest categories lately",
  "Dashboard.aiTitle": "AI · insights",
  "Dashboard.aiSubtitle": "Auto-generated (demo)",
  "Dashboard.aiP1":
    "Fixed expenses are ~38% of income — within a healthy band for your profile.",
  "Dashboard.aiP2":
    "Headroom to raise contributions ~12% without breaking goals.",
  "Dashboard.aiCta":
    "Open the assistant to simulate scenarios in natural language.",
  "MarketDesk.sessionEyebrow": "PRONUXFIN · global markets desk",
  "MarketDesk.clockLabel": "Operational clock",
  "MarketDesk.clockDetail": "America/Sao_Paulo · PRONUX aggregated data",
  "MarketDesk.stripEyebrow": "PRONUXFIN · ticker tape",
  "MarketDesk.stripLive": "Live",
  "MarketDesk.stripHint":
    "Brazilian equities + crypto (BRL) · ~8s client poll · API without CDN cache ·",
  "MarketDesk.stripDemoEquities": "equities demo",
  "MarketDesk.stripLiveEquities": "equities brapi",
  "MarketDesk.stripDemoCrypto": "crypto demo",
  "MarketDesk.stripLiveCrypto": "crypto CoinGecko",
  "MarketDesk.stripCta": "Full desk",
  "Ia.eyebrow": "PRONUX Intelligence",
  "Benefits.eyebrow": "Experience",
  "Features.eyebrow": "Roadmap",
  "DashboardMock.eyebrow": "Product",
  "Footer.product": "Product",
  "Footer.account": "Account",
};

const en = buildLocale(ptBR, transformsEn);

/** Patches applied on top of English so locales are not half-Portuguese */
const transformsEs = {
  "Language.switchAria": "Cambiar idioma",
  "Language.listAria": "Idiomas disponibles",
  "SkipLink.label": "Ir al contenido",
  "Nav.login": "Entrar",
  "Nav.start": "Empezar gratis",
  "Hero.titleLead": "Claridad bajo presión —",
  "Hero.titleAccent": "infraestructura que respeta tu decisión",
  "Hero.subtitle":
    "La psicología de mercado muestra que <highlight>la confianza nace de la precisión</highlight>. PRONUXFIN ordena datos y lenguaje de mesa para pensar con método — IA como amplificación cognitiva.",
  "Hero.ctaPrimary": "Empezar con la infraestructura",
  "Hero.ctaSecondary": "Ver superficie del producto",
  "Login.title": "Entrar",
  "Login.submit": "Entrar",
  "Login.submitting": "Iniciando sesión…",
  "Register.title": "Crear cuenta",
  "Register.submit": "Registrarse",
  "Register.submitting": "Creando cuenta…",
  "Register.passwordHint": "Mínimo 8 caracteres con letras y números.",
  "AppShell.logout": "Salir",
  "Dashboard.greeting": "Hola,",
  "MarketDesk.stripCta": "Mesa completa",
};

const es = buildLocale(en, transformsEs);

const transformsFr = {
  "Language.switchAria": "Changer de langue",
  "Language.listAria": "Langues disponibles",
  "SkipLink.label": "Aller au contenu",
  "Nav.start": "Commencer gratuitement",
  "Hero.titleLead": "Clarté sous pression —",
  "Hero.titleAccent": "une infrastructure qui respecte votre décision",
  "Login.title": "Connexion",
  "Login.submit": "Se connecter",
  "Register.title": "Créer un compte",
  "Register.submit": "S'inscrire",
  "Login.submitting": "Connexion…",
  "Register.submitting": "Création du compte…",
  "Register.passwordHint": "Au moins 8 caractères, lettres et chiffres.",
  "AppShell.logout": "Déconnexion",
  "Dashboard.greeting": "Bonjour,",
  "MarketDesk.stripCta": "Console complète",
};

const fr = buildLocale(en, transformsFr);

const transformsIt = {
  "Language.switchAria": "Cambia lingua",
  "Language.listAria": "Lingue disponibili",
  "SkipLink.label": "Vai al contenuto",
  "Nav.start": "Inizia gratis",
  "Hero.titleLead": "Chiarezza sotto pressione —",
  "Hero.titleAccent": "infrastruttura che rispetta la tua decisione",
  "Login.title": "Accedi",
  "Login.submit": "Accedi",
  "Register.title": "Crea account",
  "Register.submit": "Registrati",
  "Login.submitting": "Accesso in corso…",
  "Register.submitting": "Creazione in corso…",
  "Register.passwordHint": "Almeno 8 caratteri con lettere e numeri.",
  "AppShell.logout": "Esci",
  "Dashboard.greeting": "Ciao,",
  "MarketDesk.stripCta": "Desk completo",
};

const it = buildLocale(en, transformsIt);

const transformsZh = {
  "Language.switchAria": "切换语言",
  "Language.listAria": "可用语言",
  "SkipLink.label": "跳到主要内容",
  "Nav.market": "市场",
  "Nav.projecao": "展望",
  "Nav.news": "资讯",
  "Nav.login": "登录",
  "Nav.start": "免费开始",
  "Hero.badge": "PRONUXFIN · 认知型市场基础设施",
  "Hero.titleLead": "压力下依然清晰 —",
  "Hero.titleAccent": "尊重你判断的基础设施",
  "Hero.subtitle":
    "市场心理学表明信任来自<highlight>精确而非喧哗</highlight>。PRONUXFIN用方法与桌面级语言组织数据——AI是认知放大器，而非魔法承诺。",
  "Hero.ctaPrimary": "从基础设施开始",
  "Hero.ctaSecondary": "查看产品界面",
  "Trust.footerRail": "技术身份 · 公共页面与应用同一视觉规范",
  "Login.title": "登录",
  "Login.description": "进入你的智能财务面板。",
  "Login.submit": "登录",
  "Login.submitting": "登录中…",
  "Register.title": "创建账户",
  "Register.submit": "注册",
  "Register.submitting": "创建中…",
  "Register.passwordHint": "至少 8 个字符，需包含字母和数字。",
  "AppShell.panel": "控制台",
  "AppShell.logout": "退出",
  "Dashboard.greeting": "你好，",
  "MarketDesk.stripCta": "完整行情台",
};

const zhCN = buildLocale(en, transformsZh);

function flattenForRuntime(obj) {
  const o = structuredClone(obj);
  if (typeof o.Ia.bullets === "string")
    o.Ia.bullets = splitBullets(o.Ia.bullets);
  if (typeof o.Features.items === "string")
    o.Features.items = splitBullets(o.Features.items);
  return o;
}

for (const [name, data] of [
  ["pt-BR", flattenForRuntime(ptBR)],
  ["en", flattenForRuntime(en)],
  ["es", flattenForRuntime(es)],
  ["fr", flattenForRuntime(fr)],
  ["it", flattenForRuntime(it)],
  ["zh-CN", flattenForRuntime(zhCN)],
]) {
  fs.writeFileSync(
    path.join(dir, `${name}.json`),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

console.log("Wrote locale files to", dir);
