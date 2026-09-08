import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema/projects";
import { projectMusics } from "@/db/schema/project-musics";
import { customerMusics } from "@/db/schema/customer-musics";
import { musicCatalog } from "@/db/schema/music-catalog";
import { customers } from "@/db/schema/customers";
import type {
  CreateProjectInput,
  Project,
  ProjectWithMusics,
  UpdateProjectInput,
} from "../types";
import type { Music, MusicGenre } from "@/features/music/types";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project-schema";

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "UNAUTHORIZED"
      | "VALIDATION_ERROR"
      | "DUPLICATE_NAME"
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export async function createProject(
  input: CreateProjectInput,
  customerId: string
): Promise<Project> {
  const validated = createProjectSchema.parse(input);

  const [created] = await db
    .insert(projects)
    .values({
      customerId,
      name: validated.name,
      description: validated.description || null,
      document: validated.document || null,
    })
    .returning();

  return created;
}

export async function ensureDefaultProject(
  customerId: string,
  stageName: string
): Promise<Project> {
  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, customerId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(projects)
    .values({
      customerId,
      name: stageName || "Meu Projeto Principal",
      description: "Projeto padrão do acervo de apresentações",
    })
    .returning();

  return created;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  customerId: string
): Promise<Project> {
  const validated = updateProjectSchema.parse(input);

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ProjectServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const updateData: Partial<typeof projects.$inferInsert> = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description || null;
  if (validated.document !== undefined) updateData.document = validated.document || null;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.id, id), eq(projects.customerId, customerId)))
    .returning();

  return updated;
}

export async function deleteProject(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ProjectServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.customerId, customerId)));

  return { success: true };
}

export async function getProjectById(
  id: string,
  customerId: string
): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.customerId, customerId)))
    .limit(1);

  return project || null;
}

export async function listProjects(
  customerId: string
): Promise<ProjectWithMusics[]> {
  // Check if customer has any project; if not, create default project with their stageName
  const allProjects = await db
    .select({
      id: projects.id,
      customerId: projects.customerId,
      name: projects.name,
      description: projects.description,
      document: projects.document,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      musicsCount: sql<number>`count(${projectMusics.id})::int`,
    })
    .from(projects)
    .leftJoin(projectMusics, eq(projectMusics.projectId, projects.id))
    .where(eq(projects.customerId, customerId))
    .groupBy(projects.id)
    .orderBy(desc(projects.createdAt));

  if (allProjects.length === 0) {
    const [customer] = await db
      .select({ stageName: customers.stageName })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    const defaultProj = await ensureDefaultProject(
      customerId,
      customer?.stageName || "Meu Projeto"
    );

    return [{ ...defaultProj, musicsCount: 0 }];
  }

  return allProjects;
}

export async function addMusicsToProject(
  projectId: string,
  musicIds: string[],
  customerId: string
): Promise<{ addedCount: number }> {
  if (musicIds.length === 0) {
    return { addedCount: 0 };
  }

  // 1. Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1);

  if (!project) {
    throw new ProjectServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  // 2. Verify all musics belong to customer
  const validMusics = await db
    .select({ id: customerMusics.id })
    .from(customerMusics)
    .where(
      and(
        eq(customerMusics.customerId, customerId),
        inArray(customerMusics.id, musicIds)
      )
    );

  if (validMusics.length === 0) {
    return { addedCount: 0 };
  }

  // 3. Insert associations ignoring conflicts
  let addedCount = 0;
  for (const music of validMusics) {
    const [existing] = await db
      .select({ id: projectMusics.id })
      .from(projectMusics)
      .where(
        and(
          eq(projectMusics.projectId, projectId),
          eq(projectMusics.musicId, music.id)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(projectMusics).values({
        projectId,
        musicId: music.id,
      });
      addedCount++;
    }
  }

  return { addedCount };
}

export async function removeMusicFromProject(
  projectId: string,
  musicId: string,
  customerId: string
): Promise<{ success: true }> {
  // 1. Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1);

  if (!project) {
    throw new ProjectServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(projectMusics)
    .where(
      and(
        eq(projectMusics.projectId, projectId),
        eq(projectMusics.musicId, musicId)
      )
    );

  return { success: true };
}

export async function listProjectMusics(
  projectId: string,
  customerId: string
): Promise<Music[]> {
  // 1. Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1);

  if (!project) {
    throw new ProjectServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const rawItems = await db
    .select({
      cm: customerMusics,
      mc: musicCatalog,
    })
    .from(customerMusics)
    .innerJoin(musicCatalog, eq(musicCatalog.id, customerMusics.musicCatalogId))
    .innerJoin(projectMusics, eq(projectMusics.musicId, customerMusics.id))
    .where(
      and(
        eq(projectMusics.projectId, projectId),
        eq(customerMusics.customerId, customerId)
      )
    )
    .orderBy(musicCatalog.title);

  const items = rawItems.map((r) => ({
    id: r.cm.id,
    musicCatalogId: r.cm.musicCatalogId,
    customerId: r.cm.customerId,
    title: r.mc.title,
    artist: r.mc.artist,
    lyrics: r.cm.lyrics ?? r.mc.lyrics,
    chords: r.cm.chords ?? r.mc.chords,
    originalKey: r.cm.originalKey,
    preferredKey: r.cm.preferredKey,
    studying: r.cm.studying,
    genre: r.cm.genre,
    genres: (r.cm.genres as MusicGenre[]) ?? (r.cm.genre ? [r.cm.genre as MusicGenre] : null),
    note: r.cm.note,
    spotifyLink: r.cm.spotifyLink,
    sheetMusicFile: r.cm.sheetMusicFile,
    createdAt: r.cm.createdAt,
    updatedAt: r.cm.updatedAt,
  }));

  return items;
}
