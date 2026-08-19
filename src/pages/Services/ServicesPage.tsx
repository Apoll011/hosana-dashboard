/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { usePermissionValue } from "@/src/lib/permissions/client";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  Service,
  servicesApi,
  Spinner,
} from "@hosanna/shared";
import { useStatsigClient } from "@statsig/react-bindings";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calendar,
  Church,
  Clock,
  Copy,
  Edit2,
  MoreHorizontal,
  MoreVertical,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ServiceForm } from "../../components/forms/ServiceForm";
import { useAuth } from "../../contexts/AuthContext";
import { useServices } from "../../hooks/useServices";

interface ServicesPageProps {
  hideHeader?: boolean;
  searchQuery?: string;
}

type ServiceSortBy = "date" | "name";
type SortOrder = "asc" | "desc";

export const ServicesPage: React.FC<ServicesPageProps> = ({
  hideHeader,
  searchQuery: externalSearchQuery,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const context = (useOutletContext<Record<string, unknown>>() || {}) as Record<
    string,
    unknown
  >;
  const actualHideHeader = hideHeader ?? context.hideHeader;
  const viewMode = context.viewMode ?? "grid";
  const density =
    (context.density as "comfortable" | "compact") ?? "comfortable";
  const contextSortBy = context.sortBy;
  const contextSortOrder = context.sortOrder;
  const actualSearchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : (context.searchQuery as string) || "";

  const { client } = useStatsigClient();
  const serviceAsFolderItem = client?.checkGate
    ? client.checkGate("service_as_folder_item")
    : false;

  const { servicesQuery, createService, updateService, deleteService } =
    useServices();

  // Effective sort (from MainLayout context)
  const effectiveSortBy: ServiceSortBy =
    contextSortBy === "title" ? "name" : "date";
  const effectiveSortOrder: SortOrder =
    ((contextSortOrder as SortOrder) ?? "desc");

  // ─── Archive toggle (from MainLayout context or local fallback) ──────────
  const showArchived = (context.showArchived as boolean) ?? false;

  // Fetch archived services (fallback if context doesn't provide)
  const localArchivedServicesQuery = useQuery({
    queryKey: ["services", "archived"],
    queryFn: async () => {
      const all = await servicesApi.getServices(true);
      return (Array.isArray(all) ? all : []).map((s: Service) => ({
        ...s,
        archived: true,
      }));
    },
    enabled: showArchived && !context.archivedServicesQuery,
    staleTime: 1000 * 60 * 5,
  });

  const archivedServicesQuery =
    (context.archivedServicesQuery as UseQueryResult<
      NoInfer<Service[]>,
      Error
    >) ?? localArchivedServicesQuery;

  const { value: emptyStateAction } = usePermissionValue(
    "service.create",
    "Criar Primeiro Culto",
    undefined,
  );

  // ─── Modal / dialog state ─────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    service: Service | null;
    isMulti?: boolean;
  } | null>(null);

  // ─── Multi-select state (for serviceAsFolderItem mode) ───────────────────
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<Set<string>>(new Set());
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchArchiveOpen, setIsBatchArchiveOpen] = useState(false);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const allServices: Service[] = useMemo(
    () =>
      (servicesQuery.data || []).map((s: Service) => ({
        ...s,
        archived: s.archived ?? false,
      })),
    [servicesQuery.data],
  );
  // Active (non-archived) services
  const activeServices = useMemo(
    () => allServices.filter((s) => !s.archived),
    [allServices],
  );
  const archivedServices = useMemo(
    () =>
      showArchived
        ? ((context.archivedServices as Service[] | null) ??
          archivedServicesQuery.data ??
          [])
        : [],
    [showArchived, context.archivedServices, archivedServicesQuery.data],
  );

  // ─── Filter + sort ────────────────────────────────────────────────────────
  const sortServices = useCallback(
    (list: Service[]): Service[] => {
      return [...list].sort((a, b) => {
        let valA: string;
        let valB: string;
        if (effectiveSortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else {
          // date
          valA = a.date || a.updatedAt || "";
          valB = b.date || b.updatedAt || "";
        }
        if (valA < valB) return effectiveSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return effectiveSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },
    [effectiveSortBy, effectiveSortOrder],
  );

  const filteredServices = useMemo(() => {
    let list = activeServices;
    if (actualSearchQuery.trim()) {
      const lq = actualSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(lq) ||
          (s.notes && s.notes.toLowerCase().includes(lq)),
      );
    }
    return sortServices(list);
  }, [activeServices, actualSearchQuery, sortServices]);

  const filteredArchivedServices = useMemo(() => {
    let list = archivedServices;
    if (actualSearchQuery.trim()) {
      const lq = actualSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(lq) ||
          (s.notes && s.notes.toLowerCase().includes(lq)),
      );
    }
    return sortServices(list);
  }, [archivedServices, actualSearchQuery, sortServices]);

  // ─── Close context menu on outside click ─────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // ─── Keyboard shortcuts (serviceAsFolderItem mode) ────────────────────────
  useEffect(() => {
    if (!serviceAsFolderItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if (e.key === "Escape") {
        setContextMenu(null);
        setSelectedServiceIds(new Set());
        setLastClickedId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedServiceIds(new Set(filteredServices.map((s) => s.id)));
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedServiceIds.size === 0) return;
        e.preventDefault();
        if (selectedServiceIds.size === 1) {
          const service = filteredServices.find((s) =>
            selectedServiceIds.has(s.id),
          );
          if (service) setDeleteTarget(service);
        } else {
          setIsBatchDeleteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [serviceAsFolderItem, filteredServices, selectedServiceIds]);

  // ─── Marquee rubber-band selection ────────────────────────────────────────
  const handleWorkspaceMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!serviceAsFolderItem) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, a, [role="dialog"], [data-item-id]'))
        return;

      isMouseDownRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      if (!e.ctrlKey && !e.metaKey) {
        setSelectedServiceIds(new Set());
        initialSelectionRef.current = new Set();
      } else {
        initialSelectionRef.current = new Set(selectedServiceIds);
      }
    },
    [serviceAsFolderItem, selectedServiceIds],
  );

  useEffect(() => {
    if (!serviceAsFolderItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isMouseDownRef.current ||
        !startPosRef.current ||
        !containerRef.current
      )
        return;

      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const left = Math.min(startX, e.clientX);
      const top = Math.min(startY, e.clientY);
      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);

      if (width > 4 || height > 4) {
        setSelectionBox({ x: left, y: top, width, height });

        const itemEls =
          containerRef.current.querySelectorAll<HTMLElement>("[data-item-id]");
        const next = new Set(initialSelectionRef.current);

        itemEls.forEach((el) => {
          const id = el.getAttribute("data-item-id");
          if (!id) return;
          const rect = el.getBoundingClientRect();
          const intersects = !(
            rect.right < left ||
            rect.left > left + width ||
            rect.bottom < top ||
            rect.top > top + height
          );
          if (intersects) next.add(id);
        });

        setSelectedServiceIds(next);
      }
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
  }, [serviceAsFolderItem]);

  // ─── Item click handler (Ctrl/Shift/normal) ───────────────────────────────
  const handleServiceClick = useCallback(
    (e: React.MouseEvent, service: Service, allDisplayed: Service[]) => {
      if (!serviceAsFolderItem) {
        navigate(`${slugPrefix}/services/${service.id}`);
        return;
      }
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        setSelectedServiceIds((prev) => {
          const next = new Set(prev);
          if (next.has(service.id)) next.delete(service.id);
          else next.add(service.id);
          return next;
        });
        setLastClickedId(service.id);
      } else if (e.shiftKey && lastClickedId) {
        const allIds = allDisplayed.map((s) => s.id);
        const idx1 = allIds.indexOf(lastClickedId);
        const idx2 = allIds.indexOf(service.id);
        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const rangeIds = allIds.slice(start, end + 1);
          setSelectedServiceIds(new Set(rangeIds));
        } else {
          setSelectedServiceIds(new Set([service.id]));
        }
        setLastClickedId(service.id);
      } else {
        if (
          selectedServiceIds.size === 1 &&
          selectedServiceIds.has(service.id)
        ) {
          // Double-click-like: navigate on second click if already selected alone
          navigate(`${slugPrefix}/services/${service.id}`);
          return;
        }
        setSelectedServiceIds(new Set([service.id]));
        setLastClickedId(service.id);
      }
    },
    [serviceAsFolderItem, navigate, lastClickedId, selectedServiceIds],
  );

  // ─── Service actions ──────────────────────────────────────────────────────
  const handleCreateServiceSubmit = async (data: {
    name: string;
    date: string;
    notes: string;
  }) => {
    const newService = await createService({
      name: data.name,
      date: data.date,
      notes: data.notes,
      elements: [],
    });
    setIsCreateModalOpen(false);
    navigate(`${slugPrefix}/services/${newService.id}`);
  };

  const handleEditServiceSubmit = async (data: {
    name: string;
    date: string;
    notes: string;
  }) => {
    if (!editTarget) return;
    await updateService({
      id: editTarget.id,
      data: {
        name: data.name,
        date: data.date,
        notes: data.notes,
        updatedAt: editTarget.updatedAt,
      },
    });
    setEditTarget(null);
  };

  const handleDuplicateService = async (service: Service) => {
    try {
      let fullElements = service.elements;
      if (!fullElements) {
        const fullService = await servicesApi.getServiceById(service.id);
        fullElements = fullService?.elements || [];
      }
      await createService({
        name: `${service.name} (Cópia)`,
        date: service.date,
        notes: service.notes || "",
        elements: fullElements || [],
      });
    } catch {
      await createService({
        name: `${service.name} (Cópia)`,
        date: service.date,
        notes: service.notes || "",
        elements: [],
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteService(deleteTarget.id);
    setDeleteTarget(null);
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
  };

  const handleArchiveToggle = async (service: Service) => {
    const nextArchived = !service.archived;
    await updateService({
      id: service.id,
      data: {
        archived: nextArchived,
        updatedAt: service.updatedAt,
      },
    });
    await queryClient.invalidateQueries({ queryKey: ["services"] });
    setArchiveTarget(null);
    setContextMenu(null);
  };

  const handleBatchDelete = async () => {
    for (const id of Array.from(selectedServiceIds)) {
      await deleteService(id);
    }
    setSelectedServiceIds(new Set());
    setIsBatchDeleteOpen(false);
  };

  const handleBatchArchive = async () => {
    for (const id of Array.from(selectedServiceIds)) {
      const service =
        filteredServices.find((s) => s.id === id) ||
        filteredArchivedServices.find((s) => s.id === id);
      if (service) {
        await updateService({
          id,
          data: { archived: !service.archived, updatedAt: service.updatedAt },
        });
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["services"] });
    setSelectedServiceIds(new Set());
    setIsBatchArchiveOpen(false);
  };

  // ─── Formatted date helper ────────────────────────────────────────────────
  const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions) =>
    new Date(dateStr).toLocaleDateString(
      "pt-PT",
      options ?? {
        weekday: "long",
        day: "numeric",
        month: "long",
      },
    );

  // ─── Context menu opener ──────────────────────────────────────────────────
  const openContextMenu = useCallback(
    (e: React.MouseEvent, service: Service) => {
      e.stopPropagation();
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 320);
      const isMulti =
        serviceAsFolderItem &&
        selectedServiceIds.size > 1 &&
        selectedServiceIds.has(service.id);
      setContextMenu({ x, y, service, isMulti });
    },
    [serviceAsFolderItem, selectedServiceIds],
  );



  // ─── Service card (standard view) ────────────────────────────────────────
  const renderServiceCard = (service: Service, isArchived = false) => (
    <div
      key={service.id}
      onClick={() => navigate(`${slugPrefix}/services/${service.id}`)}
      onContextMenu={(e) => openContextMenu(e, service)}
      className={`bg-m3-card border border-m3-border rounded-4xl p-8 shadow-xl shadow-black/5 hover:shadow-m3-primary/10 hover:border-m3-primary transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${isArchived ? "opacity-60" : ""}`}
    >
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-2 h-full bg-m3-primary opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="space-y-4">
        <div className="relative flex items-center justify-between min-h-8">
          <Badge variant="sky">
            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            {formatDate(service.date)}
          </Badge>

          <div
            tabIndex={0}
            className="group/island absolute right-0 z-10 flex items-center justify-center bg-m3-card/90 backdrop-blur-xs rounded-2xl border border-m3-border/60 shadow-sm overflow-hidden transition-[width,opacity] duration-300 ease-out outline-none cursor-default
             w-8 h-8 opacity-70
             hover:opacity-100 hover:w-46
             focus-within:opacity-100 focus-within:w-46"
          >
            <div
              className="absolute inset-0 w-8 h-8 flex items-center justify-center transition-all duration-300 pointer-events-none
            opacity-100 scale-100
            group-hover/island:opacity-0 group-hover/island:scale-75 group-hover/island:-translate-x-2
            focus-within:opacity-0 focus-within:scale-75 focus-within:-translate-x-2"
            >
              <MoreHorizontal className="w-4 h-4 text-m3-secondary" />
            </div>

            <div
              className="flex items-center gap-1 p-1 w-max transition-all duration-300
            opacity-0 translate-x-4 pointer-events-none
            group-hover/island:opacity-100 group-hover/island:translate-x-0 group-hover/island:pointer-events-auto
            focus-within:opacity-100 focus-within:translate-x-0 focus-within:pointer-events-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateService(service);
                }}
                title="Duplicar Culto"
                className="p-1.5 text-m3-secondary hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all focus:outline-none"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  //const html = await printApi.printService(service.id);
                  //printHtmlDirectly(html);
                }}
                title="Imprimir Culto"
                className="p-1.5 text-m3-secondary hover:text-sky-600 hover:bg-sky-500/10 rounded-xl cursor-pointer transition-all focus:outline-none"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveToggle(service);
                }}
                title={service.archived ? "Ativar Culto" : "Arquivar Culto"}
                className="p-1.5 text-m3-secondary hover:text-amber-600 hover:bg-amber-500/10 rounded-xl cursor-pointer transition-all focus:outline-none"
              >
                {service.archived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(service);
                }}
                title="Apagar Culto"
                className="p-1.5 text-m3-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all focus:outline-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTarget(service);
                }}
                title="Editar Nome e Data"
                className="p-1.5 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-xl cursor-pointer transition-all focus:outline-none"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black text-m3-text group-hover:text-m3-primary transition-colors leading-tight">
          {service.name}
        </h3>

        {service.notes && (
          <p className="text-xs text-m3-secondary line-clamp-3 italic opacity-80 leading-relaxed">
            &ldquo;{service.notes}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-4 pt-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-m3-primary">
        <span>Gerir Lista &amp; Notas</span>
        <div className="w-8 h-8 rounded-full bg-m3-primary/10 flex items-center justify-center group-hover:bg-m3-primary group-hover:text-white transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );

  // ─── Folder-item grid card ─────────────────────────────────────────────────
  const renderFolderItemCard = (
    service: Service,
    allDisplayed: Service[],
    isArchived = false,
  ) => {
    const isSelected = selectedServiceIds.has(service.id);
    const isCompact = density === "compact";
    return (
      <div
        key={service.id}
        data-item-id={service.id}
        data-item-type="service"
        onClick={(e) => handleServiceClick(e, service, allDisplayed)}
        onDoubleClick={() => navigate(`${slugPrefix}/services/${service.id}`)}
        onContextMenu={(e) => {
          if (!isSelected) {
            setSelectedServiceIds(new Set([service.id]));
            setLastClickedId(service.id);
          }
          openContextMenu(e, service);
        }}
        className={`${isCompact ? "p-3.5 rounded-2xl" : "p-5 rounded-3xl"} border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm select-none ${
          isArchived ? "opacity-50" : ""
        } ${
          isSelected
            ? "bg-m3-primary/10 border-m3-primary shadow-lg shadow-m3-primary/10"
            : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40 hover:shadow-xl"
        } active:scale-95`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            openContextMenu(
              {
                clientX: rect.left,
                clientY: rect.bottom + 4,
              } as unknown as React.MouseEvent,
              service,
            );
          }}
          className={`absolute ${isCompact ? "top-2 right-2 p-1" : "top-3 right-3 p-1.5"} rounded-xl text-m3-secondary hover:text-m3-text hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all z-10 cursor-pointer opacity-0 group-hover:opacity-100`}
          title="Mais opções"
          aria-label="Mais opções"
        >
          <MoreVertical className={isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        </button>

        <div
          className={`${isCompact ? "w-10 h-10 rounded-xl mb-2" : "w-14 h-14 rounded-2xl mb-3"} border flex items-center justify-center group-hover:scale-110 transition-transform ${
            isArchived
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
          }`}
        >
          {isArchived ? (
            <Archive
              className={`${isCompact ? "w-5 h-5" : "w-8 h-8"} opacity-80`}
            />
          ) : (
            <Church
              className={`${isCompact ? "w-5 h-5" : "w-8 h-8"} opacity-80`}
            />
          )}
        </div>

        <span
          className={`${isCompact ? "text-xs" : "text-sm"} font-black text-m3-text transition-colors truncate w-full px-1`}
        >
          {service.name}
        </span>

        <span className="text-[10px] text-m3-secondary font-bold truncate w-full px-1 mt-0.5 opacity-70">
          {formatDate(service.date, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    );
  };

  // ─── Folder-item list row ──────────────────────────────────────────────────
  const renderFolderItemRow = (
    service: Service,
    allDisplayed: Service[],
    isArchived = false,
  ) => {
    const isSelected = selectedServiceIds.has(service.id);
    const isCompact = density === "compact";
    const cellPadding = isCompact ? "py-2.5 px-4" : "py-4 px-6";
    return (
      <tr
        key={service.id}
        data-item-id={service.id}
        data-item-type="service"
        onClick={(e) => handleServiceClick(e, service, allDisplayed)}
        onDoubleClick={() => navigate(`${slugPrefix}/services/${service.id}`)}
        onContextMenu={(e) => {
          if (!isSelected) {
            setSelectedServiceIds(new Set([service.id]));
            setLastClickedId(service.id);
          }
          openContextMenu(e, service);
        }}
        className={`cursor-pointer transition-all group select-none ${
          isArchived ? "opacity-50" : ""
        } ${
          isSelected
            ? "bg-m3-primary/10 text-m3-text"
            : "hover:bg-m3-hover/50 text-m3-text"
        }`}
      >
        <td className={cellPadding}>
          <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
            {isArchived ? (
              <Archive
                className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-amber-500 opacity-80`}
              />
            ) : (
              <Calendar
                className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-sky-500 opacity-80`}
              />
            )}
            <span>{service.name}</span>
            {isArchived && <Badge variant="slate">Arquivado</Badge>}
          </div>
        </td>
        <td className={`${cellPadding} text-m3-secondary opacity-70`}>
          Culto (.service)
        </td>
        <td className={`${cellPadding} text-m3-secondary`}>
          {formatDate(service.date, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </td>
        <td className={`${cellPadding} text-right`}>
          <div className="flex items-center justify-end gap-1">
            <Button
              size={isCompact ? "sm" : "lg"}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${slugPrefix}/services/${service.id}`);
              }}
            >
              Abrir
            </Button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openContextMenu(
                  {
                    clientX: rect.left,
                    clientY: rect.bottom + 4,
                  } as unknown as React.MouseEvent,
                  service,
                );
              }}
              className="p-1.5 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
              title="Mais opções"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ─── Loading / empty states ───────────────────────────────────────────────
  if (servicesQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner label="A carregar agenda..." />
      </div>
    );
  }

  if (allServices.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col w-full mx-auto animate-in fade-in duration-500 overflow-y-auto h-full ${actualHideHeader ? "p-6" : "p-4 sm:p-8 max-w-7xl"}`}
      >
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-m3-primary opacity-40" />}
          title="Nenhum culto agendado"
          description="A sua agenda está livre. Que tal planejar o próximo momento de louvor?"
          actionLabel={emptyStateAction}
          onAction={() => setIsCreateModalOpen(true)}
        />
        {/* CREATE SERVICE MODAL */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Criar Plano de Culto"
        >
          <ServiceForm
            onSubmit={handleCreateServiceSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <div
      className={`flex-1 flex flex-col w-full mx-auto space-y-6 animate-in fade-in duration-500 overflow-y-auto h-full ${actualHideHeader ? "p-6" : "p-4 sm:p-8 max-w-7xl"}`}
      onMouseDown={handleWorkspaceMouseDown}
      ref={containerRef}
    >
      {/* ── Services Content ── */}
      {serviceAsFolderItem ? (
        /* FEATURE FLAG ACTIVE: SERVICE AS FOLDER/FILE ITEM VIEW */
        viewMode === "grid" ? (
          <div
            className={
              density === "compact"
                ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5"
                : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            }
          >
            {filteredServices.length === 0 && !showArchived ? (
              <div className="col-span-full text-center py-20 text-m3-secondary font-black uppercase tracking-widest opacity-60">
                Nenhum plano corresponde à sua pesquisa.
              </div>
            ) : (
              filteredServices.map((service) =>
                renderFolderItemCard(service, filteredServices),
              )
            )}

            {/* Archived section */}
            {showArchived && filteredArchivedServices.length > 0 && (
              <>
                <div className="col-span-full flex items-center gap-3 mt-4 mb-2">
                  <div className="h-px flex-1 bg-amber-500/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" />
                    Cultos Arquivados ({filteredArchivedServices.length})
                  </span>
                  <div className="h-px flex-1 bg-amber-500/20" />
                </div>
                {filteredArchivedServices.map((service) =>
                  renderFolderItemCard(service, filteredArchivedServices, true),
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-m3-border/40 rounded-3xl bg-m3-card shadow-sm">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
                  <th
                    className={
                      density === "compact" ? "py-2.5 px-4" : "py-4 px-6"
                    }
                  >
                    Nome do Culto
                  </th>
                  <th
                    className={
                      density === "compact" ? "py-2.5 px-4" : "py-4 px-6"
                    }
                  >
                    Tipo
                  </th>
                  <th
                    className={
                      density === "compact" ? "py-2.5 px-4" : "py-4 px-6"
                    }
                  >
                    Data Agendada
                  </th>
                  <th
                    className={`${density === "compact" ? "py-2.5 px-4" : "py-4 px-6"} text-right`}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-m3-border/30 ${density === "compact" ? "text-xs" : "text-[13px]"} font-bold`}
              >
                {filteredServices.length === 0 && !showArchived ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-m3-secondary opacity-60"
                    >
                      Nenhum plano corresponde à sua pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) =>
                    renderFolderItemRow(service, filteredServices),
                  )
                )}

                {/* Archived rows */}
                {showArchived && filteredArchivedServices.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-6 bg-amber-50/50 dark:bg-amber-950/20"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <Archive className="w-3.5 h-3.5" />
                          Cultos Arquivados ({filteredArchivedServices.length})
                        </span>
                      </td>
                    </tr>
                    {filteredArchivedServices.map((service) =>
                      renderFolderItemRow(
                        service,
                        filteredArchivedServices,
                        true,
                      ),
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* STANDARD SERVICE CARDS VIEW */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-20 text-m3-secondary font-black uppercase tracking-widest opacity-60">
                Nenhum plano corresponde à sua pesquisa.
              </div>
            ) : (
              filteredServices.map((service) => renderServiceCard(service))
            )}
          </div>

          {/* Archived section */}
          {showArchived && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-amber-500/20" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5" />
                  Cultos Arquivados
                  {archivedServicesQuery.isLoading && <Spinner />}
                </span>
                <div className="h-px flex-1 bg-amber-500/20" />
              </div>
              {filteredArchivedServices.length === 0 &&
                !archivedServicesQuery.isLoading && (
                  <p className="text-center text-m3-secondary text-sm opacity-60">
                    Nenhum culto arquivado.
                  </p>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArchivedServices.map((service) =>
                  renderServiceCard(service, true),
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Multi-select action bar (folder-item mode) ── */}
      {serviceAsFolderItem && selectedServiceIds.size > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl shadow-2xl px-5 py-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs font-black uppercase tracking-widest px-2">
            {selectedServiceIds.size} cultos selecionados
          </span>
          <div className="h-6 w-px bg-white/20 dark:bg-slate-900/20" />
          <Button
            size="sm"
            variant="ghost"
            icon={<Archive className="w-4 h-4" />}
            onClick={() => setIsBatchArchiveOpen(true)}
            className="text-amber-400! hover:bg-amber-500/10!"
          >
            Arquivar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setIsBatchDeleteOpen(true)}
            className="text-rose-400! hover:bg-rose-500/10!"
          >
            Eliminar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<X className="w-4 h-4" />}
            onClick={() => {
              setSelectedServiceIds(new Set());
              setLastClickedId(null);
            }}
            className="text-white/70! dark:text-slate-900/70! hover:bg-white/10! dark:hover:bg-slate-900/10!"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* ── FLOATING CONTEXT MENU ── */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isMulti ? (
            /* Multi-select context menu */
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-500 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 flex items-center justify-between">
                <span>Seleção Múltipla</span>
                <Badge variant="sky">{selectedServiceIds.size}</Badge>
              </div>
              <button
                onClick={() => {
                  setIsBatchArchiveOpen(true);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-500" />
                <span>Arquivar {selectedServiceIds.size} cultos</span>
              </button>
              <button
                onClick={() => {
                  setIsBatchDeleteOpen(true);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Apagar {selectedServiceIds.size} cultos</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />
              <button
                onClick={() => {
                  setSelectedServiceIds(new Set());
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Desmarcar seleção</span>
              </button>
            </>
          ) : contextMenu.service ? (
            /* Single service context menu */
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate">
                {contextMenu.service.name}
              </div>

              <button
                onClick={() => {
                  navigate(`${slugPrefix}/services/${contextMenu.service!.id}`);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Abrir Culto</span>
              </button>

              <button
                onClick={() => {
                  setEditTarget(contextMenu.service);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-blue-500" />
                <span>Editar Nome e Data</span>
              </button>

              <button
                onClick={() => {
                  handleDuplicateService(contextMenu.service!);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-500" />
                <span>Duplicar Culto</span>
              </button>

              <button
                onClick={async () => {
                  //const html = await printApi.printService(
                  //  contextMenu.service!.id,
                  //);
                  //printHtmlDirectly(html);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Imprimir Culto</span>
              </button>

              <button
                onClick={() => {
                  handleArchiveToggle(contextMenu.service!);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                {contextMenu.service.archived ? (
                  <ArchiveRestore className="w-4 h-4 text-orange-500" />
                ) : (
                  <Archive className="w-4 h-4 text-orange-500" />
                )}
                <span>
                  {contextMenu.service.archived ? "Ativar" : "Arquivar"} Culto
                </span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              <button
                onClick={() => {
                  setDeleteTarget(contextMenu.service);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Apagar Culto</span>
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* ── CREATE SERVICE MODAL ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Plano de Culto"
      >
        <ServiceForm
          onSubmit={handleCreateServiceSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* ── EDIT SERVICE MODAL ── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Editar Plano de Culto"
      >
        {editTarget && (
          <ServiceForm
            initialValues={{
              name: editTarget.name,
              date: editTarget.date,
              notes: editTarget.notes,
            }}
            onSubmit={handleEditServiceSubmit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* ── DELETE SERVICE DIALOG ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Apagar Culto"
        message={`Tem a certeza de que deseja apagar o culto "${deleteTarget?.name}"?`}
        confirmText="Apagar Culto"
      />

      {/* ── ARCHIVE SERVICE DIALOG ── */}
      <ConfirmDialog
        variant="primary"
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && handleArchiveToggle(archiveTarget)}
        title={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
        message={`Tem a certeza de que deseja ${archiveTarget?.archived ? "ativar" : "arquivar"} o culto "${archiveTarget?.name}"?`}
        confirmText={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
      />

      {/* ── BATCH DELETE DIALOG ── */}
      <ConfirmDialog
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        title={`Apagar ${selectedServiceIds.size} Cultos`}
        message={`Tem a certeza de que deseja apagar permanentemente ${selectedServiceIds.size} cultos selecionados?`}
        confirmText="Apagar Todos"
      />

      {/* ── BATCH ARCHIVE DIALOG ── */}
      <ConfirmDialog
        variant="primary"
        isOpen={isBatchArchiveOpen}
        onClose={() => setIsBatchArchiveOpen(false)}
        onConfirm={handleBatchArchive}
        title={`Arquivar ${selectedServiceIds.size} Cultos`}
        message={`Tem a certeza de que deseja arquivar ${selectedServiceIds.size} cultos selecionados?`}
        confirmText="Arquivar Todos"
      />

      {/* ── Marquee rubberband selection box ── */}
      {selectionBox && (
        <div
          style={{
            position: "fixed",
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: "none",
            zIndex: 100,
          }}
          className="border-2 border-sky-500 bg-sky-500/20 rounded-lg shadow-xl backdrop-blur-[1px]"
        />
      )}
    </div>
  );
};
