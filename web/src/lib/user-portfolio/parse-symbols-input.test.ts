import { describe, expect, it } from "vitest";

import { parseSymbolsInput } from "./parse-symbols-input";

describe("parseSymbolsInput", () => {
  it("parses comma and newline separated tickers", () => {
    expect(parseSymbolsInput("PETR4, VALE3\nitub4")).toEqual(["PETR4", "VALE3", "ITUB4"]);
  });

  it("deduplicates and skips invalid tokens", () => {
    expect(parseSymbolsInput("PETR4, PETR4, bad@")).toEqual(["PETR4"]);
  });
});
