import type { Concert } from "@/features/concert/types";
import type { Contractor } from "@/features/contractor/types";
import { formatConcertDate } from "@/lib/date-utils";

export interface ContractArtistData {
  fullName: string;
  stageName?: string | null;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ContractTemplateData {
  artist: ContractArtistData;
  concert: Concert;
  contractor?: Contractor | null;
  projectName?: string;
  mealsIncluded?: boolean;
  maximumConsumptionAmount?: number | null;
  agreedFee?: number | null;
  additionalClauses?: string | null;
}



export function generateStandardContractText(data: ContractTemplateData): string {
  const {
    artist,
    concert,
    contractor,
    projectName,
    mealsIncluded = false,
    maximumConsumptionAmount,
    agreedFee = concert.agreedFee,
    additionalClauses,
  } = data;

  const formattedDate = formatConcertDate(concert.presentationDate);

  const artistName = artist.fullName;
  const stageName = artist.stageName || artist.fullName;
  const artistDoc = artist.cpf ? `inscrito(a) no CPF sob o nº ${artist.cpf}` : "representante artístico(a)";
  const artistContact = artist.phone ? `telefone: ${artist.phone}` : "";

  const contractorName = contractor?.contactPersonName || "CONTRATANTE NÃO INFORMADO";
  const establishment = contractor?.establishmentOrEventName
    ? ` (${contractor.establishmentOrEventName})`
    : "";
  const contractorDoc = contractor?.documentNumber
    ? `, documento nº ${contractor.documentNumber}`
    : "";
  const contractorAddress = contractor?.address ? `, com endereço em ${contractor.address}` : "";
  const contractorContact = contractor?.phone ? `, telefone: ${contractor.phone}` : "";

  const concertLocation = concert.location || contractor?.address || "Local a definir";
  const concertStartTime = concert.startTime || "Horário a combinar";
  const concertFinishTime = concert.finishTime ? ` às ${concert.finishTime}` : "";
  const concertDuration = concert.durationInHours ? ` com duração aproximada de ${concert.durationInHours}h` : "";
  const concertBreaks = concert.totalBreakTime ? ` e intervalo de ${concert.totalBreakTime} minutos` : "";

  const feeFormatted =
    agreedFee !== null && agreedFee !== undefined
      ? `R$ ${Number(agreedFee).toFixed(2)}`
      : "A combinar";

  const mealsClause = mealsIncluded
    ? `O CONTRATANTE fornecerá alimentação e bebidas para a equipe artística durante o evento${
        maximumConsumptionAmount
          ? `, com limite de consumação estipulado em R$ ${Number(maximumConsumptionAmount).toFixed(2)}`
          : ""
      }.`
    : "Alimentação e consumação não inclusas, salvo acordo prévio entre as partes.";

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS

Pelo presente instrumento particular, de um lado:

CONTRATANTE: ${contractorName}${establishment}${contractorDoc}${contractorAddress}${contractorContact}.

CONTRATADA: ${artistName} (Nome Artístico: ${stageName}), ${artistDoc}, ${artistContact}.

Têm, entre si, justo e contratado o quanto segue:

CLÁUSULA 1ª — DO OBJETO E APRESENTAÇÃO
A CONTRATADA compromete-se a realizar a apresentação musical artística ("${concert.title}" — Projeto ${projectName || stageName}), no seguinte formato e local:
• Data: ${formattedDate}
• Horário: A partir das ${concertStartTime}${concertFinishTime}${concertDuration}${concertBreaks}
• Local da Apresentação: ${concertLocation}

CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO
Pela prestação dos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de ${feeFormatted}, a ser quitado integralmente até a finalização da apresentação musical.
${mealsClause}

CLÁUSULA 3ª — DA SONORIZAÇÃO, EQUIPAMENTOS E AUXÍLIO NO TRANSPORTE
I. O CONTRATANTE ficará responsável pela disponibilização de espaço adequado, ponto de energia estável e infraestrutura de sonorização e amplificação no local da apresentação.
II. O CONTRATANTE prestará auxílio à CONTRATADA no transporte das caixas de som e pedestais do veículo até o local exato da apresentação na chegada e na saída do evento, tratando-se de atividade leve referente a 2 (duas) a 3 (três) caixas de som de aproximadamente 10 kg cada e 2 (dois) pedestais.

CLÁUSULA 4ª — DO CANCELAMENTO
Em caso de cancelamento injustificado por qualquer das partes com menos de 48 (quarenta e oito) horas de antecedência, a parte que der causa arcará com multa rescisória de 30% (trinta por cento) do cachê acordado, ressalvados motivos de força maior ou caso fortuito.
${additionalClauses ? `\nCLÁUSULA 5ª — DISPOSIÇÕES ESPECÍFICAS\n${additionalClauses}\n` : ""}
E, por estarem justos e contratados, firmam o presente instrumento.

Local e Data: ${concertLocation.split("-")[0].trim() || "Local"}, ${formattedDate}.


_____________________________________________
CONTRATANTE: ${contractorName}


_____________________________________________
CONTRATADA: ${artistName} (${stageName})
`;
}
