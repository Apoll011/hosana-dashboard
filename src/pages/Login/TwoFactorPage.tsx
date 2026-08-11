/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from "@hosanna/shared";
import { ArrowRight, Shield } from "lucide-react";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

export const TwoFactorPage: React.FC = () => {
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const [otp, setOtp] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg("Insira o código de verificação.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const { error } = await authClient.twoFactor.verifyTotp({
      code: otp,
      trustDevice,
    });
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Código inválido. Tente novamente.");
      return;
    }

    await refetch();
    navigate("/", { replace: true });
  };

  return (
    <LoginLayout
      errorMsg={errorMsg}
      optionalLink="/login"
      optionalMsg="← Voltar ao login"
    >
      <form onSubmit={handleOtpSubmit} className="space-y-5">
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 bg-m3-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-m3-primary" />
          </div>
          <h2 className="font-display font-black text-xl text-slate-900">
            Verificação em 2 Etapas
          </h2>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Introduza o código gerado pela sua aplicação autenticadora
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} />

        <div className="flex items-center justify-center pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-m3-primary focus:ring-m3-primary"
            />
            <span>Confiar neste dispositivo</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2"
        >
          <span>Verificar</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </LoginLayout>
  );
};

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const length = 6;
  const refs = Array.from({ length }, () => useRef<HTMLInputElement>(null));

  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key === "Backspace") {
      e.preventDefault();
      const next = digits
        .map((d, idx) => (idx === i ? "" : d))
        .join("")
        .trimEnd();
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? v : d)).join("");
    onChange(next);
    if (v && i < length - 1) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    refs[Math.min(pasted.length, length - 1)].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-m3-primary focus:bg-white focus:outline-none transition-all shadow-sm caret-transparent"
        />
      ))}
    </div>
  );
}
