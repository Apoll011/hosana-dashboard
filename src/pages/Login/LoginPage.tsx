/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import bg from '../../assets/images/background.webp';
import logo from '../../assets/hosannastudio_logo.png';
import LoginLayout from './Layout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectMessage = (location.state as any)?.message || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Por favor, insira o seu e-mail e a sua senha');
        return;
      }
      await login({ email: email.trim(), password });
      navigate('/songs', { replace: true });
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_NOT_APPROVED' || err?.status === 403 || err?.message?.includes('pending approval')) {
        setErrorMsg('A sua conta está a aguardar aprovação de um administrador da Organização');
      } else {
        setErrorMsg(err?.message || 'Autenticação Falhou');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <LoginLayout errorMsg={errorMsg} redirectMessage={redirectMessage} optionalLink={"/register"} optionalMsg={"Criar ou aderir a uma organização"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              label="E-mail"
              placeholder="admin@hosanna.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
            <Input
              type="password"
              label="Palavra-passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 opacity-40" />}
              className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-4 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
            isLoading={isLoading}
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>
      </LoginLayout>    
  );
};
