"use client";

import { type RefObject, useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function restoreFocusSafely(el: HTMLElement | null | undefined) {
  if (!el || !document.body.contains(el)) return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    try {
      el.focus();
    } catch {
      /* ignore */
    }
  }
}

function listFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((node) => {
    if (node.closest("[inert]") || node.getAttribute("aria-hidden") === "true")
      return false;
    const ti = node.getAttribute("tabindex");
    if (ti === "-1") return false;
    return true;
  });
}

/** Focus trap + initial focus while `active`; restores focus when `active` turns false. */
export function useDialogFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  restoreTargetRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;

    const root = containerRef.current;
    if (!root) return;

    function onKeyDown(e: KeyboardEvent) {
      const r = containerRef.current;
      if (!r) return;

      if (e.key !== "Tab") return;
      const list = listFocusable(r);
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const ae = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (ae === first || (ae && !r.contains(ae))) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (ae === last || (ae && !r.contains(ae))) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    root.addEventListener("keydown", onKeyDown);

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const r = containerRef.current;
        if (!r) return;
        const marked = r.querySelector<HTMLElement>("[data-initial-dialog-focus]");
        const list = listFocusable(r);
        const target = marked && list.includes(marked) ? marked : list[0];
        target?.focus();
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (active) return;
    restoreFocusSafely(restoreTargetRef.current ?? undefined);
  }, [active, restoreTargetRef]);
}
