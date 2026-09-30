/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfirmDialog, EmptyState, Spinner } from "@/src/components/common";
import { CreateCollectionModal } from "@/src/components/modals/CreateCollectionModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useCollections } from "@/src/hooks/useCollections";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Collection } from "@/src/types";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "@/src/utils/folderCustomization";
import {
  Edit2,
  LibraryBig,
  MoreHorizontal,
  Printer,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

type CollectionSortBy = "updatedAt" | "title" | "number";

export const CollectionsPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const { organization, user } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const { granted: canCreateCollection } = useCan("collection.create");

  const { searchQuery, sortBy } = useOutletContext<{
    searchQuery: string;
    sortBy: CollectionSortBy;
  }>();

  const {
    collections,
    isLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    printCollection,
  } = useCollections();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deletingCollection, setDeletingCollection] =
    useState<Collection | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Filtered & Sorted collections
  const filteredCollections = useMemo(() => {
    let result = [...collections];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "title") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "number") {
        const countA = a.songCount ?? a.songIds?.length ?? 0;
        const countB = b.songCount ?? b.songIds?.length ?? 0;
        return countB - countA;
      }
      // Recent (default)
      const dateA = a.updatedAt || a.createdAt || "";
      const dateB = b.updatedAt || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    return result;
  }, [collections, searchQuery, sortBy, user?.id, organization?.id]);

  const handleCreateSubmit = async (data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    image?: string | null;
  }) => {
    await createCollection(data);
  };

  const handleUpdateSubmit = async (data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    image?: string | null;
  }) => {
    if (!editingCollection) return;
    await updateCollection({
      id: editingCollection.id,
      ...data,
    });
    setEditingCollection(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCollection) return;
    await deleteCollection(deletingCollection.id);
    setDeletingCollection(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-m3-bg">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-m3-bg">
      {/* COLLECTIONS GRID */}
      {filteredCollections.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <EmptyState
            icon={<LibraryBig className="w-8 h-8" />}
            title={
              searchQuery
                ? t("foldersPage.noResults")
                : t("collectionsPage.noCollectionsAvailable")
            }
            description={
              searchQuery
                ? t("foldersPage.noResultsDesc", {
                    folder: t("common.collections"),
                    query: searchQuery,
                  })
                : t("collectionsPage.createCollectionFirst")
            }
            actionLabel={
              !searchQuery && canCreateCollection
                ? t("addressBar.newCollection")
                : undefined
            }
            onAction={
              !searchQuery && canCreateCollection
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
          />
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Collection Cards */}
            {filteredCollections.map((collection) => {
              const IconComp = getFolderIconComponent(collection.icon);
              const colorStyle = getFolderColorStyle(collection.color);
              const songCount =
                collection.songCount ?? collection.songIds?.length ?? 0;
              const isMenuOpen = openMenuId === collection.id;

              return (
                <div
                  key={collection.id}
                  onClick={() =>
                    navigate(`${slugPrefix}/collections/${collection.id}`)
                  }
                  className="group relative rounded-[var(--radius-lg)] border border-m3-border/80 bg-m3-card overflow-hidden hover:border-m3-primary/40 transition-colors duration-200 cursor-pointer flex flex-col"
                >
                  {collection.image && (
                    <div className="relative h-16 w-full overflow-hidden bg-m3-sidebar">
                      <img
                        src={collection.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="relative px-4 py-3.5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${colorStyle.colorHex}18`,
                          color: colorStyle.colorHex,
                          borderColor: `${colorStyle.colorHex}33`,
                        }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h4 className="text-sm font-semibold text-m3-text line-clamp-1 group-hover:text-m3-primary transition-colors">
                          {collection.name}
                        </h4>
                        <span className="text-caption mt-0.5 block">
                          {t(
                            `collectionsPage.songCount.${songCount === 1 ? "one" : "other"}`,
                            { count: songCount },
                          )}
                        </span>
                      </div>

                      {/* Three Dots Menu Button */}
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : collection.id);
                          }}
                          className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-[var(--radius-md)] text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                          aria-label={t("explorer.moreOptions")}
                          title={t("explorer.moreOptions")}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-xl z-20 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            <Can permission="collection.update">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setEditingCollection(collection);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-m3-primary" />
                                {t("collectionsPage.edit")}
                              </button>
                            </Can>
                            <Can permission="export.pdf">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  void printCollection(collection);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                              >
                                <Printer className="w-3.5 h-3.5 text-m3-secondary" />
                                {t("print.buttons.printCollection")}
                              </button>
                            </Can>
                            <Can permission="collection.delete">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setDeletingCollection(collection);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                {t("collectionsPage.delete")}
                              </button>
                            </Can>
                          </div>
                        )}
                      </div>
                    </div>

                    {collection.description && (
                      <p className="text-caption line-clamp-2 mt-2.5 leading-relaxed">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSubmit}
      />

      {/* Edit Modal */}
      {editingCollection && (
        <CreateCollectionModal
          isOpen={Boolean(editingCollection)}
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onSave={handleUpdateSubmit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDeleteConfirm}
        title={t("collectionsPage.deleteTitle")}
        message={t("collectionsPage.deleteMessage", {
          name: deletingCollection?.name ?? "",
        })}
        confirmText={t("collectionsPage.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
};
