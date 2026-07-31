/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@hosanna/shared";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "O título do culto é obrigatório"),
  date: z.string().min(1, "A data do culto é obrigatória"),
  notes: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  initialValues?: {
    name?: string;
    date?: string;
    notes?: string;
  };
  onSubmit: (data: {
    name: string;
    date: string;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialValues?.name || "",
      date: initialValues?.date || new Date().toISOString(),
      notes: initialValues?.notes || "",
    },
  });

  const onFormSubmit = async (data: ServiceFormData) => {
    await onSubmit({
      name: data.name.trim(),
      date: new Date(data.date).toISOString(),
      notes: data.notes || "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
      <Input
        label="Título do Culto"
        placeholder="Ex: Culto de Domingo de Manhã"
        error={errors.name?.message}
        autoFocus
        {...register("name")}
      />

      <Input
        label="Data Agendada"
        type="date"
        error={errors.date?.message}
        {...register("date")}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Notas Gerais de Planeamento
        </label>
        <textarea
          rows={3}
          placeholder="Ex: Tema: Graça e Esperança. Ensaio da banda às 8:15."
          {...register("notes")}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
        />
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
          Guardar Plano de Culto
        </Button>
      </div>
    </form>
  );
};
