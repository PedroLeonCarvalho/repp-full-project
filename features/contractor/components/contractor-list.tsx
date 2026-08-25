"use client";

import type { Contractor } from "../types";
import { generateWhatsAppLink, getContractorWhatsAppMessage } from "@/lib/whatsapp";

interface ContractorListProps {
  contractors: Contractor[];
  artistStageName: string;
  onEdit: (contractor: Contractor) => void;
  onDelete: (id: string) => void;
}

export function ContractorList({
  contractors,
  artistStageName,
  onEdit,
  onDelete,
}: ContractorListProps) {
  if (contractors.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center text-zinc-500">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/60 text-2xl mb-3">
          🏢
        </div>
        <h3 className="text-base font-semibold text-zinc-300">Nenhum contratante cadastrado</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
          Cadastre os contratantes, donos de bares, noivos e produtores para organizar seus shows e gerar contratos rapidamente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {contractors.map((contractor) => {
        const waMessage = getContractorWhatsAppMessage({
          contactName: contractor.contactPersonName,
          artistStageName,
          establishmentName: contractor.establishmentOrEventName,
        });

        const waLink = generateWhatsAppLink(contractor.phone, waMessage);

        return (
          <div
            key={contractor.id}
            className="flex flex-col justify-between rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 hover:border-zinc-700/80 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {contractor.establishmentOrEventName && (
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block truncate">
                      {contractor.establishmentOrEventName}
                    </span>
                  )}
                  <h4 className="text-base font-bold text-zinc-100 truncate">
                    {contractor.contactPersonName}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(contractor)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Editar contratante"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Deseja realmente excluir o contratante "${contractor.contactPersonName}"?`
                        )
                      ) {
                        onDelete(contractor.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Excluir contratante"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Details list */}
              <div className="mt-3.5 flex flex-col gap-1.5 text-xs text-zinc-400">
                {contractor.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">📞</span>
                    <span className="font-mono text-zinc-300">{contractor.phone}</span>
                  </div>
                )}
                {contractor.email && (
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-500">✉️</span>
                    <span className="truncate">{contractor.email}</span>
                  </div>
                )}
                {contractor.documentNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">📄</span>
                    <span className="font-mono text-zinc-400">{contractor.documentNumber}</span>
                  </div>
                )}
                {contractor.address && (
                  <div className="flex items-start gap-2 line-clamp-1">
                    <span className="text-zinc-500 shrink-0">📍</span>
                    <span className="truncate">{contractor.address}</span>
                  </div>
                )}
                {contractor.note && (
                  <div className="mt-1 rounded-xl bg-zinc-950/60 p-2.5 text-[11px] text-zinc-400 border border-zinc-800/60">
                    <strong className="text-zinc-300">Obs:</strong> {contractor.note}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: WhatsApp Outreach Button */}
            <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between gap-2">
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all shadow-sm active:scale-95 cursor-pointer w-full justify-center"
                >
                  <span className="text-sm">💬</span>
                  <span>Chamar no WhatsApp</span>
                </a>
              ) : (
                <span className="text-[11px] text-zinc-500 italic w-full text-center">
                  Telefone não cadastrado para WhatsApp
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
