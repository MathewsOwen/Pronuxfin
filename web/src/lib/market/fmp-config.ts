/** Configuração FMP sem dependências do registry (evita ciclo de imports). */

export function isFmpApiKeyConfigured(): boolean {
  return Boolean(
    process.env.FMP_API_KEY?.trim() ||
      process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim(),
  );
}

/** Ativo quando há chave, salvo `MARKET_PROVIDER_FMP_ENABLED=false`. */
export function isFmpProviderEnabled(): boolean {
  const toggle = process.env.MARKET_PROVIDER_FMP_ENABLED?.trim().toLowerCase();
  if (toggle === "0" || toggle === "false" || toggle === "no" || toggle === "off") {
    return false;
  }
  if (toggle === "1" || toggle === "true" || toggle === "yes" || toggle === "on") {
    return isFmpApiKeyConfigured();
  }
  return isFmpApiKeyConfigured();
}
