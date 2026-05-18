/** Link para carteira simulada com ticker e campos opcionais de pré-preenchimento. */
export function buildPortfolioHref(
  symbol: string,
  options?: {
    price?: number | null;
    quantity?: number | null;
    averageCost?: number | null;
  },
) {
  const params = new URLSearchParams({
    symbol: symbol.trim().toUpperCase(),
  });
  const price = options?.price;
  if (price != null && Number.isFinite(price)) {
    params.set("price", String(price));
  }
  const quantity = options?.quantity;
  if (quantity != null && Number.isFinite(quantity) && quantity > 0) {
    params.set("quantity", String(quantity));
  }
  const averageCost = options?.averageCost;
  if (averageCost != null && Number.isFinite(averageCost) && averageCost > 0) {
    params.set("averageCost", String(averageCost));
  }
  return `/carteira?${params.toString()}`;
}
