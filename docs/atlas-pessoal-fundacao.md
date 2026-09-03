# Atlas Pessoal — documento de fundação

## 1. Propósito

O Atlas Pessoal será uma plataforma única de estudo orientado por competência. O usuário deverá conseguir estudar, escrever notas, responder avaliações, acompanhar o roadmap, receber recomendações e organizar revisões sem alternar entre diversos programas.

O primeiro usuário será o próprio idealizador. O produto deve nascer útil para uma pessoa, com arquitetura que possa evoluir posteriormente.

O Atlas não será apenas uma interface com IA. Ele deverá transformar evidências de estudo em decisões pedagógicas compreensíveis, rastreáveis e contestáveis.

## 2. Princípios definidos

- **Competência demonstrada:** conclusão não depende apenas de assistir ou marcar conteúdo como visto.
- **Teoria ligada à prática:** cada etapa deve produzir aplicação concreta compatível com a área estudada.
- **Progressão por pré-requisitos:** conteúdos dependentes permanecem bloqueados até a validação da base necessária.
- **Rigor com transparência:** o sistema informa por que um conteúdo avançou, entrou em risco, foi suspenso ou voltou para recuperação.
- **Evidências múltiplas:** notas, cobertura, quizzes, revisões, exercícios, projetos e consistência precisam contar uma história coerente.
- **Interface simples, cérebro complexo:** o usuário recebe orientação clara; análises e orquestração permanecem em segundo plano.
- **Decisão humana preservada:** mudanças críticas, punições de alto impacto e suspeitas de fraude exigem revisão e devido processo.
- **Privacidade por projeto:** dados pessoais devem seguir a LGPD e existirão áreas explicitamente excluídas da análise por IA.

## 3. Experiência central

O fluxo desejado é:

1. o usuário abre o Atlas e vê o que precisa fazer hoje;
2. entra em **Estudar** e retoma exatamente do ponto onde parou;
3. registra notas e anexos dentro da própria plataforma;
4. responde questões de fixação baseadas no que realmente estudou;
5. cumpre revisões e avaliações programadas;
6. o Atlas atualiza o estado pedagógico e o roadmap;
7. o usuário recebe uma explicação simples da decisão e do próximo passo.

## 4. Estrutura dos conteúdos

Hierarquia inicialmente prevista:

**Roadmap → fase → disciplina/matéria → conteúdo → subtópico-chave → atividade/evidência.**

Subtópicos não devem fragmentar excessivamente o estudo. Serão destacados quando forem importantes para comprovar competência. Exemplo: o uso correto da HP 12C pode ser uma evidência-chave dentro de Matemática Financeira.

Conteúdos fundamentais podem ter versões aplicadas à formação escolhida, como matemática para contabilidade ou matemática para arquitetura. Uma prova de proficiência poderá dispensar fundamentos já dominados sem quebrar os pré-requisitos.

## 5. Máquina de estados pedagógicos

Estados definidos conceitualmente:

- **Não iniciado:** disponível, mas ainda sem atividade.
- **Em estudo:** iniciado pelo usuário.
- **Exame de meia conclusão:** avaliação aplicada ao atingir aproximadamente 50% da cobertura.
- **Cobertura confirmada:** 100% do conteúdo estudado e exame intermediário com nota mínima de 70.
- **Avaliação:** conjunto de instrumentos que compõe a nota final.
- **Proficiente:** nota final igual ou superior a 70, com evidências coerentes e validações de integridade aprovadas.
- **Domínio:** desempenho igual ou superior a 85 e demonstração prática compatível com a natureza da competência.
- **Revisão:** reforço programado ou disparado por falha, inconsistência ou perda de retenção.
- **Recuperação:** tratamento dirigido das partes reprovadas; bloqueia o avanço até cobertura completa e nota superior a 85.
- **Em risco:** queda de desempenho, notas incorretas ou sinais de fragilidade que exigem acompanhamento.
- **Revalidação:** nova comprovação por suspeita de fraude ou perda de domínio ao longo do tempo.
- **Consolidação:** análise conjunta de todas as evidências para determinar o estado final e a elegibilidade ao domínio.

Regras já acordadas:

- aprovação normal: nota **igual ou superior a 70**;
- Selo Atlas de Domínio: nota **igual ou superior a 85**, sem inconsistências relevantes e com prova prática;
- após recuperação, a progressão exige cobertura completa e nota superior a 85;
- um novo erro em recuperação volta a bloquear o avanço;
- todos os conteúdos são relevantes; “criticidade” será usada para pré-requisitos e evidências-chave, não para tolerar erros.

## 6. Avaliações e revisões

### Rotina de revisão definida

