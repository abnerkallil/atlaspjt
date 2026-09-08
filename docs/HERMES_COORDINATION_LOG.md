# Atlas — Log de coordenação Codex ↔ Hermes

## Política permanente

Cada conversa com o Hermes deve gerar uma entrada cronológica com:

1. data e ID da sessão;
2. objetivo da conversa;
3. prompt técnico sanitizado enviado;
4. resposta integral do Hermes ou referência verificável à exportação local; em caso de falha, registrar a falha de transporte;
5. decisão, divergência ou ação resultante;
6. referência ao artefato de exportação local, quando existir.

Nunca registrar ou enviar ao provedor nomes pessoais, usernames, caminhos absolutos, credenciais, chaves, tokens, cookies, conteúdo real de notas, identificadores de hospedagem/conta, dados de clientes ou informações alheias ao Atlas.

Prompts internos do runtime, raciocínio privado do modelo e banners do terminal não fazem parte da conversa e ficam fora do log. Caso o runtime injete metadados locais automaticamente, a limitação deve ser informada ao usuário.

## Eficiência e baixo consumo

- Meta padrão de guias visíveis abertas automaticamente: **zero**.
- Não abrir preview do Atlas ou navegador sem pedido explícito do usuário.
- Preferir verificações por build, testes direcionados, typecheck e requisição HTTP não visual.
- Agrupar leituras independentes, evitar consultas repetidas sem mudança e encerrar processos retidos após a validação.
- Consultar o Hermes somente em fronteiras de decisão ou revisão, com prompts sanitizados e concisos.
- Em cada gate, registrar: guias visíveis abertas, sessões Hermes realizadas, validações reutilizadas e processos que permaneceram ativos.
- Eficiência não autoriza reduzir cobertura essencial, segurança ou correção.

## Histórico anterior ao Gate 1

| Sessão                   | Objetivo                                     | Resposta/resultado                         |
| ------------------------ | -------------------------------------------- | ------------------------------------------ |
| `20260907_163257_31e396` | Confirmar conexão com o perfil Atlas         | `HERMES_ATLAS_CONECTADO`                   |
| `20260907_165041_b37d3f` | Revisão adversarial da arquitetura candidata | Alterações e critérios de aceite propostos |
| `20260907_165627_df4b0e` | Rodada 2 completa                            | Sem resposta por falha de transporte       |
| `20260907_165838_a777d8` | Retomar a rodada 2                           | Hermes recusou inventar o contexto ausente |
| `20260907_170014_ec3c87` | Reenvio autocontido da rodada 2A             | Sem resposta por falha de transporte       |
| `20260907_170155_c4d40d` | Verificar bloco 2A                           | `ACCEPT`                                   |
| `20260907_170400_9538b1` | Verificar bloco 2B                           | `ACCEPT`                                   |
| `20260907_170532_924e1a` | Consolidar consenso                          | `READY_FOR_USER_APPROVAL: YES`             |
| `20260907_170719_05400f` | Corrigir o mapeamento DEC-NOTES              | `ACK_MAP`                                  |

As exportações integrais e verificáveis dessas sessões permanecem no armazenamento local do perfil Hermes. Nenhum conteúdo pessoal deve ser copiado daqui para uma nova conversa com o modelo.

## Gate 1

### 2026-09-07 — Revisão técnica do spike

- Sessão: `20260907_180544_4477d1`
- Objetivo: verificar contradições com as decisões, o baseline global de lint, o tamanho observado do bundle e eventuais testes bloqueadores.
- Prompt enviado: resumo técnico sanitizado do escopo, implementação e validações do Gate 1; proibição explícita de ferramentas, código, Gate 2 e solicitação de dados pessoais.
- Síntese fiel (resposta original preservada na exportação local):

