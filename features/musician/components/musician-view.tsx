"use client";

import { useEffect, useState } from "react";
import type { AccompanyingMusician, CreateMusicianInput } from "../types";
import {
  createMusicianAction,
  deleteMusicianAction,
  listMusiciansAction,
  updateMusicianAction,
} from "../actions/musician-actions";
import { getCustomerStageNameAction } from "@/features/contractor/actions/contractor-actions";
import { MusicianList } from "./musician-list";
import { MusicianForm } from "./musician-form";

export function MusicianView() {
  const [musicians, setMusicians] = useState<AccompanyingMusician[]>([]);
  const [artistStageName, setArtistStageName] = useState<string>("Artista");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<AccompanyingMusician | null>(
    null
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialData() {
      const [res, stageName] = await Promise.all([
        listMusiciansAction(),
        getCustomerStageNameAction(),
      ]);

      if (!isCancelled) {
        if (res.success && res.data) {
          setMusicians(res.data);
        }
        if (stageName) {
          setArtistStageName(stageName);
        }
        setIsLoading(false);
      }
    }

    void fetchInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenNew = () => {
    setEditingMusician(null);
    setIsFormOpen(true);
  };

  const handleEdit = (musician: AccompanyingMusician) => {
    setEditingMusician(musician);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteMusicianAction(id);
    if (res.success) {
      setMusicians((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSubmit = async (data: CreateMusicianInput) => {
    if (editingMusician) {
      const res = await updateMusicianAction(editingMusician.id, data);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setMusicians((prev) =>
        prev.map((m) => (m.id === editingMusician.id ? res.data : m))
      );
      return { success: true };
    } else {
      const res = await createMusicianAction(data);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setMusicians((prev) => [res.data, ...prev]);
      return { success: true };
    }
  };


  const filteredMusicians = musicians.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.instrument && m.instrument.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header with Search and Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight">
            Músicos Acompanhantes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Equipe, parceiros de banda, instrumentos e contato direto via WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          <span>+</span>
          <span>Novo Músico</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do músico, instrumento ou telefone..."
            className="w-full rounded-2xl bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* List or Loading */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 text-sm flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Carregando músicos...</span>
        </div>
      ) : (
        <MusicianList
          musicians={filteredMusicians}
          artistStageName={artistStageName}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Modal */}
      <MusicianForm
        isOpen={isFormOpen}
        initialData={editingMusician}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
