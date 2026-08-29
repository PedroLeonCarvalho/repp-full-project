"use client";

import { useEffect, useState } from "react";
import type { Concert, CreateConcertInput, PaymentStatus } from "../types";
import type { Contractor, CreateContractorInput } from "@/features/contractor/types";
import type { AccompanyingMusician } from "@/features/musician/types";
import { PAYMENT_STATUSES } from "@/db/schema/enums";
import {
  listContractorsAction,
  createContractorAction,
} from "@/features/contractor/actions/contractor-actions";
import {
  listMusiciansAction,
  listConcertMusiciansAction,
} from "@/features/musician/actions/musician-actions";
import { ContractorForm } from "@/features/contractor/components/contractor-form";


interface ConcertFormProps {
  isOpen: boolean;
  projectId: string;
  projectName?: string;
  initialData: Concert | null;
  onClose: () => void;
  onSubmit: (data: CreateConcertInput) => Promise<{ success: boolean; error?: string }>;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PARTIALLY_PAID: "Parcialmente Pago",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

function formatDateForInput(date: Date | string | undefined): string {
  if (!date) {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

function ConcertFormModal({
  projectId,
  projectName,
  initialData,
  onClose,
  onSubmit,
}: {
  projectId: string;
  projectName?: string;
  initialData: Concert | null;
  onClose: () => void;
  onSubmit: (data: CreateConcertInput) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [contractorId, setContractorId] = useState(initialData?.contractorId ?? "");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [presentationDate, setPresentationDate] = useState(
    formatDateForInput(initialData?.presentationDate)
  );
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "");
  const [finishTime, setFinishTime] = useState(initialData?.finishTime ?? "");
  const [durationInHours, setDurationInHours] = useState(
    initialData?.durationInHours ? String(initialData.durationInHours) : ""
  );
  const [totalBreakTime, setTotalBreakTime] = useState(
    initialData?.totalBreakTime ? String(initialData.totalBreakTime) : ""
  );
  const [agreedFee, setAgreedFee] = useState(
    initialData?.agreedFee ? String(initialData.agreedFee) : ""
  );
  const [travelCost, setTravelCost] = useState(
    initialData?.travelCost ? String(initialData.travelCost) : ""
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialData?.paymentStatus ?? "PENDING"
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateContractorOpen, setIsCreateContractorOpen] = useState(false);

  // Musicians state
  const [allMusicians, setAllMusicians] = useState<AccompanyingMusician[]>([]);
  const [selectedMusicians, setSelectedMusicians] = useState<
    Array<{ musicianId: string; agreedFee: number | null }>
  >([]);
  const [currentMusicianId, setCurrentMusicianId] = useState("");
  const [currentAgreedFee, setCurrentAgreedFee] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      const [contractorsRes, musiciansRes, concertMusiciansRes] =
        await Promise.all([
          listContractorsAction(),
          listMusiciansAction(),
          initialData
            ? listConcertMusiciansAction(initialData.id)
            : Promise.resolve(null),
        ]);

      if (!isCancelled) {
        if (contractorsRes.success && contractorsRes.data) {
          setContractors(contractorsRes.data);
        }
        if (musiciansRes.success && musiciansRes.data) {
          setAllMusicians(musiciansRes.data);
        }
        if (
          concertMusiciansRes &&
          concertMusiciansRes.success &&
          concertMusiciansRes.data
        ) {
          setSelectedMusicians(
            concertMusiciansRes.data.map((cm) => ({
              musicianId: cm.musicianId,
              agreedFee: cm.agreedFee,
            }))
          );
        }
      }
    }

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [initialData]);

  const handleAddMusician = () => {
    if (!currentMusicianId) return;
    if (selectedMusicians.some((m) => m.musicianId === currentMusicianId)) return;
    const fee = currentAgreedFee ? parseFloat(currentAgreedFee) : null;
    setSelectedMusicians((prev) => [
      ...prev,
      { musicianId: currentMusicianId, agreedFee: fee },
    ]);
    setCurrentMusicianId("");
    setCurrentAgreedFee("");
  };

  const handleRemoveMusician = (musicianId: string) => {
    setSelectedMusicians((prev) =>
      prev.filter((m) => m.musicianId !== musicianId)
    );
  };

  const handleContractorChange = (selectedId: string) => {
    setContractorId(selectedId);
    if (!selectedId) return;

    const selectedContractor = contractors.find((c) => c.id === selectedId);
    if (!selectedContractor) return;

    // Fulfill Estabelecimento ou Evento (Title) according to contractor selected
    if (selectedContractor.establishmentOrEventName?.trim()) {
      if (!initialData || !title.trim()) {
        setTitle(selectedContractor.establishmentOrEventName.trim());
      }
    } else if (selectedContractor.contactPersonName?.trim()) {
      if (!initialData || !title.trim()) {
        setTitle(selectedContractor.contactPersonName.trim());
      }
    }

    // Fulfill address according to the selected contractor
    if (selectedContractor.address?.trim()) {
      if (!initialData || !location.trim()) {
        setLocation(selectedContractor.address.trim());
      }
    }
  };

  const handleCreateContractor = async (data: CreateContractorInput) => {
    const res = await createContractorAction(data);
    if (res.success) {
      const newContractor = res.data;
      setContractors((prev) => [...prev, newContractor]);
      setContractorId(newContractor.id);

      // Auto-fill title & address for newly created contractor
      if (newContractor.establishmentOrEventName?.trim()) {
        if (!initialData || !title.trim()) {
          setTitle(newContractor.establishmentOrEventName.trim());
        }
      } else if (newContractor.contactPersonName?.trim()) {
        if (!initialData || !title.trim()) {
          setTitle(newContractor.contactPersonName.trim());
        }
      }

      if (newContractor.address?.trim()) {
        if (!initialData || !location.trim()) {
          setLocation(newContractor.address.trim());
        }
      }

      setIsCreateContractorOpen(false);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("O título da apresentação é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        projectId,
        contractorId: contractorId || null,
        title: title.trim(),
        location: location.trim() || null,
        presentationDate: new Date(presentationDate),
        startTime: startTime.trim() || null,
        finishTime: finishTime.trim() || null,
        durationInHours: durationInHours ? parseFloat(durationInHours) : null,
        totalBreakTime: totalBreakTime ? parseInt(totalBreakTime, 10) : null,
        agreedFee: agreedFee ? parseFloat(agreedFee) : null,
        travelCost: travelCost ? parseFloat(travelCost) : null,
        paymentStatus,
        note: note.trim() || null,
        musicians: selectedMusicians,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || "Erro ao salvar apresentação.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {projectName || "Projeto"}
            </span>
            <h2 className="text-xl font-bold text-zinc-50">
              {initialData ? "Editar Apresentação" : "Nova Apresentação / Show"}
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
          {/* Contractor Select (1st field to be filled) with "+ Novo" button */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Contratante / Estabelecimento
            </label>
            <div className="flex items-center gap-2">
              <select
                value={contractorId}
                onChange={(e) => handleContractorChange(e.target.value)}
                className="flex-1 rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Nenhum contratante vinculado</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contactPersonName} {c.establishmentOrEventName ? `(${c.establishmentOrEventName})` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsCreateContractorOpen(true)}
                className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 shrink-0 inline-flex items-center gap-1 cursor-pointer"
                title="Cadastrar novo contratante"
              >
                <span>+ Novo</span>
              </button>
            </div>
          </div>

          {/* Title / Event Name (2nd field) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Título / Nome do Evento <span className="text-emerald-400">*</span>
              </label>
              {contractorId && contractors.find((c) => c.id === contractorId)?.establishmentOrEventName && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  Preenchido do contratante
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Show Bar Central, Casamento Marina & Lucas"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Local / Endereço / Estabelecimento
              </label>
              {contractorId && contractors.find((c) => c.id === contractorId)?.address && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  Endereço do contratante preenchido automaticamente
                </span>
              )}
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 - Bela Vista, SP"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Date and Times Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Data do Show <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={presentationDate}
                onChange={(e) => setPresentationDate(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Término
              </label>
              <input
                type="time"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Duration and Break */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Duração Total (horas)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="48"
                value={durationInHours}
                onChange={(e) => setDurationInHours(e.target.value)}
                placeholder="Ex: 3.0"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Intervalo Total (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={totalBreakTime}
                onChange={(e) => setTotalBreakTime(e.target.value)}
                placeholder="Ex: 15"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Financials & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Cachê Acordado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={agreedFee}
                onChange={(e) => setAgreedFee(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Deslocamento (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={travelCost}
                onChange={(e) => setTravelCost(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Status do Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Accompanying Musicians Section (Optional) */}
          <div className="rounded-2xl bg-zinc-800/40 p-4 border border-zinc-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-zinc-200">
                  Músicos Acompanhantes <span className="text-zinc-500 font-normal">(Opcional)</span>
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Vincule músicos a este show agora ou adicione-os depois nos detalhes do evento.
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-zinc-700">
                {selectedMusicians.length} selecionado(s)
              </span>
            </div>

            {/* Selector and Fee inputs */}
            {allMusicians.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={currentMusicianId}
                  onChange={(e) => setCurrentMusicianId(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Selecione um músico...</option>
                  {allMusicians
                    .filter(
                      (m) =>
                        !selectedMusicians.some((sm) => sm.musicianId === m.id)
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.instrument ? `• ${m.instrument}` : ""}
                      </option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cachê R$"
                    value={currentAgreedFee}
                    onChange={(e) => setCurrentAgreedFee(e.target.value)}
                    className="w-28 rounded-xl bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddMusician}
                    disabled={!currentMusicianId}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/30">
                Nenhum músico cadastrado no momento. Você poderá cadastrar músicos na aba &quot;Músicos&quot; e vinculá-los a este evento a qualquer momento.
              </p>
            )}

            {/* List of currently selected musicians */}
            {selectedMusicians.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {selectedMusicians.map((sm) => {
                  const musicianInfo = allMusicians.find(
                    (m) => m.id === sm.musicianId
                  );
                  return (
                    <div
                      key={sm.musicianId}
                      className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/80 px-3 py-2 border border-zinc-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-zinc-100 truncate">
                          {musicianInfo?.name ?? "Músico"}
                        </span>
                        {musicianInfo?.instrument && (
                          <span className="rounded-md bg-zinc-700/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                            {musicianInfo.instrument}
                          </span>
                        )}
                        {sm.agreedFee !== null && sm.agreedFee !== undefined && (
                          <span className="text-emerald-400 font-semibold">
                            R$ {Number(sm.agreedFee).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMusician(sm.musicianId)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                        title="Remover músico"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Observações do Show
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Levar pedestal extra, contato do técnico de som..."
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Submit buttons */}
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
                : "Cadastrar Apresentação"}
            </button>
          </div>
        </form>

        {/* Modal to quickly create a new contractor */}
        {isCreateContractorOpen && (
          <ContractorForm
            isOpen={isCreateContractorOpen}
            initialData={null}
            onClose={() => setIsCreateContractorOpen(false)}
            onSubmit={handleCreateContractor}
          />
        )}
      </div>
    </div>
  );
}

export function ConcertForm(props: ConcertFormProps) {
  if (!props.isOpen) return null;
  return (
    <ConcertFormModal
      key={props.initialData?.id ?? `new-concert-${props.projectId}`}
      projectId={props.projectId}
      projectName={props.projectName}
      initialData={props.initialData}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
