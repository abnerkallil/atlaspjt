// APA-10: só a parte pura do OCR (decisão de estratégia por mimeType) é
// testável com função pura + node --test. O OCR em si (Tesseract.js WASM,
// Worker, download dos dados do idioma) roda só no navegador — convenção do
// repo (ver docs/APACHE.md: "onde não dá pra testar com função pura +
// node --test, o aceite é verificação manual no navegador").
import assert from "node:assert/strict";
import test from "node:test";
import { ApacheError } from "../lib/apache/errors.js";
import { MAX_OCR_FILE_BYTES, ocrFile, pickOcrStrategy } from "../lib/apache/ocr.js";

void test("APA-10: imagem é roteada para a estratégia 'image'", () => {
  assert.equal(pickOcrStrategy("image/png"), "image");
  assert.equal(pickOcrStrategy("image/jpeg"), "image");
});

void test("APA-10: application/pdf é roteado para a estratégia 'pdf'", () => {
  assert.equal(pickOcrStrategy("application/pdf"), "pdf");
});

void test("APA-10: mimeType que não é imagem nem PDF é rejeitado com 400", () => {
  assert.throws(
    () => pickOcrStrategy("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    (error: unknown) => error instanceof ApacheError && error.status === 400,
  );
});

void test("APA-10 (DEC-020 item 8): mensagem de mimeType inválido nunca ecoa o valor enviado pelo usuário", () => {
  const mimeTypeMalicioso = "<script>alert(1)</script>";
  assert.throws(
    () => pickOcrStrategy(mimeTypeMalicioso),
    (error: unknown) => error instanceof ApacheError && !error.message.includes(mimeTypeMalicioso),
  );
});

void test("APA-10 (DEC-020 item 2): arquivo maior que 10 MB é rejeitado antes de qualquer OCR", async () => {
  const file = { bytes: new ArrayBuffer(MAX_OCR_FILE_BYTES + 1), mimeType: "image/png" };
  await assert.rejects(
    ocrFile(file),
    (error: unknown) => error instanceof ApacheError && error.status === 413,
  );
});
