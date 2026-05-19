import { expect, test } from "@playwright/test";

test.describe("Bolsa · layout mobile", () => {
  test("lista em cartões visível e tabela larga oculta", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Só no projeto mobile");

    await page.goto("/bolsa");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });

    const mobileCards = page.locator("ul.md\\:hidden").filter({ has: page.locator("article") });
    const mobileEmpty = page.locator("p.md\\:hidden[role='status']");
    await expect(mobileCards.or(mobileEmpty).first()).toBeVisible({ timeout: 60_000 });

    const desktopTable = page.locator("div.hidden.md\\:block table").first();
    await expect(desktopTable).toBeHidden();
  });
});
