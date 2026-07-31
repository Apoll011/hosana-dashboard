/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@hosanna/shared";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const folderSchema = z.object({
  name: z.string().min(1, "O nome da pasta é obrigatório"),
});

type FolderFormData = z.infer<typeof folderSchema>;

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
    resolver: zodResolver(folderSchema),
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
