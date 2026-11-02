import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export class SheetMusicUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetMusicUploadError";
  }
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const UPLOAD_SUBDIR = path.join("uploads", "sheet-musics");

export async function uploadSheetMusicFile(
  file: File,
  customerId: string
): Promise<{ url: string; fileName: string; size: number }> {
  if (!file) {
    throw new SheetMusicUploadError("Nenhum arquivo enviado.");
  }

  // 1. Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new SheetMusicUploadError(
      "O arquivo excede o tamanho limite permitido de 15MB."
    );
  }

  // 2. Validate MIME type or file extension
  const isPdfMime = file.type === "application/pdf";
  const hasPdfExt = file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !hasPdfExt) {
    throw new SheetMusicUploadError("Apenas arquivos PDF são permitidos.");
  }

  // 3. Read array buffer and verify PDF magic bytes (%PDF)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 4) {
    throw new SheetMusicUploadError("Arquivo inválido ou corrompido.");
  }

  // PDF magic bytes: 0x25 0x50 0x44 0x46 ("%PDF")
  const isPdfMagic =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  if (!isPdfMagic) {
    throw new SheetMusicUploadError(
      "O arquivo fornecido não é um documento PDF válido."
    );
  }

  // 4. Sanitize file name
  const rawBaseName = path.basename(file.name, path.extname(file.name));
  const sanitizedBaseName = rawBaseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);

  const cleanCustomerId = customerId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const timestamp = Date.now();
  const safeFileName = `sheet_${cleanCustomerId}_${timestamp}_${sanitizedBaseName}.pdf`;

  // 5. Ensure directory exists
  const publicDir = path.join(process.cwd(), "public");
  const targetDir = path.join(publicDir, UPLOAD_SUBDIR);
  await mkdir(targetDir, { recursive: true });

  // 6. Write file
  const destinationPath = path.join(targetDir, safeFileName);
  await writeFile(destinationPath, buffer);

  const publicUrl = `/${UPLOAD_SUBDIR.replace(/\\/g, "/")}/${safeFileName}`;

  return {
    url: publicUrl,
    fileName: file.name,
    size: file.size,
  };
}

export async function deleteSheetMusicFile(
  fileUrl: string,
  customerId: string
): Promise<boolean> {
  if (!fileUrl || !fileUrl.startsWith(`/${UPLOAD_SUBDIR.replace(/\\/g, "/")}/`)) {
    return false;
  }

  const fileName = path.basename(fileUrl);
  const cleanCustomerId = customerId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);

  // Security check: only allow deleting files belonging to this customer
  if (!fileName.startsWith(`sheet_${cleanCustomerId}_`)) {
    return false;
  }

  try {
    const fullPath = path.join(process.cwd(), "public", UPLOAD_SUBDIR, fileName);
    await unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}
