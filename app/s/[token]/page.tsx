import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSharedConcertByToken } from "@/features/concert/services/concert-service";
import { PublicSharedSetlistView } from "@/features/concert/components/public-shared-setlist-view";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const concert = await getSharedConcertByToken(token);

  if (!concert) {
    return {
      title: "Setlist não encontrado | REPP",
    };
  }

  return {
    title: `${concert.title} — Setlist | REPP`,
    description: `Repertório e apresentação do projeto ${concert.projectName}. Acesse o setlist e letras das músicas.`,
  };
}

export default async function SharedSetlistPage({ params }: PageProps) {
  const { token } = await params;
  const concert = await getSharedConcertByToken(token);

  if (!concert) {
    notFound();
  }

  return <PublicSharedSetlistView concert={concert} />;
}
