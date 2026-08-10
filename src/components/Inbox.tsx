/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  X,
  Building2,
  Users,
  Shield,
  CreditCard,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@hosanna/shared";

export interface NotificationItem {
  id: string;
  type: "organization" | "team" | "security" | "billing";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface UseInboxOptions {
  organizationId?: string;
  pollInterval?: number;
}

export interface UseInboxReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  refresh: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "organization",
    title: "Boas-vindas à Organização",
    message: "A sua conta foi associada com sucesso à organização principal.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "notif-2",
    type: "team",
    title: "Adicionado à Equipa de Louvor",
    message: "Foi promovido a Líder de Equipa de Louvor.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: "notif-3",
    type: "security",
    title: "Nova Sessão Detetada",
    message: "Novo início de sessão a partir do navegador Chrome.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "notif-4",
    type: "billing",
    title: "Subscrição Ativa",
    message: "O plano de organização está ativo e sincronizado com Sucesso.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export function useInbox(
  client: any,
  options?: UseInboxOptions
): UseInboxReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("hosanna_inbox_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      } catch {
        return DEFAULT_NOTIFICATIONS;
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "hosanna_inbox_notifications",
      JSON.stringify(notifications)
    );
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  }, []);

  const loadMore = useCallback(() => {
    setHasMore(false);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const pollInterval = options?.pollInterval ?? 30000;
    const timer = setInterval(() => {
      // Periodic check
    }, pollInterval);
    return () => clearInterval(timer);
  }, [options?.pollInterval]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    deleteNotification,
    refresh,
  };
}

export interface InboxPanelProps {
  inbox: UseInboxReturn;
  onNavigate?: (notif: NotificationItem) => void;
  renderItem?: (notif: NotificationItem) => React.ReactNode;
  onClose?: () => void;
}

export const InboxPanel: React.FC<InboxPanelProps> = ({
  inbox,
  onNavigate,
  renderItem,
  onClose,
}) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const filteredNotifications = inbox.notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "organization":
        return <Building2 className="w-4 h-4 text-sky-500" />;
      case "team":
        return <Users className="w-4 h-4 text-emerald-500" />;
      case "security":
        return <Shield className="w-4 h-4 text-amber-500" />;
      case "billing":
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[520px] animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Notificações
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {inbox.unreadCount} não lida{inbox.unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {inbox.unreadCount > 0 && (
            <button
              onClick={inbox.markAllRead}
              title="Marcar todas como lidas"
              className="p-1.5 text-xs text-m3-primary hover:bg-m3-primary/10 rounded-lg transition-colors flex items-center gap-1 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lerdas todas</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs px-2 pt-2 bg-slate-50/30 dark:bg-slate-900/30">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors border-b-2 ${
            filter === "all"
              ? "border-m3-primary text-m3-primary bg-white dark:bg-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Todas ({inbox.notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors border-b-2 ${
            filter === "unread"
              ? "border-m3-primary text-m3-primary bg-white dark:bg-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Não Lidas ({inbox.unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-600">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            if (renderItem) return renderItem(notif);

            return (
              <div
                key={notif.id}
                onClick={() => {
                  inbox.markRead(notif.id);
                  if (onNavigate) onNavigate(notif);
                  setSelectedNotif(notif);
                }}
                className={`p-3 transition-colors cursor-pointer flex gap-3 items-start group ${
                  !notif.read
                    ? "bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-m3-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                    {notif.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inbox.deleteNotification(notif.id);
                    }}
                    title="Remover"
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Details Modal/Drawer */}
      {selectedNotif && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-m3-primary flex items-center gap-1 uppercase tracking-wider">
              {getIcon(selectedNotif.type)}
              {selectedNotif.type}
            </span>
            <button
              onClick={() => setSelectedNotif(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Fechar
            </button>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
            {selectedNotif.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {selectedNotif.message}
          </p>
        </div>
      )}
    </div>
  );
};

export interface InboxButtonProps {
  client: any;
  onNavigate?: (notif: NotificationItem) => void;
  renderItem?: (notif: NotificationItem) => React.ReactNode;
  pollInterval?: number;
  organizationId?: string;
  className?: string;
}

export const InboxButton: React.FC<InboxButtonProps> = ({
  client,
  onNavigate,
  renderItem,
  pollInterval = 30000,
  organizationId,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const inbox = useInbox(client, { pollInterval, organizationId });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer focus:outline-none"
        title="Inbox de Notificações"
      >
        <Bell className="w-5 h-5" />
        {inbox.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {inbox.unreadCount > 9 ? "9+" : inbox.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50">
          <InboxPanel
            inbox={inbox}
            onNavigate={onNavigate}
            renderItem={renderItem}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
