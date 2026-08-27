/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { posthog } from "@/src/lib/posthog";
import {
  ArrowLeft,
  Bug,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  HelpCircle,
  Inbox,
  Loader2,
  MailCheck,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { EarlyAccessFeature, Message, Ticket } from "posthog-js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n";

/* ─── PostHog type stubs (posthog) ─────────────────────────── */
export interface FeaturesTabProps {
  active: boolean;
}

/* ─── Section heading ─────────────────────────────────────────────── */
const SectionHeading: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="mt-0.5 p-2 rounded-xl bg-m3-primary/10 text-m3-primary">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {subtitle}
      </p>
    </div>
  </div>
);

/* ─── Early-Access Panel ──────────────────────────────────────────── */
const EarlyAccessPanel: React.FC = () => {
  const { t } = useI18n();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!posthog) {
      setLoading(false);
      return;
    }
    setLoading(true);
    posthog.getEarlyAccessFeatures((feats) => {
      setFeatures(feats);
      const state: Record<string, boolean> = {};
      feats.forEach((f) => {
        if (!f.flagKey) return;
        state[f.flagKey] = posthog!.isFeatureEnabled(f.flagKey) || false;
      });
      setEnrolled(state);
      setLoading(false);
    }, true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (flagKey: string) => {
    const next = !enrolled[flagKey];
    posthog?.updateEarlyAccessFeatureEnrollment(flagKey, next);
    setEnrolled((prev) => ({ ...prev, [flagKey]: next }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SectionHeading
          icon={FlaskConical}
          title={t("settings.features.earlyAccess.title")}
          subtitle={t("settings.features.earlyAccess.subtitle")}
        />
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {!posthog ? (
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.earlyAccess.unavailable")}
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading")}…
        </div>
      ) : features.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.earlyAccess.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {features.map((feat) => {
            if (!feat.flagKey) return <></>;
            const on = enrolled[feat.flagKey] ?? false;
            return (
              <li
                key={feat.flagKey}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {feat.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-m3-primary/10 text-m3-primary">
                      {feat.stage}
                    </span>
                    {on && (
                      <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {t("settings.features.earlyAccess.enrolled")}
                      </span>
                    )}
                  </div>
                  {feat.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {feat.description}
                    </p>
                  )}
                  {feat.documentationUrl && (
                    <a
                      href={feat.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-m3-primary mt-1 hover:underline"
                    >
                      {t("settings.features.earlyAccess.docs")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => toggle(feat.flagKey!)}
                  className="shrink-0 mt-0.5 transition-colors"
                >
                  {on ? (
                    <ToggleRight className="w-6 h-6 text-m3-primary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* ─── Support Panel ───────────────────────────────────────────────── */
type SupportView = "tickets" | "chat" | "restore";

const SupportPanel: React.FC = () => {
  const { t } = useI18n();
  const available = posthog?.conversations?.isAvailable() ?? false;

  const [view, setView] = useState<SupportView>("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreSent, setRestoreSent] = useState(false);
  const [restoreSending, setRestoreSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    if (!available) return;
    setLoadingTickets(true);
    try {
      setTickets((await posthog!.conversations!.getTickets())?.results ?? []);
    } finally {
      setLoadingTickets(false);
    }
  }, [available]);

  useEffect(() => {
    if (view === "tickets") loadTickets();
  }, [view, loadTickets]);

  const loadMessages = useCallback(
    async (ticketId?: string) => {
      if (!available) return;
      setLoadingMsgs(true);
      try {
        setMessages(
          (await posthog.conversations!.getMessages(ticketId))?.messages ?? [],
        );
        await posthog!.conversations!.markAsRead(ticketId);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [available],
  );

  useEffect(() => {
    if (view === "chat") loadMessages(activeTicketId);
  }, [view, activeTicketId, loadMessages]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openTicket = (id?: string) => {
    setActiveTicketId(id);
    setView("chat");
  };

  const sendMsg = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await posthog!.conversations!.sendMessage(
        draft.trim(),
        undefined,
        !activeTicketId,
      );
      if (!res) {
        console.error("res is null");
        return;
      }
      setActiveTicketId(res.ticket_id);
      setDraft("");
      await loadMessages(res.ticket_id);
    } finally {
      setSending(false);
    }
  };

  const sendRestore = async () => {
    if (!restoreEmail.trim()) return;
    setRestoreSending(true);
    try {
      await posthog!.conversations!.requestRestoreLink(restoreEmail.trim());
      setRestoreSent(true);
    } finally {
      setRestoreSending(false);
    }
  };

  if (!available) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <SectionHeading
          icon={HelpCircle}
          title={t("settings.features.support.title")}
          subtitle={t("settings.features.support.subtitle")}
        />
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.support.unavailable")}
        </p>
      </div>
    );
  }

  const headerSubtitle =
    view === "chat"
      ? activeTicketId
        ? `#${activeTicketId}`
        : t("settings.features.support.newTicket")
      : view === "restore"
        ? t("settings.features.support.restore")
        : t("settings.features.support.subtitle");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-2 px-5 pt-5 pb-3">
        {view !== "tickets" && (
          <button
            onClick={() => setView("tickets")}
            className="p-1 mt-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <SectionHeading
            icon={HelpCircle}
            title={t("settings.features.support.title")}
            subtitle={headerSubtitle}
          />
        </div>
        {view === "tickets" && (
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => setView("restore")}
              title={t("settings.features.support.restore")}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <MailCheck className="w-4 h-4" />
            </button>
            <button
              onClick={loadTickets}
              title="Refresh"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Tickets list */}
      {view === "tickets" && (
        <div className="px-5 pb-5 space-y-3">
          {loadingTickets ? (
            <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("common.loading")}…
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {t("settings.features.support.noTickets")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map((tk) => (
                <li key={tk.id}>
                  <button
                    onClick={() => openTicket(tk.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-m3-primary/40 hover:bg-m3-primary/5 transition-all text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tk.id ??
                          `${t("settings.features.support.ticket")} #${tk.id}`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(tk.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {(tk.unread_count ?? 0) > 0 && (
                      <span className="text-[10px] font-bold bg-m3-primary text-white rounded-full px-1.5 py-0.5">
                        {tk.unread_count}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${tk.status === "open" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                    >
                      {tk.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Quick starters */}
          <div className="pt-1 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {t("settings.features.support.startNew")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    icon: Sparkles,
                    label: t("settings.features.support.requestFeature"),
                    msg: t("settings.features.support.requestFeatureMsg"),
                  },
                  {
                    icon: Bug,
                    label: t("settings.features.support.reportBug"),
                    msg: t("settings.features.support.reportBugMsg"),
                  },
                ] as const
              ).map(({ icon: Icon, label, msg }) => (
                <button
                  key={label}
                  onClick={() => {
                    setDraft(msg);
                    setActiveTicketId(undefined);
                    setMessages([]);
                    setView("chat");
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-m3-primary/50 hover:bg-m3-primary/5 transition-all text-left"
                >
                  <Icon className="w-4 h-4 text-m3-primary shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {view === "chat" && (
        <div className="flex flex-col px-5 pb-5">
          <div className="min-h-50 max-h-64 overflow-y-auto space-y-3 py-2">
            {loadingMsgs ? (
              <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.loading")}…
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {t("settings.features.support.chatEmpty")}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.author_name === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.author_name === "customer" ? "bg-m3-primary text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"}`}
                  >
                    <p>{m.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${m.author_name === "customer" ? "text-white/60" : "text-slate-400"}`}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-end gap-2 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMsg();
                }
              }}
              rows={2}
              placeholder={t("settings.features.support.placeholder")}
              className="flex-1 resize-none text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-m3-primary/40"
            />
            <button
              onClick={sendMsg}
              disabled={!draft.trim() || sending}
              className="shrink-0 p-2.5 rounded-xl bg-m3-primary text-white disabled:opacity-40 hover:bg-m3-primary/90 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Restore */}
      {view === "restore" && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.features.support.restoreDesc")}
          </p>
          {restoreSent ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
              <MailCheck className="w-4 h-4 shrink-0" />
              {t("settings.features.support.restoreSent")}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                placeholder={t("settings.features.support.emailPlaceholder")}
                className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-m3-primary/40"
              />
              <button
                onClick={sendRestore}
                disabled={!restoreEmail.trim() || restoreSending}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-m3-primary text-white text-xs font-semibold disabled:opacity-40 hover:bg-m3-primary/90 transition-colors"
              >
                {restoreSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {t("settings.features.support.sendLink")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Tab ────────────────────────────────────────────────────── */
export const FeaturesTab: React.FC<FeaturesTabProps> = ({ active }) => {
  if (!active) return null;
  return (
    <div className="space-y-6">
      <EarlyAccessPanel />
      <SupportPanel />
    </div>
  );
};
