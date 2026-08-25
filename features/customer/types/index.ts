export interface Customer {
  id: string;
  fullName: string;
  stageName: string;
  email: string;
  passwordHash: string;
  cpf: string | null;
  phone: string | null;
  instagram: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerProfile = Omit<Customer, "passwordHash">;

export interface RegisterCustomerInput {
  fullName: string;
  stageName: string;
  email: string;
  password: string;
  cpf?: string | null;
  phone?: string | null;
  instagram?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionPayload {
  customerId: string;
  email: string;
  stageName: string;
}
