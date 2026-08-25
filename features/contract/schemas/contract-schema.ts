import { z } from "zod";

export const generateContractSchema = z.object({
  concertId: z.string().uuid("ID de apresentação inválido."),
  contractorId: z.string().uuid("ID de contratante inválido.").nullish(),
  mealsIncluded: z.boolean().default(false),
  maximumConsumptionAmount: z
    .number()
    .min(0, "O valor de consumação não pode ser negativo.")
    .nullish(),
  agreedFee: z
    .number()
    .min(0, "O cachê não pode ser negativo.")
    .nullish(),
  additionalClauses: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
});

export const updateContractSchema = z.object({
  contractText: z.string().min(1, "O texto do contrato não pode ficar vazio."),
  mealsIncluded: z.boolean().optional(),
  maximumConsumptionAmount: z.number().min(0).nullish(),
  agreedFee: z.number().min(0).nullish(),
  status: z.string().optional(),
});
