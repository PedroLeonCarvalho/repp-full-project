"use server";

import { revalidatePath } from "next/cache";
import { requireAuthCustomerId } from "@/features/auth/services/auth-service";
import {
  generateOrUpdateContract,
  getContractByConcertId,
  updateContract,
  ContractServiceError,
} from "../services/contract-service";
import type {
  Contract,
  GenerateContractInput,
  UpdateContractInput,
} from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getContractByConcertIdAction(
  concertId: string
): Promise<ActionResult<Contract | null>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await getContractByConcertId(concertId, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro ao buscar contrato." };
  }
}

export async function generateContractAction(
  input: GenerateContractInput
): Promise<ActionResult<Contract>> {
  try {
    const customerId = await requireAuthCustomerId();
    const created = await generateOrUpdateContract(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof ContractServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro ao gerar contrato." };
  }
}

export async function updateContractAction(
  id: string,
  input: UpdateContractInput
): Promise<ActionResult<Contract>> {
  try {
    const customerId = await requireAuthCustomerId();
    const updated = await updateContract(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof ContractServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro ao salvar contrato." };
  }
}