> **FINDINGS**  
> Nenhuma contradição bloqueadora com DEC-NOTES-01 a DEC-NOTES-11 foi identificada. O lint direcionado, o typecheck, o build e os testes focados são suficientes para o spike; as falhas globais preexistentes não bloqueiam o Gate 1 quando registradas como intocadas. O chunk JS de 403.065 bytes e o CSS de 2.808 bytes são dados para otimização no Gate 2, pois nenhum limite havia sido congelado. Nenhum teste adicional foi considerado bloqueador.  
> **REQUIRED_FIXES**  
> Nenhum. Registrar o baseline global de lint como intocado e carregar a observação do bundle para o Gate 2 sem inventar limite.  
> **GATE_1_VERDICT: PASS**  
> **GATE_2_STATUS: NOT_AUTHORIZED**

- Resultado: parecer favorável ao Gate 1. Codex adicionou ainda uma fixture direta para demonstrar que texto com aparência de HTML permanece texto literal na conversão de colagem.
- Exportação local verificável: `20260907_180544_4477d1-review-atlas-notes-gate-1.md`.
- SHA-256 do arquivo exportado completo: `2e8871bcb519ac3add623c38590be4eedf60e531fb2ccc507ebd590e3ab52d0a`.
- SHA-256 do corpo útil da resposta: `3bfb523777ba3aad44618554a5b20a5b694f620775a2b6306927ccd29307b9c4`.

## Gate 2

### 2026-09-08 — Preflight da integração de produção

- Sessão: `20260908_083518_0864da`.
- Objetivo: verificar se o plano de integração aprovado contradizia alguma DEC-NOTES-01 a DEC-NOTES-11.
- Prompt enviado: decisões autoritativas e plano técnico sanitizados; sem caminhos, dados pessoais, credenciais, conteúdo real de notas ou ferramentas.
- Resposta:

> **ACCEPT_PLAN** — Nenhuma contradição bloqueadora com DEC-NOTES-01 a DEC-NOTES-11. Como cuidados não bloqueadores, o Hermes reforçou a aplicação de todos os limites no servidor, as versões e dependências congeladas, a projeção LF determinística e as proteções contra downgrade e conflito de `operationId`.
> **GATE_2_PREFLIGHT: PASS**

- Resultado: integração autorizada a prosseguir no branch isolado, sem merge, backfill ou deploy.
- Exportação local verificável: `20260908_083518_0864da-atlas-notes-decision-only-preflight.md`.
- SHA-256 do arquivo exportado completo: `cec147defe79f833cb0526fc1e437daf72be5a0ee74690ff66d1a16aa3c9f6f2`.
- Uso informado pelo Hermes: 1 chamada; 7.708 tokens de entrada, 1.370 de saída, 1.128 de raciocínio, 9.078 no total; custo estimado informado como US$ 0,00 com status de custo desconhecido.
- Eficiência: nenhuma guia visível aberta. A primeira tentativa foi cancelada antes da inferência pela confirmação do modo Contributor e não gerou conversa; apenas a chamada concluída foi contabilizada.

### 2026-09-08 — Revisão final sem resposta por limite do provedor

- Sessão: `20260908_090402_bde228`.
- Objetivo: revisão independente final do registro técnico já validado localmente.
- Prompt enviado: síntese sanitizada das decisões, implementação e evidências; sem caminhos, dados pessoais, credenciais ou conteúdo real.
- Resposta: não houve. O provedor retornou HTTP 429 (`rate_limit_exceeded`) após três tentativas automáticas do cliente.
- Resultado: nenhum parecer foi atribuído ao Hermes e nenhuma nova tentativa foi feita, em respeito à política de baixo consumo.
- Exportação local verificável: `20260908_090402_bde228-you-are-an-independent-atlas-notes-gate-2.md`.
- SHA-256 do arquivo exportado completo: `127718cdd11ac29979c1878306d10347b6dc08464d551dd6343a849fb4853438`.
- Uso informado: uma chamada lógica marcada como falha; tokens e custo indisponíveis.

### 2026-09-08 — Teste do modelo alterado pelo usuário

