import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  const expectedView = path.includes("view=plain") ? "plain" : "desktop";
  if (!path.startsWith("/1999")) {
    await expect(page.locator("html")).toHaveAttribute(
      "data-view",
      expectedView
    );
  }
  await page.evaluate(() => globalThis.document.fonts.ready);
}

test("keyboard users can move, close and reopen a window", async ({ page }) => {
  await gotoReady(page, "/?view=desktop");
  const panel = page.getByRole("region", { name: "About me", exact: true });
  const title = panel.getByRole("button", { name: /Move About me/ });
  const launcher = page.getByRole("button", { name: "About me", exact: true });
  await title.focus();
  await expect(panel).toHaveClass(/is-active/);
  await title.press("ArrowRight");
  await expect(panel).toHaveAttribute("data-x", "16");
  await title.press("ArrowLeft");
  await expect(panel).toHaveAttribute("data-x", "0");
  await title.press("ArrowLeft");
  await expect(panel).toHaveAttribute("data-x", "0");
  await title.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
  await launcher.press("Enter");
  await expect(panel).toBeVisible();
  await expect(title).toBeFocused();
  await expect(launcher).toHaveAttribute("aria-expanded", "true");
});

test("actions provide click movement, clamp to workspace bounds and dismiss before the window", async ({
  page,
}) => {
  await gotoReady(page, "/?view=desktop");
  const panel = page.getByRole("region", { name: "About me", exact: true });
  await panel.locator("summary").click();
  const left = panel.getByRole("button", { name: "Move left", exact: true });
  const right = panel.getByRole("button", { name: "Move right", exact: true });
  const up = panel.getByRole("button", { name: "Move up", exact: true });
  await left.click();
  await expect(panel).toHaveAttribute("data-x", "0");
  await up.click();
  await expect(panel).toHaveAttribute("data-y", "-10");
  await up.click();
  await expect(panel).toHaveAttribute("data-y", "-10");
  await right.click();
  await expect(panel).toHaveAttribute("data-x", "16");
  await right.press("Escape");
  await expect(panel.locator("details")).not.toHaveAttribute("open");
  await expect(panel).toBeVisible();

  const writing = page.locator("#window-writing");
  await page.getByRole("button", { name: "Writing", exact: true }).click();
  await writing.locator("summary").click();
  await writing
    .getByRole("button", { name: "Move right", exact: true })
    .click();
  await expect(writing).toHaveAttribute("data-x", "0");
});

test("desktop cascades windows, keeps icons clear and reveals focused content above the footer", async ({
  page,
}) => {
  await gotoReady(page, "/?view=desktop");
  await expect(page.getByRole("main")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth } = globalThis;
        const workspace = document
          .querySelector(".desktop-workspace")!
          .getBoundingClientRect();
        const footer = document
          .querySelector("footer")!
          .getBoundingClientRect();
        const icons = [...document.querySelectorAll(".desktop-icon")].map(
          (item) => item.getBoundingClientRect()
        );
        const windows = [
          "window-welcome",
          "window-writing",
          "window-projects",
          "window-personal",
        ].map((id) =>
          document.querySelector(`#${id}`)!.getBoundingClientRect()
        );
        const controls = [
          ...document.querySelectorAll("[data-close], .window-actions summary"),
        ].map((item) => item.getBoundingClientRect());

        return {
          noHorizontalOverflow:
            document.documentElement.scrollWidth <= innerWidth,
          iconsLeftOfWorkspace: icons.every(
            (item) => item.right <= workspace.left
          ),
          windowsInsideWorkspace: windows.every(
            (item) =>
              item.left >= workspace.left &&
              item.right <= workspace.right &&
              item.bottom + 7 <= footer.top
          ),
          verticalCascade: windows.every(
            (item, index) => index === 0 || item.top > windows[index - 1].top
          ),
          staggeredColumns:
            windows[0].left < windows[1].left &&
            windows[2].left < windows[3].left,
          targetsAtLeast28px: controls.every(
            (item) => item.width >= 28 && item.height >= 28
          ),
        };
      })
    )
    .toEqual({
      noHorizontalOverflow: true,
      iconsLeftOfWorkspace: true,
      windowsInsideWorkspace: true,
      verticalCascade: true,
      staggeredColumns: true,
      targetsAtLeast28px: true,
    });

  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Personal", exact: true })
  ).toHaveClass(/is-active/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerHeight, getComputedStyle } = globalThis;
        const active = document.querySelectorAll("[data-window].is-active");
        const personal = document.querySelector("#window-personal")!;
        const zIndices = [...document.querySelectorAll("[data-window]")].map(
          (item) => Number(getComputedStyle(item).zIndex) || 0
        );
        const bounds = personal
          .querySelector("[data-window-title]")!
          .getBoundingClientRect();
        return (
          active.length === 1 &&
          active[0] === personal &&
          Number(getComputedStyle(personal).zIndex) === Math.max(...zIndices) &&
          bounds.top >= 0 &&
          bounds.bottom <= innerHeight
        );
      })
    )
    .toBe(true);
});

test("skip link focuses the main landmark", async ({ page }) => {
  await gotoReady(page, "/?view=desktop");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("pointer dragging moves a window, clamps at workspace edges and releases cleanly", async ({
  page,
}) => {
  await gotoReady(page, "/?view=desktop");
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

  await page.setViewportSize({ width: 800, height: 700 });
  await expect(panel).not.toHaveAttribute("data-x");
  await expect(panel).not.toHaveAttribute("data-y");
});

test("intermediate desktop width keeps windows inside the workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await gotoReady(page, "/?view=desktop");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth } = globalThis;
        const workspace = document
          .querySelector(".desktop-workspace")!
          .getBoundingClientRect();
        const footer = document
          .querySelector("footer")!
          .getBoundingClientRect();
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          [...document.querySelectorAll("[data-window]")].every((item) => {
            const bounds = item.getBoundingClientRect();
            return (
              bounds.left >= workspace.left &&
              bounds.right <= innerWidth &&
              bounds.bottom + 7 <= footer.top
            );
          })
        );
      })
    )
    .toBe(true);
});

