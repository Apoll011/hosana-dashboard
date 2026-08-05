import { AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/hosannastudio_logo.png";
import bg from "../../assets/images/background.webp";

interface LoginLayoutProps {
  children: React.ReactNode;
  redirectMessage?: string;
  errorMsg?: string;
  optionalLink: string;
  optionalMsg: string;
  titleMb?: number;
}

export default function LoginLayout({
  children,
  redirectMessage,
  errorMsg,
  optionalLink,
  optionalMsg,
  titleMb = 6,
}: LoginLayoutProps) {
  const mbClass =
    titleMb === 2 ? "mb-2" : titleMb === 4 ? "mb-4" : "mb-6";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-y-auto py-8 sm:py-12 font-sans bg-slate-50 transition-colors duration-500">
      {/* Background Image (fixed to prevent scrolling artifacts) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Overlay for contrast */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative max-w-md sm:max-w-lg w-full bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl sm:rounded-4xl shadow-2xl shadow-black/30 p-6 sm:p-8 transition-all duration-300 z-20 my-auto">
        {/* Branding */}

        <div
          className={`flex flex-col items-center text-center ${mbClass} select-none`}
        >
          <div
            className="
              w-20 h-20 sm:w-22 sm:h-22 rounded-[22px]
              flex items-center justify-center
              mb-3 sm:mb-4
              border border-slate-100 shadow-sm
              transition-transform
              hover:scale-105 hover:rotate-2
            "
          >
            <img
              src={logo}
              alt="Hosanna Studio"
              className="w-20 h-20 sm:w-22 sm:h-22 object-contain rounded-[22px]"
            />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-slate-900">
            Hosanna Studio
          </h1>
        </div>

        {redirectMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 bg-rose-500/10 border-rose-500/20 text-rose-600`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {children}

        <div className="mt-6 text-center">
          <Link
            to={optionalLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-m3-primary hover:underline"
          >
            <span>{optionalMsg}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
