/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';
import { Service } from '../../types';
import {
  Calendar, Plus, Clock, Music, Edit2, Trash2, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ServiceForm } from '../../components/forms/ServiceForm';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';

interface ServicesPageProps {
  hideHeader?: boolean;
  searchQuery?: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ hideHeader, searchQuery = '' }) => {
  const navigate = useNavigate();

  const { servicesQuery, createService, deleteService } = useServices();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const services = servicesQuery.data || [];
  
  const filteredServices = React.useMemo(() => {
    if (!searchQuery.trim()) return services;
    const lowerQuery = searchQuery.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(lowerQuery) || 
      (service.notes && service.notes.toLowerCase().includes(lowerQuery))
    );
  }, [services, searchQuery]);

  const handleCreateServiceSubmit = async (data: { name: string; date: string; notes: string }) => {
    const newService = await createService({
      name: data.name,
      date: data.date,
      notes: data.notes,
      songIds: [],
      songs: [],
      songNotes: {},
    });
    setIsCreateModalOpen(false);
    navigate(`/services/${newService.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteService(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className={`flex-1 flex flex-col w-full mx-auto space-y-8 animate-in fade-in duration-500 ${hideHeader ? 'p-6' : 'p-4 sm:p-8 max-w-7xl'}`}>
      {/* Header Banner */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-m3-text tracking-tighter flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-m3-primary/10 text-m3-primary flex items-center justify-center border border-m3-primary/20">
                <Calendar className="w-7 h-7" />
              </div>
              Planeador de Cultos
            </h1>
            <p className="text-sm text-m3-secondary font-bold uppercase tracking-widest mt-2 ml-16 opacity-60">
              Organize as listas de cânticos para os próximos eventos
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-2xl py-6 px-6 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-m3-primary/20"
          >
            Novo Culto
          </Button>
        </div>
      )}

      {/* Services Grid */}
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
      ) : (
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
              className="bg-m3-card border border-m3-border rounded-[32px] p-8 shadow-xl shadow-black/5 hover:shadow-m3-primary/10 hover:border-m3-primary transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-2 h-full bg-m3-primary opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <Badge variant="sky">
                    <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                    {new Date(service.date).toLocaleDateString('pt-PT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Badge>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(service);
                    }}
                    title="Apagar Culto"
                    className="p-2 text-m3-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                <h3 className="text-xl font-black text-m3-text group-hover:text-m3-primary transition-colors leading-tight">
                  {service.name}
                </h3>

                {service.notes && (
                  <p className="text-xs text-m3-secondary line-clamp-3 italic opacity-80 leading-relaxed">
                    "{service.notes}"
                  </p>
                )}

                <div className="pt-5 border-t border-m3-border/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-m3-secondary">
                    {service.songs ? service.songs.length : 0} Cânticos agendados
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-m3-primary">
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

      {/* DELETE SERVICE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Apagar Culto"
        message={`Tem a certeza de que deseja apagar o culto "${deleteTarget?.name}"?`}
        confirmText="Apagar Culto"
      />
    </div>
  );
};
