/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Folder, Input } from "@hosanna/shared";
import React from "react";
import { Resolver, useForm } from "react-hook-form";

interface SongFormData {
  title: string;
  artist: string;
  folderId?: string;
  tags?: string;
}

// Custom resolver logic handling required field validations
const customSongResolver: Resolver<SongFormData> = async (values) => {
  const errors: Record<string, any> = {};

  if (!values.title?.trim()) {
    errors.title = {
      type: "required",
      message: "O título do cântico é obrigatório",
    };
  }

  if (!values.artist?.trim()) {
    errors.artist = {
      type: "required",
      message: "O nome do artista é obrigatório",
    };
  }

  return {
    values: Object.keys(errors).length === 0 ? values : {},
    errors,
  };
};

interface SongFormProps {
  initialValues?: {
    title?: string;
    artist?: string;
    folderId?: string | null;
    tags?: string[];
  };
  folders: Folder[];
  onSubmit: (data: {
    title: string;
    artist: string;
    folderId: string | null;
    tags: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SongForm: React.FC<SongFormProps> = ({
  initialValues,
  folders,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SongFormData>({
    resolver: customSongResolver,
    defaultValues: {
      title: initialValues?.title || "",
      artist: initialValues?.artist || "Unknown Artist",
      folderId: initialValues?.folderId || "",
      tags: initialValues?.tags ? initialValues.tags.join(", ") : "",
    },
  });

  const onFormSubmit = async (data: SongFormData) => {
    const parsedTags = data.tags
      ? data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await onSubmit({
      title: data.title,
      artist: data.artist,
      folderId: data.folderId || null,
      tags: parsedTags,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
      <Input
        label="Título do Cântico"
        placeholder="Ex: Caminho no Deserto"
        error={errors.title?.message}
        {...register("title")}
      />

      <Input
        label="Artista / Autor"
        placeholder="Ex: Sinach"
        error={errors.artist?.message}
        {...register("artist")}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Categoria de Pasta
        </label>
        <select
          {...register("folderId")}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
        >
          <option value="">Nível Raiz (Sem pasta)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Etiquetas (separadas por vírgulas)"
        placeholder="Ex: Hino, Louvor, Graça"
        error={errors.tags?.message}
        {...register("tags")}
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
          Guardar Cântico
        </Button>
      </div>
    </form>
  );
};
