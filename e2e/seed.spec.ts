import { expect, test } from "@playwright/test";

// Seed for the playwright-tests skill (.claude/skills). Generated tests start from here; keep it minimal.
test("seed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
});
