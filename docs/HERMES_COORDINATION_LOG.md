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
