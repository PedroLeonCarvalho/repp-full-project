import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contractors } from "@/db/schema/contractors";
import type {
  Contractor,
  CreateContractorInput,
  UpdateContractorInput,
} from "../types";
import {
  createContractorSchema,
  updateContractorSchema,
} from "../schemas/contractor-schema";

export class ContractorServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "ContractorServiceError";
  }
}

export async function createContractor(
  input: CreateContractorInput,
  customerId: string
): Promise<Contractor> {
  const validated = createContractorSchema.parse(input);

  const [created] = await db
    .insert(contractors)
    .values({
      customerId,
      contactPersonName: validated.contactPersonName,
      establishmentOrEventName: validated.establishmentOrEventName || null,
      documentNumber: validated.documentNumber || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      note: validated.note || null,
    })
    .returning();

  return created;
}

export async function updateContractor(
  id: string,
  input: UpdateContractorInput,
  customerId: string
): Promise<Contractor> {
  const validated = updateContractorSchema.parse(input);

  const [existing] = await db
    .select()
    .from(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ContractorServiceError(
      "Contratante não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const updateData: Partial<typeof contractors.$inferInsert> = {};
  if (validated.contactPersonName !== undefined) {
    updateData.contactPersonName = validated.contactPersonName;
  }
  if (validated.establishmentOrEventName !== undefined) {
    updateData.establishmentOrEventName = validated.establishmentOrEventName || null;
  }
  if (validated.documentNumber !== undefined) {
    updateData.documentNumber = validated.documentNumber || null;
  }
  if (validated.phone !== undefined) {
    updateData.phone = validated.phone || null;
  }
  if (validated.email !== undefined) {
    updateData.email = validated.email || null;
  }
  if (validated.address !== undefined) {
    updateData.address = validated.address || null;
  }
  if (validated.note !== undefined) {
    updateData.note = validated.note || null;
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(contractors)
    .set(updateData)
    .where(and(eq(contractors.id, id), eq(contractors.customerId, customerId)))
    .returning();

  return updated;
}

export async function deleteContractor(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const [existing] = await db
    .select({ id: contractors.id })
    .from(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ContractorServiceError(
      "Contratante não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.customerId, customerId)));

  return { success: true };
}

export async function getContractorById(
  id: string,
  customerId: string
): Promise<Contractor | null> {
  const [contractor] = await db
    .select()
    .from(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.customerId, customerId)))
    .limit(1);

  return contractor || null;
}

export async function listContractors(
  customerId: string
): Promise<Contractor[]> {
  return await db
    .select()
    .from(contractors)
    .where(eq(contractors.customerId, customerId))
    .orderBy(desc(contractors.createdAt));
}
