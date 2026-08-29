"use client";

import { useState } from "react";
import type { Contractor, CreateContractorInput } from "../types";

interface ContractorFormProps {
  isOpen: boolean;
  initialData: Contractor | null;
  onClose: () => void;
  onSubmit: (data: CreateContractorInput) => Promise<{ success: boolean; error?: string }>;
}

function ContractorFormModal({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: Contractor | null;
  onClose: () => void;
  onSubmit: (data: CreateContractorInput) => Promise<{ success: boolean; error?: string }>;
}) {
  const [contactPersonName, setContactPersonName] = useState(
    initialData?.contactPersonName ?? ""
  );
  const [establishmentOrEventName, setEstablishmentOrEventName] = useState(
    initialData?.establishmentOrEventName ?? ""
  );
  const [documentNumber, setDocumentNumber] = useState(
    initialData?.documentNumber ?? ""
  );
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contactPersonName.trim()) {
      setErrorMessage("O nome do responsável / contato é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        contactPersonName: contactPersonName.trim(),
        establishmentOrEventName: establishmentOrEventName.trim() || null,
        documentNumber: documentNumber.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        note: note.trim() || null,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || "Erro ao salvar contratante.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Contratante
            </span>
            <h2 className="text-xl font-bold text-zinc-50">
              {initialData ? "Editar Contratante" : "Novo Contratante / Estabelecimento"}
            </h2>
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
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nome do Responsável / Contato <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              placeholder="Ex: Carlos Silva, Juliana Mendes"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Estabelecimento ou Evento
            </label>
            <input
              type="text"
              value={establishmentOrEventName}
              onChange={(e) => setEstablishmentOrEventName(e.target.value)}
              placeholder="Ex: Bar do Rock, Casamento Ana & Pedro, Cerimonial Sol"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ex: 000.000.000-00 ou CNPJ"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: contato@bardorock.com.br"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Endereço Completo
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Preferência por pagamentos via PIX no final do show..."
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
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
                : "Cadastrar Contratante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ContractorForm(props: ContractorFormProps) {
  if (!props.isOpen) return null;
  return (
    <ContractorFormModal
      key={props.initialData?.id ?? "new-contractor"}
      initialData={props.initialData}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
