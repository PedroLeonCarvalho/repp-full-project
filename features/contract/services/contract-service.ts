import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts } from "@/db/schema/contracts";
import { concerts } from "@/db/schema/concerts";
import { contractors } from "@/db/schema/contractors";
import { customers } from "@/db/schema/customers";
import { projects } from "@/db/schema/projects";
import type {
  Contract,
  GenerateContractInput,
  UpdateContractInput,
} from "../types";
import {
  generateContractSchema,
  updateContractSchema,
} from "../schemas/contract-schema";
import { generateStandardContractText } from "../templates/contract-template";

export class ContractServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "ContractServiceError";
  }
}

export async function getContractByConcertId(
  concertId: string,
  customerId: string
): Promise<Contract | null> {
  const [row] = await db
    .select({
      id: contracts.id,
      customerId: contracts.customerId,
      concertId: contracts.concertId,
      contractorId: contracts.contractorId,
      mealsIncluded: contracts.mealsIncluded,
      maximumConsumptionAmount: contracts.maximumConsumptionAmount,
      agreedFee: contracts.agreedFee,
      contractText: contracts.contractText,
      status: contracts.status,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      contractor: contractors,
    })
    .from(contracts)
    .leftJoin(contractors, eq(contractors.id, contracts.contractorId))
    .where(
      and(
        eq(contracts.concertId, concertId),
        eq(contracts.customerId, customerId)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    customerId: row.customerId,
    concertId: row.concertId,
    contractorId: row.contractorId,
    mealsIncluded: row.mealsIncluded,
    maximumConsumptionAmount: row.maximumConsumptionAmount
      ? parseFloat(row.maximumConsumptionAmount)
      : null,
    agreedFee: row.agreedFee ? parseFloat(row.agreedFee) : null,
    contractText: row.contractText,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contractor: row.contractor,
  };
}

export async function generateOrUpdateContract(
  input: GenerateContractInput,
  customerId: string
): Promise<Contract> {
  const validated = generateContractSchema.parse(input);

  // 1. Fetch concert & customer & contractor & project
  const [concertRow] = await db
    .select({
      concert: concerts,
      customer: customers,
      project: projects,
    })
    .from(concerts)
    .innerJoin(customers, eq(customers.id, concerts.customerId))
    .innerJoin(projects, eq(projects.id, concerts.projectId))
    .where(
      and(
        eq(concerts.id, validated.concertId),
        eq(concerts.customerId, customerId)
      )
    )
    .limit(1);

  if (!concertRow) {
    throw new ContractServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const effectiveContractorId =
    validated.contractorId || concertRow.concert.contractorId;

  let contractorData = null;
  if (effectiveContractorId) {
    const [c] = await db
      .select()
      .from(contractors)
      .where(
        and(
          eq(contractors.id, effectiveContractorId),
          eq(contractors.customerId, customerId)
        )
      )
      .limit(1);
    contractorData = c || null;
  }

  const fee =
    validated.agreedFee !== undefined && validated.agreedFee !== null
      ? validated.agreedFee
      : concertRow.concert.agreedFee
      ? parseFloat(concertRow.concert.agreedFee)
      : null;

  // 2. Generate standard contract text
  const contractText = generateStandardContractText({
    artist: {
      fullName: concertRow.customer.fullName,
      stageName: concertRow.customer.stageName,
      email: concertRow.customer.email,
      cpf: concertRow.customer.cpf,
      phone: concertRow.customer.phone,
    },
    concert: {
      ...concertRow.concert,
      durationInHours: concertRow.concert.durationInHours
        ? parseFloat(concertRow.concert.durationInHours)
        : null,
      agreedFee: concertRow.concert.agreedFee
        ? parseFloat(concertRow.concert.agreedFee)
        : null,
      travelCost: concertRow.concert.travelCost
        ? parseFloat(concertRow.concert.travelCost)
        : null,
    },
    contractor: contractorData,
    projectName: concertRow.project.name,
    mealsIncluded: validated.mealsIncluded,
    maximumConsumptionAmount: validated.maximumConsumptionAmount,
    agreedFee: fee,
    additionalClauses: validated.additionalClauses,
  });

  // 3. Upsert contract
  const [existing] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(
      and(
        eq(contracts.concertId, validated.concertId),
        eq(contracts.customerId, customerId)
      )
    )
    .limit(1);

  let result;
  if (existing) {
    const [updated] = await db
      .update(contracts)
      .set({
        contractorId: effectiveContractorId || null,
        mealsIncluded: validated.mealsIncluded,
        maximumConsumptionAmount: validated.maximumConsumptionAmount
          ? String(validated.maximumConsumptionAmount)
          : null,
        agreedFee: fee !== null ? String(fee) : null,
        contractText,
        status: "GENERATED",
      })
      .where(eq(contracts.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(contracts)
      .values({
        customerId,
        concertId: validated.concertId,
        contractorId: effectiveContractorId || null,
        mealsIncluded: validated.mealsIncluded,
        maximumConsumptionAmount: validated.maximumConsumptionAmount
          ? String(validated.maximumConsumptionAmount)
          : null,
        agreedFee: fee !== null ? String(fee) : null,
        contractText,
        status: "GENERATED",
      })
      .returning();
    result = created;
  }

  // Also sync contractorId back to concert if changed
  if (effectiveContractorId && effectiveContractorId !== concertRow.concert.contractorId) {
    await db
      .update(concerts)
      .set({ contractorId: effectiveContractorId })
      .where(eq(concerts.id, validated.concertId));
  }

  return {
    id: result.id,
    customerId: result.customerId,
    concertId: result.concertId,
    contractorId: result.contractorId,
    mealsIncluded: result.mealsIncluded,
    maximumConsumptionAmount: result.maximumConsumptionAmount
      ? parseFloat(result.maximumConsumptionAmount)
      : null,
    agreedFee: result.agreedFee ? parseFloat(result.agreedFee) : null,
    contractText: result.contractText,
    status: result.status,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    contractor: contractorData,
  };
}

export async function updateContract(
  id: string,
  input: UpdateContractInput,
  customerId: string
): Promise<Contract> {
  const validated = updateContractSchema.parse(input);

  const [existing] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ContractServiceError(
      "Contrato não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const [updated] = await db
    .update(contracts)
    .set({
      contractText: validated.contractText,
      mealsIncluded: validated.mealsIncluded ?? existing.mealsIncluded,
      maximumConsumptionAmount:
        validated.maximumConsumptionAmount !== undefined
          ? validated.maximumConsumptionAmount
            ? String(validated.maximumConsumptionAmount)
            : null
          : existing.maximumConsumptionAmount,
      agreedFee:
        validated.agreedFee !== undefined
          ? validated.agreedFee
            ? String(validated.agreedFee)
            : null
          : existing.agreedFee,
      status: validated.status ?? existing.status,
    })
    .where(eq(contracts.id, id))
    .returning();

  return {
    id: updated.id,
    customerId: updated.customerId,
    concertId: updated.concertId,
    contractorId: updated.contractorId,
    mealsIncluded: updated.mealsIncluded,
    maximumConsumptionAmount: updated.maximumConsumptionAmount
      ? parseFloat(updated.maximumConsumptionAmount)
      : null,
    agreedFee: updated.agreedFee ? parseFloat(updated.agreedFee) : null,
    contractText: updated.contractText,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
