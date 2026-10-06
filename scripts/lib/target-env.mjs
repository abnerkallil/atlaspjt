// DEC-009: scripts que podem tocar recursos remotos exigem o ambiente de destino
// explícito a cada execução. Não há default: sem `--target`, o script para antes
// de ler ou gravar qualquer coisa. Nada aqui lê `.dev.vars`.
export const TARGETS = ['local', 'production'];

export function requireTarget(value, allowed = TARGETS) {
  if (!value) {
    throw new Error(
      `Informe o ambiente de destino com --target <${allowed.join('|')}>. ` +
        'Não existe ambiente padrão (DEC-009).',
    );
  }
  if (!allowed.includes(value)) {
    throw new Error(`--target "${value}" inválido. Use: ${allowed.join(', ')}.`);
  }
  return value;
}

export function requireOption(values, name, hint) {
  const value = values[name];
  if (!value) throw new Error(`Informe ${hint} com --${name} <valor> (obrigatório, sem default — DEC-009).`);
  return value;
}

// Mensagem curta em vez de stack trace para erros de uso.
export async function runCli(main) {
  try {
    await main();
  } catch (error) {
    console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
