/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import React from "react";
import { Resolver, useForm } from "react-hook-form";

interface FolderFormData {
  name: string;
}

const customFolderResolver: Resolver<FolderFormData> = async (values) => {
  const errors: Record<string, any> = {};

  const trimmedName = values.name?.trim();

  if (!trimmedName) {
    errors.name = {
      type: "required",
      message: "O nome da pasta é obrigatório",
    };
  } else if (trimmedName.length < 2) {
    errors.name = {
      type: "minLength",
      message: "O nome deve ter pelo menos 2 caracteres",
    };
  }

  return {
    values: Object.keys(errors).length === 0 ? values : {},
    errors,
  };
};

interface FolderFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export const FolderForm: React.FC<FolderFormProps> = ({
  initialName = "",
  onSubmit,
  onCancel,
  isLoading = false,
  title = "Criar Pasta",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FolderFormData>({
    resolver: customFolderResolver,
    defaultValues: {
      name: initialName,
    },
  });

  const onFormSubmit = async (data: FolderFormData) => {
    await onSubmit(data.name.trim());
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nome da Pasta"
        placeholder="Ex: Natal 2026"
        error={errors.name?.message}
        autoFocus
        {...register("name")}
      />

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
          {title}
        </Button>
      </div>
    </form>
  );
};
