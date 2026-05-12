# Deploy PRONUXFIN (frontend Next.js)

## Por que não abria no PC?

1. **Suba o servidor** na pasta `web`:

   ```bash
   cd web
   npm install
   npm run dev
   ```

2. Abra no navegador: **http://127.0.0.1:3000** (no Windows, às vezes `localhost` falha por IPv6 — use `127.0.0.1`).

3. Se usar **OneDrive** na pasta do projeto, pode haver travamentos ou sync lento; prefira clonar em `C:\dev\PronuxFin` sem sync pesado.

## Deploy gratuito na Vercel (recomendado)

1. Suba o código para um repositório **GitHub**.
2. Em [vercel.com](https://vercel.com), **Add New Project** → importe o repo.
3. Configure **Root Directory** = `web` (importante: monorepo).
4. Variáveis de ambiente (Production):

   | Nome | Valor |
   |------|--------|
   | `JWT_SECRET` | Mesmo segredo forte do backend (≥32 caracteres) |
   | `NEXT_PUBLIC_SITE_URL` | `https://seu-dominio.vercel.app` ou seu domínio final |
   | `API_URL` | URL pública do NestJS (ex.: Railway/Render). Sem isso, login/registro quebram. |
   | `BRAPI_TOKEN` | (opcional) Token [brapi.dev](https://brapi.dev) para cotações mais estáveis |

5. Deploy. A URL tipo `https://<projeto>.vercel.app` é o link público até você apontar o domínio comprado.

## CI com GitHub Actions (opcional)

1. Crie um projeto na Vercel e copie **Org ID** e **Project ID** (Settings → General).
2. Gere um **Token** em Vercel → Account Settings → Tokens.
3. No GitHub do repo: **Settings → Secrets → Actions** e adicione:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Cada push na branch `main` dispara `.github/workflows/deploy-web-vercel.yml`.

## APIs “mais rápidas” neste projeto

- Rotas `/api/quotes` e `/api/news` estão em modo **`force-dynamic`** com **`cache: no-store`** nas fontes → cada pedido busca dados atualizados (sem cache ISR na CDN para essas respostas).
- **Região `gru1`** na Vercel aproxima o serverless do público brasileiro.
- Limitação real: latência e rate limits de **brapi**, **CoinGecko** e feeds **RSS** — não há como ultrapassar isso sem APIs pagas ou infra própria.
