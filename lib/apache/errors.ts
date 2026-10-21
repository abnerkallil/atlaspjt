// Padrão único de erro do Apache (Gate APA-14 item 8): mensagem curta e um
// `status` HTTP, nunca stack trace, caminho de arquivo ou detalhe interno
// exposto ao cliente. Compartilhado por todo lib/apache/*.
export class ApacheError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApacheError";
    this.status = status;
  }
}

// Gate APA-14/DEC-020 item 8: toda rota do Apache responde com este padrão —
// a mensagem de uma ApacheError (já pensada para o cliente) ou, para
// qualquer outro erro, uma mensagem genérica, nunca stack trace ou detalhe
// interno.
export function apacheErrorResponse(error: unknown): Response {
  if (error instanceof ApacheError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Não foi possível concluir a operação do Apache." }, { status: 500 });
}
