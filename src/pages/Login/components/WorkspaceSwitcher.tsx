/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { useI18n } from "@/src/lib/i18n";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Compact workspace (organization) switcher for pre-app screens (e.g.
 * onboarding). Renders nothing when the user belongs to a single
 * organization — it only appears when there is something to switch to.
 */
export function WorkspaceSwitcher({ className = "" }: { className?: string }) {
  const { organization, organizations, switchOrganization } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasMultipleOrgs = organizations.length > 1;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only meaningful for users who belong to more than one organization.
  if (!hasMultipleOrgs || !organization) return null;

  const shortName = organization.metadata?.shortName || organization.slug;

  const handleSwitch = async (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (!target || target.id === organization.id || switchingOrgId) return;

    setSwitchingOrgId(orgId);
    setErrorMsg("");
    try {
      // On success this hard-navigates to the new workspace.
      await switchOrganization(target);
    } catch (err) {
      setErrorMsg(
        t("settings.workspace.switchOrgError", {
          error: (err as { message?: string })?.message || "",
        }),
      );
      setSwitchingOrgId(null);
    }
  };

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => {
          setErrorMsg("");
          setIsOpen(!isOpen);
        }}
        title={t("sidebar.switchWorkspace")}
        aria-label={t("sidebar.switchWorkspace")}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200 inline-flex items-center gap-1.5"
      >
        <Building2 className="w-5 h-5 shrink-0" />
        <span className="text-xs font-bold max-w-24 truncate hidden sm:inline">
          {shortName}
        </span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            {t("sidebar.switchWorkspace")}
          </p>
          {organizations.map((org) => {
            const isActive = org.id === organization.id;
            const isLoading = switchingOrgId === org.id;
            return (
              <button
                key={org.id}
                type="button"
                disabled={isActive || switchingOrgId !== null}
                onClick={() => handleSwitch(org.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-blue-50 dark:bg-m3-primary/20 text-m3-primary font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="w-7 h-7 rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-m3-primary/10 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-m3-primary">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (org.name?.trim().charAt(0) || "·").toUpperCase()
                  )}
                </div>
                <span className="flex-1 min-w-0 text-left">
                  <span className="block font-semibold truncate">
                    {org.name}
                  </span>
                  <span className="block text-[10px] opacity-70 truncate">
                    @{org.slug}
                  </span>
                </span>
                {isActive && <Check className="w-4 h-4 shrink-0" />}
                {isLoading && (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                )}
              </button>
            );
          })}
          {errorMsg && (
            <p className="px-3 pb-1.5 pt-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
