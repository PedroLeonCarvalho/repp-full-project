"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CustomerProfile, LoginInput, RegisterCustomerInput } from "@/features/customer/types";
import {
  AuthServiceError,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "../services/auth-service";

export type AuthActionResult<T = CustomerProfile> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function registerAction(
  input: RegisterCustomerInput
): Promise<AuthActionResult> {
  try {
    const { customer } = await registerCustomer(input);
    revalidatePath("/");
    return { success: true, data: customer };
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao realizar cadastro." };
  }
}

export async function loginAction(
  input: LoginInput
): Promise<AuthActionResult> {
  try {
    const { customer } = await loginCustomer(input);
    revalidatePath("/");
    return { success: true, data: customer };
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao realizar login." };
  }
}

export async function logoutAction(): Promise<void> {
  await logoutCustomer();
  revalidatePath("/");
  redirect("/login");
}
