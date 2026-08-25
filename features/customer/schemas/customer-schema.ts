import { z } from "zod";

export const registerCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "O nome completo deve ter pelo menos 2 caracteres")
    .max(255, "O nome completo deve ter no máximo 255 caracteres"),
  stageName: z
    .string()
    .trim()
    .min(1, "O nome artístico é obrigatório")
    .max(255, "O nome artístico deve ter no máximo 255 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido"),
  password: z
    .string()
    .min(6, "A senha deve conter no mínimo 6 caracteres")
    .max(100, "A senha deve conter no máximo 100 caracteres"),
  cpf: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  instagram: z.string().trim().optional().nullable(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type RegisterCustomerSchemaInput = z.infer<typeof registerCustomerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
