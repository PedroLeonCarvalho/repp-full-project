"use server";

import { revalidatePath } from "next/cache";
import { requireAuthCustomerId } from "@/features/auth/services/auth-service";
import {
  addMusicsToProject,
  createProject,
  deleteProject,
  getProjectById,
  listProjectMusics,
  listProjects,
  removeMusicFromProject,
  updateProject,
  ProjectServiceError,
} from "../services/project-service";
import type {
  CreateProjectInput,
  Project,
  ProjectWithMusics,
  UpdateProjectInput,
} from "../types";
import type { Music } from "@/features/music/types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const customerId = await requireAuthCustomerId();
    const created = await createProject(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof ProjectServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao criar projeto." };
  }
}

export async function updateProjectAction(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const customerId = await requireAuthCustomerId();
    const updated = await updateProject(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof ProjectServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar projeto." };
  }
}

export async function deleteProjectAction(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await deleteProject(id, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ProjectServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao excluir projeto." };
  }
}

export async function listProjectsAction(): Promise<
  ActionResult<ProjectWithMusics[]>
> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listProjects(customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar projetos." };
  }
}

export async function getProjectByIdAction(
  id: string
): Promise<ActionResult<Project | null>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await getProjectById(id, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar projeto." };
  }
}

export async function addMusicsToProjectAction(
  projectId: string,
  musicIds: string[]
): Promise<ActionResult<{ addedCount: number }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await addMusicsToProject(projectId, musicIds, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ProjectServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao vincular músicas." };
  }
}

export async function removeMusicFromProjectAction(
  projectId: string,
  musicId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await removeMusicFromProject(projectId, musicId, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ProjectServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao desvincular música." };
  }
}

export async function listProjectMusicsAction(
  projectId: string
): Promise<ActionResult<Music[]>> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listProjectMusics(projectId, customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar músicas do projeto." };
  }
}
