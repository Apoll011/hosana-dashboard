/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Folder, Input } from "@hosanna/shared";
import { useState } from "react";

interface SongFormData {
  title: string;
  artist: string;
  folderId: string;
  tags: string;
}

// Extracted pure validation function
const validateSongForm = (
  values: SongFormData,
): Record<string, string> | undefined => {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = "O título do cântico é obrigatório";
  }
  if (!values.artist.trim()) {
    errors.artist = "O nome do artista é obrigatório";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
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
  const [formData, setFormData] = useState<SongFormData>({
    title: initialValues?.title || "",
    artist: initialValues?.artist || "Unknown Artist",
    folderId: initialValues?.folderId || "",
    tags: initialValues?.tags ? initialValues.tags.join(", ") : "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the specific field error when the user starts modifying it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSongForm(formData);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    const parsedTags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await onSubmit({
      title: formData.title.trim(),
      artist: formData.artist.trim(),
      folderId: formData.folderId || null,
      tags: parsedTags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="title"
        label="Título do Cântico"
        placeholder="Ex: Caminho no Deserto"
        error={errors.title}
        value={formData.title}
        onChange={handleChange}
        disabled={isLoading}
      />

      <Input
        name="artist"
        label="Artista / Autor"
        placeholder="Ex: Sinach"
        error={errors.artist}
        value={formData.artist}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Categoria de Pasta
        </label>
        <select
          name="folderId"
          value={formData.folderId}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed"
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
        name="tags"
        label="Etiquetas (separadas por vírgulas)"
        placeholder="Ex: Hino, Louvor, Graça"
        error={errors.tags}
        value={formData.tags}
        onChange={handleChange}
        disabled={isLoading}
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
