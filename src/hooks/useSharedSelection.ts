import React, { useCallback, useEffect, useRef, useState } from "react";

export type SelectionRecord<TType extends string> = Record<TType, Set<string>>;

export interface SelectionViewItem<TType extends string> {
  id: string;
  type: TType;
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseSharedSelectionOptions<TType extends string> {
  enabled?: boolean;
  itemTypes: readonly TType[];
  viewItems: SelectionViewItem<TType>[];
  containerRef: React.RefObject<HTMLElement | null>;
}

function createEmptySelection<TType extends string>(
  itemTypes: readonly TType[],
): SelectionRecord<TType> {
  const next = {} as SelectionRecord<TType>;
  itemTypes.forEach((type) => {
    next[type] = new Set<string>();
  });
  return next;
}

function cloneSelectionRecord<TType extends string>(
  source: SelectionRecord<TType>,
  itemTypes: readonly TType[],
): SelectionRecord<TType> {
  const next = {} as SelectionRecord<TType>;
  itemTypes.forEach((type) => {
    next[type] = new Set(source[type] ?? []);
  });
  return next;
}

export function isTypingElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

export function useSharedSelection<TType extends string>({
  enabled = true,
  itemTypes,
  viewItems,
  containerRef,
}: UseSharedSelectionOptions<TType>) {
  const [selectedIdsByType, setSelectedIdsByType] =
    useState<SelectionRecord<TType>>(() => createEmptySelection(itemTypes));
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isMouseDownRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<SelectionRecord<TType>>(
    createEmptySelection(itemTypes),
  );

  const setSelectedIdsForType = useCallback(
    (type: TType, nextIds: Set<string>) => {
      setSelectedIdsByType((prev) => ({
        ...prev,
        [type]: new Set(nextIds),
      }));
    },
    [],
  );

  const selectOnly = useCallback(
    (id: string, type: TType) => {
      const next = createEmptySelection(itemTypes);
      next[type].add(id);
      setSelectedIdsByType(next);
    },
    [itemTypes],
  );

  const toggleItemSelection = useCallback((id: string, type: TType) => {
    setSelectedIdsByType((prev) => {
      const next = { ...prev };
      const currentSet = new Set(prev[type] ?? []);
      if (currentSet.has(id)) currentSet.delete(id);
      else currentSet.add(id);
      next[type] = currentSet;
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIdsByType(createEmptySelection(itemTypes));
    setLastClickedId(null);
  }, [itemTypes]);

  const selectAllInView = useCallback(
    (items?: SelectionViewItem<TType>[]) => {
      const sourceItems = items ?? viewItems;
      const next = createEmptySelection(itemTypes);
      sourceItems.forEach((item) => {
        next[item.type].add(item.id);
      });
      setSelectedIdsByType(next);
    },
    [itemTypes, viewItems],
  );

  const handleItemClick = useCallback(
    (
      e: React.MouseEvent,
      id: string,
      type: TType,
      orderedItems?: SelectionViewItem<TType>[],
    ) => {
      if (!enabled) return;
      e.stopPropagation();
      const sourceItems = orderedItems ?? viewItems;

      if (e.ctrlKey || e.metaKey) {
        toggleItemSelection(id, type);
        setLastClickedId(id);
        return;
      }

      if (e.shiftKey && lastClickedId) {
        const allIds = sourceItems.map((item) => item.id);
        const idx1 = allIds.indexOf(lastClickedId);
        const idx2 = allIds.indexOf(id);
        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const range = sourceItems.slice(start, end + 1);
          const next = createEmptySelection(itemTypes);
          range.forEach((item) => {
            next[item.type].add(item.id);
          });
          setSelectedIdsByType(next);
        } else {
          selectOnly(id, type);
        }
        setLastClickedId(id);
        return;
      }

      selectOnly(id, type);
      setLastClickedId(id);
    },
    [
      enabled,
      viewItems,
      toggleItemSelection,
      lastClickedId,
      itemTypes,
      selectOnly,
    ],
  );

  const handleWorkspaceMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled || e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, a, [role="dialog"], [data-item-id]')) {
        return;
      }

      const isAdditive = e.ctrlKey || e.metaKey;
      isMouseDownRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      if (!isAdditive) {
        const empty = createEmptySelection(itemTypes);
        setSelectedIdsByType(empty);
        setLastClickedId(null);
        initialSelectionRef.current = empty;
      } else {
        initialSelectionRef.current = cloneSelectionRecord(
          selectedIdsByType,
          itemTypes,
        );
      }
    },
    [enabled, itemTypes, selectedIdsByType],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isMouseDownRef.current ||
        !startPosRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const left = Math.min(startX, e.clientX);
      const top = Math.min(startY, e.clientY);
      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);

      if (width <= 4 && height <= 4) return;

      setSelectionBox({ x: left, y: top, width, height });

      const itemEls =
        containerRef.current.querySelectorAll<HTMLElement>("[data-item-id]");
      const next = cloneSelectionRecord(initialSelectionRef.current, itemTypes);

      itemEls.forEach((el) => {
        const id = el.getAttribute("data-item-id");
        const typeAttr = el.getAttribute("data-item-type") as TType | null;
        if (!id || !typeAttr || !itemTypes.includes(typeAttr)) return;

        const rect = el.getBoundingClientRect();
        const intersects = !(
          rect.right < left ||
          rect.left > left + width ||
          rect.bottom < top ||
          rect.top > top + height
        );

        if (intersects) {
          next[typeAttr].add(id);
        }
      });

      setSelectedIdsByType(next);
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        startPosRef.current = null;
        setSelectionBox(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, containerRef, itemTypes]);

  return {
    selectedIdsByType,
    setSelectedIdsByType,
    setSelectedIdsForType,
    lastClickedId,
    setLastClickedId,
    selectionBox,
    clearSelection,
    selectOnly,
    selectAllInView,
    toggleItemSelection,
    handleItemClick,
    handleWorkspaceMouseDown,
  };
}

interface UseSelectionKeyboardShortcutsOptions {
  enabled?: boolean;
  onEscape?: () => void;
  onSelectAll?: (event: KeyboardEvent) => void;
  onDelete?: (event: KeyboardEvent) => void;
  onEnter?: (event: KeyboardEvent) => void;
}

export function useSelectionKeyboardShortcuts({
  enabled = true,
  onEscape,
  onSelectAll,
  onDelete,
  onEnter,
}: UseSelectionKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      if (isTypingElement(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        onSelectAll?.(e);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        onDelete?.(e);
        return;
      }

      if (e.key === "Enter") {
        onEnter?.(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onEscape, onSelectAll, onDelete, onEnter]);
}
