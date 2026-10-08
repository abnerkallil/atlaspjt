# Apolo — motor de avaliação determinístico (DEC-014)

Sem IA externa: todo o Apolo é regra fixa, em código, auditável. Cobre a
curadoria de questões (APO-01..08, ver `docs/FONTES.md` e `docs/QUESTOES.md`)
e, a partir daqui, o motor que usa o banco para avaliar o aluno.

## Modelo do aluno (APO-09, DEC-017)

O Apolo acompanha a habilidade do aluno por **tema × conteúdo × subtópico**
(Elo) e a memória de cada questão já respondida (dificuldade, estabilidade e
recuperabilidade, inspirado no FSRS). As duas coisas só **priorizam ou
selecionam** questão — nunca mudam a nota do quiz, que continua sendo
calculada por `lib/quizzes.ts` (DEC-016: só o Apolo emite nota, e aqui ele
nem participa disso).

Tudo em `lib/apolo/skill.ts` (funções puras) e `lib/apolo/profile.ts` (leitura
do D1). **Nenhum estado incremental é gravado**: cada chamada a
`getStudentProfile` reprocessa o histórico inteiro de tentativas enviadas
(`atlas_quiz_attempts` com `status = 'enviado'`) do zero. Reprocessar duas
vezes o mesmo histórico dá sempre o mesmo resultado — é a garantia que o
DEC-017 pede (a regra pode mudar amanhã; o estado de hoje não precisa ser
migrado, só recalculado).

- **Habilidade Elo**: começa em 1200 por grupo (tema, conteúdo, subtópico).
  A dificuldade nominal da questão (`facil`/`media`/`dificil`, curada à mão)
  vira o "oponente" Elo (1000/1200/1400). O passo de atualização (K) encolhe
  conforme mais respostas se acumulam naquele grupo — K alto no início,
  estabiliza perto de 8.
- **Memória por questão**: dificuldade (1 a 10, prior pela dificuldade
  nominal), estabilidade (dias até ~90% de chance de lembrar) e data de
  vencimento (`dueAt`). Acerto reduz a dificuldade e aumenta a estabilidade
  (mais, se o aluno acertou depois de muito tempo); erro faz o oposto. A
  curva de esquecimento usada é uma simplificação do FSRS
  (`R(t) = (1 + t/(9·S))⁻¹`), não o algoritmo FSRS oficial (que ajusta 19
  parâmetros por otimização) — essa parte real da fila de recuperação
  (política de revisão, agenda) é entregue no APO-15.
- Questão sem `theme` (anterior ao Apolo) não entra no cálculo — o Apolo só
  enxerga o que ele próprio classificou.

`GET /api/apolo/perfil` retorna `{ temas, filaRecuperacao }`: a habilidade por
grupo e a lista de questões por ordem de vencimento (`dueAt`).
