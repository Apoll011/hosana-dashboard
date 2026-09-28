/**
 * Interactive onboarding runner — permission-composed modules with
 * wait-for-action steps. The spotlight is visual only: the rest of the UI
 * (and tour buttons) must stay fully clickable.
 *
 * Navigation is allowed and expected (Drive → Library → editor, etc.).
 * The tour must survive route changes: we re-paint after navigations and
 * never treat DOM unmounts as a user dismiss.
 */

import type { TranslationKey } from "@/src/lib/i18n";
import { driver, type Driver, type PopoverDOM } from "driver.js";
import "driver.js/dist/driver.css";
import "../tour.css";
import type { AppRole } from "../../permissions/roles";
import { roleHasAnyPermission, roleHasPermission } from "../permissions";
import { onOnboardingEvent, waitForOnboardingEvent } from "./events";
import { INTERACTIVE_MODULES, type InteractiveStepDef } from "./modules";
import { setActiveOnboardingWaitFor } from "./navigationPolicy";

export interface InteractiveRunOptions {
  role: AppRole;
  collectionsEnabled: boolean;
  agendaEnabled: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  labels: {
    next: string;
    skipStep: string;
    skipTour: string;
    waiting: string;
    done: string;
    progress: string;
  };
  onCompleted: () => void;
  onDismissed: () => void;
}

let activeDriver: Driver | null = null;
let runAbort: AbortController | null = null;
/** When true, destroy() is intentional (finish / abort). */
let allowDestroy = false;
/** Re-paint the step currently on screen (after route changes). */
let repaintActiveStep: (() => void) | null = null;
/**
 * Monotonic token for the step that is allowed to paint. Bumped when entering
 * a step and again the moment we leave it, so in-flight highlight/retarget/
 * refresh callbacks from an older step can never overwrite the UI.
 */
let paintToken = 0;

export function isInteractiveOnboardingRunning(): boolean {
  return activeDriver !== null;
}

/** Call after client-side navigations so the spotlight finds the new DOM. */
export function refreshInteractiveOnboarding(): void {
  if (!activeDriver || allowDestroy) return;
  const token = paintToken;
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      if (token !== paintToken || allowDestroy) {
        unlockInteractiveChrome();
        return;
      }
      repaintActiveStep?.();
      unlockInteractiveChrome();
    }, 60);
  });
}

export function destroyInteractiveOnboarding(): void {
  runAbort?.abort();
  runAbort = null;
  repaintActiveStep = null;
  paintToken += 1;
  setActiveOnboardingWaitFor(null);
  if (activeDriver) {
    allowDestroy = true;
    try {
      activeDriver.destroy();
    } catch {
      // ignore
    }
    activeDriver = null;
  }
  allowDestroy = false;
  purgeOrphanedTourDom();
}

/**
 * Driver.js paints a full-screen SVG overlay at z-index ~1e9 and installs
 * capture listeners. For wait-for-action tours we only want a visual cue —
 * never a click shield.
 */
function unlockInteractiveChrome(): void {
  document.querySelectorAll<HTMLElement>(".driver-overlay").forEach((el) => {
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("z-index", "30", "important");
  });
  document
    .querySelectorAll<HTMLElement>(".hosana-interactive-tour")
    .forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("z-index", "60", "important");
    });
}

/** Remove hidden leftover popovers from prior highlight() calls. */
function purgeOrphanedTourDom(): void {
  document.querySelectorAll(".driver-popover").forEach((el) => {
    const node = el as HTMLElement;
    if (node.style.display === "none" || !node.isConnected) {
      node.remove();
    }
  });
  // Keep only the newest visible interactive popover.
  const live = Array.from(
    document.querySelectorAll<HTMLElement>(".hosana-interactive-tour"),
  ).filter((el) => el.style.display !== "none");
  live.slice(0, -1).forEach((el) => el.remove());
}

/**
 * Driver.js always traps Tab for focus cycling inside the spotlight, even with
 * allowKeyboardControl:false. That breaks ChordPro TAB snippet completion.
 */
function stripDriverTabTrap(): void {
  if (!activeDriver) return;
  try {
    const events = activeDriver.getState("__events") as
      { onKeydown?: (e: KeyboardEvent) => void } | undefined;
    if (events?.onKeydown) {
      window.removeEventListener("keydown", events.onKeydown);
    }
  } catch {
    // ignore
  }
}

