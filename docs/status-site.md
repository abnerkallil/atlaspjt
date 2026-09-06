# Atlas Pessoal — estado atual do site

**Data de corte:** 6 de setembro de 2026
**Estágio:** protótipo funcional com persistência do Atlas Notes; motor pedagógico ainda não implementado.

## Ambientes

### Versão publicada

- Endereço: https://atlas-pessoal-prototipo.abnercoimbra74.chatgpt.site/
- Acesso: privado ao proprietário.
- Referência de código publicada: `0745791` — *Restore blue and gold Atlas identity*.
- Contém a identidade visual consolidada e a página **Hoje**.
- Não contém ainda a nova experiência completa da aba **Estudar**.

### Versão local atual

- Endereço durante desenvolvimento: http://localhost:3000/
- Estado verificado: resposta HTTP 200.
- Contém modificações locais ainda não publicadas em `app/page.tsx` e `app/globals.css`.
- Contém a página **Hoje** e a primeira versão funcional da página **Estudar**.

## Identidade visual definida

- base branca/cinza muito claro;
- azul cobalto como cor principal da marca e das ações;
- dourado reservado para domínio, conquista e detalhes nobres;
- verde para conclusão/resultado positivo;
- âmbar para atenção;
- violeta somente como cor auxiliar de estado;
- tipografia DM Sans;
- cartões claros, bordas sutis e sombras discretas;
- referências estruturais: clareza da Udemy, modularidade da Alura e organização de catálogo da Coursera, sem copiar a identidade dessas marcas.

## Navegação prevista

Abas visíveis no cabeçalho:

1. Hoje
2. Estudar
3. Roadmap
4. Notas
5. Quizzes
6. Progresso

Hoje e Estudar possuem telas próprias no ambiente local. As demais exibem somente aviso de futura construção.

## Página Hoje — implementada como protótipo

Elementos visuais:

- faixa superior com atividades, tempo restante e revisões;
- cabeçalho com navegação, busca, notificações e perfil;
- saudação e sequência de consistência;
- cartão “Continue de onde parou”;
- recomendação “O Atlas observou”;
- métricas de domínio, retenção e consistência;
- jornada diária com quatro atividades;
- cartão resumido do roadmap;
- botão flutuante “Perguntar ao Atlas”.

Interações demonstrativas:

- alternar visualmente o estado de conclusão das atividades;
- atualizar contagem e tempo restante na faixa superior;
- abrir e fechar o painel do Atlas;
- abrir e fechar o modal de início de sessão;
- navegar entre as abas do cabeçalho.

Limitação: dados são exemplos fixos e desaparecem ao recarregar a página.

## Página Estudar — implementada localmente

Decisão de UX: ao entrar na aba, o usuário vai direto ao último conteúdo, sem passar por catálogo.

Tela de retomada:

- disciplina e módulo atuais;
- conteúdo “Regime de competência”;
- ponto exato da última sessão;
- progresso de 42%;
- botão principal “Retomar estudo”;
- sequência resumida da sessão;
- mensagem de que o progresso está salvo.

Visão de conteúdo completo:

- acionada por “Ver conteúdo completo”;
- módulo concluído;
- módulo atual com aulas concluída, ativa e futura;
- módulo seguinte bloqueado por pré-requisito;
- retorno direto ao estudo ativo.

Interações demonstrativas:

- alternar entre retomada e conteúdo completo;
- abrir o modal de início da sessão;
- retornar à aula ativa a partir da lista.

Limitação: o conteúdo, percentuais e bloqueios ainda são exemplos fixos.

## Componentes globais já existentes

- cabeçalho responsivo;
- navegação em pílula no desktop;
- comportamento básico para telas menores;
- painel lateral do Atlas;
- modal de início de sessão;
- botões, cartões, barras de progresso e indicadores de estado;
- imagem social e metadados do site.

## Atlas Notes — primeira versão funcional

- criação, edição, listagem e pesquisa de notas;
- texto integral persistido no D1 do próprio Atlas;
- catálogo local rastreável com os IDs oficiais de Contabilidade Geral e Contabilidade Tributária lidos da planilha em 6 de setembro de 2026;
- análise lexical de título e texto para sugerir conteúdos relacionados;
- confirmação e remoção manual de vínculos antes de salvar;
- vínculo registrado sempre como **Anotado — ainda não trabalhado**;
- operações de sincronização gravadas em fila com chave idempotente e payload restrito a metadados;
- nenhuma escrita na planilha durante esta implementação.

Limitação atual: a fila está pronta para retentativa, mas o executor que grava os metadados na planilha ainda depende de credencial Google segura no ambiente hospedado. Até essa integração existir, os pedidos permanecem em `queued` e nenhuma via alternativa é usada.

## O que ainda não existe

- cadastro, login e perfis reais;
- persistência de progresso acadêmico;
- anexos e PDFs;
- motor de roadmap;
- agenda interna;
- quizzes reais;
- cálculo de notas, domínio ou retenção;
- executor autenticado da fila de metadados para planilha, integrações com Obsidian, Google Agenda ou IA;
- Atlas/Hades/Themis executáveis;
- detecção de fraude;
- acessibilidade e testes completos;
- páginas próprias de Roadmap, Notas, Quizzes e Progresso.

