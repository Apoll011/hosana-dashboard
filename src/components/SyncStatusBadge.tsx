import React from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useSync } from "../contexts/SyncContext";

interface SyncStatusBadgeProps {
  className?: string;
  showText?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  className = "",
  showText = false,
}) => {
  const { syncStatus, triggerSyncCheck, lastSyncedAt } = useSync();

  const getStatusConfig = () => {
    switch (syncStatus) {
      case "syncing":
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />,
          label: "A sincronizar...",
          tooltip: "A sincronizar dados locais com o servidor...",
          bgClass: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        };
      case "offline":
        return {
          icon: <CloudOff className="w-4 h-4 text-amber-500" />,
          label: "Offline",
          tooltip:
            "Modo offline. As alterações serão sincronizadas quando reconectar.",
          bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          label: "Erro ao sincronizar",
          tooltip: "Erro na sincronização. Clique para tentar novamente.",
          bgClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
      case "synced":
      default:
        return {
          icon: <Cloud className="w-4 h-4 text-emerald-500" />,
          label: "Sincronizado",
          tooltip: `Sincronizado${lastSyncedAt ? ` (${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}. Clique para forçar sincronização.`,
          bgClass:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={() => void triggerSyncCheck()}
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 text-xs font-medium ${config.bgClass} ${className}`}
    >
      {config.icon}
      {showText && <span>{config.label}</span>}
    </button>
  );
};
