/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@hosanna/shared";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const tokenSchema = z.object({
  name: z.string().min(1, "A descrição / identificador da senha é obrigatório"),
  expiresInDays: z.string().min(1, "A validade é obrigatória"),
});

type TokenFormData = z.infer<typeof tokenSchema>;

interface MusicianTokenFormProps {
  onSubmit: (data: { name: string; expiresAt: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MusicianTokenForm: React.FC<MusicianTokenFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: "Acesso para Equipas de Louvor e Banda",
      expiresInDays: "365",
    },
  });

  const onFormSubmit = async (data: TokenFormData) => {
    const days = parseInt(data.expiresInDays, 10) || 365;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    await onSubmit({
      name: data.name.trim(),
      expiresAt,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nome / Identificador do Músico"
        placeholder="Ex: Acesso Banda de Domingo"
        error={errors.name?.message}
        autoFocus
        {...register("name")}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Validade da Senha
        </label>
        <select
          {...register("expiresInDays")}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
        >
          <option value="365">1 Ano (Padrão)</option>
          <option value="90">90 Dias</option>
          <option value="30">30 Dias</option>
          <option value="14">14 Dias</option>
          <option value="7">7 Dias</option>
        </select>
      </div>

      <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
        A geração de uma senha para músico cria um código QR e uma ligação
        segura para os membros da equipa visualizarem as pautas dos cultos de
        louvor sem necessidade de permissões de administração.
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Gerar Acesso e Código QR
        </Button>
      </div>
    </form>
  );
};
