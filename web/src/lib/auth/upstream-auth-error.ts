/**
 * Normaliza resposta de erro do Nest em `{ message, code? }` para o proxy Next repassar ao browser.
 */
export function normalizeUpstreamAuthError(
  data: Record<string, unknown>,
  fallbackMessage: string,
): { message: string; code?: string } {
  const readCode = (row: Record<string, unknown>): string | undefined => {
    const c = row.code;
    return typeof c === "string" && c.trim().length > 0 ? c.trim() : undefined;
  };

  let code = readCode(data);
  let message = "";

  const msgField = data.message;
  if (typeof msgField === "string") {
    message = msgField;
  } else if (Array.isArray(msgField)) {
    message = msgField.filter((x): x is string => typeof x === "string").join(". ");
  } else if (msgField && typeof msgField === "object" && !Array.isArray(msgField)) {
    const nested = msgField as Record<string, unknown>;
    code ??= readCode(nested);
    const nm = nested.message;
    if (typeof nm === "string") message = nm;
    else if (Array.isArray(nm)) {
      message = nm.filter((x): x is string => typeof x === "string").join(". ");
    }
  }

  message = message.trim();
  return {
    message: message.length ? message : fallbackMessage,
    ...(code ? { code } : {}),
  };
}
