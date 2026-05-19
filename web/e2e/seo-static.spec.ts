import { expect, test } from "@playwright/test";

test.describe("SEO estático", () => {
  test("sitemap e robots respondem", async ({ request, baseURL }) => {
    const sitemap = await request.get(`${baseURL}/sitemap.xml`);
    expect(sitemap.ok()).toBeTruthy();
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("/bolsa");
    expect(sitemapText).toContain("/privacidade");

    const robots = await request.get(`${baseURL}/robots.txt`);
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText.toLowerCase()).toMatch(/disallow:\s*\/dashboard/i);
    expect(robotsText.toLowerCase()).not.toMatch(/disallow:\s*\/privacidade/i);
  });

  test("páginas legais e mercado público carregam", async ({ page }) => {
    for (const path of ["/bolsa", "/login", "/privacidade", "/termos", "/ferramentas/calendario"]) {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("main, [role='main'], #main-content").first()).toBeVisible();
    }
  });
});
