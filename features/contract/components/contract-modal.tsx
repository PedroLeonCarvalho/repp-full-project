"use client";

import { useEffect, useState } from "react";
import type { Contract } from "../types";
import type { Contractor } from "@/features/contractor/types";
import {
  generateContractAction,
  getContractByConcertIdAction,
  updateContractAction,
} from "../actions/contract-actions";
import { listContractorsAction } from "@/features/contractor/actions/contractor-actions";

interface ContractModalProps {
  isOpen: boolean;
  concertId: string;
  concertTitle: string;
  defaultContractorId?: string | null;
  defaultFee?: number | null;
  onClose: () => void;
}

export function ContractModal({
  isOpen,
  concertId,
  concertTitle,
  defaultContractorId,
  defaultFee,
  onClose,
}: ContractModalProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [contractText, setContractText] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>(
    defaultContractorId || ""
  );
  const [mealsIncluded, setMealsIncluded] = useState(false);
  const [maxConsumption, setMaxConsumption] = useState("");
  const [feeInput, setFeeInput] = useState(
    defaultFee ? String(defaultFee) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchContract() {
      const [cRes, contRes] = await Promise.all([
        getContractByConcertIdAction(concertId),
        listContractorsAction(),
      ]);

      if (!isCancelled) {
        if (contRes.success && contRes.data) {
          setContractors(contRes.data);
        }

        if (cRes.success && cRes.data) {
          setContract(cRes.data);
          setContractText(cRes.data.contractText);
          setMealsIncluded(cRes.data.mealsIncluded);
          if (cRes.data.maximumConsumptionAmount) {
            setMaxConsumption(String(cRes.data.maximumConsumptionAmount));
          }
          if (cRes.data.agreedFee) {
            setFeeInput(String(cRes.data.agreedFee));
          }
          if (cRes.data.contractorId) {
            setSelectedContractorId(cRes.data.contractorId);
          }
        } else {
          setContract(null);
          if (defaultContractorId) {
            setSelectedContractorId(defaultContractorId);
          }
          if (defaultFee) {
            setFeeInput(String(defaultFee));
          }
        }
        setIsLoading(false);
      }
    }

    if (isOpen) {
      void fetchContract();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, concertId, defaultContractorId, defaultFee]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsSaving(true);
    try {
      const res = await generateContractAction({
        concertId,
        contractorId: selectedContractorId || null,
        mealsIncluded,
        maximumConsumptionAmount: maxConsumption ? parseFloat(maxConsumption) : null,
        agreedFee: feeInput ? parseFloat(feeInput) : null,
      });

      if (res.success && res.data) {
        setContract(res.data);
        setContractText(res.data.contractText);
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveText = async () => {
    if (!contract) return;
    setIsSaving(true);
    try {
      const res = await updateContractAction(contract.id, {
        contractText,
        mealsIncluded,
        maximumConsumptionAmount: maxConsumption ? parseFloat(maxConsumption) : null,
        agreedFee: feeInput ? parseFloat(feeInput) : null,
      });

      if (res.success && res.data) {
        setContract(res.data);
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!contractText) return;
    await navigator.clipboard.writeText(contractText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      {/* Printable Area - styled for Print and Screen */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl flex flex-col max-h-[92vh] my-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0 print:hidden">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Contrato de Apresentação
            </span>
            <h2 className="text-xl font-bold text-zinc-50 truncate max-w-md sm:max-w-xl">
              {concertTitle}
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

        {/* Content Body */}
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex items-center justify-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span>Carregando informações do contrato...</span>
          </div>
        ) : !contract ? (
          /* Generate Contract Form */
          <div className="py-6 flex flex-col gap-5 overflow-y-auto">
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-zinc-200 mb-1">
                📄 Gerar Contrato de Prestação de Serviços Artísticos
              </h3>
              <p className="text-xs text-zinc-400">
                O modelo padrão contempla responsabilidades de som, auxílio leve no transporte de caixas/pedestais e valores acordados.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Selecione o Contratante / Casa de Show
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Nenhum contratante selecionado</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contactPersonName}{" "}
                      {c.establishmentOrEventName
                        ? `(${c.establishmentOrEventName})`
                        : ""}
                    </option>
                  ))}
                </select>
                {contractors.length === 0 && (
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Dica: Cadastre contratantes na aba &quot;Contratantes&quot; para preenchimento automático.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Cachê Total do Show (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Limite de Consumação (R$, opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxConsumption}
                    onChange={(e) => setMaxConsumption(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mealsIncludedCheck"
                  checked={mealsIncluded}
                  onChange={(e) => setMealsIncluded(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                />
                <label
                  htmlFor="mealsIncludedCheck"
                  className="text-xs text-zinc-300 select-none cursor-pointer"
                >
                  Alimentação e bebidas inclusas para a equipe artística
                </label>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSaving}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Gerando Contrato..." : "📄 Gerar Texto do Contrato"}
              </button>
            </div>
          </div>
        ) : (
          /* View / Edit Generated Contract */
          <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-zinc-800/70 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isEditing
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                  }`}
                >
                  {isEditing ? "👁️ Visualizar" : "✏️ Editar Texto"}
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isSaving}
                  className="rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Regenerar o texto com os dados atuais do show"
                >
                  🔄 Regenerar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  {copyFeedback ? "✅ Copiado!" : "📋 Copiar Texto"}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Salvar em PDF / Imprimir</span>
                </button>
              </div>
            </div>

            {/* Editor or Formatted Preview */}
            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  rows={16}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="w-full flex-1 rounded-2xl bg-zinc-950 font-mono text-xs text-zinc-200 p-4 border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all resize-y leading-relaxed"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContractText(contract.contractText);
                      setIsEditing(false);
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveText}
                    disabled={isSaving}
                    className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            ) : (
              /* Beautiful formatted contract sheet */
              <div
                id="contract-printable-doc"
                className="bg-zinc-950/80 rounded-2xl p-6 sm:p-8 border border-zinc-800 text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text shadow-inner"
              >
                {contractText}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-zinc-800 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
