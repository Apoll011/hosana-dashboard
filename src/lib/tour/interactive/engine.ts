/**
 * Interactive onboarding runner — permission-composed modules with
 * wait-for-action steps (Next disabled until the user acts or skips).
 */

import type { TranslationKey } from "@/src/lib/i18n";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../tour.css";
import type { AppRole } from "../../permissions/roles";
import { roleHasAnyPermission, roleHasPermission } from "../permissions";
import { waitForOnboardingEvent } from "./events";
import { INTERACTIVE_MODULES, type InteractiveStepDef } from "./modules";

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

export function isInteractiveOnboardingRunning(): boolean {
  return activeDriver !== null;
}

export function destroyInteractiveOnboarding(): void {
  runAbort?.abort();
  runAbort = null;
  if (activeDriver) {
    try {
      activeDriver.destroy();
    } catch {
      // ignore
    }
    activeDriver = null;
  }
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
    animate: true,
    allowClose: true,
    // Light overlay — users must interact with modals/menus outside the spotlight
    overlayColor: "rgba(15, 23, 42, 0.25)",
    overlayOpacity: 0.35,
    overlayClickBehavior: () => {
      // Keep tour open; actions happen elsewhere in the UI
    },
    disableActiveInteraction: false,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: "hosana-driver-popover hosana-interactive-tour",
    nextBtnText: options.labels.next,
    prevBtnText: options.labels.skipTour,
    doneBtnText: options.labels.done,
    progressText: options.labels.progress,
    onDestroyStarted: () => {
      if (!activeDriver) return;
      if (!completed && !dismissed) {
        finish("dismissed");
        return;
      }
      activeDriver.destroy();
    },
  });

  for (let i = 0; i < allSteps.length; i++) {
    if (signal.aborted || dismissed || completed) break;
    const step = allSteps[i]!;
    const isLast = i === allSteps.length - 1;

    if (step.element && !document.querySelector(step.element)) {
      await new Promise((r) => setTimeout(r, 450));
    }

    const element =
      step.element && document.querySelector(step.element)
        ? step.element
        : undefined;

    let actionDone = !step.waitFor;
    let advanceResolver: (() => void) | null = null;
    const advancePromise = new Promise<void>((resolve) => {
      advanceResolver = resolve;
    });

    const requestAdvance = () => {
      advanceResolver?.();
      advanceResolver = null;
    };

    let keyCleanup: (() => void) | null = null;

    activeDriver.highlight({
      element,
      disableActiveInteraction: false,
      popover: {
        title: options.t(step.titleKey),
        description: `${options.t(step.descriptionKey)}${
          step.waitFor ? `\n\n${options.labels.waiting}` : ""
        }`,
        side: step.side,
        align: step.align,
        // IMPORTANT: footer is hidden unless next/previous is included
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
          if (step.waitFor && !actionDone) return;
          requestAdvance();
        },
        onPrevClick: () => {
          if (step.waitFor) {
            // Skip this step
            actionDone = true;
            requestAdvance();
            return;
          }
          // Exit tour
          finish("dismissed");
          requestAdvance();
        },
        onCloseClick: () => {
          finish("dismissed");
          requestAdvance();
        },
        onPopoverRender: (popover) => {
          // Ensure footer is visible (driver hides it when only close is shown)
          popover.footer.style.display = "flex";
          popover.nextButton.style.display = "block";
          popover.previousButton.style.display = "block";

          if (step.waitFor && !actionDone) {
            popover.nextButton.disabled = true;
            popover.nextButton.classList.add("driver-popover-btn-disabled");
            popover.nextButton.style.opacity = "0.45";
            popover.nextButton.style.cursor = "not-allowed";
          } else {
            popover.nextButton.disabled = false;
            popover.nextButton.classList.remove("driver-popover-btn-disabled");
            popover.nextButton.style.opacity = "1";
            popover.nextButton.style.cursor = "pointer";
          }

          // For wait steps, also offer "exit tour" as a third control
          if (step.waitFor) {
            let exitBtn = popover.footerButtons.querySelector(
              "[data-tour-exit]",
            ) as HTMLButtonElement | null;
            if (!exitBtn) {
              exitBtn = document.createElement("button");
              exitBtn.type = "button";
              exitBtn.dataset.tourExit = "true";
              exitBtn.className =
                "driver-popover-prev-btn driver-popover-footer-btn";
              exitBtn.textContent = options.labels.skipTour;
              exitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                finish("dismissed");
                requestAdvance();
              });
              popover.footerButtons.insertBefore(
                exitBtn,
                popover.previousButton,
              );
            }
          }

          const enableNext = () => {
            actionDone = true;
            popover.nextButton.disabled = false;
            popover.nextButton.classList.remove("driver-popover-btn-disabled");
            popover.nextButton.style.opacity = "1";
            popover.nextButton.style.cursor = "pointer";
            if (popover.description) {
              popover.description.innerText = options.t(step.descriptionKey);
            }
            window.setTimeout(() => requestAdvance(), 400);
          };

          (popover.wrapper as unknown as { __enableNext?: () => void }).__enableNext =
            enableNext;

          const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            if (step.waitFor && !actionDone) return;
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
              return;
            }
            e.preventDefault();
            requestAdvance();
          };
          window.addEventListener("keydown", onKey);
          keyCleanup = () => window.removeEventListener("keydown", onKey);
        },
      },
    });

    if (step.waitFor) {
      void waitForOnboardingEvent(step.waitFor, signal)
        .then(() => {
          const wrap = document.querySelector(
            ".hosana-interactive-tour",
          ) as (HTMLElement & { __enableNext?: () => void }) | null;
          wrap?.__enableNext?.();
        })
        .catch(() => {
          // aborted
        });
    }

    await advancePromise;
    keyCleanup?.();

    if (dismissed) break;
    if (isLast && !dismissed) {
      finish("completed");
      break;
    }
  }

  if (!completed && !dismissed) {
    finish("completed");
  }

  return true;
}
