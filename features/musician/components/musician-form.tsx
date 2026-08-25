"use client";

import { useState } from "react";
import type { AccompanyingMusician, CreateMusicianInput } from "../types";

interface MusicianFormProps {
  isOpen: boolean;
  initialData: AccompanyingMusician | null;
  onClose: () => void;
  onSubmit: (data: CreateMusicianInput) => Promise<{ success: boolean; error?: string }>;
}

const COMMON_INSTRUMENTS = [
  "Violão",
  "Guitarra",
  "Baixo",
  "Bateria",
  "Percussão",
  "Teclado / Piano",
  "Saxofone / Sopros",
  "Sanfona / Acordeom",
  "Backing Vocal",
  "Voz e Violão",
  "Trompete",
  "Flauta",
  "Cavaquinho",
  "Bandolim",
];

function MusicianFormModal({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: AccompanyingMusician | null;
  onClose: () => void;
  onSubmit: (data: CreateMusicianInput) => Promise<{ success: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [instrument, setInstrument] = useState(initialData?.instrument ?? "");
  const [cpf, setCpf] = useState(initialData?.cpf ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("O nome do músico é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        name: name.trim(),
        instrument: instrument.trim() || null,
        cpf: cpf.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        note: note.trim() || null,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || "Erro ao salvar músico.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Músico Acompanhante
            </span>
            <h2 className="text-xl font-bold text-zinc-50">
              {initialData ? "Editar Músico" : "Novo Músico Acompanhante"}
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
              Nome Completo / Artístico <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Beto Percussão, Juliana Teclas"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Instrumento / Função Principal
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                list="instruments-list"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="Ex: Bateria, Baixo, Teclado, Backing Vocal"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
              <datalist id="instruments-list">
                {COMMON_INSTRUMENTS.map((inst) => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>

              {/* Quick suggestions pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["Violão", "Bateria", "Baixo", "Teclado", "Percussão", "Sopros"].map(
                  (sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setInstrument(sug)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        instrument === sug
                          ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold"
                          : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {sug}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Telefone / WhatsApp (com DDD)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Usado para botão rápido de WhatsApp
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                CPF (Opcional)
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Endereço / Região
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Zona Sul, SP"
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
              placeholder="Ex: Possui amplificador próprio, disponível aos finais de semana..."
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
                : "Cadastrar Músico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MusicianForm(props: MusicianFormProps) {
  if (!props.isOpen) return null;
  return (
    <MusicianFormModal
      key={props.initialData?.id ?? "new-musician"}
      initialData={props.initialData}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