- Sessão: `20260908_091037_6e569a`.
- Objetivo: verificar a conectividade do novo modelo com uma resposta fixa e sem ferramentas.
- Prompt enviado: teste sanitizado solicitando apenas `HERMES_GATE2_CONNECTED`.
- Resposta: `HERMES_GATE2_CONNECTED`.
- Diagnóstico local: o perfil `atlas-agent` ainda apontava para `prism-ml/bonsai-27b` via LM Studio. A resposta foi concluída com atraso de aproximadamente 4 minutos e 48 segundos; por isso, a primeira exportação feita durante o processamento ainda continha somente a mensagem do solicitante.
- Resultado: conectividade local confirmada, mas o usuário esclareceu em seguida que o Bonsai não deveria ser usado na coordenação; esta resposta não foi considerada parecer do Gate 2.
- Exportação local verificável: `20260908_091037_6e569a-sanitized-atlas-connectivity-test.-do-not-use.md`.
- SHA-256 do arquivo exportado completo: `5459ca2c509091044d3f78684d00a9c515fe7ad0520ddb90d9dbb133e17dd79b`.
- SHA-256 do corpo útil da resposta: `d51a2f1ea6a78378757ac1e4f0d93ca89e98023025baa18071baa866f8da4693`.
- Uso informado: 1 chamada; 6.314 tokens de entrada, 87 de saída, 79 de raciocínio, 6.401 no total; custo estimado informado como US$ 0,00.
- Eficiência: nenhuma guia visível aberta.

### 2026-09-08 — Chamada Bonsai interrompida após correção do usuário

- Sessão: `20260908_091925_e12b46`.
- Objetivo original: revisão final do Gate 2.
- Prompt enviado: síntese técnica sanitizada, sem dados pessoais ou ferramentas.
- Resposta: não houve. Ao usuário esclarecer que o modelo deveria ser Muse Spark, os três processos associados à chamada Bonsai foram identificados e encerrados; os serviços gerais do Hermes permaneceram ativos.
- Resultado: sessão cancelada e excluída da avaliação técnica do Gate 2.
- Exportação local verificável: `20260908_091925_e12b46-you-are-hermes-final-technical-reviewer-for.md`.
- SHA-256 do arquivo exportado completo: `0aeaeae1987cba591479b2a8ce718e148e3dc4905524b8e7dcf346dc3d6f8d37`.
- Uso: arquivo de métricas não produzido; custo e tokens indisponíveis.

### 2026-09-08 — Veredito final no Muse Spark

- Sessão: `20260908_092330_d10924`.
- Modelo/provedor: `muse-spark-1.3-contributor-free` via `opencode-free`, selecionado explicitamente para esta chamada.
- Objetivo: revisar a integração concluída contra as decisões e evidências do Gate 2.
- Prompt enviado: contrato, implementação e validações sanitizados; sem caminhos, dados pessoais, credenciais, conteúdo real ou ferramentas.
- Resposta integral:

> No implementation-blocking contradiction found. Canonical versioned JSON with derived LF body, NULL legacy until explicit save, body-based search/sync, plaintext P0 paste, unsupported rejection, downgrade and cross-note operationId protection, same-note replay first-write-wins, read-time revalidation, and client-only P0 editor scope all match contract. Guards enforce rejection without truncation. 18 tests plus lint, typecheck, frozen install, five-stage build, disposable D1 migrations, and structured API integration cover required paths.
>
> **ACCEPT_IMPLEMENTATION**
> **GATE_2_VERDICT: PASS**

- Resultado: nenhuma contradição ou teste bloqueador; Gate 2 aprovado pelo Hermes.
- Exportação local verificável: `20260908_092330_d10924-session.md`.
- SHA-256 do arquivo exportado completo: `03d390ffe4e35623c31eb4e5da88fa1455c124b1cfb06fd0cdeb209a10c1b4bb`.
- Uso informado: 1 chamada; 7.527 tokens de entrada, 1.472 de saída, 1.282 de raciocínio, 8.999 no total; custo estimado informado como US$ 0,00.
- Eficiência: nenhuma guia visível aberta; nenhuma nova consulta necessária neste gate.