test("plain view persists through navigation, stacks sections without chrome and restores closed content", async ({
  page,
}) => {
  await gotoReady(page, "/?view=desktop");
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
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, getComputedStyle } = globalThis;
        const panels = [...document.querySelectorAll("[data-window]")];
        const rects = panels.map((item) => item.getBoundingClientRect());
        return (
          getComputedStyle(document.querySelector(".desktop-icons")!)
            .display === "none" &&
          getComputedStyle(document.querySelector(".window-bar")!).display ===
            "none" &&
          panels.every(
            (item) => getComputedStyle(item).position === "static"
          ) &&
          rects.every(
            (item, index) => index === 0 || item.top >= rects[index - 1].bottom
          )
        );
      })
    )
    .toBe(true);
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
  await gotoReady(page, "/?view=desktop");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth, getComputedStyle } = globalThis;
        const panels = [...document.querySelectorAll("[data-window]")].map(
          (item) => item.getBoundingClientRect()
        );
        const close = document
          .querySelector("[data-close]")!
          .getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          stacked: panels.every(
            (item, index) =>
              index === 0 || item.top >= panels[index - 1].bottom + 7
          ),
          touch: getComputedStyle(document.querySelector(".window-bar")!)
            .touchAction,
          target: Math.min(close.width, close.height),
        };
      })
    )
    .toEqual({
      overflow: false,
      stacked: true,
      touch: "auto",
      target: 44,
    });
});

test("blog post reader window aligns rail beside article on desktop and stacks on phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoReady(page, "/blog/local-elections-4-november");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth } = globalThis;
        const reader = document
          .querySelector("#window-reader")!
          .getBoundingClientRect();
        const rail = document
          .querySelector(".post-rail")!
          .getBoundingClientRect();
        const body = document
          .querySelector(".post-body")!
          .getBoundingClientRect();
        const footer = document
          .querySelector("footer")!
          .getBoundingClientRect();
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          rail.left >= reader.left &&
          rail.right <= body.left &&
          body.right <= reader.right &&
          reader.bottom + 7 <= footer.top
        );
      })
    )
    .toBe(true);

  await page.setViewportSize({ width: 320, height: 700 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, innerWidth } = globalThis;
        const rail = document
          .querySelector(".post-rail")!
          .getBoundingClientRect();
        const body = document
          .querySelector(".post-body")!
          .getBoundingClientRect();
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          rail.bottom <= body.top
        );
      })
    )
    .toBe(true);
});

test("print media exposes closed windows in static flow and hides interactive chrome", async ({
  page,
}) => {
  await gotoReady(page, "/?view=desktop");
  await page
    .getByRole("button", { name: "Close About me", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "About me", exact: true })
  ).toBeHidden();

  await page.emulateMedia({ media: "print" });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { document, getComputedStyle } = globalThis;
        const panels = [...document.querySelectorAll("[data-window]")];
        const noPrint = [...document.querySelectorAll(".no-print")];
        return (
          panels.every((item) => {
            const style = getComputedStyle(item);
            return style.display === "block" && style.position === "static";
          }) &&
          noPrint.every((item) => getComputedStyle(item).display === "none")
        );
      })
    )
    .toBe(true);
});

test("reduced motion removes desktop transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page, "/?view=desktop");
  expect(
    await page
      .locator("#window-welcome")
      .evaluate((item) => getComputedStyle(item).transitionProperty)
  ).toBe("none");
});

test("plain phone navigation exposes every main page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await gotoReady(page, "/?view=plain");
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
      "mailto:hello@timothybrits.co.za"
    );
    const hrefs = await links.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href"))
    );
    for (const href of hrefs) {
      expect(href).toBe("mailto:hello@timothybrits.co.za");
    }
  });
}

test("email links still resolve after a client-side navigation", async ({
  page,
}) => {
  await gotoReady(page, "/?view=plain");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Work" })
    .click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(
    page.getByRole("link", { name: "hello@timothybrits.co.za" })
  ).toHaveAttribute("href", "mailto:hello@timothybrits.co.za");
  await expect(
    page.getByRole("button", { name: "Copy email address" })
  ).toBeVisible();
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
  await expect(
    page.getByRole("button", { name: "Copy email address" })
  ).toBeHidden();
  await context.close();
});

test("copy email button copies the address to the clipboard", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoReady(page, "/?view=desktop");
  const button = page.getByRole("button", { name: "Copy email address" });
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toHaveText("Copied!");
  expect(
    await page.evaluate(() => globalThis.navigator.clipboard.readText())
  ).toBe("hello@timothybrits.co.za");
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
      await gotoReady(page, path);
      await expect(page.getByRole("main")).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(() => {
            const { document, innerWidth } = globalThis;
            const main = document
              .querySelector("main")!
              .getBoundingClientRect();
            const footer = document
              .querySelector("footer")!
              .getBoundingClientRect();
            const windows = [
              ...document.querySelectorAll<HTMLElement>("[data-window]"),
            ].filter((item) => !item.hidden);
            return (
              document.documentElement.scrollWidth <= innerWidth &&
              main.width > 0 &&
              main.height > 0 &&
              windows.every(
                (item) => item.getBoundingClientRect().bottom <= footer.top
              )
            );
          })
        )
        .toBe(true);
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
