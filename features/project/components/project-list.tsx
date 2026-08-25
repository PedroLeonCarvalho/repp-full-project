"use client";

import { useState } from "react";
import type { ProjectWithMusics } from "../types";
import type { ConcertWithSetlist } from "@/features/concert/types";

interface ProjectListProps {
  projects: ProjectWithMusics[];
  expandedIds: Set<string>;
  projectConcertsMap: Record<string, ConcertWithSetlist[]>;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onEditProject: (project: ProjectWithMusics) => void;
  onDeleteProject: (id: string) => void;
  onOpenCreateProject: () => void;
  onOpenCreateConcert: (projectId: string, projectName: string) => void;
  onOpenEditConcert: (concert: ConcertWithSetlist) => void;
  onOpenConcertDetail: (concertId: string) => void;
  onDuplicateConcert: (concertId: string) => void;
  onDeleteConcert: (concertId: string) => void;
}

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Pendente",
    badgeClass: "bg-amber-950/80 border-amber-800/80 text-amber-300",
  },
  PARTIALLY_PAID: {
    label: "Parc. Pago",
    badgeClass: "bg-sky-950/80 border-sky-800/80 text-sky-300",
  },
  PAID: {
    label: "Pago",
    badgeClass: "bg-emerald-950/80 border-emerald-800/80 text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClass: "bg-zinc-800 border-zinc-700 text-zinc-400",
  },
};

export function ProjectList({
  projects,
  expandedIds,
  projectConcertsMap,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onEditProject,
  onDeleteProject,
  onOpenCreateProject,
  onOpenCreateConcert,
  onOpenEditConcert,
  onOpenConcertDetail,
  onDuplicateConcert,
  onDeleteConcert,
}: ProjectListProps) {
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-2xl text-zinc-400 mb-4">
          📁
        </div>
        <h3 className="text-base font-semibold text-zinc-200">
          Nenhum projeto cadastrado
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Cadastre seus projetos musicais, bandas ou formatos de shows para organizar apresentações e repertórios.
        </p>
        <button
          type="button"
          onClick={onOpenCreateProject}
          className="mt-5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          + Criar Primeiro Projeto
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Global Expand / Collapse Toolbar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-zinc-400">
          {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Expandir todos
          </button>
          <span className="text-zinc-600 text-xs">•</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Recolher todos
          </button>
        </div>
      </div>

      {/* Accordion Projects List */}
      <div className="flex flex-col gap-3">
        {projects.map((project) => {
          const isExpanded = expandedIds.has(project.id);
          const isMenuOpen = openMenuProjectId === project.id;
          const concerts = projectConcertsMap[project.id] || [];

          return (
            <div
              key={project.id}
              className="group overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700/80 transition-all shadow-sm"
            >
              {/* Project Card Header */}
              <div className="flex items-center justify-between p-4 gap-3">
                <button
                  type="button"
                  onClick={() => onToggleExpand(project.id)}
                  className="flex flex-1 items-center gap-3 text-left focus:outline-none cursor-pointer"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90 text-emerald-400 bg-emerald-950/40" : ""
                    }`}
                  >
                    ▶
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      {project.document && (
                        <span className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                          {project.document}
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-lg">
                        {project.description}
                      </p>
                    )}
                  </div>
                </button>

                {/* Right Actions & Menu */}
                <div className="relative flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hidden sm:inline">
                    {concerts.length}{" "}
                    {concerts.length === 1 ? "apresentação" : "apresentações"}
                  </span>

                  {/* Options Menu Button (⋮) */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuProjectId(isMenuOpen ? null : project.id)
                    }
                    className="rounded-xl p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Opções do projeto"
                  >
                    ⋮
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setOpenMenuProjectId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-zinc-800 bg-zinc-900/95 py-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            onEditProject(project);
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            if (
                              confirm(
                                `Tem certeza de que deseja excluir o projeto "${project.name}"?`
                              )
                            ) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Presentation Region (Concerts & Setlists) */}
              {isExpanded && (
                <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-4 sm:p-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <span>📅</span> Apresentações (Shows)
                    </h4>

                    <button
                      type="button"
                      onClick={() => onOpenCreateConcert(project.id, project.name)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>+ Nova Apresentação</span>
                    </button>
                  </div>

                  {/* Concerts List */}
                  {concerts.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-center">
                      <p className="text-xs font-medium text-zinc-400">
                        Nenhuma apresentação cadastrada para este projeto.
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Crie uma nova apresentação para agendar datas, gerenciar cachês e montar o setlist.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenCreateConcert(project.id, project.name)}
                        className="mt-3.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        + Cadastrar Show
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {concerts.map((concert) => {
                        const statusConfig =
                          PAYMENT_STATUS_CONFIG[concert.paymentStatus] ||
                          PAYMENT_STATUS_CONFIG.PENDING;

                        const dateStr = new Date(
                          concert.presentationDate
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });

                        return (
                          <div
                            key={concert.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-900/80 hover:border-zinc-700/80 transition-all gap-3"
                          >
                            <div
                              onClick={() => onOpenConcertDetail(concert.id)}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs sm:text-sm text-zinc-100 hover:text-emerald-400 transition-colors truncate">
                                  {concert.title}
                                </span>
                                <span
                                  className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${statusConfig.badgeClass}`}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                                <span>📅 {dateStr}</span>
                                {concert.startTime && <span>⏰ {concert.startTime}</span>}
                                {concert.location && (
                                  <span className="truncate max-w-[200px]">
                                    📍 {concert.location}
                                  </span>
                                )}
                                {concert.agreedFee !== null && (
                                  <span className="text-emerald-400 font-medium">
                                    💰 R$ {concert.agreedFee.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-zinc-500 font-medium">
                                  🎵 {concert.setlistCount}{" "}
                                  {concert.setlistCount === 1 ? "música" : "músicas"}
                                </span>
                              </div>
                            </div>

                            {/* Concert Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => onOpenConcertDetail(concert.id)}
                                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              >
                                Ver Setlist
                              </button>

                              <button
                                type="button"
                                onClick={() => onDuplicateConcert(concert.id)}
                                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Duplicar apresentação com todo o setlist"
                              >
                                📋 Duplicar
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenEditConcert(concert)}
                                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Editar dados da apresentação"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Deseja realmente excluir o show "${concert.title}"?`
                                    )
                                  ) {
                                    onDeleteConcert(concert.id);
                                  }
                                }}
                                className="rounded-lg p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Excluir apresentação"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
