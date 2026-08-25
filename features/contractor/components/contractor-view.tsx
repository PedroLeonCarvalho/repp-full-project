"use client";

import { useEffect, useState } from "react";
import type { Contractor, CreateContractorInput } from "../types";
import {
  createContractorAction,
  deleteContractorAction,
  getCustomerStageNameAction,
  listContractorsAction,
  updateContractorAction,
} from "../actions/contractor-actions";
import { ContractorList } from "./contractor-list";
import { ContractorForm } from "./contractor-form";

export function ContractorView() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [artistStageName, setArtistStageName] = useState<string>("Artista");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialData() {
      const [res, stageName] = await Promise.all([
        listContractorsAction(),
        getCustomerStageNameAction(),
      ]);

      if (!isCancelled) {
        if (res.success && res.data) {
          setContractors(res.data);
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
    setEditingContractor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteContractorAction(id);
    if (res.success) {
      setContractors((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSubmit = async (data: CreateContractorInput) => {
    if (editingContractor) {
      const res = await updateContractorAction(editingContractor.id, data);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setContractors((prev) =>
        prev.map((c) => (c.id === editingContractor.id ? res.data : c))
      );
      return { success: true };
    } else {
      const res = await createContractorAction(data);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setContractors((prev) => [res.data, ...prev]);
      return { success: true };
    }
  };


  const filteredContractors = contractors.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.contactPersonName.toLowerCase().includes(q) ||
      (c.establishmentOrEventName &&
        c.establishmentOrEventName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.documentNumber && c.documentNumber.includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header with Search and Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight">
            Contratantes & Casas de Show
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gerencie contatos, envie mensagens diretas no WhatsApp e gere contratos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          <span>+</span>
          <span>Novo Contratante</span>
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
            placeholder="Buscar por nome do contato, bar, evento, telefone..."
            className="w-full rounded-2xl bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* List or Loading */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 text-sm flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Carregando contratantes...</span>
        </div>
      ) : (
        <ContractorList
          contractors={filteredContractors}
          artistStageName={artistStageName}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Modal */}
      <ContractorForm
        isOpen={isFormOpen}
        initialData={editingContractor}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
