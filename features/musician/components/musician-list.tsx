"use client";

import type { AccompanyingMusician } from "../types";
import { generateWhatsAppLink, getMusicianWhatsAppMessage } from "@/lib/whatsapp";

interface MusicianListProps {
  musicians: AccompanyingMusician[];
  artistStageName: string;
  onEdit: (musician: AccompanyingMusician) => void;
  onDelete: (id: string) => void;
}

export function MusicianList({
  musicians,
  artistStageName,
  onEdit,
  onDelete,
}: MusicianListProps) {
  if (musicians.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center text-zinc-500">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/60 text-2xl mb-3">
          🎸
        </div>
        <h3 className="text-base font-semibold text-zinc-300">Nenhum músico cadastrado</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
          Cadastre seus parceiros de banda, bateristas, baixistas e tecladistas para organizar sua equipe de show e mandar mensagens no WhatsApp com 1 toque.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
      {musicians.map((musician) => {
        const waMessage = getMusicianWhatsAppMessage({
          musicianName: musician.name,
          artistStageName,
        });

        const waLink = generateWhatsAppLink(musician.phone, waMessage);

        return (
          <div
            key={musician.id}
            className="flex flex-col justify-between rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 hover:border-zinc-700/80 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-zinc-100 truncate">
                    {musician.name}
                  </h4>
                  {musician.instrument ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400 mt-1">
                      <span>🎸</span>
                      <span className="truncate">{musician.instrument}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 italic block mt-1">
                      Sem instrumento definido
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(musician)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Editar músico"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Deseja realmente excluir o músico "${musician.name}"?`
                        )
                      ) {
                        onDelete(musician.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Excluir músico"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Extra details if available */}
              <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
                {musician.phone && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">📱</span>
                    <span className="font-mono text-zinc-300">{musician.phone}</span>
                  </div>
                )}
                {musician.address && (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-500">📍</span>
                    <span className="truncate text-zinc-400">{musician.address}</span>
                  </div>
                )}
                {musician.note && (
                  <div className="mt-1 text-[11px] text-zinc-400 bg-zinc-950/50 rounded-lg p-1.5 border border-zinc-800/60 line-clamp-2">
                    {musician.note}
                  </div>
                )}
              </div>
            </div>

            {/* Quick WhatsApp outreach button */}
            <div className="mt-3.5 pt-3 border-t border-zinc-800/70">
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all shadow-sm active:scale-95 cursor-pointer w-full text-center"
                >
                  <span>💬</span>
                  <span>Mandar WhatsApp</span>
                </a>
              ) : (
                <span className="text-[11px] text-zinc-500 italic block text-center py-1">
                  Sem telefone cadastrado
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
