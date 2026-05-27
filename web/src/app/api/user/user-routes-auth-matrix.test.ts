import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session-user", () => ({
  getSessionUserId: vi.fn(async () => null),
}));

import { POST as portfolioBulkPost } from "@/app/api/user/portfolio/bulk/route";
import {
  DELETE as portfolioDelete,
  GET as portfolioGet,
  POST as portfolioPost,
} from "@/app/api/user/portfolio/route";
import { PATCH as profilePatch } from "@/app/api/user/profile/route";
import {
  DELETE as financialRoutesDelete,
  GET as financialRoutesGet,
  POST as financialRoutesPost,
} from "@/app/api/user/financial-routes/route";
import {
  DELETE as alertRulesDelete,
  GET as alertRulesGet,
  PATCH as alertRulesPatch,
} from "@/app/api/user/watchlist/alert-rules/route";
import {
  DELETE as compoundScenariosDelete,
  GET as compoundScenariosGet,
  POST as compoundScenariosPost,
} from "@/app/api/user/compound-scenarios/route";
import {
  DELETE as watchlistDelete,
  GET as watchlistGet,
  POST as watchlistPost,
} from "@/app/api/user/watchlist/route";
import { GET as aiKeysGet, PATCH as aiKeysPatch } from "@/app/api/user/ai-keys/route";
import { POST as routeAlertsPost } from "@/app/api/user/financial-routes/alerts/route";
import { POST as watchlistSignalsPost } from "@/app/api/user/watchlist/signals/route";

type CaseItem = {
  name: string;
  run: () => Promise<Response>;
};

function jsonReq(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("User API auth matrix", () => {
  const cases: CaseItem[] = [
    {
      name: "POST /api/user/portfolio/bulk",
      run: () => portfolioBulkPost(jsonReq("/api/user/portfolio/bulk", { positions: [] })),
    },
    {
      name: "GET /api/user/portfolio",
      run: () => portfolioGet(),
    },
    {
      name: "POST /api/user/portfolio",
      run: () => portfolioPost(jsonReq("/api/user/portfolio", { symbol: "PETR4" })),
    },
    {
      name: "DELETE /api/user/portfolio",
      run: () => portfolioDelete(jsonReq("/api/user/portfolio", { symbol: "PETR4" })),
    },
    {
      name: "PATCH /api/user/profile",
      run: () =>
        profilePatch(
          new Request("http://localhost/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Matheus" }),
          }),
        ),
    },
    {
      name: "GET /api/user/financial-routes",
      run: () => financialRoutesGet(),
    },
    {
      name: "POST /api/user/financial-routes",
      run: () => financialRoutesPost(jsonReq("/api/user/financial-routes", {})),
    },
    {
      name: "DELETE /api/user/financial-routes",
      run: () => financialRoutesDelete(jsonReq("/api/user/financial-routes", { id: "x" })),
    },
    {
      name: "GET /api/user/watchlist/alert-rules",
      run: () => alertRulesGet(),
    },
    {
      name: "PATCH /api/user/watchlist/alert-rules",
      run: () =>
        alertRulesPatch(
          new Request("http://localhost/api/user/watchlist/alert-rules", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rules: [] }),
          }),
        ),
    },
    {
      name: "DELETE /api/user/watchlist/alert-rules",
      run: () => alertRulesDelete(jsonReq("/api/user/watchlist/alert-rules", { ruleType: "news_flow" })),
    },
    {
      name: "GET /api/user/compound-scenarios",
      run: () => compoundScenariosGet(),
    },
    {
      name: "POST /api/user/compound-scenarios",
      run: () => compoundScenariosPost(jsonReq("/api/user/compound-scenarios", {})),
    },
    {
      name: "DELETE /api/user/compound-scenarios",
      run: () => compoundScenariosDelete(jsonReq("/api/user/compound-scenarios", { id: "x" })),
    },
    {
      name: "GET /api/user/watchlist",
      run: () => watchlistGet(),
    },
    {
      name: "POST /api/user/watchlist",
      run: () => watchlistPost(jsonReq("/api/user/watchlist", { symbol: "PETR4" })),
    },
    {
      name: "DELETE /api/user/watchlist",
      run: () => watchlistDelete(jsonReq("/api/user/watchlist", { symbol: "PETR4" })),
    },
    {
      name: "GET /api/user/ai-keys",
      run: () => aiKeysGet(),
    },
    {
      name: "PATCH /api/user/ai-keys",
      run: () =>
        aiKeysPatch(
          new Request("http://localhost/api/user/ai-keys", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clearOpenai: true }),
          }),
        ),
    },
    {
      name: "POST /api/user/financial-routes/alerts",
      run: () => routeAlertsPost(jsonReq("/api/user/financial-routes/alerts", { id: "x" })),
    },
    {
      name: "POST /api/user/watchlist/signals",
      run: () => watchlistSignalsPost(jsonReq("/api/user/watchlist/signals", { signals: [] })),
    },
  ];

  it.each(cases)("$name returns 401 without session", async ({ run }) => {
    const res = await run();
    expect(res.status).toBe(401);
  });
});
