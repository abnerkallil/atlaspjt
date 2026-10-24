// APA-18 (fix operacional): scripts/apache-accept-vision-license.ts tratava
// a confirmação de aceite da licença (Cloudflare lança uma "rejeição" com
// código 5016, cuja mensagem já é "Thank you for agreeing...") como falha e
// saía com exit 1. Esse teste cobre a função pura que decide isso, extraída
// para lib/apache/vision-license.ts.
import assert from 'node:assert/strict';
import test from 'node:test';
import { isVisionLicenseAcceptedError, VISION_LICENSE_ACCEPTED_CODE } from '../lib/apache/vision-license.js';

void test('reconhece o erro com code 5016 (número) como aceite, não falha', () => {
  assert.equal(isVisionLicenseAcceptedError({ code: VISION_LICENSE_ACCEPTED_CODE }), true);
});

void test('reconhece o erro com code "5016" (string) como aceite', () => {
  assert.equal(isVisionLicenseAcceptedError({ code: '5016' }), true);
});

void test('reconhece um Error cuja mensagem cita o código 5016', () => {
  const error = new Error('5016: Thank you for agreeing to the usage terms of this model.');
  assert.equal(isVisionLicenseAcceptedError(error), true);
});

void test('não trata qualquer erro como aceite -- só quando o código 5016 aparece', () => {
  assert.equal(isVisionLicenseAcceptedError(new Error('network timeout')), false);
  assert.equal(isVisionLicenseAcceptedError({ code: 5017 }), false);
  assert.equal(isVisionLicenseAcceptedError(null), false);
});
