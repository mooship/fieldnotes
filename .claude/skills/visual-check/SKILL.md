---
name: visual-check
description: Confirm a visible change by looking at the running site. Run it on its own port, take screenshots at phone, tablet and desktop sizes in both colour schemes and in the desktop and plain views the change affects, say what looks wrong or hard to use, fix it, and stop everything started. Use for any change that alters what the site shows, before pushing, and whenever someone asks to look at, screenshot or verify the running site.
---

# Visual check

`AGENTS.md` ("Definition of done") requires this for every change to what the site shows; tests and linters cannot see that something looks bad or is hard to use. A change with no visible effect says so under **Seen** and skips the rest.

The model that does this check must be able to read images. Claude models can; for any other, ask it to describe a screenshot in one line before relying on it. An agent that cannot read images does not do this check: it runs the tests and accessibility-tree checks, says under **Seen** that it did not look at the screen and why, and never claims to have seen anything. The caller then starts a reviewer on a model that can read images, or asks the person for exactly what is needed (a real device, a real screen reader).

## 1. Start the site

1. Install the browser once if it is missing: `npx --no-install playwright install chromium`.
2. Pick a port nobody uses (say 5190) and check that nothing listens on it: `Get-NetTCPConnection -LocalPort 5190 -State Listen` in PowerShell (an error means none), `lsof -nP -iTCP:5190 -sTCP:LISTEN` elsewhere. Another agent may have a server running, so never reuse a taken port.
3. Run `npm run preview -- --port 5190 --ip 127.0.0.1` in the background. It builds the site, then serves the built Worker with `wrangler dev`. Wait for its ready line, run the listener check again and write down the PID: the port was free, so that process is yours. Load the home page once and let it finish.

## 2. Take the screenshots

Save every image under `.tmp-visual/` (ignored by git), named for size, scheme, view and page, such as `phone-dark-plain-blog.png`.

| Size | Viewport |
| --- | --- |
| Narrow phone | 320x640 (windows stacked, no horizontal scroll, no layout shift) |
| Phone | 390x844 |
| Tablet | 820x1180 (above the 761px breakpoint, so the desktop shell) |
| Desktop | 1440x900 |

- Cover light and dark (`--color-scheme`; the site follows the system setting only) and, where the change touches the shell, both views (`?view=desktop` and `?view=plain`). The site is English only.
- Show the state the change affects (a window closed or moved, the actions menu open, a post with its contents list), not only the bare page. Pages to consider: `/`, `/blog`, a post, `/now`, `/work`, `/uses`, `/colophon`.
- Use the Playwright CLI from the repository root:

```bash
npx --no-install playwright screenshot --viewport-size=390,844 --color-scheme=dark --wait-for-timeout=2000 "http://127.0.0.1:5190/?view=desktop" .tmp-visual/phone-dark-desktop-home.png
```

If a state needs clicks or key presses, use a short script in `.tmp-visual/` and run it with `node .tmp-visual/shot.mjs` (import `chromium` from `playwright`; set the viewport and `colorScheme` on the context). Read each image; do not assume it is right because it was produced.

## 3. Judge and fix

Judge against the design system in `AGENTS.md` ("Architecture", Design system and Accessibility). Look for overlap or clipping, windows hiding the footer, weak contrast (petrol is not for small text on the desktop colour), touch targets that are too small, a layout that shifts or differs between schemes, hard-coded colours, gradients, blur or decoration, and anything out of keeping with the rest of the site. Write down each problem with its image name. Fix what is in scope, take the affected images again, and repeat until none remain. Mention a problem outside the change under **Follow-ups**.

## 4. Clean up and report

1. Stop the server and every browser you started, and nothing else. Kill only the process you recorded and its children (`taskkill /PID <pid> /T /F` on Windows), then re-run the listener check and confirm nothing listens on the port.
2. Check `git status` shows no image; `.tmp-visual/` stays uncommitted (add it to `.gitignore` if it is not there).
3. Report under **Seen** (`AGENTS.md`, "Hand-off"): the sizes, schemes, views and pages covered, what looked wrong and what you fixed, and what remains. Give the folder's absolute path to your caller.
