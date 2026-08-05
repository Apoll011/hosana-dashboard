/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { printHtmlDirectly } from "@/src/utils";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  printApi,
  Service,
  servicesApi,
  Spinner,
} from "@hosanna/shared";
import { useStatsigClient } from "@statsig/react-bindings";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calendar,
  Church,
  Clock,
  Copy,
  Edit2,
  MoreVertical,
  Printer,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ServiceForm } from "../../components/forms/ServiceForm";
import { useServices } from "../../hooks/useServices";

interface ServicesPageProps {
  hideHeader?: boolean;
  searchQuery?: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  hideHeader,
  searchQuery: externalSearchQuery,
}) => {
  const navigate = useNavigate();
  const context = useOutletContext<any>() || {};
  const actualHideHeader = hideHeader ?? context.hideHeader;
  const viewMode = context.viewMode;
  const actualSearchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : context.searchQuery || "";

  const { client } = useStatsigClient();
  const serviceAsFolderItem = client?.checkGate
    ? client.checkGate("service_as_folder_item")
    : false;

  const {
    servicesQuery,
    createService,
    updateService,
    deleteService,
    archiveService,
  } = useServices();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    service: Service;
  } | null>(null);

  const services = servicesQuery.data || [];

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredServices = React.useMemo(() => {
    if (!actualSearchQuery.trim()) return services;
    const lowerQuery = actualSearchQuery.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerQuery) ||
        (service.notes && service.notes.toLowerCase().includes(lowerQuery)),
    );
  }, [services, actualSearchQuery]);

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
    navigate(`/services/${newService.id}`);
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
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    await archiveService({
      id: archiveTarget.id,
      archived: !archiveTarget.archived,
    });
    setArchiveTarget(null);
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full ${hideHeader ? "p-6" : "p-4 sm:p-8 max-w-7xl"}`}
    >
      {/* Services Content */}
      {servicesQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <Spinner label="A carregar agenda..." />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-m3-primary opacity-40" />}
          title="Nenhum culto agendado"
          description="A sua agenda está livre. Que tal planejar o próximo momento de louvor?"
          actionLabel="Criar Primeiro Culto"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : serviceAsFolderItem ? (
        /* FEATURE FLAG ACTIVE: SERVICE AS FOLDER/FILE ITEM VIEW */
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-20 text-m3-secondary font-black uppercase tracking-widest opacity-60">
                Nenhum plano corresponde à sua pesquisa.
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id}`)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, service });
                  }}
                  className="p-5 rounded-3xl border border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40 transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenu({
                        x: rect.left,
                        y: rect.bottom + 4,
                        service,
                      });
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all z-10 cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Mais opções"
                    aria-label="Mais opções"
                  >
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>

                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3 group-hover:scale-110 transition-transform">
                    <Church className="w-8 h-8 opacity-80" />
                  </div>

                  <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">
                    {service.name}
                  </span>

                  <span className="text-[10px] text-m3-secondary font-bold truncate w-full px-1 mt-0.5 opacity-70">
                    {new Date(service.date).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-m3-border/40 rounded-3xl bg-m3-card shadow-sm">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
                  <th className="py-4 px-6">Nome do Culto</th>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Data Agendada</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-border/30 text-[13px] font-bold">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-m3-secondary opacity-60"
                    >
                      Nenhum plano corresponde à sua pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      onClick={() => navigate(`/services/${service.id}`)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, service });
                      }}
                      className="cursor-pointer transition-all group select-none hover:bg-m3-hover/50 text-m3-text"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                          <Calendar className="w-5 h-5 text-sky-500 opacity-80" />
                          <span>{service.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-m3-secondary opacity-70">
                        Culto (.service)
                      </td>
                      <td className="py-4 px-6 text-m3-secondary">
                        {new Date(service.date).toLocaleDateString("pt-PT", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="lg"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/services/${service.id}`);
                            }}
                          >
                            Abrir
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setContextMenu({
                                x: rect.left,
                                y: rect.bottom + 4,
                                service,
                              });
                            }}
                            className="p-2 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                            title="Mais opções"
                            aria-label="Mais opções"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* STANDARD SERVICE CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-20 text-m3-secondary font-black uppercase tracking-widest opacity-60">
              Nenhum plano corresponde à sua pesquisa.
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY, service });
                }}
                className="bg-m3-card border border-m3-border rounded-4xl p-8 shadow-xl shadow-black/5 hover:shadow-m3-primary/10 hover:border-m3-primary transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-m3-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="sky">
                      <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      {new Date(service.date).toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </Badge>

                    {/* Action Buttons list (Position fixed nicely) */}
                    <div className="flex items-center gap-1 bg-m3-card/90 backdrop-blur-xs p-1 rounded-2xl border border-m3-border/60 shadow-sm transition-all opacity-90 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTarget(service);
                        }}
                        title="Editar Nome e Data"
                        aria-label="Editar Nome e Data"
                        className="p-1.5 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-xl cursor-pointer transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateService(service);
                        }}
                        title="Duplicar Culto"
                        aria-label="Duplicar Culto"
                        className="p-1.5 text-m3-secondary hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const html = await printApi.printService(service.id);
                          printHtmlDirectly(html);
                        }}
                        title="Imprimir Culto"
                        aria-label="Imprimir Culto"
                        className="p-1.5 text-m3-secondary hover:text-sky-600 hover:bg-sky-500/10 rounded-xl cursor-pointer transition-all"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchiveTarget(service);
                        }}
                        title={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
                        aria-label={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
                        className="p-1.5 text-m3-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all"
                      >
                        {archiveTarget?.archived ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <ArchiveRestore className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(service);
                        }}
                        title="Apagar Culto"
                        aria-label="Apagar Culto"
                        className="p-1.5 text-m3-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-m3-text group-hover:text-m3-primary transition-colors leading-tight">
                    {service.name}
                  </h3>

                  {service.notes && (
                    <p className="text-xs text-m3-secondary line-clamp-3 italic opacity-80 leading-relaxed">
                      "{service.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-m3-primary">
                  <span>Gerir Lista & Notas</span>
                  <div className="w-8 h-8 rounded-full bg-m3-primary/10 flex items-center justify-center group-hover:bg-m3-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate">
            {contextMenu.service.name}
          </div>

          <button
            onClick={() => {
              navigate(`/services/${contextMenu.service.id}`);
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
              handleDuplicateService(contextMenu.service);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
          >
            <Copy className="w-4 h-4 text-emerald-500" />
            <span>Duplicar Culto</span>
          </button>

          <button
            onClick={async () => {
              const html = await printApi.printService(contextMenu.service.id);
              printHtmlDirectly(html);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>Imprimir Culto</span>
          </button>

          <button
            onClick={() => {
              setArchiveTarget(contextMenu.service);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
          >
            {archiveTarget?.archived ? (
              <Archive className="w-4 h-4 text-orange-500" />
            ) : (
              <ArchiveRestore className="w-4 h-4 text-orange-500" />
            )}
            <span>{archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto</span>
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
        </div>
      )}

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

      {/* EDIT SERVICE MODAL */}
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

      {/* DELETE SERVICE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Apagar Culto"
        message={`Tem a certeza de que deseja apagar o culto "${deleteTarget?.name}"?`}
        confirmText="Apagar Culto"
      />
      <ConfirmDialog
        variant="primary"
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
        message={`Tem a certeza de que deseja ${archiveTarget?.archived ? "ativar" : "arquivar"} o culto "${archiveTarget?.name}"?`}
        confirmText={`${archiveTarget?.archived ? "Ativar" : "Arquivar"} Culto`}
      />
    </div>
  );
};
