import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("keyboard users can move, close and reopen a window", async ({ page }) => {
  await page.goto("/?view=desktop");
  const panel = page.getByRole("region", { name: "About me", exact: true });
  const title = panel.getByRole("button", { name: /Move About me/ });
  const launcher = page.getByRole("button", { name: "About me", exact: true });
  await title.focus();
  await expect(panel).toHaveClass(/is-active/);
  await title.press("ArrowRight");
  await expect(panel).toHaveAttribute("data-x", "16");
  await title.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
  await launcher.press("Enter");
  await expect(panel).toBeVisible();
  await expect(title).toBeFocused();
  await expect(launcher).toHaveAttribute("aria-expanded", "true");
});

test("actions provide click movement and dismiss before the window", async ({
  page,
}) => {
  await page.goto("/?view=desktop");
  const panel = page.getByRole("region", { name: "About me", exact: true });
  await panel.locator("summary").click();
  const right = panel.getByRole("button", { name: "Move right", exact: true });
  await right.click();
  await expect(panel).toHaveAttribute("data-x", "16");
  await right.press("Escape");
  await expect(panel.locator("details")).not.toHaveAttribute("open");
  await expect(panel).toBeVisible();
});

test("desktop contains its windows above the footer and reveals focused content", async ({
  page,
}) => {
  await page.goto("/?view=desktop");
  await expect(page.getByRole("main")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document } = globalThis;
        const footer = document
          .querySelector("footer")!
          .getBoundingClientRect();
        return [...document.querySelectorAll("[data-window]")].every(
          (item) => item.getBoundingClientRect().bottom + 7 <= footer.top
        );
      })
    )
    .toBe(true);
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Personal", exact: true })
  ).toHaveClass(/is-active/);
  expect(
    await page
      .locator("#window-personal [data-window-title]")
      .evaluate((item) => {
        const bounds = item.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= innerHeight;
      })
  ).toBe(true);
});

test("skip link focuses the main landmark", async ({ page }) => {
  await page.goto("/?view=desktop");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("pointer dragging moves a window and releases cleanly", async ({
  page,
}) => {
  await page.goto("/?view=desktop");
  const panel = page.getByRole("region", { name: "About me", exact: true });
  const title = panel.getByRole("button", { name: /Move About me/ });
  const bounds = await title.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + bounds!.width / 2;
  const startY = bounds!.y + bounds!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 32, startY + 32, { steps: 4 });
  await page.mouse.up();
  await expect(panel).toHaveAttribute("data-x", "32");
  await expect(panel).toHaveAttribute("data-y", "32");
  await expect(panel).not.toHaveClass(/is-dragging/);
});

test("intermediate desktop width keeps windows inside the workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto("/?view=desktop");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth } = globalThis;
        const footer = document
          .querySelector("footer")!
          .getBoundingClientRect();
        return [...document.querySelectorAll("[data-window]")].every((item) => {
          const bounds = item.getBoundingClientRect();
          return bounds.right <= innerWidth && bounds.bottom + 7 <= footer.top;
        });
      })
    )
    .toBe(true);
});

test("plain view persists through navigation and restores closed content", async ({
  page,
}) => {
  await page.goto("/?view=desktop");
  await page
    .getByRole("button", { name: "Close About me", exact: true })
    .click();
  await page.getByRole("link", { name: "Skip the OS" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await expect(
    page.getByRole("heading", { name: "Timothy Brits", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Writing", exact: true })
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main", exact: true })
    .getByRole("link", { name: "Writing", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await page.getByRole("link", { name: "Back to desktop" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-view", "desktop");
});

test("phone windows stack without overflow and allow title-bar scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/?view=desktop");
  const result = await page.evaluate(() => {
    const { document, innerWidth, getComputedStyle } = globalThis;
    const panels = [...document.querySelectorAll("[data-window]")].map((item) =>
      item.getBoundingClientRect()
    );
    const close = document
      .querySelector("[data-close]")!
      .getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      stacked: panels.every(
        (item, index) => index === 0 || item.top >= panels[index - 1].bottom + 7
      ),
      touch: getComputedStyle(document.querySelector(".window-bar")!)
        .touchAction,
      target: Math.min(close.width, close.height),
    };
  });
  expect(result).toEqual({
    overflow: false,
    stacked: true,
    touch: "auto",
    target: 44,
  });
});

test("reduced motion removes desktop transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=desktop");
  expect(
    await page
      .locator("#window-welcome")
      .evaluate((item) => getComputedStyle(item).transitionProperty)
  ).toBe("none");
});

test("plain phone navigation exposes every main page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/?view=plain");
  const navigation = page.getByRole("navigation", {
    name: "Main",
    exact: true,
  });
  for (const name of ["Writing", "Work", "Now", "Uses", "Colophon"]) {
    await expect(
      navigation.getByRole("link", { name, exact: true })
    ).toBeVisible();
  }
});

test("no JavaScript leaves a usable conventional document", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Writing", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Desktop", exact: true })
  ).toBeHidden();
  await context.close();
});

const EMAIL_PAGES = ["/", "/work", "/1999"];

for (const path of EMAIL_PAGES) {
  test(`the served HTML of ${path} never contains an email address`, async ({
    request,
  }) => {
    const response = await request.get(path);
    const html = await response.text();
    expect(html).not.toMatch(/mailto:/i);
    expect(html).not.toMatch(/icloud\.com/i);
    expect(html).not.toMatch(/contact@timothybrits/i);
    expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  });

  test(`email links on ${path} become mailto links once JavaScript runs`, async ({
    page,
  }) => {
    await page.goto(path);
    const links = page.locator("a[data-email]");
    await expect(links.first()).toHaveAttribute(
      "href",
      "mailto:timothybrits@icloud.com"
    );
    const hrefs = await links.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href"))
    );
    for (const href of hrefs) {
      expect(href).toBe("mailto:timothybrits@icloud.com");
    }
  });
}

test("email links still resolve after a client-side navigation", async ({
  page,
}) => {
  await page.goto("/?view=plain");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Work" })
    .click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(
    page.getByRole("link", { name: "timothybrits@icloud.com" })
  ).toHaveAttribute("href", "mailto:timothybrits@icloud.com");
});

test("without JavaScript the work page says the address needs JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/work");
  await expect(
    page.getByRole("link", { name: "Email me (needs JavaScript)" })
  ).toBeVisible();
  await context.close();
});

for (const width of [320, 1280]) {
  for (const path of [
    "/?view=desktop",
    "/?view=plain",
    "/blog",
    "/blog/local-elections-4-november",
    "/now",
    "/work",
    "/uses",
    "/colophon",
  ]) {
    test(`WCAG A/AA scan at ${width}px: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.getByRole("main")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
      if (path.startsWith("/?view=")) {
        await page.screenshot({
          path: test.info().outputPath("layout.png"),
          fullPage: true,
        });
      }
    });
  }
}
