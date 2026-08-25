import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do projeto é obrigatório")
    .max(255, "O nome do projeto deve ter no máximo 255 caracteres"),
  description: z.string().trim().max(1000, "A descrição deve ter no máximo 1000 caracteres").optional().nullable(),
  document: z.string().trim().max(100, "O documento deve ter no máximo 100 caracteres").optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do projeto não pode ficar vazio")
    .max(255, "O nome do projeto deve ter no máximo 255 caracteres")
    .optional(),
  description: z.string().trim().max(1000, "A descrição deve ter no máximo 1000 caracteres").optional().nullable(),
  document: z.string().trim().max(100, "O documento deve ter no máximo 100 caracteres").optional().nullable(),
});

export const linkMusicsToProjectSchema = z.object({
  projectId: z.string().uuid("ID de projeto inválido"),
  musicIds: z.array(z.string().uuid("ID de música inválido")).min(1, "Selecione ao menos uma música"),
});

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>;
