/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import React, { useState } from "react";

interface FolderFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

// Extracted validation logic to a pure function for better testability
const validateFolderName = (name: string): string | undefined => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "O nome da pasta é obrigatório";
  }
  if (trimmedName.length < 2) {
    return "O nome deve ter pelo menos 2 caracteres";
  }

  return undefined;
};

export const FolderForm: React.FC<FolderFormProps> = ({
  initialName = "",
  onSubmit,
  onCancel,
  isLoading = false,
  title = "Criar Pasta",
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateFolderName(name);

    if (validationError) {
      setError(validationError);
      return;
    }

    await onSubmit(name.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);

    // Clear the error state as soon as the user starts interacting again
    if (error) {
      setError(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome da Pasta"
        placeholder="Ex: Natal 2026"
        error={error}
        autoFocus
        value={name}
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
          {title}
        </Button>
      </div>
    </form>
  );
};
