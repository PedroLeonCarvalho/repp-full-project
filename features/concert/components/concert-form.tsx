"use client";

import { useEffect, useState } from "react";
import type { Concert, CreateConcertInput, PaymentStatus } from "../types";
import type { Contractor } from "@/features/contractor/types";
import { PAYMENT_STATUSES } from "@/db/schema/enums";
import { listContractorsAction } from "@/features/contractor/actions/contractor-actions";


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

  useEffect(() => {
    async function loadContractors() {
      const res = await listContractorsAction();
      if (res.success && res.data) {
        setContractors(res.data);
      }
    }
    void loadContractors();
  }, []);

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
          {/* Title / Event Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Título / Nome do Evento <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Show Bar Central, Casamento Marina & Lucas"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Contractor Select */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Contratante / Estabelecimento
            </label>
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            >
              <option value="">Nenhum contratante vinculado</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contactPersonName} {c.establishmentOrEventName ? `(${c.establishmentOrEventName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Local / Endereço / Estabelecimento
            </label>
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
