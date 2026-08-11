import { AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import bg from "../../assets/images/background.webp";

interface LoginLayoutProps {
  children: React.ReactNode;
  redirectMessage?: string;
  errorMsg?: string;
  optionalLink?: string;
  optionalMsg?: string;
  titleMb?: number;
  compactBranding?: boolean;
}

export default function LoginLayout({
  children,
  redirectMessage,
  errorMsg,
  optionalLink,
  optionalMsg,
  titleMb = 6,
  compactBranding = false,
}: LoginLayoutProps) {
  const mbClass =
    titleMb === 2 ? "mb-2" : titleMb === 4 ? "mb-3" : "mb-4";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-y-auto font-sans bg-slate-50 transition-colors duration-500">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative max-w-md sm:max-w-lg w-full bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl sm:rounded-4xl shadow-2xl shadow-black/30 p-5 sm:p-7 transition-all duration-300 z-20 my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin">
        {/* Branding */}
        <div
          className={`flex flex-col items-center text-center ${mbClass} select-none shrink-0`}
        >
          <div
            className={`
              ${compactBranding ? "w-12 h-12 rounded-xl mb-1.5" : "w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] mb-2 sm:mb-3"}
              flex items-center justify-center
              border border-slate-100 shadow-sm
              transition-transform
              hover:scale-105 hover:rotate-2
            `}
          >
            <img
              src="/favicon.png"
              alt="Hosanna Studio"
              className={`${compactBranding ? "w-12 h-12 rounded-xl" : "w-14 h-14 sm:w-16 sm:h-16 rounded-[18px]"} object-contain`}
            />
          </div>
          <h1 className={`font-display font-black tracking-tighter text-slate-900 ${compactBranding ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
            Hosanna Studio
          </h1>
        </div>

        {redirectMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div
            className={`mb-3 p-3 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 bg-rose-500/10 border-rose-500/20 text-rose-600 shrink-0`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-0.5">
          {children}
        </div>

        {optionalLink && optionalMsg && (
          <div className="mt-4 pt-2 text-center shrink-0">
            <Link
              to={optionalLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-m3-primary hover:underline"
            >
              <span>{optionalMsg}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
