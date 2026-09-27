/**
 * Interactive onboarding modules — permission-gated, wait-for-action steps.
 */

import type { TranslationKey } from "../../i18n";
import type { PermissionString } from "../../permissions/permission";
import type { OnboardingEventName } from "./events";

export interface InteractiveStepDef {
  id: string;
  /** i18n keys */
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  element?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  requireAll?: PermissionString[];
  requireAny?: PermissionString[];
  when?: (ctx: { collectionsEnabled: boolean; agendaEnabled: boolean }) => boolean;
  /** If set, Next stays disabled until this event fires (or user skips step). */
  waitFor?: OnboardingEventName;
  /** Optional route hint shown in the popover (not auto-navigated). */
  hintRoute?: string;
}

export interface InteractiveModuleDef {
  id: string;
  requireAll?: PermissionString[];
  requireAny?: PermissionString[];
  when?: InteractiveStepDef["when"];
  steps: InteractiveStepDef[];
}

export const INTERACTIVE_MODULES: InteractiveModuleDef[] = [
  {
    id: "intro",
    steps: [
      {
        id: "intro.welcome",
        titleKey: "tour.interactive.intro.welcome.title",
        descriptionKey: "tour.interactive.intro.welcome.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "start",
      },
      {
        id: "intro.sandbox",
        titleKey: "tour.interactive.intro.sandbox.title",
        descriptionKey: "tour.interactive.intro.sandbox.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "center",
      },
    ],
  },
  {
    id: "folders",
    requireAny: ["folder.create", "folder.update", "folder.access"],
    steps: [
      {
        id: "folders.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAny: ["folder.create"],
        waitFor: "create-menu-opened",
      },
      {
        id: "folders.create",
        titleKey: "tour.interactive.folders.create.title",
        descriptionKey: "tour.interactive.folders.create.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAll: ["folder.create"],
        waitFor: "folder-created",
      },
      {
        id: "folders.drive",
        titleKey: "tour.interactive.folders.drive.title",
        descriptionKey: "tour.interactive.folders.drive.description",
        element: "[data-tour='nav-drive']",
        side: "right",
        align: "start",
      },
    ],
  },
  {
    id: "songs",
    requireAll: ["song.access"],
    steps: [
      {
        id: "songs.create",
        titleKey: "tour.interactive.songs.create.title",
        descriptionKey: "tour.interactive.songs.create.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAll: ["song.create"],
        waitFor: "song-created",
      },
      {
        id: "songs.open",
        titleKey: "tour.interactive.songs.open.title",
        descriptionKey: "tour.interactive.songs.open.description",
        element: "[data-tour='nav-library']",
        side: "right",
        align: "start",
        waitFor: "song-opened",
      },
    ],
  },
  {
    id: "chordpro",
    requireAny: ["song.update", "song.access"],
    steps: [
      {
        id: "chordpro.editor",
        titleKey: "tour.interactive.chordpro.editor.title",
        descriptionKey: "tour.interactive.chordpro.editor.description",
        element: "[data-tour='song-editor']",
        side: "left",
        align: "start",
      },
      {
        id: "chordpro.preview",
        titleKey: "tour.interactive.chordpro.preview.title",
        descriptionKey: "tour.interactive.chordpro.preview.description",
        element: "[data-tour='song-preview']",
        side: "left",
        align: "start",
      },
      {
        id: "chordpro.save",
        titleKey: "tour.interactive.chordpro.save.title",
        descriptionKey: "tour.interactive.chordpro.save.description",
        element: "[data-tour='song-save']",
        side: "bottom",
        align: "end",
        requireAll: ["song.update"],
        waitFor: "song-saved",
      },
    ],
  },
  {
    id: "collections",
    requireAll: ["collection.access"],
    when: (ctx) => ctx.collectionsEnabled,
    steps: [
      {
        id: "collections.nav",
        titleKey: "tour.interactive.collections.nav.title",
        descriptionKey: "tour.interactive.collections.nav.description",
        element: "[data-tour='nav-collections']",
        side: "right",
        align: "start",
        waitFor: "navigated-collections",
      },
      {
        id: "collections.create",
        titleKey: "tour.interactive.collections.create.title",
        descriptionKey: "tour.interactive.collections.create.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAll: ["collection.create"],
        waitFor: "collection-created",
      },
    ],
  },
  {
    id: "services",
    requireAll: ["service.access"],
    steps: [
      {
        id: "services.nav",
        titleKey: "tour.interactive.services.nav.title",
        descriptionKey: "tour.interactive.services.nav.description",
        element: "[data-tour='nav-services']",
        side: "right",
        align: "start",
        waitFor: "navigated-services",
      },
      {
        id: "services.create",
        titleKey: "tour.interactive.services.create.title",
        descriptionKey: "tour.interactive.services.create.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAll: ["service.create"],
        waitFor: "service-created",
      },
      {
        id: "services.builder",
        titleKey: "tour.interactive.services.builder.title",
        descriptionKey: "tour.interactive.services.builder.description",
        element: "[data-tour='service-builder']",
        side: "left",
        align: "start",
        requireAny: ["service.update", "service.create"],
        waitFor: "service-opened",
      },
      {
        id: "services.elements",
        titleKey: "tour.interactive.services.elements.title",
        descriptionKey: "tour.interactive.services.elements.description",
        element: "[data-tour='service-builder']",
        side: "top",
        align: "center",
        requireAny: ["service.update", "service.create"],
      },
    ],
  },
  {
    id: "agenda",
    requireAll: ["agenda.access"],
    when: (ctx) => ctx.agendaEnabled,
    steps: [
      {
        id: "agenda.nav",
        titleKey: "tour.interactive.agenda.nav.title",
        descriptionKey: "tour.interactive.agenda.nav.description",
        element: "[data-tour='nav-agenda']",
        side: "right",
        align: "start",
        waitFor: "navigated-agenda",
      },
      {
        id: "agenda.create",
        titleKey: "tour.interactive.agenda.create.title",
        descriptionKey: "tour.interactive.agenda.create.description",
        element: "[data-tour='toolbar-create']",
        side: "bottom",
        align: "end",
        requireAll: ["agenda.create"],
        waitFor: "event-created",
      },
    ],
  },
  {
    id: "finish",
    steps: [
      {
        id: "finish.done",
        titleKey: "tour.interactive.finish.done.title",
        descriptionKey: "tour.interactive.finish.done.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "center",
      },
    ],
  },
];
