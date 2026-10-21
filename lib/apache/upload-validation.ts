// APA-12 (Gate APA-14 item 4): valida o arquivo de enriquecimento antes de
// passar para a ingestão digital (APA-09) -- confere o tipo declarado E os
// magic bytes do próprio arquivo, para um PDF renomeado para .docx (ou
// vice-versa) nunca chegar ao `toMarkdown`. Só PDF/DOCX/XLSX, teto de 10MB
// (mesma decisão do Gate APA-14 usada pelo upload de anexos de nota).
import { ApacheError } from './errors.js';

export const MAX_APACHE_UPLOAD_BYTES = 10 * 1024 * 1024;

// DOCX e XLSX são ambos arquivos ZIP (Office Open XML): o magic byte sozinho
// não distingue um do outro -- só confirma "é um ZIP válido", o próprio
// `mimeType` declarado decide qual dos dois é esperado.
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"
const ZIP_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // "PK\x03\x04"

const MAGIC_BY_MIME_TYPE: Record<string, Uint8Array> = {
  'application/pdf': PDF_MAGIC,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ZIP_MAGIC,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ZIP_MAGIC,
};

function matchesMagic(bytes: ArrayBuffer, magic: Uint8Array): boolean {
  if (bytes.byteLength < magic.length) return false;
  const head = new Uint8Array(bytes.slice(0, magic.length));
  return magic.every((byte, index) => head[index] === byte);
}

// Lança 415 (tipo não suportado/não combina) ou 413 (tamanho). Nunca ecoa
// o mimeType recebido na mensagem (Gate APA-14 item 8).
export function validateApacheUpload(bytes: ArrayBuffer, declaredMimeType: string): void {
  if (bytes.byteLength > MAX_APACHE_UPLOAD_BYTES) {
    throw new ApacheError('Arquivo maior que 10 MB.', 413);
  }
  if (bytes.byteLength === 0) {
    throw new ApacheError('Arquivo vazio.', 400);
  }
  const magic = MAGIC_BY_MIME_TYPE[declaredMimeType];
  if (!magic) {
    throw new ApacheError('Tipo de arquivo não suportado. Envie PDF, DOCX ou XLSX.', 415);
  }
  if (!matchesMagic(bytes, magic)) {
    throw new ApacheError('O conteúdo do arquivo não corresponde ao tipo declarado.', 415);
  }
}
