# Atlas Pessoal — roadmap de desenvolvimento

## Situação resumida

| Frente | Situação | Próximo marco |
|---|---|---|
| Visão do produto | Definida em nível conceitual | transformar regras em requisitos testáveis |
| Identidade visual | Definida | consolidar componentes reutilizáveis |
| Página Hoje | Protótipo local e publicado | revisar após as demais páginas |
| Página Estudar | Primeira versão local | decidir área lateral durante a sessão |
| Roadmap | Apenas navegação/resumo | desenhar página completa |
| Notas | Apenas navegação | desenhar editor e pastas |
| Quizzes | Apenas navegação | desenhar apresentação, execução e resultado |
| Progresso | Apenas navegação/métricas em Hoje | desenhar gráficos e explicações |
| Backend | Não iniciado | definir modelo de dados e autenticação |
| Cérebro pedagógico | Não iniciado | formalizar estados, eventos e regras |
| Atlas/Hades/Themis | Conceitual | adiar até haver dados e regras executáveis |

## Concluído nesta fase

- definição da proposta do Atlas Pessoal e separação do Atlas Business;
- princípios de progressão, proficiência, domínio, recuperação e revalidação;
- rotina conceitual de quizzes e revisões 24/7/30;
- concepção do Atlas Notes e do PrivateLink;
- definição conceitual de Atlas, Hades e Themis;
- estrutura principal de navegação;
- identidade visual branca, azul e dourada;
- página Hoje navegável;
- painel demonstrativo do Atlas;
- marcação demonstrativa de tarefas;
- primeira versão local da página Estudar;
- fluxo entre retomada imediata e lista completa do conteúdo;
- layout responsivo inicial;
- publicação privada da versão anterior do protótipo.

## Próxima sequência recomendada — experiência visual

### 1. Finalizar Estudar

- decidir o elemento permanentemente visível ao lado do material;
- desenhar leitura, vídeo/PDF e atividade prática;
- desenhar anotações durante a sessão;
- desenhar encerramento da sessão e geração da fixação;
- definir comportamento em celular.

### 2. Roadmap

- visão geral por fases;
- pré-requisitos e conteúdos bloqueados;
- estados pedagógicos e penalidades;
- detalhamento de disciplina/conteúdo;
- explicação de alterações feitas pelo Atlas.

### 3. Notas

- árvore de pastas;
- editor principal;
- anexos;
- associação ao conteúdo;
- mapa de cobertura;
- indicação visual de área privada, ainda sem implementar o PrivateLink real.

### 4. Quizzes

- tela de preparação e regras da avaliação;
- experiência de múltipla escolha e resposta discursiva;
- timer;
- navegação e revisão antes do envio;
- resultado, erros, recuperação e botão de reportar questão.

### 5. Progresso

- visão por competência;
- histórico e tendência;
- retenção e consistência;
- proficiência versus domínio;
- riscos, recuperação e explicação das recomendações.

### 6. Revisar Hoje

- substituir exemplos provisórios pelos componentes finais;
- reduzir redundâncias entre Hoje, Estudar e Progresso;
- validar a hierarquia diária completa.

## Depois do protótipo visual

### Fundação técnica

- separar páginas e componentes hoje concentrados em uma tela;
- definir modelo de dados;
- escolher autenticação, banco e armazenamento de anexos;
- implementar usuário único primeiro;
- criar persistência de conteúdos, sessões, notas e atividades;
- registrar eventos em uma trilha de auditoria.

### Núcleo mínimo funcional

- conteúdo e pré-requisitos;
- editor de notas;
- sessões de estudo;
- agenda interna;
- quizzes manuais ou pré-cadastrados;
- cálculo determinístico inicial de progresso;
- revisões 24/7/30;
- relatórios simples e explicáveis.

### Inteligência posterior

- associação assistida entre notas e conteúdos;
- geração e validação de questões;
- recomendações personalizadas;
- pesos adaptativos dentro de limites;
- detecção de inconsistências;
- Hades e Themis como análises independentes;
- integrações externas e importação do Obsidian.

## Decisões pendentes prioritárias

1. O que permanece ao lado do conteúdo durante uma sessão: notas, sequência, referências ou combinação adaptável?
2. Qual é a distribuição inicial dos 100 pontos?
3. Quais transições da máquina pedagógica são automáticas e quais exigem confirmação?
4. Como medir cobertura sem premiar volume de texto?
5. Qual banco de questões inicia o MVP e como será licenciado?
6. Quais métodos de estudo têm evidência suficiente para integrar o AtlasStudy?
7. Qual infraestrutura gratuita ou de baixo custo sustentará o usuário único?
8. Como armazenar anexos e preparar a futura garantia técnica do PrivateLink?
9. Qual nível mínimo de acessibilidade será exigido antes do primeiro teste real?

## Regras para a próxima sessão

- continuar pela página **Estudar**, sem começar outra frente antes de fechar seu fluxo principal;
- fazer uma decisão relevante por vez com o usuário;
- preservar a identidade branca, azul e dourada;
- não implementar Hades/Themis antes do núcleo determinístico;
- não chamar exemplos visuais de funções prontas;
- publicar somente quando a rodada aprovada estiver coerente.

