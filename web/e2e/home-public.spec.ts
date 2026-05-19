import { expect, test } from "@playwright/test";

test.describe("Home pública", () => {
  test("hero, skip link e secções de confiança", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.getByRole("link", { name: /produto|product|superfícies|surfaces/i }).first()).toBeVisible();

    const skip = page.getByRole("link", { name: /conteúdo|content/i });
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("FAQ e preview do produto abaixo da dobra", async ({ page }) => {
    await page.goto("/");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await expect(page.locator("#faq")).toBeVisible({ timeout: 45_000 });

    await page.locator("#produto").scrollIntoViewIfNeeded();
    await expect(page.locator("#produto")).toBeVisible({ timeout: 45_000 });
  });
});
