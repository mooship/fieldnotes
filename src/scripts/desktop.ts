const lifecycle: { controller: AbortController | undefined } = {
  controller: undefined,
};

function initialiseDesktop() {
  lifecycle.controller?.abort();
  const controller = new AbortController();
  lifecycle.controller = controller;
  const { signal } = controller;
  const root = document.documentElement;
  const requested = new URLSearchParams(location.search).get("view");
  let isPlain = requested === "plain";
  try {
    isPlain =
      (requested ?? localStorage.getItem("fieldnotes-view")) === "plain";
    localStorage.setItem("fieldnotes-view", isPlain ? "plain" : "desktop");
  } catch {
    isPlain = requested === "plain";
  }
  root.dataset.view = isPlain ? "plain" : "desktop";
  const viewLink =
    document.querySelector<HTMLAnchorElement>("[data-view-toggle]");
  if (viewLink) {
    viewLink.href = `${location.pathname}?view=${isPlain ? "desktop" : "plain"}`;
    viewLink.textContent = isPlain ? "Back to desktop" : "Skip the OS";
  }

  const windows = [...document.querySelectorAll<HTMLElement>("[data-window]")];
  const workspace = document.querySelector<HTMLElement>(".desktop-workspace");
  const mobile = matchMedia("(max-width: 760px)");
  const home = workspace?.querySelector<HTMLElement>(":scope > main");
  const minimumHeight = workspace?.clientHeight ?? 0;
  const launchers = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-open]"),
  ];
  let layer = 10;
  let activeDrag:
    | {
        window: HTMLElement;
        handle: HTMLElement;
        pointerId: number;
        x: number;
        y: number;
      }
    | undefined;

  function focusWindow(window: HTMLElement) {
    for (const item of windows) {
      item.classList.toggle("is-active", item === window);
    }
    layer += 1;
    window.style.zIndex = String(layer);
  }

  function updateWorkspace() {
    if (!home || !workspace) {
      return;
    }
    if (isPlain || mobile.matches) {
      workspace.style.removeProperty("min-height");
      return;
    }
    const bottom = Math.max(
      0,
      ...windows
        .filter((item) => !item.hidden)
        .map((item) => item.offsetTop + item.offsetHeight + 24)
    );
    workspace.style.minHeight = `${Math.max(minimumHeight, bottom)}px`;
  }

  function updateLaunchers() {
    for (const launcher of launchers) {
      const targetId = `window-${launcher.dataset.open}`;
      const target = document.querySelector<HTMLElement>(
        `#${CSS.escape(targetId)}`
      );
      launcher.setAttribute("aria-controls", targetId);
      launcher.setAttribute(
        "aria-expanded",
        String(Boolean(target && !target.hidden))
      );
    }
  }

  function moveWindow(window: HTMLElement, dx: number, dy: number) {
    if (isPlain || !workspace || mobile.matches) {
      return;
    }
    const bounds = workspace.getBoundingClientRect();
    const rect = window.getBoundingClientRect();
    const currentX = Number(window.dataset.x ?? 0);
    const currentY = Number(window.dataset.y ?? 0);
    const nextX =
      currentX +
      Math.max(
        bounds.left - rect.left,
        Math.min(dx, bounds.right - rect.right - 7)
      );
    const nextY =
      currentY +
      Math.max(
        bounds.top - rect.top,
        Math.min(dy, bounds.bottom - rect.bottom - 7)
      );
    window.dataset.x = String(nextX);
    window.dataset.y = String(nextY);
    window.style.transform = `translate(${nextX}px, ${nextY}px)`;
  }

  function closeWindow(window: HTMLElement) {
    window.hidden = true;
    document
      .querySelector<HTMLButtonElement>(
        `[aria-controls="${CSS.escape(window.id)}"]`
      )
      ?.focus();
    const status = document.querySelector<HTMLElement>("[data-desktop-status]");
    if (status) {
      status.textContent = `${window.getAttribute("aria-label")} closed`;
    }
    updateLaunchers();
    updateWorkspace();
  }

  for (const window of windows) {
    window.addEventListener("pointerdown", () => focusWindow(window), {
      signal,
    });
    window.addEventListener("focusin", () => focusWindow(window), { signal });
    window
      .querySelector("[data-close]")
      ?.addEventListener("click", () => closeWindow(window), { signal });
    window.querySelector("[data-window-title]")?.addEventListener(
      "keydown",
      (event) => {
        const key = event as KeyboardEvent;
        const directions = new Map<string, [number, number]>([
          ["ArrowLeft", [-16, 0]],
          ["ArrowRight", [16, 0]],
          ["ArrowUp", [0, -16]],
          ["ArrowDown", [0, 16]],
        ]);
        const direction = directions.get(key.key);
        if (!direction) {
          return;
        }
        key.preventDefault();
        const [dx, dy] = direction;
        moveWindow(window, dx, dy);
      },
      { signal }
    );
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.defaultPrevented || event.key !== "Escape") {
          return;
        }
        event.preventDefault();
        const actions = window.querySelector<HTMLDetailsElement>(
          ".window-actions[open]"
        );
        if (actions) {
          actions.open = false;
          actions.querySelector("summary")?.focus();
          return;
        }
        closeWindow(window);
      },
      { signal }
    );
    for (const control of window.querySelectorAll<HTMLButtonElement>(
      "[data-move]"
    )) {
      control.addEventListener(
        "click",
        () => {
          const direction = control.dataset.move;
          moveWindow(
            window,
            direction === "left" ? -16 : direction === "right" ? 16 : 0,
            direction === "up" ? -16 : direction === "down" ? 16 : 0
          );
        },
        { signal }
      );
    }
    const handle = window.querySelector<HTMLElement>("[data-drag-handle]");
    handle?.addEventListener(
      "pointerdown",
      (event) => {
        if (
          isPlain ||
          event.button !== 0 ||
          mobile.matches ||
          (event.target as Element).closest("[data-close], .window-actions")
        ) {
          return;
        }
        event.preventDefault();
        window
          .querySelector<HTMLButtonElement>("[data-window-title]")
          ?.focus({ preventScroll: true });
        activeDrag = {
          window,
          handle,
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
        handle.setPointerCapture(event.pointerId);
        window.classList.add("is-dragging");
      },
      { signal }
    );
    handle?.addEventListener(
      "pointermove",
      (event) => {
        if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
          return;
        }
        moveWindow(
          window,
          event.clientX - activeDrag.x,
          event.clientY - activeDrag.y
        );
        activeDrag.x = event.clientX;
        activeDrag.y = event.clientY;
      },
      { signal }
    );
    handle?.addEventListener(
      "lostpointercapture",
      () => {
        window.classList.remove("is-dragging");
        activeDrag = undefined;
      },
      { signal }
    );
    handle?.addEventListener(
      "pointerup",
      (event) => {
        if (handle.hasPointerCapture(event.pointerId)) {
          handle.releasePointerCapture(event.pointerId);
        }
      },
      { signal }
    );
  }

  for (const launcher of launchers) {
    launcher.addEventListener(
      "click",
      () => {
        const window = document.querySelector<HTMLElement>(
          `#${CSS.escape(`window-${launcher.dataset.open}`)}`
        );
        if (!window) {
          return;
        }
        window.hidden = false;
        focusWindow(window);
        updateLaunchers();
        updateWorkspace();
        window.querySelector<HTMLButtonElement>("[data-window-title]")?.focus();
        window.scrollIntoView({ block: "nearest" });
      },
      { signal }
    );
  }

  window.addEventListener(
    "resize",
    () => {
      for (const item of windows) {
        item.style.removeProperty("transform");
        delete item.dataset.x;
        delete item.dataset.y;
      }
      updateWorkspace();
    },
    { signal }
  );
  const observer = new ResizeObserver(updateWorkspace);
  for (const item of windows) {
    observer.observe(item);
  }
  signal.addEventListener("abort", () => observer.disconnect());
  updateLaunchers();
  updateWorkspace();
  if (windows[0]) {
    focusWindow(windows[0]);
  }
}

document.addEventListener("astro:page-load", initialiseDesktop);
document.addEventListener("astro:before-swap", () =>
  lifecycle.controller?.abort()
);
