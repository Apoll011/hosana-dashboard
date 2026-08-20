/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import React, { useState } from "react";

// --- SERVICE FORM ---

interface ServiceFormData {
  name: string;
  date: string;
  notes: string;
}

// Extracted pure validation function
const validateServiceForm = (
  values: ServiceFormData,
): Record<string, string> | undefined => {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "O título do culto é obrigatório";
  }
  if (!values.date.trim()) {
    errors.date = "A data do culto é obrigatória";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
};

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
  const [formData, setFormData] = useState<ServiceFormData>({
    name: initialValues?.name || "",
    date: initialValues?.date
      ? new Date(initialValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    notes: initialValues?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the specific field error when the user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateServiceForm(formData);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      date: new Date(formData.date).toISOString(),
      notes: formData.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="name"
        label="Título do Culto"
        placeholder="Ex: Culto de Domingo de Manhã"
        error={errors.name}
        autoFocus
        value={formData.name}
        onChange={handleChange}
        disabled={isLoading}
      />

      <Input
        name="date"
        label="Data Agendada"
        type="date"
        error={errors.date}
        value={formData.date}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Notas Gerais de Planeamento
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Ex: Tema: Graça e Esperança. Ensaio da banda às 8:15."
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed"
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
