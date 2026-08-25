"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { CreateProjectInput, ProjectWithMusics } from "../types";
import type { ConcertWithSetlist, CreateConcertInput } from "@/features/concert/types";
import {
  createProjectAction,
  deleteProjectAction,
  listProjectsAction,
  updateProjectAction,
} from "../actions/project-actions";
import {
  createConcertAction,
  deleteConcertAction,
  duplicateConcertAction,
  listConcertsByProjectAction,
  updateConcertAction,
} from "@/features/concert/actions/concert-actions";
import { ProjectList } from "./project-list";
import { ProjectForm } from "./project-form";
import { ConcertForm } from "@/features/concert/components/concert-form";
import { ConcertDetail } from "@/features/concert/components/concert-detail";

export function ProjectView() {
  const [projects, setProjects] = useState<ProjectWithMusics[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [projectConcertsMap, setProjectConcertsMap] = useState<
    Record<string, ConcertWithSetlist[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Project Modals state
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithMusics | null>(
    null
  );

  // Concert Modals state
  const [isConcertFormOpen, setIsConcertFormOpen] = useState(false);
  const [editingConcert, setEditingConcert] = useState<ConcertWithSetlist | null>(
    null
  );
  const [activeProjectForConcert, setActiveProjectForConcert] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedConcertIdForDetail, setSelectedConcertIdForDetail] = useState<
    string | null
  >(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const loadConcertsForProject = useCallback(async (projectId: string) => {
    const res = await listConcertsByProjectAction(projectId);
    if (res.success) {
      setProjectConcertsMap((prev) => ({
        ...prev,
        [projectId]: res.data,
      }));
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    const res = await listProjectsAction();
    if (res.success) {
      setProjects(res.data);
      // Refresh concerts for all currently expanded projects
      for (const p of res.data) {
        void loadConcertsForProject(p.id);
      }
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  }, [loadConcertsForProject]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await listProjectsAction();
      if (!isCancelled) {
        if (res.success) {
          setProjects(res.data);
          // Load concerts for all projects
          for (const p of res.data) {
            void loadConcertsForProject(p.id);
          }
        } else {
          setFeedbackMessage({ type: "error", text: res.error });
        }
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [loadConcertsForProject]);

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        void loadConcertsForProject(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(projects.map((p) => p.id)));
    for (const p of projects) {
      void loadConcertsForProject(p.id);
    }
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Project CRUD
  const handleCreateOrUpdateProject = async (
    data: CreateProjectInput
  ): Promise<{ success: boolean; error?: string }> => {
    let res;
    if (editingProject) {
      res = await updateProjectAction(editingProject.id, data);
    } else {
      res = await createProjectAction(data);
    }

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: editingProject
          ? "Projeto atualizado com sucesso!"
          : "Projeto criado com sucesso!",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      startTransition(() => {
        void refreshProjects();
      });
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await deleteProjectAction(id);
    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: "Projeto excluído com sucesso.",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      startTransition(() => {
        void refreshProjects();
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  };

  // Concert Handlers
  const handleOpenCreateConcert = (projectId: string, projectName: string) => {
    setEditingConcert(null);
    setActiveProjectForConcert({ id: projectId, name: projectName });
    setIsConcertFormOpen(true);
  };

  const handleOpenEditConcert = (concert: ConcertWithSetlist) => {
    setEditingConcert(concert);
    setActiveProjectForConcert({
      id: concert.projectId,
      name: concert.projectName || "Projeto",
    });
    setIsConcertFormOpen(true);
  };

  const handleCreateOrUpdateConcert = async (
    data: CreateConcertInput
  ): Promise<{ success: boolean; error?: string }> => {
    let res;
    if (editingConcert) {
      res = await updateConcertAction(editingConcert.id, data);
    } else {
      res = await createConcertAction(data);
    }

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: editingConcert
          ? "Apresentação atualizada com sucesso!"
          : "Apresentação cadastrada com sucesso!",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      const projId = editingConcert ? editingConcert.projectId : data.projectId;
      // Ensure the project card is expanded to reveal the new concert
      setExpandedIds((prev) => new Set(prev).add(projId));
      startTransition(() => {
        void loadConcertsForProject(projId);
      });
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleDuplicateConcert = async (concertId: string) => {
    const res = await duplicateConcertAction(concertId);
    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: "Apresentação duplicada com sucesso com todo o setlist!",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      setExpandedIds((prev) => new Set(prev).add(res.data.projectId));
      startTransition(() => {
        void loadConcertsForProject(res.data.projectId);
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  };

  const handleDeleteConcert = async (concertId: string) => {
    const res = await deleteConcertAction(concertId);
    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: "Apresentação excluída com sucesso.",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      startTransition(() => {
        void refreshProjects();
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
            Projetos e Apresentações
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Gerencie suas bandas, shows agendados, cachês e setlists em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setIsProjectFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0 cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden xs:inline">Novo Projeto</span>
          <span className="xs:hidden">Novo</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-medium border ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : feedbackMessage.type === "info"
              ? "bg-sky-950/80 border-sky-800 text-sky-200"
              : "bg-red-950/80 border-red-800 text-red-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            Carregando projetos e apresentações...
          </div>
        </div>
      ) : (
        <ProjectList
          projects={projects}
          expandedIds={expandedIds}
          projectConcertsMap={projectConcertsMap}
          onToggleExpand={handleToggleExpand}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onEditProject={(project) => {
            setEditingProject(project);
            setIsProjectFormOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          onOpenCreateProject={() => {
            setEditingProject(null);
            setIsProjectFormOpen(true);
          }}
          onOpenCreateConcert={handleOpenCreateConcert}
          onOpenEditConcert={handleOpenEditConcert}
          onOpenConcertDetail={(concertId) =>
            setSelectedConcertIdForDetail(concertId)
          }
          onDuplicateConcert={handleDuplicateConcert}
          onDeleteConcert={handleDeleteConcert}
        />
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        initialData={editingProject}
        onClose={() => {
          setIsProjectFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrUpdateProject}
      />

      {/* Concert Form Modal */}
      {activeProjectForConcert && (
        <ConcertForm
          isOpen={isConcertFormOpen}
          projectId={activeProjectForConcert.id}
          projectName={activeProjectForConcert.name}
          initialData={editingConcert}
          onClose={() => {
            setIsConcertFormOpen(false);
            setEditingConcert(null);
            setActiveProjectForConcert(null);
          }}
          onSubmit={handleCreateOrUpdateConcert}
        />
      )}

      {/* Concert Detail & Setlist Manager Modal */}
      {selectedConcertIdForDetail && (
        <ConcertDetail
          concertId={selectedConcertIdForDetail}
          onClose={() => {
            setSelectedConcertIdForDetail(null);
            void refreshProjects();
          }}
          onEdit={(concert) => {
            setSelectedConcertIdForDetail(null);
            handleOpenEditConcert(concert);
          }}
          onDelete={(id) => {
            setSelectedConcertIdForDetail(null);
            void handleDeleteConcert(id);
          }}
        />
      )}
    </div>
  );
}
