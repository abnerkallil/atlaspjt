# Changelog visual do Atlas

Cada PR mesclado na `main` tem aqui uma entrada com o que muda para quem usa o
site e o ponto de restauração criado logo antes do merge: um branch
`restore/...` apontando para a `main` daquele momento (tags não podem ser
enviadas deste ambiente). Se algo no site
ficar estranho (uma nota, uma tela, um número), procure a entrada que mexe
naquela parte; para ver o estado anterior a um PR, use o ponto dele:

```
git checkout restore/<nome>
```

ou peça ao Claude para reverter o PR. Publicar continua sendo um passo seu
(`Publicar Atlas.cmd`): nada daqui aparece no site antes disso.

## PR #30 — Backup do D1 e R2 com restauração de teste (DEC-011)

- Ponto de restauração: branch `restore/pre-backup-dec011` (commit `d4d3145`, main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda.
- O que muda fora do site: novos comandos `Backup Atlas.cmd` (copia o D1 e os
  anexos de produção para a pasta `backupDir` do `deploy.local.json`) e
  `Testar Restauracao Atlas.cmd` (restaura a cópia num banco local separado e
  confere). Uso em `docs/BACKUP.md`.
- Se algo der errado: só o backup em si pode falhar; ele apenas lê da
  Cloudflare, então não altera dados do site.

## PR #31 — Sessões de estudo reais (MVP-02, ATLAS-ESC-13)

- Ponto de restauração: branch `restore/pre-mvp-02` (commit `858c181`, main antes do merge).
- Migration nova: `0008_study_sessions` (tabela `atlas_study_sessions`). O
  `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Estudar**: a tela deixa de ser demonstração. Mostra a sessão aberta (ou
    o próximo conteúdo liberado do roadmap) e a lista de conteúdos da
    disciplina. Endereço `/estudar?sessao=...` abre uma sessão específica.
  - **Sessão de estudo**: relógio com **Pausar** / **Retomar** (aparece um
    aviso "Sessão pausada"), o ponto atual e o rascunho da nota são salvos
    sozinhos (a cada 2 s e ao fechar a aba), e **Concluir** registra a
    evidência e leva o conteúdo para "aguardando quiz". As datas de revisão
    de exemplo sumiram da sessão.
  - **Hoje**: o cartão "Continue de onde parou" usa a sessão real (some se
    não houver nada aberto).
  - **Roadmap**: o botão "Começar a estudar / Estudar" cria a sessão e abre
    a tela de estudo.
- Se algo der errado: tempo de estudo errado, sessão que não retoma, conteúdo
  que não passa para "aguardando quiz" ou cartão "Continue de onde parou"
  estranho vêm deste PR.

## PR #32 — Quizzes reais com banco de questões (MVP-04, ATLAS-ESC-14)

- Ponto de restauração: branch `restore/pre-mvp-04` (commit `40f6b8a`, main antes do merge).
- Migrations novas: `0009_quizzes` (tabelas `atlas_questions` e
  `atlas_quiz_attempts`) e `0010_question_bank` (60 questões de Fundamentos,
  CG-001 a CG-006). O `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Quizzes**: o quiz de demonstração "Débito e crédito" sumiu. A tela lista
    os quizzes liberados (conteúdos com sessão concluída) e as tentativas
    anteriores com nota.
  - **Fazer um quiz**: tela de regras, até 10 questões com alternativas
    embaralhadas, relógio (1 min por múltipla, 5 min por dissertativa) que trava
    as respostas ao zerar, revisão antes do envio e, se houver dissertativas, uma
    etapa para comparar sua resposta com o gabarito.
  - **Resultado**: nota, certa/errada de cada questão com gabarito e explicação.
    Aprovado (70% ou mais) marca o conteúdo como **concluído** no Roadmap;
    reprovado o deixa **bloqueado** até uma nova sessão de estudo, com o botão
    "Estudar de novo".
  - **Sessão concluída**: ganhou o botão "Fazer o quiz".
  - Conteúdos fora de Fundamentos (CG-007 em diante) aparecem com "Ainda sem
    questões cadastradas" até você importar questões (`docs/QUESTOES.md`).
- Se algo der errado: quiz que não abre, nota estranha, conteúdo que não vira
  concluído/bloqueado depois do quiz, ou texto de questão errado vêm deste PR.

## PR #33 — Agenda interna real em Hoje (MVP-05, ATLAS-ESC-15)

- Ponto de restauração: branch `restore/pre-mvp-05` (commit `c178fd0`, main antes do merge).
- Migration nova: `0011_agenda` (tabela `atlas_agenda_items`). O
  `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Cabeçalho** (faixa do topo): "N atividades · N min restantes · N revisões
    programadas" passa a contar a agenda real do dia, em todas as páginas.
  - **Hoje → Sua jornada de hoje**: as quatro tarefas de demonstração sumiram.
    Os passos vêm do roadmap: recuperação urgente (vermelho) para conteúdo
    bloqueado, quiz para conteúdo com sessão concluída e o próximo estudo
    liberado. Cada passo mostra horário (a partir das 7h), duração, prioridade e
    o motivo de estar ali.
  - O círculo numerado conclui o passo à mão; ele também se conclui sozinho
    quando a sessão ou o quiz é feito. "Reagendar ou ajustar" abre um diálogo
    para mudar dia, horário, duração, prioridade e escrever o motivo.
  - Passos não feitos passam para o dia seguinte com "Não foi feita em DD/MM";
    passos reagendados aparecem em **Próximos dias**.
- Se algo der errado: passos repetidos, horários estranhos, contagem errada no
  cabeçalho ou um passo que não some depois de feito vêm deste PR.

## PR #34 — Revisões 24h/7d/30d (MVP-06, ATLAS-ESC-16)

- Ponto de restauração: branch `restore/pre-mvp-06` (commit `22fbb60`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Quizzes**: além do quiz de conteúdo, aparecem "Revisão de 24h", "Revisão
    de 7d", "Revisão de 30d" e "Quiz corretivo". O corretivo só libera depois de
    uma nova sessão de estudo.
  - **Hoje**: a revisão aparece na agenda (já em Próximos dias antes do prazo).
    Falhar numa revisão cria uma **recuperação urgente** (vermelho) e depois o
    quiz corretivo.
  - **Resultado do quiz**: mostra a data da próxima revisão, "Ciclo de revisões
    concluído" ou "Conteúdo reaberto" quando a revisão falha.
  - **Roadmap**: os estados "aguardando revisão", "revalidado" e "em revisão
    ativa" passam a acontecer de verdade.
- Se algo der errado: revisão que aparece no dia errado, conteúdo que fica
  preso em "aguardando revisão", corretivo que não libera ou data de próxima
  revisão estranha vêm deste PR.

## PR #35 — Progresso calculado (MVP-07, ATLAS-ESC-17)

- Ponto de restauração: branch `restore/pre-mvp-07` (commit `7963874`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Hoje → Seus indicadores** e **Progresso** (os três cartões do topo):
    Domínio geral, Retenção média e Consistência deixam de ser números fixos e
    passam a ser calculados (podem ter uma casa decimal, ex.: "3,8%").
  - **Progresso → Visão por disciplina**: as quatro "competências" de exemplo
    viraram as disciplinas reais do roadmap, com proficiência (média das
    últimas 5 tentativas) e domínio (nota da disciplina).
  - **Progresso → Histórico e tendência**: gráfico de 8 semanas real.
  - **Progresso → Consistência**: os 28 quadrados pintam pelos minutos de
    sessão de cada dia.
  - **Progresso → Conteúdos em risco**: lista conteúdos bloqueados, com revisão
    vencida ou reabertos, com o próximo passo.
  - **Progresso → Como a nota é calculada** e **Pesos do curso** (novos):
    pontos de cada componente (Avaliações, Atividades, Cobertura, Revisão,
    Quiz) e de onde vieram. Avaliações e Atividades aparecem em 0 porque ainda
    não existem no Atlas.
  - Saíram o "Plano da semana" de exemplo e o aviso "Dados de demonstração".
- Se algo der errado: nota de disciplina ou indicador estranho, gráfico ou
  consistência que não bate com o que você estudou vêm deste PR.

## PR #36 — Recuperação e bloqueios (MVP-08, ATLAS-ESC-18)

- Ponto de restauração: branch `restore/pre-mvp-08` (commit `fb7af78`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Sessão de estudo** de um conteúdo reprovado (bloqueado ou reaberto pela
    revisão): faixa vermelha **Estudo dirigido** no topo, com as questões
    erradas na última reprovação, a resposta certa e a explicação (fechada
    quando são mais de 3; clique para abrir).
  - **Quizzes**: o quiz seguinte a uma reprovação é dirigido. Aparece a faixa
    "Quiz dirigido: as N questões que você errou voltaram" e elas estão entre
    as 10 questões.
  - **Hoje**: a recuperação urgente diz quantas questões erradas voltam e,
    a partir da 2ª reprovação seguida, "Reincidência". O quiz depois do estudo
    aparece como "Quiz dirigido".
  - **Progresso**: conteúdos em risco mostram a reincidência, e a disciplina
    com conteúdo bloqueado mostra "Conclusão da disciplina congelada".
- Se algo der errado: quiz que repete questões demais, faixa de estudo
  dirigido que aparece sem ter reprovado, ou aviso de congelamento errado vêm
  deste PR.

## PR #37 — Relatórios explicáveis (MVP-09, ATLAS-ESC-19)

- Ponto de restauração: branch `restore/pre-mvp-09` (commit `2c175d4`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Página nova `/relatorio`**: lista os conteúdos já estudados; cada um abre
    um relatório com Próxima ação (com botão), Risco, Origem da nota, Mudanças
    de estado e Histórico (sessões e quizzes).
  - **Progresso**: link "Relatórios por conteúdo" no subtítulo e "Ver
    relatório" em cada conteúdo em risco.
  - **Roadmap**: "Ver relatório do conteúdo" no painel do conteúdo escolhido
    (só para conteúdos já iniciados); o texto do cartão "Conteúdos concluídos"
    passou a dizer "A nota com pesos fica em Progresso."
- Se algo der errado: relatório que não abre, risco ou próxima ação que não
  batem com o estado do conteúdo, ou histórico incompleto vêm deste PR.

## PR #38 — Reprovação em quiz não altera a nota (ATLAS-ESC-20)

- Ponto de restauração: branch `restore/pre-quiz-nota` (commit `cd2cb38`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Progresso** e **Relatório**: o componente Quiz da nota só conta a melhor
    nota *aprovada* de cada conteúdo. Uma reprovação não baixa mais a nota; só
    deixa o conteúdo urgente.
  - Conteúdo em revisão ativa (falhou numa revisão) continua contando na
    Cobertura.
- Se algo der errado: nota de disciplina que caiu depois de um quiz reprovado,
  ou cobertura que não conta um conteúdo já estudado vêm deste PR.

## PR #39 — Quiz reprovado trava o conteúdo até passar (ATLAS-ESC-21)

- Ponto de restauração: branch `restore/pre-quiz-refazer` (commit `c63fdf5`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Resultado do quiz reprovado**: botões "Refazer o quiz" (principal) e
    "Revisar as notas antes"; o texto diz que o conteúdo, e o próximo, ficam
    travados até passar com 70%.
  - **Quizzes**: conteúdo bloqueado aparece na lista para refazer na hora; o
    quiz corretivo também abre direto (sem exigir nova sessão de estudo).
  - **Hoje/agenda**: reprovação vira um quiz urgente ("refaça até passar com
    70%"), não mais uma "recuperação" de estudo; enquanto há reprovação, o
    Atlas não sugere conteúdo novo.
  - **Roadmap**: conteúdo bloqueado ou em revisão ativa mostra "Refazer o
    quiz" / "Fazer o quiz corretivo" e "Revisar as notas antes".
  - **Relatório**: próxima ação de conteúdo bloqueado é "Refazer o quiz".
- Se algo der errado: quiz que não reabre depois de reprovar, conteúdo que não
  desbloqueia ao passar, ou agenda sem sugestão de estudo vêm deste PR.

## PR #40 — Revisão da página Hoje (UX-06, ATLAS-ESC-22)

- Ponto de restauração: branch `restore/pre-ux-06` (commit `f4216f1`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Hoje · Continue de onde parou**: quando há quiz pendente (refazer,
    corretivo, liberado ou revisão vencida), o botão principal é o quiz
    ("Refazer o quiz", "Fazer o quiz corretivo"…) e, se o conteúdo foi
    reprovado, aparece "Revisar as notas antes".
  - **Estudar**: mesmo próximo passo, com o selo "QUIZ PENDENTE".
  - **Hoje · O Atlas observou**: texto calculado do seu progresso (conteúdo em
    risco com link para o relatório, sequência de dias, retenção ou
    constância), não mais fixo.
  - **Assistente (Perguntar ao Atlas)**: sem exemplo fictício nem campo de
    pergunta; atalhos para Roadmap, Progresso e Relatórios.
  - **Agenda**: o quiz corretivo feito conclui o item de quiz; o motivo de um
    item pendente se atualiza (ex.: contagem de reincidência).
- Se algo der errado: botão de Hoje levando ao lugar errado, observação
  estranha, ou item de agenda que não conclui/atualiza vêm deste PR.
