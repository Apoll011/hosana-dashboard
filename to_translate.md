Files still missing translation
Fully migrated (no remaining user-facing PT): MainLayout, FoldersPage, SongsPage, SongEditorPage, TrashPage, AppSidebar, ExplorerAddressBar, ExplorerToolbar, HosannaCommandPalette, CommandPaletteModal, SettingsPage, AppearanceTab, the three forms (FolderForm/SongForm/ServiceForm), and the modals MoveSongModal, BatchMoveModal, BatchDeleteModal, BatchTagModal, CustomizeFolderModal, CifraModal.

Partially migrated (1–2 leftover strings):

src/pages/Services/ServicesPage.tsx — "(Cópia)" suffix when duplicating a service.
src/components/settings/GeneralTab.tsx — "Erro de comunicação" fallback + the org-locale option labels (Português (Portugal), Português (Brasil), …).
Not migrated at all (still hardcoded PT):

Settings: AboutTab, AccountTab, MembersTab, MemberProfilePage, WorkspaceTab, TwoFactor, settingsUtils (role labels).
Explorer: ExplorerItemCards, ExplorerItemRows, ServiceExplorerItems, FolderTreeItemNode, ExplorerContextMenu, ExplorerModals.
Misc components: ChorproSettings, Inbox, SyncStatusBadge, HelpModal (snippets/shortcuts + headers).
Pages: TeamsPage, ServiceDetailPage, Services/modals/* (7 files), OnboardingPage, all Login/* pages, routes/AppRoutes (error fallback), routes/ProtectedRoute.
Hooks & import logic: useRxDbSearch, useSongs (PT toasts — useServices also has hardcoded English toasts that should be localized), import/chordpro, import/json.
utils/folderCustomization.ts — folder color/icon names (these are stored data values; translating them is optional/arguably wrong).
Note: BatchTagModal's PRESET_CATEGORIES and CustomizeFolderModal's color names are data values (they get persisted as tags/colors), so I intentionally left them untranslated rather than breaking stored data.
