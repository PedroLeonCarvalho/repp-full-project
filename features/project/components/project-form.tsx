"use client";

import { useState } from "react";
import type { CreateProjectInput, Project } from "../types";

interface ProjectFormProps {
  isOpen: boolean;
  initialData: Project | null;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => Promise<{ success: boolean; error?: string }>;
}

function ProjectFormModal({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: Project | null;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => Promise<{ success: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [document, setDocument] = useState(initialData?.document ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("O nome do projeto é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        document: document.trim() || null,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || "Erro ao salvar projeto.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-50">
              {initialData ? "Editar Projeto" : "Novo Projeto"}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {initialData
                ? "Atualize as informações do seu projeto ou banda."
                : "Cadastre um novo projeto musical ou formação de banda."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-950/70 border border-red-800 p-3 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nome do Projeto <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projeto Acústico Voz & Violão, Banda XYZ"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Descrição / Proposta
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Formação em trio para eventos particulares, casamentos e pubs..."
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>

          {/* Document / CNPJ / ID */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Documento / CNPJ / Referência (opcional)
            </label>
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Ex: 00.000.000/0001-00 ou MEI"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting
                ? "Salvando..."
                : initialData
                ? "Salvar Alterações"
                : "Criar Projeto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProjectForm(props: ProjectFormProps) {
  if (!props.isOpen) return null;
  return (
    <ProjectFormModal
      key={props.initialData?.id ?? "new-project"}
      initialData={props.initialData}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