- revisões de 24 horas e 7 dias: quiz básico de 30 questões, voltado à recordação;
- após erros no quiz de 30: quiz dirigido de 10 questões sobre as falhas;
- novo erro no quiz dirigido: conteúdo entra em urgência para o dia seguinte e sofre penalidade no roadmap;
- revisão de 30 dias: 60 questões em dificuldade média ou alta conforme a complexidade do tema;
- ao finalizar: resumo breve dos pontos principais e atualização das evidências relacionadas.

### Tentativas

- quiz diário: até duas tentativas;
- avaliações semanais, mensais e de conclusão: uma tentativa, seguida de recuperação quando necessário.

### Tipos de evidência

- múltipla escolha;
- respostas discursivas;
- explicação de conceitos;
- resolução de casos;
- criação de exemplos;
- cálculos e raciocínios demonstrados;
- projetos ou entregas profissionais quando a competência exigir prática.

Uma avaliação de domínio não pode ser somente uma prova objetiva. Sua composição deve variar com a natureza do conteúdo.

## 7. Pontuação

A distribuição exata permanece **provisória**. A nota deve somar 100 pontos a partir de grupos como:

- cobertura do conteúdo;
- avaliações intermediárias e finais;
- quizzes e revisões;
- notas e capacidade de síntese;
- exercícios, casos e projetos;
- retenção e consistência.

O Atlas poderá realizar pequenos ajustes de peso para incentivar uma prática deficiente, mas deverá:

- anunciar a alteração;
- explicar a evidência que a motivou;
- respeitar limites previamente definidos;
- nunca transformar uma única evidência, como anotações, no fator dominante da aprovação.

Qualquer modelo adaptativo precisa ser validado cientificamente antes de se tornar regra do produto.

## 8. Notas e materiais

O **Atlas Notes** substituirá o Obsidian no núcleo do produto. A primeira versão deverá ser simples:

- editor de texto;
- organização por pastas;
- salvamento automático;
- anexos de texto, imagens e PDFs;
- associação automática das notas aos conteúdos do roadmap;
- questionário de fixação com pelo menos duas questões por subtópico efetivamente estudado.

Links bidirecionais semelhantes aos do Obsidian poderão ser adicionados depois. A migração/importação do Obsidian é futura.

### PrivateLink

Área privada conceitualmente definida para informações que o usuário não deseja submeter à IA. A implementação precisa garantir tecnicamente que o conteúdo não seja enviado para modelos nem usado em análises. Esta função não integra o primeiro MVP público, mas sua arquitetura não deve ser inviabilizada.

## 9. Integridade acadêmica

Uma nota alta isolada não prova domínio. O Atlas deverá confrontar:

- evolução entre tentativas;
- qualidade e cobertura das notas;
- desempenho em quizzes e revisões;
- tempo e padrão de respostas;
- consistência entre questões objetivas, discursivas e práticas;
- capacidade de aplicar o conhecimento em um cenário novo.

Saltos incompatíveis, como passar de desempenho baixo para perfeito sem novas evidências de aprendizagem, geram alerta — não condenação automática.

Avaliações de domínio deverão minimizar interferência de IA externa. Uma suspeita relevante poderá iniciar revalidação ou auditoria assistida. Punições, suspensão de certificação e banimento pertencem ao futuro produto institucional e exigem política formal, direito de contestação, proteção de dados e revisão humana.

## 10. Atlas, Hades e Themis

Arquitetura conceitual, fora do primeiro MVP:

- **Atlas:** orquestrador e comunicador. Reúne evidências, apresenta recomendações e conversa com o usuário.
- **Hades:** analisa risco, lacunas, regressão, descumprimento de pré-requisitos e necessidade de intervenção.
- **Themis:** contesta causalidade, verifica proporcionalidade, qualidade da evidência e possíveis explicações alternativas.

Hades e Themis não serão “autoridades imutáveis”. Eles deverão operar sob constituições versionadas, métricas distintas e trilha de auditoria. A conclusão nasce do confronto entre análises; decisões de alto impacto continuam sujeitas a governança humana.

## 11. Agenda

O MVP utilizará agenda interna. Eventos externos e Google Calendar ficam para uma integração posterior.

Diretrizes desejadas:

- atividades agendadas preferencialmente às 7h;
- visibilidade durante o dia;
- revisões 24/7/30 geradas conforme o conteúdo concluído;
- conclusão manual ou automática quando houver evidência clara;
- reagendamento explicado quando o Atlas alterar prioridades.

## 12. Limites atuais

Todo o conteúdo deste documento, exceto o que estiver explicitamente descrito no status do site, é especificação de produto. Ainda não existem banco de dados, modelos pedagógicos executáveis, geração validada de questões, agenda real, autenticação, análise de notas nem agentes Hades/Themis.

