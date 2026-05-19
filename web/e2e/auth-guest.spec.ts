import { expect, test } from "@playwright/test";

test.describe("Mesa privada (convidado)", () => {
  test("dashboard redireciona para login com return path", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("from")).toMatch(/dashboard/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("calendário privado redireciona para login", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("from")).toMatch(/calendario/);
  });
});
