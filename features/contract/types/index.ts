import type { Contractor } from "@/features/contractor/types";

export interface Contract {
  id: string;
  customerId: string;
  concertId: string;
  contractorId: string | null;
  mealsIncluded: boolean;
  maximumConsumptionAmount: number | null;
  agreedFee: number | null;
  contractText: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contractor?: Contractor | null;
}

export interface GenerateContractInput {
  concertId: string;
  contractorId?: string | null;
  mealsIncluded?: boolean;
  maximumConsumptionAmount?: number | null;
  agreedFee?: number | null;
  additionalClauses?: string | null;
}

export interface UpdateContractInput {
  contractText: string;
  mealsIncluded?: boolean;
  maximumConsumptionAmount?: number | null;
  agreedFee?: number | null;
  status?: string;
}
