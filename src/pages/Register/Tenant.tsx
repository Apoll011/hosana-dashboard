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
  AlertCircle, 
  Building2, 
  Link as LinkIcon, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';
import logo from '../../assets/logo.png';

import { authApi } from '../../api/auth'; 

export const RegisterTenantPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [tenantName, setTenantName] = useState('Hosanna Community Church');
  const [tenantSlug, setTenantSlug] = useState('hosanna-community');
  const [adminName, setAdminName] = useState('John Smith');
  const [adminEmail, setAdminEmail] = useState('john@example.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(''); // Included for the API call
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfoBanner, setSuccessInfoBanner] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfoBanner('');
    setIsLoading(true);

    try {
      if (!tenantName.trim() || !tenantSlug.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        throw new Error('Por favor preencha todos os campos obrigatórios.');
      }

      if (!agreedToTerms) {
        throw new Error('You must agree to the Terms before continuing.');
      }

      await authApi.registerTenant({
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword,
        serverUrl: serverUrl.trim(),
      });

      // On success, redirect to login with message
      navigate('/login', {
        state: { message: 'Organization created! You can now log in.' },
        replace: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao criar organização');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-start p-4 sm:p-8 md:p-16 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bg}
          alt="Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Overlay for contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-m3-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-m3-primary-dark/10 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* Adjusted max-width slightly to accommodate more fields comfortably */}
      <div className="relative max-w-[420px] w-full bg-white border border-slate-200 rounded-[32px] shadow-2xl shadow-black/40 p-6 sm:p-8 transition-all duration-300 z-20 my-8">
        
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div
            className="
              w-22 h-22 rounded-[22px]
              flex items-center justify-center
              mb-4
              border
              transition-transform
              hover:scale-105 hover:rotate-2
            "
            style={{
              backgroundColor: "#EEF4FA",
              borderColor: "#D3E5F8",
            }}
          >
            <img
              src={logo}
              alt="Hosanna Studio"
              className="w-22 h-22 object-contain translate-y-0.5"
            />
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter text-slate-900">
            Create your Church
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Set up your organization to get started
          </p>
        </div>

        {/* Success Banner */}
        {successInfoBanner && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successInfoBanner}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 bg-rose-500/10 border-rose-500/20 text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="text"
              label="Church Name"
              placeholder="Hosanna Community Church"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              icon={<Building2 className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
            
            <Input
              type="text"
              label="Church URL"
              placeholder="hosanna-community"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              icon={<LinkIcon className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />

            <Input
              type="text"
              label="Your Name"
              placeholder="John Smith"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              icon={<User className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />

            <Input
              type="email"
              label="Email"
              placeholder="john@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center gap-2 mt-2 px-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-m3-primary focus:ring-m3-primary cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                Concordas com os Termos de Serviço?
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-4 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
            isLoading={isLoading}
          >
            <span>Criar Organização</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        {/* Link back to Login */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Já tems uma organização?{' '}
            <Link
              to="/login"
              className="font-bold text-m3-primary hover:underline"
            >
              Faça Login Aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};