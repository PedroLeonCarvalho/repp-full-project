export interface Contractor {
  id: string;
  customerId: string;
  contactPersonName: string;
  establishmentOrEventName: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractorInput {
  contactPersonName: string;
  establishmentOrEventName?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface UpdateContractorInput {
  contactPersonName?: string;
  establishmentOrEventName?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
}
