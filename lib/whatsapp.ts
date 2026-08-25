/**
 * WhatsApp integration utility
 */

/**
 * Clean phone number into international format digits (e.g. 5511999999999)
 */
export function formatPhoneNumberForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove all non-numeric chars
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // If standard Brazilian number without country code (10 or 11 digits), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Generate a wa.me URL with pre-filled message
 */
export function generateWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const formattedPhone = formatPhoneNumberForWhatsApp(phone);
  if (!formattedPhone) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Default message generator for Contractor outreach
 */
export function getContractorWhatsAppMessage(options: {
  contactName: string;
  artistStageName: string;
  establishmentName?: string | null;
}): string {
  const { contactName, artistStageName, establishmentName } = options;
  const placeContext = establishmentName ? ` para o ${establishmentName}` : "";

  return `Olá, ${contactName}, tudo bem? Aqui é ${artistStageName}! Estou com a agenda de shows aberta e um repertório especial preparado${placeContext}. Gostaria de alinhar novas datas de apresentações com você. Como estão os eventos por aí?`;
}

/**
 * Default message generator for Musician coordination
 */
export function getMusicianWhatsAppMessage(options: {
  musicianName: string;
  artistStageName: string;
  concertTitle?: string;
  concertDate?: string;
}): string {
  const { musicianName, artistStageName, concertTitle, concertDate } = options;

  if (concertTitle && concertDate) {
    return `Fala ${musicianName}, tudo bem? Aqui é ${artistStageName}! Teremos uma apresentação: "${concertTitle}" no dia ${concertDate}. Gostaria de confirmar sua participação conosco!`;
  }

  return `Fala ${musicianName}, tudo bem? Aqui é ${artistStageName}! Passando para trocar uma ideia sobre os nossos próximos ensaios e apresentações.`;
}
