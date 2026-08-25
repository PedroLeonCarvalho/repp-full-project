"use client";

import { useEffect, useState } from "react";
import type { AccompanyingMusician, ConcertMusician } from "../types";
import {
  addMusicianToConcertAction,
  listConcertMusiciansAction,
  listMusiciansAction,
  removeMusicianFromConcertAction,
  updateConcertMusicianFeeAction,
} from "../actions/musician-actions";
import { generateWhatsAppLink, getMusicianWhatsAppMessage } from "@/lib/whatsapp";

interface ConcertMusiciansSectionProps {
  concertId: string;
  concertTitle: string;
  concertDate: string;
  artistStageName: string;
}

export function ConcertMusiciansSection({
  concertId,
  concertTitle,
  concertDate,
  artistStageName,
}: ConcertMusiciansSectionProps) {
  const [concertMusicians, setConcertMusicians] = useState<ConcertMusician[]>([]);
  const [allMusicians, setAllMusicians] = useState<AccompanyingMusician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMusicianId, setSelectedMusicianId] = useState("");
  const [agreedFeeInput, setAgreedFeeInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFee, setTempFee] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialMusicians() {
      const [cRes, aRes] = await Promise.all([
        listConcertMusiciansAction(concertId),
        listMusiciansAction(),
      ]);

      if (!isCancelled) {
        if (cRes.success && cRes.data) {
          setConcertMusicians(cRes.data);
        }
        if (aRes.success && aRes.data) {
          setAllMusicians(aRes.data);
        }
        setIsLoading(false);
      }
    }

    void fetchInitialMusicians();

    return () => {
      isCancelled = true;
    };
  }, [concertId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMusicianId) return;

    setIsAdding(true);
    try {
      const fee = agreedFeeInput ? parseFloat(agreedFeeInput) : null;
      const res = await addMusicianToConcertAction({
        concertId,
        musicianId: selectedMusicianId,
        agreedFee: fee,
      });

      if (res.success && res.data) {
        setConcertMusicians((prev) => [...prev, res.data]);
        setSelectedMusicianId("");
        setAgreedFeeInput("");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const res = await removeMusicianFromConcertAction(id);
    if (res.success) {
      setConcertMusicians((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSaveFee = async (id: string) => {
    const fee = tempFee ? parseFloat(tempFee) : null;
    const res = await updateConcertMusicianFeeAction(id, fee);
    if (res.success) {
      setConcertMusicians((prev) =>
        prev.map((m) => (m.id === id ? { ...m, agreedFee: fee } : m))
      );
      setEditingFeeId(null);
    }
  };

  const assignedMusicianIds = new Set(concertMusicians.map((m) => m.musicianId));
  const availableMusicians = allMusicians.filter(
    (m) => !assignedMusicianIds.has(m.id)
  );

  return (
    <div className="flex flex-col gap-3 py-3 border-t border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200">
            🎸 Músicos do Show ({concertMusicians.length})
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            • Equipe & Cachês individuais
          </span>
        </div>
      </div>

      {/* Add Musician Row */}
      {availableMusicians.length > 0 && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950/60 p-2.5 rounded-2xl border border-zinc-800/80"
        >
          <select
            value={selectedMusicianId}
            onChange={(e) => setSelectedMusicianId(e.target.value)}
            className="flex-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 border border-zinc-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Selecione um músico parceiro...</option>
            {availableMusicians.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.instrument ? `(${m.instrument})` : ""}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            value={agreedFeeInput}
            onChange={(e) => setAgreedFeeInput(e.target.value)}
            placeholder="Cachê R$"
            className="w-full sm:w-28 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 border border-zinc-800 focus:border-emerald-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!selectedMusicianId || isAdding}
            className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 px-3.5 py-1.5 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            + Adicionar
          </button>
        </form>
      )}

      {/* Musicians List */}
      {isLoading ? (
        <div className="text-xs text-zinc-500 py-2">Carregando músicos do show...</div>
      ) : concertMusicians.length === 0 ? (
        <div className="text-xs text-zinc-500 py-2 italic bg-zinc-950/30 rounded-xl p-3 border border-zinc-800/40">
          Nenhum músico associado a esta apresentação ainda. {allMusicians.length === 0 ? "Cadastre músicos na aba Músicos." : "Selecione um músico acima para incluir na equipe do show."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {concertMusicians.map((cm) => {
            const mus = cm.musician;
            if (!mus) return null;

            const waMsg = getMusicianWhatsAppMessage({
              musicianName: mus.name,
              artistStageName,
              concertTitle,
              concertDate,
            });
            const waLink = generateWhatsAppLink(mus.phone, waMsg);

            return (
              <div
                key={cm.id}
                className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm">🎸</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-200 truncate block">
                      {mus.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      {mus.instrument || "Instrumento não informado"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Fee display / edit */}
                  {editingFeeId === cm.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempFee}
                        onChange={(e) => setTempFee(e.target.value)}
                        placeholder="R$"
                        className="w-20 rounded-lg bg-zinc-900 px-2 py-1 text-xs text-zinc-100 border border-zinc-700"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveFee(cm.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-1.5"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFeeId(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFeeId(cm.id);
                        setTempFee(cm.agreedFee ? String(cm.agreedFee) : "");
                      }}
                      className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-700"
                      title="Clique para editar cachê"
                    >
                      {cm.agreedFee !== null ? (
                        <span className="font-mono text-emerald-400 font-semibold">
                          R$ {cm.agreedFee.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">+ Cachê</span>
                      )}
                    </button>
                  )}

                  {/* WhatsApp button */}
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-1 text-xs text-emerald-400 hover:bg-emerald-500/20"
                      title="Enviar WhatsApp sobre este show"
                    >
                      💬
                    </a>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(cm.id)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title="Remover músico do show"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
