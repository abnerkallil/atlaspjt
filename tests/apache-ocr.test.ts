// APA-10: só a parte pura do OCR (decisão de estratégia por mimeType) é
// testável com função pura + node --test. O OCR em si (Tesseract.js WASM,
// Worker, download dos dados do idioma) roda só no navegador — convenção do
// repo (ver docs/APACHE.md: "onde não dá pra testar com função pura +
// node --test, o aceite é verificação manual no navegador").
import assert from "node:assert/strict";
import test from "node:test";
import { ApacheError } from "../lib/apache/errors.js";
import { pickOcrStrategy } from "../lib/apache/ocr.js";

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
