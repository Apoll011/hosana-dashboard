/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppleIcon,
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
  MicrosoftIcon,
} from "@/src/components/icons/SocialIcons";
import { authClient } from "@/src/lib/authClient";
import { useI18n } from "@/src/lib/i18n";
import { posthog } from "@/src/lib/posthog";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

export type SocialProviderId =
  | "google"
  | "github"
  | "apple"
  | "microsoft"
  | "discord"
  | (string & {});

export interface SocialProviderOption {
  id: SocialProviderId;
  name: string;
  icon: React.FC<{ className?: string }>;
  enabled?: boolean;
}

export const DEFAULT_LOGIN_PROVIDERS: SocialProviderOption[] = [
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    enabled: true,
  },
  {
    id: "github",
    name: "GitHub",
    icon: GitHubIcon,
    enabled: false,
  },
  {
    id: "apple",
    name: "Apple",
    icon: AppleIcon,
    enabled: false,
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: MicrosoftIcon,
    enabled: false,
  },
  {
    id: "discord",
    name: "Discord",
    icon: DiscordIcon,
    enabled: false,
  },
];

interface SocialAuthButtonsProps {
  providers?: SocialProviderOption[];
  onError?: (error: string) => void;
  disabled?: boolean;
  callbackURL?: string;
  showDivider?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  providers = DEFAULT_LOGIN_PROVIDERS,
  onError,
  disabled = false,
  callbackURL,
  showDivider = true,
}) => {
  const { t } = useI18n();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const activeProviders = providers.filter((p) => p.enabled !== false);

  if (activeProviders.length === 0) return null;

  const handleSocialSignIn = async (providerId: SocialProviderId) => {
    setLoadingProvider(providerId);
    onError?.("");

    try {
      const activeSlug = localStorage.getItem("active_org_slug");
      const targetPath =
        callbackURL || (activeSlug ? `/${activeSlug}/folders` : "/onboarding");
      const fullCallbackUrl = targetPath.startsWith("http")
        ? targetPath
        : `${window.location.origin}${targetPath}`;

      posthog.capture("user_social_login_attempt", { provider: providerId });

      await authClient.signIn.social({
        provider: providerId as "google",
        callbackURL: fullCallbackUrl,
      });
    } catch (err: unknown) {
      const message =
        (err as Error)?.message || t("auth.login.errorGeneric");
      onError?.(message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {showDivider && (
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700/80" />
          </div>
          <div className="relative px-3 bg-white dark:bg-slate-900 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
            {t("auth.login.orContinueWith")}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {activeProviders.map((provider) => {
          const Icon = provider.icon;
          const isLoading = loadingProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              disabled={disabled || loadingProvider !== null}
              onClick={() => handleSocialSignIn(provider.id)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-600"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <Icon className="w-5 h-5 shrink-0" />
              )}
              <span>
                {provider.id === "google"
                  ? t("auth.login.continueWithGoogle")
                  : `${t("auth.login.continueWith")} ${provider.name}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
