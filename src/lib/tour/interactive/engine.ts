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
    activeDriver.destroy();
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

    let enableNext: (() => void) | null = null;

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
        showButtons: ["close"],
        progressText: options.labels.progress
          .replace("{{current}}", String(i + 1))
          .replace("{{total}}", String(allSteps.length)),
        onPopoverRender: (popover) => {
          popover.footerButtons.innerHTML = "";

          const skipTourBtn = document.createElement("button");
          skipTourBtn.type = "button";
          skipTourBtn.className = "driver-popover-prev-btn";
          skipTourBtn.textContent = options.labels.skipTour;
          skipTourBtn.addEventListener("click", (e) => {
            e.preventDefault();
            finish("dismissed");
            requestAdvance();
          });
          popover.footerButtons.appendChild(skipTourBtn);

          if (step.waitFor) {
            const skipStepBtn = document.createElement("button");
            skipStepBtn.type = "button";
            skipStepBtn.className = "driver-popover-prev-btn";
            skipStepBtn.textContent = options.labels.skipStep;
            skipStepBtn.addEventListener("click", (e) => {
              e.preventDefault();
              actionDone = true;
              requestAdvance();
            });
            popover.footerButtons.appendChild(skipStepBtn);
          }

          const nextBtn = document.createElement("button");
          nextBtn.type = "button";
          nextBtn.className = "driver-popover-next-btn";
          nextBtn.textContent = isLast
            ? options.labels.done
            : options.labels.next;
          nextBtn.disabled = Boolean(step.waitFor && !actionDone);
          if (nextBtn.disabled) {
            nextBtn.style.opacity = "0.45";
            nextBtn.style.cursor = "not-allowed";
          }
          nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (nextBtn.disabled) return;
            requestAdvance();
          });
          popover.footerButtons.appendChild(nextBtn);

          enableNext = () => {
            if (actionDone && nextBtn.disabled === false) return;
            actionDone = true;
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
            nextBtn.style.cursor = "pointer";
            if (popover.description) {
              popover.description.innerText = options.t(step.descriptionKey);
            }
            window.setTimeout(() => requestAdvance(), 400);
          };
        },
      },
    });

    if (step.waitFor) {
      void waitForOnboardingEvent(step.waitFor, signal)
        .then(() => {
          enableNext?.();
        })
        .catch(() => {
          // aborted
        });
    }

    await advancePromise;
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
