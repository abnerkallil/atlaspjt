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
