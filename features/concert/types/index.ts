import type { Music } from "@/features/music/types";
import type { ConcertMusician } from "@/features/musician/types";
import { PAYMENT_STATUSES } from "@/db/schema/enums";

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Concert {
  id: string;
  projectId: string;
  customerId: string;
  contractorId: string | null;
  title: string;
  location: string | null;
  presentationDate: Date;
  startTime: string | null;
  finishTime: string | null;
  durationInHours: number | null;
  totalBreakTime: number | null;
  agreedFee: number | null;
  travelCost: number | null;
  paymentStatus: PaymentStatus;
  note: string | null;
  shareToken?: string | null;
  isShareEnabled: boolean;
  originalConcertId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetlistItem {
  id: string;
  concertId: string;
  musicId: string;
  position: number;
  note: string | null;
  createdAt: Date;
  music?: Music;
}

export interface PublicSharedMusic {
  id: string;
  title: string;
  artist: string;
  preferredKey: string | null;
  originalKey: string | null;
  lyrics: string | null;
  chords: string | null;
  spotifyLink: string | null;
}

export interface PublicSharedSetlistItem {
  id: string;
  position: number;
  note: string | null;
  music: PublicSharedMusic;
}

export interface PublicSharedConcert {
  id: string;
  title: string;
  projectName: string;
  location: string | null;
  presentationDate: Date | string;
  startTime: string | null;
  finishTime: string | null;
  durationInHours: number | null;
  totalBreakTime: number | null;
  note: string | null;
  setlist: PublicSharedSetlistItem[];
  setlistCount: number;
}

export interface ConcertWithSetlist extends Concert {
  setlist: SetlistItem[];
  setlistCount: number;
  projectName?: string;
  contractorName?: string | null;
  musicians?: ConcertMusician[];
}

export interface ConcertMusicianInput {
  musicianId: string;
  agreedFee?: number | null;
}

export interface CreateConcertInput {
  projectId: string;
  contractorId?: string | null;
  title: string;
  location?: string | null;
  presentationDate: string | Date;
  startTime?: string | null;
  finishTime?: string | null;
  durationInHours?: number | null;
  totalBreakTime?: number | null;
  agreedFee?: number | null;
  travelCost?: number | null;
  paymentStatus?: PaymentStatus;
  note?: string | null;
  musicians?: ConcertMusicianInput[];
}

export interface UpdateConcertInput {
  contractorId?: string | null;
  title?: string;
  location?: string | null;
  presentationDate?: string | Date;
  startTime?: string | null;
  finishTime?: string | null;
  durationInHours?: number | null;
  totalBreakTime?: number | null;
  agreedFee?: number | null;
  travelCost?: number | null;
  paymentStatus?: PaymentStatus;
  note?: string | null;
  musicians?: ConcertMusicianInput[];
}

