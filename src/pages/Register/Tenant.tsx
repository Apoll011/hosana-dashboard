/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Building2, 
  Link as LinkIcon, 
  User, 
  CheckCircle2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';
import logo from '../../assets/hosannastudio_logo.png';

import { authApi } from '../../api/auth'; 

export const RegisterTenantPage: React.FC = () => {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);
  
  // Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(''); 
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validation per step
  const isStep1Valid = tenantName.trim() !== '' && tenantSlug.trim() !== '';
  const isStep2Valid = adminName.trim() !== '' && adminEmail.trim() !== '';
  const isStep3Valid = adminPassword.trim() !== '' && agreedToTerms;

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 1) setStep(step - 1);
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isStep3Valid) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      await authApi.registerTenant({
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword,
        serverUrl: serverUrl.trim(),
      });

      // Show success checkmark
      setIsLoading(false);
      setIsSuccess(true);

      // Wait 2 seconds for the user to see the success animation, then redirect
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Organização criada! Já pode fazer login.' },
          replace: true,
        });
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao criar organização. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Allow pressing Enter to go to next step
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 1 && isStep1Valid) handleNext();
      if (step === 2 && isStep2Valid) handleNext();
      if (step === 3 && isStep3Valid) handleCreateSubmit();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 md:p-16 relative overflow-hidden font-sans bg-slate-50 transition-colors duration-500">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bg}
          alt="Background" 
          className="w-full h-full object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Card */}
      <div className="relative max-w-[440px] w-full bg-white/95 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl shadow-black/40 p-6 sm:p-10 transition-all duration-300 z-20 my-8">
        
        {/* Branding */}
        {!isSuccess && (
          <div className="flex flex-col items-center text-center mb-8 select-none animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-22 h-22 rounded-[20px] flex items-center justify-center mb-3 border shadow-inner">
              <img src={logo} alt="Hosanna Studio" className="w-22 h-22 object-contain rounded-[20px]" />
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900">
              Criar Organização
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Configure o seu espaço em 3 passos simples
            </p>
          </div>
        )}

        {/* Success / Loading State Screen */}
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75" />
              <div className="relative flex items-center justify-center w-24 h-24 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 animate-in zoom-in duration-300 delay-150" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Tudo Pronto!</h2>
            <p className="text-slate-500 font-medium">A redirecionar para o login...</p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 flex flex-col gap-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      step >= i ? 'bg-m3-primary shadow-[0_0_10px_rgba(var(--m3-primary-rgb),0.4)]' : 'bg-slate-200'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 bg-rose-50 border-rose-200 text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Steps */}
            <form onKeyDown={handleKeyDown} className="relative min-h-[220px]">
              
              {/* STEP 1: Church Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Dados da Igreja</h3>
                    <p className="text-xs text-slate-500">Como se chama a sua comunidade?</p>
                  </div>
                  <Input
                    type="text"
                    label="Nome da Igreja"
                    placeholder="Ex: Hosanna Community Church"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    icon={<Building2 className="w-4 h-4 opacity-40" />}
                    autoFocus
                    className="h-12 rounded-xl border-slate-200 focus:border-m3-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                  <Input
                    type="text"
                    label="URL Personalizado"
                    placeholder="Ex: hosanna-community"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    icon={<LinkIcon className="w-4 h-4 opacity-40" />}
                    className="h-12 rounded-xl border-slate-200 focus:border-m3-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              )}

              {/* STEP 2: Admin Info */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Perfil de Administrador</h3>
                    <p className="text-xs text-slate-500">Quem vai gerir a plataforma?</p>
                  </div>
                  <Input
                    type="text"
                    label="O seu Nome"
                    placeholder="Ex: João Silva"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    icon={<User className="w-4 h-4 opacity-40" />}
                    autoFocus
                    className="h-12 rounded-xl border-slate-200 focus:border-m3-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                  <Input
                    type="email"
                    label="Email Profissional"
                    placeholder="joao@exemplo.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4 opacity-40" />}
                    className="h-12 rounded-xl border-slate-200 focus:border-m3-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              )}

              {/* STEP 3: Security & Terms */}
              {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Segurança</h3>
                    <p className="text-xs text-slate-500">Proteja a sua conta com uma senha forte.</p>
                  </div>
                  <Input
                    type="password"
                    label="Palavra-passe"
                    placeholder="••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 opacity-40" />}
                    autoFocus
                    className="h-12 rounded-xl border-slate-200 focus:border-m3-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                  
                  <div className="flex items-start gap-3 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-m3-primary focus:ring-m3-primary cursor-pointer transition-all"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                      Concordo com os <a href="#" className="font-bold text-m3-primary hover:underline">Termos de Serviço</a> e a <a href="#" className="font-bold text-m3-primary hover:underline">Política de Privacidade</a>.
                    </label>
                  </div>
                </div>
              )}
            </form>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="h-12 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-semibold"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  variant="primary"
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="flex-1 h-12 bg-m3-primary hover:bg-m3-primary-dark border-0 font-bold text-sm text-white rounded-xl transition-all shadow-lg shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateSubmit}
                  variant="primary"
                  isLoading={isLoading}
                  disabled={!isStep3Valid || isLoading}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 border-0 font-bold text-sm text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>A criar...</span>
                  ) : (
                    <>
                      <span>Criar Organização</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Footer Link */}
            <div className="mt-8 text-center animate-in fade-in duration-700">
              <p className="text-sm text-slate-500 font-medium">
                Já tem uma organização?{' '}
                <Link to="/login" className="font-bold text-m3-primary hover:text-m3-primary-dark hover:underline transition-colors">
                  Faça Login Aqui
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};