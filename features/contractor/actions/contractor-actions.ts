"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedCustomer, requireAuthCustomerId } from "@/features/auth/services/auth-service";
import {
  createContractor,
  deleteContractor,
  getContractorById,
  listContractors,
  updateContractor,
  ContractorServiceError,
} from "../services/contractor-service";
import type {
  Contractor,
  CreateContractorInput,
  UpdateContractorInput,
} from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createContractorAction(
  input: CreateContractorInput
): Promise<ActionResult<Contractor>> {
  try {
    const customerId = await requireAuthCustomerId();
    const created = await createContractor(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof ContractorServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao cadastrar contratante." };
  }
}

export async function updateContractorAction(
  id: string,
  input: UpdateContractorInput
): Promise<ActionResult<Contractor>> {
  try {
    const customerId = await requireAuthCustomerId();
    const updated = await updateContractor(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof ContractorServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar contratante." };
  }
}

export async function deleteContractorAction(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await deleteContractor(id, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ContractorServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao excluir contratante." };
  }
}

export async function listContractorsAction(): Promise<ActionResult<Contractor[]>> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listContractors(customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar contratantes." };
  }
}

export async function getContractorByIdAction(
  id: string
): Promise<ActionResult<Contractor | null>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await getContractorById(id, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar contratante." };
  }
}

export async function getCustomerStageNameAction(): Promise<string> {
  const customer = await getAuthenticatedCustomer();
  return customer?.stageName || customer?.fullName || "Artista";
}
