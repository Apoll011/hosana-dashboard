# Translation Status

All files and components in the application are now fully migrated to the i18n system (`src/i18n/`) with translations in Portuguese (`pt.ts`), English (`en.ts`), and Spanish (`es.ts`).

## Fully Migrated

- **Layout & Navigation:** MainLayout, AppSidebar, ExplorerAddressBar, ExplorerToolbar, HosannaCommandPalette, CommandPaletteModal.
- **Settings:** SettingsPage, AppearanceTab, GeneralTab, AboutTab, AccountTab, MembersTab, MemberProfilePage, WorkspaceTab, TwoFactor, settingsUtils (roles & badges).
- **Explorer:** FoldersPage, ExplorerItemCards, ExplorerItemRows, ServiceExplorerItems, FolderTreeItemNode, ExplorerContextMenu, ExplorerModals.
- **Forms & Modals:** FolderForm, SongForm, ServiceForm, MoveSongModal, BatchMoveModal, BatchDeleteModal, BatchTagModal, CustomizeFolderModal, CifraModal, HelpModal.
- **Misc Components:** ChorproSettings (ChordProPreviewSettings), Inbox (InboxPanel, InboxButton), SyncStatusBadge.
- **Pages:** SongsPage, SongEditorPage, TrashPage, ServicesPage, ServiceDetailPage, Services modals (Welcome, Bible, Message, Announcement, Custom, DurationField), TeamsPage, OnboardingPage.
- **Authentication & Login:** LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, TwoFactorPage, VerifyEmailPage, Tenant, AcceptInvitationPage, Layout, PasswordStrengthMeter.
- **Routing & Guards:** AppRoutes (ErrorFallback, PageLoader), ProtectedRoute.
- **Hooks & Data:** useSongs, useServices, useRxDbSearch.

_Note: BatchTagModal's PRESET_CATEGORIES and CustomizeFolderModal's color names remain data values (as they are persisted in stored items/database)._
