"use client";

import { useMemo, useState } from "react";
import type { ProjectWithMusics } from "../types";
import type { ConcertWithSetlist } from "@/features/concert/types";
import { formatConcertDate } from "@/lib/date-utils";

function getConcertTimestamp(concert: {
  presentationDate: Date | string;
  startTime?: string | null;
}): number {
  const dateObj = new Date(concert.presentationDate);
  let year = dateObj.getUTCFullYear();
  let month = dateObj.getUTCMonth();
  let day = dateObj.getUTCDate();

  if (typeof concert.presentationDate === "string" && concert.presentationDate.includes("-")) {
    const datePart = concert.presentationDate.split("T")[0];
    const [y, m, d] = datePart.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      year = y;
      month = m - 1;
      day = d;
    }
  }

  let hour = 12;
  let minute = 0;
  if (concert.startTime) {
    const [h, m] = concert.startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hour = h;
      minute = m;
    }
  }

  return new Date(year, month, day, hour, minute).getTime();
}

function isConcertPassed(
  concert: {
    presentationDate: Date | string;
    startTime?: string | null;
    finishTime?: string | null;
    durationInHours?: number | string | null;
  },
  nowTimestamp: number
): boolean {
  const dateObj = new Date(concert.presentationDate);
  let year = dateObj.getUTCFullYear();
  let month = dateObj.getUTCMonth();
  let day = dateObj.getUTCDate();

  if (typeof concert.presentationDate === "string" && concert.presentationDate.includes("-")) {
    const datePart = concert.presentationDate.split("T")[0];
    const [y, m, d] = datePart.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      year = y;
      month = m - 1;
      day = d;
    }
  }

  let endHour = 23;
  let endMinute = 59;

  if (concert.finishTime) {
    const [h, m] = concert.finishTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      endHour = h;
      endMinute = m;
    }
  } else if (concert.startTime) {
    const [h, m] = concert.startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const dur = concert.durationInHours ? Number(concert.durationInHours) : 2;
      endHour = h + Math.floor(dur);
      endMinute = m + Math.round((dur % 1) * 60);
    }
  }

  const concertEnd = new Date(year, month, day, endHour, endMinute, 59, 999);
  return concertEnd.getTime() < nowTimestamp;
}

function getProjectClosestConcertDistance(
  concerts: ConcertWithSetlist[] | undefined,
  nowTimestamp: number
): { minDistance: number; hasUpcoming: boolean } {
  if (!concerts || concerts.length === 0) {
    return { minDistance: Infinity, hasUpcoming: false };
  }

  let minDistance = Infinity;
  let hasUpcoming = false;

  for (const concert of concerts) {
    const ts = getConcertTimestamp(concert);
    const passed = isConcertPassed(concert, nowTimestamp);
    if (!passed) {
      hasUpcoming = true;
    }
    const dist = Math.abs(ts - nowTimestamp);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return { minDistance, hasUpcoming };
}

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
  onOpenConcertSetlist: (concertId: string) => void;
  onShareConcert?: (concert: ConcertWithSetlist) => void;
  onDuplicateConcert: (concertId: string) => void;
  onDeleteConcert: (concertId: string) => void;
}

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
  onOpenConcertSetlist,
  onShareConcert,
  onDuplicateConcert,
  onDeleteConcert,
}: ProjectListProps) {
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  // Sort projects by which has the concert with presentation date closer to current date
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const concertsA = projectConcertsMap[a.id] || [];
      const concertsB = projectConcertsMap[b.id] || [];

      const distA = getProjectClosestConcertDistance(concertsA, now);
      const distB = getProjectClosestConcertDistance(concertsB, now);

      // Projects with concert closer to current date first
      if (distA.minDistance !== distB.minDistance) {
        return distA.minDistance - distB.minDistance;
      }

      // Tiebreaker: upcoming concert takes precedence over already-passed concert
      if (distA.hasUpcoming !== distB.hasUpcoming) {
        return distA.hasUpcoming ? -1 : 1;
      }

      // Alphabetical order
      return a.name.localeCompare(b.name);
    });
  }, [projects, projectConcertsMap, now]);

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
        {sortedProjects.map((project) => {
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
                      {[...concerts]
                        .sort((a, b) => getConcertTimestamp(b) - getConcertTimestamp(a))
                        .map((concert) => {
                          const isPassed = isConcertPassed(concert, now);
                          const dateStr = formatConcertDate(concert.presentationDate);

                          return (
                            <div
                              key={concert.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all gap-2 ${
                                isPassed
                                  ? "border-zinc-800/40 bg-zinc-950/40 opacity-70"
                                  : "border-zinc-800/60 bg-zinc-900/80 hover:border-zinc-700/80"
                              }`}
                            >
                              <div
                                onClick={() => onOpenConcertDetail(concert.id)}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                {/* Line 1: Concert Title */}
                                <div
                                  className={`font-semibold text-xs sm:text-sm truncate transition-colors ${
                                    isPassed
                                      ? "line-through text-zinc-500 hover:text-zinc-400"
                                      : "text-zinc-100 hover:text-emerald-400"
                                  }`}
                                  title={
                                    isPassed
                                      ? `${concert.title} (Show já realizado)`
                                      : concert.title
                                  }
                                >
                                  {concert.title}
                                </div>

                                {/* Line 2: Date & Hour */}
                                <div
                                  className={`flex items-center gap-2 mt-0.5 text-xs ${
                                    isPassed
                                      ? "line-through text-zinc-600"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  <span>📅 {dateStr}</span>
                                  {concert.startTime && (
                                    <>
                                      <span className="text-zinc-600">•</span>
                                      <span>⏰ {concert.startTime}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                            {/* Concert Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                              <button
                                type="button"
                                onClick={() => onOpenConcertDetail(concert.id)}
                                className="rounded-lg bg-zinc-800 border border-zinc-700/70 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Ver dados da apresentação (endereço, cachê, etc.)"
                              >
                                <span>📋</span>
                                <span>Ver Dados</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenConcertSetlist(concert.id)}
                                className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Iniciar apresentação ao vivo com setlist e letras"
                              >
                                <span>▶</span>
                                <span>Iniciar show</span>
                              </button>

                              {onShareConcert && (
                                <button
                                  type="button"
                                  onClick={() => onShareConcert(concert)}
                                  className="rounded-lg bg-zinc-800 border border-zinc-700/70 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Compartilhar setlist da apresentação"
                                >
                                  <span>🔗</span>
                                  <span>Compartilhar</span>
                                </button>
                              )}

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
                                      `Tem certeza de que deseja excluir o show "${concert.title}"?`
                                    )
                                  ) {
                                    onDeleteConcert(concert.id);
                                  }
                                }}
                                className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
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
