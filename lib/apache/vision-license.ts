// APA-16 (operacional): `scripts/apache-accept-vision-license.ts` chama
// `AI.run(MODEL_ID, { prompt: 'agree' })` para aceitar a licença do modelo
// gated de visão. A Cloudflare confirmou (thread 2026-10-23, Abner rodou o
// comando real): essa chamada responde com uma rejeição cujo código é 5016 e
// cuja mensagem é a confirmação do aceite ("Thank you for agreeing to the
// usage terms..."), não um erro de fato — é assim que o endpoint sinaliza
// sucesso nesse caso específico (gated model). Extraído como função pura
// para o script poder tratar esse caso como sucesso sem depender de um
// binding AI real, e para ser testável sem rede.
export const VISION_LICENSE_ACCEPTED_CODE = 5016;

export function isVisionLicenseAcceptedError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  if (code === VISION_LICENSE_ACCEPTED_CODE || code === String(VISION_LICENSE_ACCEPTED_CODE)) {
    return true;
  }
  const text =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();
  return text.includes(String(VISION_LICENSE_ACCEPTED_CODE));
}