function waitForSelector(
  selector: string | undefined,
  timeoutMs = 6000,
  signal?: AbortSignal,
): Promise<boolean> {
  if (!selector) return Promise.resolve(true);
  if (document.querySelector(selector)) return Promise.resolve(true);

  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }
    const done = (found: boolean) => {
      window.clearTimeout(timer);
      obs.disconnect();
      signal?.removeEventListener("abort", onAbort);
      resolve(found);
    };
    const onAbort = () => done(false);
    const timer = window.setTimeout(() => done(false), timeoutMs);
    const obs = new MutationObserver(() => {
      if (document.querySelector(selector)) done(true);
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function stepAllowed(
  step: InteractiveStepDef,
  role: AppRole,
  ctx: { collectionsEnabled: boolean; agendaEnabled: boolean },
): boolean {
  if (step.when && !step.when(ctx)) return false;
  if (step.requireAll?.length) {
    if (!step.requireAll.every((p) => roleHasPermission(role, p))) return false;
  }
  if (step.requireAny?.length) {
    if (!roleHasAnyPermission(role, step.requireAny)) return false;
  }
  return true;
}

export function buildInteractiveSteps(
  options: Pick<
    InteractiveRunOptions,
    "role" | "collectionsEnabled" | "agendaEnabled"
  >,
): InteractiveStepDef[] {
  const ctx = {
    collectionsEnabled: options.collectionsEnabled,
    agendaEnabled: options.agendaEnabled,
  };
  const steps: InteractiveStepDef[] = [];
  for (const mod of INTERACTIVE_MODULES) {
    if (mod.when && !mod.when(ctx)) continue;
    if (mod.requireAll?.length) {
      if (!mod.requireAll.every((p) => roleHasPermission(options.role, p))) {
        continue;
      }
    }
    if (mod.requireAny?.length) {
      if (!roleHasAnyPermission(options.role, mod.requireAny)) continue;
    }
    for (const step of mod.steps) {
      if (stepAllowed(step, options.role, ctx)) steps.push(step);
    }
  }
  return steps;
}

export async function runInteractiveOnboarding(
  options: InteractiveRunOptions,
): Promise<boolean> {
  destroyInteractiveOnboarding();

  const allSteps = buildInteractiveSteps(options);
  if (allSteps.length === 0) return false;

  runAbort = new AbortController();
  const { signal } = runAbort;
  let dismissed = false;
  let completed = false;
  allowDestroy = false;

  const finish = (kind: "completed" | "dismissed") => {
    if (completed || dismissed) return;
    if (kind === "completed") {
      completed = true;
      options.onCompleted();
    } else {
      dismissed = true;
      options.onDismissed();
    }
    destroyInteractiveOnboarding();
  };

  activeDriver = driver({
    // No animation: consecutive highlight() calls otherwise race and can paint
    // an older step's popover after we've already moved on (seen as jump to
    // step 8 + frozen overlay inside the ChordPro editor).
    animate: false,
    allowClose: false,
    allowKeyboardControl: false,
    overlayColor: "rgba(15, 23, 42, 0.2)",
    overlayOpacity: 0.25,
    overlayClickBehavior: () => {
      // no-op — never close / never block
    },
    disableActiveInteraction: false,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: "hosana-driver-popover hosana-interactive-tour",
    nextBtnText: options.labels.next,
    prevBtnText: options.labels.skipTour,
    doneBtnText: options.labels.done,
    progressText: options.labels.progress,
    onHighlightStarted: () => {
      queueMicrotask(() => {
        unlockInteractiveChrome();
        stripDriverTabTrap();
      });
    },
    onHighlighted: () => {
      unlockInteractiveChrome();
      stripDriverTabTrap();
      purgeOrphanedTourDom();
      window.setTimeout(unlockInteractiveChrome, 0);
      window.setTimeout(unlockInteractiveChrome, 50);
    },
    onDestroyStarted: () => {
      // Driver calls this instead of destroying when allowClose paths fire.
      // Keep the tour alive across navigations / missing elements unless we
      // intentionally tear down.
      if (allowDestroy || completed || dismissed) {
        activeDriver?.destroy();
        return;
      }
      unlockInteractiveChrome();
      queueMicrotask(() => {
        if (!completed && !dismissed && !allowDestroy) {
          repaintActiveStep?.();
          unlockInteractiveChrome();
        }
      });
    },
  });

  for (let i = 0; i < allSteps.length; i++) {
    if (signal.aborted || dismissed || completed) break;
    const step = allSteps[i]!;
    const isLast = i === allSteps.length - 1;
    const myToken = ++paintToken;
    repaintActiveStep = null;
    setActiveOnboardingWaitFor(step.waitFor ?? null);

    const elementWaitMs = step.skipIfElementMissing ? 1500 : 6000;
    const found = await waitForSelector(step.element, elementWaitMs, signal);
    if (signal.aborted || dismissed || completed || myToken !== paintToken) {
      break;
    }
    // Skipped “open + menu” → dependent create-menu step has nothing to attach to.
    if (!found && step.skipIfElementMissing) {
      setActiveOnboardingWaitFor(null);
      continue;
    }

    let actionDone = !step.waitFor;
    let advanceResolver: (() => void) | null = null;
    const advancePromise = new Promise<void>((resolve) => {
      advanceResolver = resolve;
    });

    /** Leave this step; invalidate any in-flight paints first. */
    const leaveStep = () => {
      if (myToken !== paintToken) {
        advanceResolver?.();
        advanceResolver = null;
        return;
      }
      paintToken += 1;
      repaintActiveStep = null;
      advanceResolver?.();
      advanceResolver = null;
    };

    const skipStep = () => {
      if (myToken !== paintToken) return;
      actionDone = true;
      leaveStep();
    };

    const advanceStepOnAction = () => {
      if (myToken !== paintToken) return;
      if (actionDone) return;
      actionDone = true;
      // Leave immediately. Delayed auto-advance raced with route refresh and
      // re-painted this step over later ChordPro steps (jump back to step 8).
      leaveStep();
    };

    let keyCleanup: (() => void) | null = null;
    let retargetCleanup: (() => void) | null = null;

    // Prefer a more specific target when the context menu is open (Add to collection).
    const initialElement =
      step.id === "collections.addSongs" &&
      document.querySelector("[data-tour='ctx-add-to-collection']")
        ? "[data-tour='ctx-add-to-collection']"
        : step.element;

    let paintOpts: {
      element?: string;
      side?: InteractiveStepDef["side"];
      align?: InteractiveStepDef["align"];
    } = {
      element: initialElement,
      side: step.side,
      align: step.align,
    };

    const paintStep = (opts: {
      element?: string;
      side?: InteractiveStepDef["side"];
      align?: InteractiveStepDef["align"];
    }) => {
      if (myToken !== paintToken) return;
      if (!activeDriver || allowDestroy || completed || dismissed) return;
      paintOpts = opts;

      const el =
        opts.element && document.querySelector(opts.element)
          ? opts.element
          : undefined;

      activeDriver.highlight({
        element: el,
        disableActiveInteraction: false,
        popover: {
          title: options.t(step.titleKey),
          description: `${options.t(step.descriptionKey)}${
            step.waitFor && !actionDone ? `\n\n${options.labels.waiting}` : ""
          }`,
          side: opts.side ?? step.side ?? "left",
          align: opts.align ?? step.align ?? "start",
          showButtons: ["next", "previous", "close"],
          showProgress: true,
          progressText: options.labels.progress
            .replace("{{current}}", String(i + 1))
            .replace("{{total}}", String(allSteps.length)),
          nextBtnText: isLast ? options.labels.done : options.labels.next,
          prevBtnText: step.waitFor
            ? options.labels.skipStep
            : options.labels.skipTour,
          onNextClick: () => {
            if (myToken !== paintToken) return;
            if (step.waitFor && !actionDone) return;
            leaveStep();
          },
          onPrevClick: () => {
            if (myToken !== paintToken) return;
            if (step.waitFor) {
              skipStep();
              return;
            }
            finish("dismissed");
            leaveStep();
          },
          onCloseClick: () => {
            if (myToken !== paintToken) return;
            finish("dismissed");
            leaveStep();
          },
          onPopoverRender: (popover: PopoverDOM) => {
            // Always unlock — a stale render must never leave the overlay
            // blocking the whole app (the "frozen" state).
            unlockInteractiveChrome();
            stripDriverTabTrap();

            if (myToken !== paintToken) {
              popover.wrapper.style.display = "none";
              return;
            }

            purgeOrphanedTourDom();

            popover.footer.style.display = "flex";
            popover.nextButton.style.display = "block";
            popover.previousButton.style.display = "block";
            popover.previousButton.disabled = false;
            popover.previousButton.classList.remove(
              "driver-popover-btn-disabled",
            );

            if (step.waitFor && !actionDone) {
              popover.nextButton.disabled = true;
              popover.nextButton.classList.add("driver-popover-btn-disabled");
              popover.nextButton.style.opacity = "0.45";
              popover.nextButton.style.cursor = "not-allowed";
            } else {
              popover.nextButton.disabled = false;
              popover.nextButton.classList.remove(
                "driver-popover-btn-disabled",
              );
              popover.nextButton.style.opacity = "1";
              popover.nextButton.style.cursor = "pointer";
            }

            // Dedicated skip handler — don't rely only on driver onPrevClick
            // (can be swallowed when the popover is unattached / mid-repaint).
            const onSkipClick = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              if (myToken !== paintToken) return;
              if (step.waitFor) {
                skipStep();
              } else {
                finish("dismissed");
                leaveStep();
              }
            };
            popover.previousButton.addEventListener("click", onSkipClick, true);

            if (step.waitFor) {
              let exitBtn = popover.footerButtons.querySelector(
                "[data-tour-exit]",
              ) as HTMLButtonElement | null;
              if (!exitBtn) {
                exitBtn = document.createElement("button");
                exitBtn.type = "button";
                exitBtn.dataset.tourExit = "true";
                // Do NOT use driver-popover-prev-btn — that aliases to Skip.
                exitBtn.className =
                  "driver-popover-footer-btn hosana-tour-exit-btn";
                exitBtn.textContent = options.labels.skipTour;
                exitBtn.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  finish("dismissed");
                  leaveStep();
                });
                popover.footerButtons.insertBefore(
                  exitBtn,
                  popover.previousButton,
                );
              }
            }

            keyCleanup?.();
            const onKey = (e: KeyboardEvent) => {
              if (e.key !== "Enter") return;
              if (myToken !== paintToken) return;
              if (step.waitFor && !actionDone) return;
              const tag = (e.target as HTMLElement)?.tagName;
              if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
                return;
              }
              if ((e.target as HTMLElement)?.isContentEditable) return;
              // Don't steal Enter from Ace (textarea.ace_text-input)
              if (
                (e.target as HTMLElement)?.classList?.contains("ace_text-input")
              ) {
                return;
              }
              e.preventDefault();
              leaveStep();
            };
            window.addEventListener("keydown", onKey);
            keyCleanup = () => {
              window.removeEventListener("keydown", onKey);
              popover.previousButton.removeEventListener(
                "click",
                onSkipClick,
                true,
              );
            };

            unlockInteractiveChrome();
          },
        },
      });

      unlockInteractiveChrome();
      stripDriverTabTrap();
    };

    repaintActiveStep = () => {
      const token = myToken;
      const opts = { ...paintOpts };
      void waitForSelector(opts.element, 3500, signal).then((found) => {
        if (!found) return;
        if (token !== paintToken || signal.aborted || dismissed || completed) {
          unlockInteractiveChrome();
          return;
        }
        paintStep(opts);
      });
    };

    paintStep(paintOpts);

    if (step.retargetOn && step.retargetElement) {
      retargetCleanup = onOnboardingEvent(step.retargetOn, () => {
        if (myToken !== paintToken) return;
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            void waitForSelector(step.retargetElement, 3000, signal).then(
              (found) => {
                if (!found || myToken !== paintToken) return;
                paintStep({
                  element: step.retargetElement,
                  side: step.retargetSide ?? "left",
                  align: "start",
                });
              },
            );
          }, 50);
        });
      });
    }

    if (step.waitFor) {
      void waitForOnboardingEvent(step.waitFor, signal)
        .then(() => {
          if (myToken !== paintToken) return;
          advanceStepOnAction();
        })
        .catch(() => {
          // aborted
        });
    }

    await advancePromise;
    keyCleanup?.();
    retargetCleanup?.();
    setActiveOnboardingWaitFor(null);
    unlockInteractiveChrome();

    if (dismissed) break;
    if (isLast && !dismissed) {
      finish("completed");
      break;
    }
  }

  repaintActiveStep = null;

  if (!completed && !dismissed) {
    finish("completed");
  }

  return true;
}
