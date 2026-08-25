export interface AccompanyingMusician {
  id: string;
  customerId: string;
  name: string;
  instrument: string | null;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMusicianInput {
  name: string;
  instrument?: string | null;
  cpf?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface UpdateMusicianInput {
  name?: string;
  instrument?: string | null;
  cpf?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface ConcertMusician {
  id: string;
  concertId: string;
  musicianId: string;
  agreedFee: number | null;
  createdAt: Date;
  musician?: AccompanyingMusician;
}

export interface AddMusicianToConcertInput {
  concertId: string;
  musicianId: string;
  agreedFee?: number | null;
}
