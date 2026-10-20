-- Materiais de estudo extraídos da apostila "Documentos Fiscais na Reforma
-- Tributária" (Débora Maiara Rediess, Nota Fácil Assessoria), pedido do Abner
-- em 2026-10-20: dividir o conteúdo por tema e anexar aos nós do roadmap de
-- Contabilidade Tributária. O Módulo 1 (panorama documental) foi anexado ao nó
-- já existente CT-106; os Módulos 2 a 8 geraram os nós novos CT-118 a CT-124
-- (migração do catálogo em drizzle/0005_catalog_seed.sql). Textos capados em
-- ~19.000 caracteres por material (limite de 20.000 em lib/materials.ts),
-- partidos em várias partes quando o módulo passa disso.
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-106-apostila-01', 'CT-106', 'texto', 'Apostila — Panorama documental da Reforma (Módulo 1)', 'MÓDULO 1 — PANORAMA DOCUMENTAL
divisória no slide 4 · conteúdo nos slides 5 a 17
5. A nova função do documento fiscal
Antes: comprovante da operação, escriturado depois e conferido por amostragem. Agora: o próprio lançamento. A Cartilha afirma que os DF-e e seus eventos são o "principal insumo" da apuração e têm "efeito direto e automático sobre o saldo". Consequência prática: erro de emissão deixa de ser erro de forma e vira erro de saldo
Fontes: Cartilha IBS vol. 1, p. 8
6. O documento como origem da apuração assistida
Os quatro produtos declarados pela Cartilha: apuração do saldo devedor do período; controle dos créditos do adquirente, condicionado à extinção do débito pelo fornecedor; vinculação cronológica entre débitos e créditos; relatórios de apoio e ferramentas de conferência. Correções e ajustes também se fazem por emissão — notas de débito e de crédito — ou por eventos vinculados ao documento original
Fontes: Cartilha IBS vol. 1, p. 8
7. O ecossistema documental da Reforma
Três normas distintas, três funções: art. 62 da LC 214/2025 impõe aos entes adaptar os autorizadores ao leiaute padronizado (não lista modelos); o IT 2025.002 v1.70 define, na tabela cClassTrib, dezessete indicadores de modelos de documentos, que "estabelecem a permissão ou não de informar o cClassTrib no respectivo documento" — de indNFeABI a indDUIMP; o art. 1º do Ato Conjunto RFB/CGIBS 4/2026 fixa o rol sujeito à obrigatoriedade e as datas de início, alcançando também MDF-e, GTV-e e DC-e, que não têm indicador próprio naquela tabela. Mapa visual agrupando por natureza
Fontes: LC 214/2025 art. 62; IT 2025.002 v1.70, p. 6; Ato 4/2026 art. 1º
8. Documentos de mercadorias
NF-e mod. 55, NFC-e mod. 65, NF-e ABI mod. 77 (alienação de bens imóveis) — obrigatoriedade no plano jurídico (Ato Conjunto RFB/CGIBS nº 4/2026, art. 1º, XVIII); leiaute e documentação técnica PENDENTES DE IMPLEMENTAÇÃO TÉCNICA, e o IT 2025.002 v1.70 o relaciona entre os "documentos em desenvolvimento" — e DC-e mod. 99. O que passa a existir nos documentos cuja documentação técnica já foi publicada: grupo de IBS/CBS no nível do item, totalização própria e referenciamento por item. A NFC-e tem restrições próprias — não referência outros documentos e não admite crédito presumido. Estrutura detalhada no M3
Fontes: NT 2025.002 v1.52 (grupos UB e W; RV VC02-04, UB120-10); Ato 4/2026 art. 1º, I, II, XII e XVIII
9. Documentos de serviços
NFS-e nacional e NFS-e Via. Dois conceitos que a turma costuma confundir: a DPS é o que o emitente declara; a NFS-e é o que o sistema gera, carregando a DPS aninhada. O que passa a existir: grupos de IBS/CBS declarados na DPS e calculados pelo sistema, e um código próprio que determina o local da operação, coexistindo com a localidade de incidência do ISSQN. Detalhamento no M4
Fontes: Anexo VI v1.04.00 (leiaute DPS/NFS-e); Nota Técnica SE/CGNFS-e nº 007, pp. 8-10
10. Documentos de transporte, comunicação e energia
Transporte: CT-e 57, CT-e OS 67, BP-e 63, MDF-e 58, GTV-e 64. Comunicação: NFCom 62. Energia, gás e saneamento: NF3e 66, NFGás 76, NFAg 75. Todos recebem os mesmos grupos de IBS/CBS, com códigos de local da operação próprios das famílias de transporte, exploração de via, telefonia, utilities e gás. Regra específica do Ato: NF3e, NFCom, NFGás e NFAg acobertam todos os fornecimentos objeto das cobranças neles consignadas
Fontes: Ato 4/2026 art. 1º e §6º; Anexo VII v1.02.00 (famílias 06 a 13)
11. Documentos e declarações complementares
Duimp (importação), DIR (importação de remessa) e DeRE (regimes específicos), esta em duas camadas: Eventos de Tabela do Contribuinte e Eventos Periódicos Mensais — D-1101 balancete, D-1106 aplicações financeiras, D-1121 deduções, D-2101 títulos de dívida, D-1198 reabertura e D-1199 fechamento, com entrega até o dia 15 do mês seguinte ao período de apuração. A documentação técnica da DeRE está na versão 1.3.0, formalizada pelo Ato Técnico Conjunto RFB/SUFIS/CGIBS/Diretoria-Executiva nº 6/2026, e passou a reunir Manual de Orientação do Usuário, leiautes de eventos, tabelas, regras de validação e arquivos XSD. A transmissão dos eventos de tabela no ambiente de produção foi disponibilizada a partir de 01/10/2026.
Fontes: Ato 4/2026 art. 1º, XIV, XV, XVII e §5º · Documentação técnica da DeRE v1.3.0 · Ato Técnico Conjunto nº 6/2026 [PRIMÁRIA]
12. Convivência entre os tributos atuais e IBS/CBS/IS
Três consequências já normatizadas: (a) NF-e de débito e de crédito são documentos exclusivamente de IBS/CBS — não podem conter ICMS, ISSQN, IPI, II, PIS ou COFINS, salvo exceções expressas; (b) na NFS-e coexistem duas localidades de incidência, uma pelas regras do ISSQN e outra pelas do IBS/CBS; (c) na escrituração, o Guia Prático declara que a EFD ICMS/IPI "não se presta à apuração dos novos tributos, CBS, IBS e IS", restando apenas regras de convivência de valores
Fontes: NT v1.52, RV B25-80; Anexo VI v1.04.00 (cLocIncid × cLocalidadeIncid); Guia EFD 3.2.4, pp. 7, 67 e 107
13. O XML como fonte da informação fiscal
O que é autorizado é o XML; o documento auxiliar é representação gráfica. Ponto que torna isso urgente: a NT v1.52 registra que as alterações do DANFE para exibir os novos tributos "estão em estudo, e serão publicadas em uma nova versão desta Nota Técnica" — ou seja, hoje a informação de IBS/CBS/IS existe no arquivo e não no documento impresso. Quem confere pelo DANFE não está conferindo. Atualização: a NT 2026.010 v1.00, de outubro de 2026, publicou o novo leiaute de impressão do DANFE modelo 55, com a representação do IBS, da CBS e do Imposto Seletivo — leiaute publicado, com implantação em produção prevista para 01/12/2026. Até lá, a conferência continua a ser feita no XML.
Fontes: NT 2025.002 v1.52, cap. 9 · NT 2026.010 v1.00 — DANFE Reforma Tributária [PRIMÁRIA]
14. Emissão, autorização, evento e apuração: quatro etapas distintas
Emitir ≠ autorizar ≠ registrar evento ≠ apurar. Os eventos são atos posteriores, cada um com autor definido — emitente, adquirente, sucessora ou Fisco — e efeito próprio sobre o saldo. São autorizados na SVRS, com orientação expressa de envio individual, sem compor lote. A NT situa o registro dos eventos a partir de janeiro de 2026; a exigibilidade de cada evento decorre da hipótese específica que ele documenta, tratada uma a uma no M5
Fontes: NT v1.52, cap. 8 e p. 75
15. Quem responde pelo quê
Área
O que responde por
Entrega concreta
Faturamento
Escolher o documento e descrever a operação
Modelo documental correto e descrição fiel da operação
Fiscal
Definir a classificação e validar as regras
Par CST × cClassTrib e conferência das regras de validação
Contábil
Evidenciar o ajuste e conciliar
Ajuste evidenciado e conciliação entre documento, apuração e escrituração
TI / ERP
Habilitar os grupos, aplicar os indicadores das tabelas oficiais e manter a versão de leiaute
Grupos abertos pelo indicador, tabelas na versão vigente e leiaute atualizado

A mensagem central: a classificação deixou de ser tarefa isolada do fiscal, porque o cadastro virou pré-requisito da emissão. Quem cadastra decide, na prática, o que o documento poderá dizer.
Fontes: NT v1.52 (indicadores de grupo); tabela cClassTrib
16. Cronograma consolidado e a condição de 2026
Um quadro com os cinco marcos do art. 1º, os modelos de cada um e os perfis de cliente afetados — sem abrir uma linha por data no corpo da aula.
Os cinco marcos — quadro sintético de tela
Marco
Documentos, em síntese
Perfis alcançados
3 de agosto de 2026
NF-e · NFC-e · CT-e · CT-e OS · MDF-e · GTV-e · BP-e exceto semiurbano, metropolitano e aéreo (alíneas "a" e "b" do inciso VI) · NF3e · DC-e · NFS-e Via
Comércio · indústria · transportadoras · energia elétrica
1º de outubro de 2026
NFS-e dos demais serviços da lista da LC 116/2003 · NFCom · DIR · DeRE, eventos de tabela
Prestadores de serviços em geral · comunicação · importação de remessa
15 de novembro de 2026
DeRE, eventos periódicos mensais
Contribuintes de regimes específicos
1º de dezembro de 2026
NFS-e das hipóteses específicas · transporte de passageiros semiurbano, metropolitano e aéreo · NFGás · NFAg · NF-e ABI
Plataformas digitais · condomínios · locadores · transporte de passageiros · gás · água e saneamento · alienação de imóveis
1º de janeiro de 2027
Duimp · DeRE, demais eventos · e, por regra própria, os documentos dos optantes pelo Simples Nacional
Optantes pelo Simples Nacional · monofásicos · importadores de bens materiais

Quatro ressalvas que afastam o prazo geral — leem-se junto com o quadro, nunca depois dele
Ressalva
Regra própria
Base
Optantes pelo Simples Nacional
Os documentos do caput deste artigo começam em 1º/01/2027, qualquer que seja a linha do quadro. O § 1º trata do cronograma de IBS e CBS do Ato: não adia obrigações documentais preexistentes nem as regras próprias do Emissor Nacional
art. 1º, § 1º
Tributação monofásica
A NF-e que registre esses fornecimentos começa em 1º/01/2027
art. 1º, § 2º
Importação de bens materiais
Aplica-se, em substituição ao prazo da NF-e, o prazo da Duimp — 1º/01/2027
art. 1º, § 3º
NF-e do sujeito passivo de IBS e CBS não contribuinte do ICMS
Fornecimentos, movimentações de bens materiais e devoluções começam em 1º/12/2026
art. 1º, § 4º

Como ler o quadro: as datas da tabela acima valem por modelo; estas quatro ressalvas valem por perfil e por operação e prevalecem sobre a linha do modelo. Nenhuma linha do quadro deve ser apresentada como prazo geral.
Fonte do quadro: Ato Conjunto RFB/CGIBS nº 4, de 30 de julho de 2026, art. 1º, incisos I a XVIII e §§ 1º a 6º. A discriminação completa por inciso, alínea e parágrafo está no registro técnico deste documento.
Dispensa de recolhimento ≠ dispensa de obrigação
Em 2026, a dispensa de recolhimento do IBS e da CBS alcança os sujeitos passivos que cumprirem as obrigações acessórias previstas na legislação de cada tributo ou estiverem legalmente desobrigados de cumpri-las. A dispensa não afasta as exigências documentais dos demais tributos vigentes.
As obrigações acessórias e sua aplicabilidade
Obrigação
Aplicabilidade e base
Emitir o documento fiscal eletrônico
Por modelo e por perfil de contribuinte. As datas de início são fixadas modelo a modelo no art. 1º do Ato Conjunto RFB/CGIBS nº 4/2026, que traz regras próprias para optantes pelo Simples Nacional, tributação monofásica, importação de bens materiais e sujeito passivo do IBS e da CBS não contribuinte do ICMS (§§ 1º a 4º)
Preencher os campos de IBS e CBS
Por modelo e por regime do emitente. O cronograma da NT 2025.002-RTC v1.52 é apresentado para CRT 3 — Regime Normal; para CRT 1, 2 e 4 a própria NT registra que as orientações serão publicadas em nota técnica futura
Registrar os eventos
Por hipótese. A exigibilidade decorre da situação concreta que cada evento documenta — não é geral

Na orientação ao cliente: a dispensa é condicionada e é por tributo. Não se apresenta como suspensão geral de obrigações, nem alcança a documentação dos tributos que seguem vigentes.
Este quadro é referência operacional e está sujeito a alteração por ato posterior. O detalhamento por modelo, inciso e alínea está no desenvolvimento deste mesmo material.
Fontes: Resolução CGIBS nº 6/2026, art. 465, caput e § 2º · Decreto nº 12.955/2026, art. 464, caput e § 2º · Ato Conjunto RFB/CGIBS nº 4/2026, art. 1º e §§ 1º a 4º · NT 2025.002-RTC v1.52, p. 7. · Documentação técnica da DeRE v1.3.0 e Ato Técnico Conjunto nº 6/2026 — transmissão dos eventos de tabela em produção a partir de 01/10/2026 [PRIMÁRIA].
17. Exercício 1 — qual documento e qual o impacto operacional
Seis situações descritas sem referência temporal. Para cada uma, a dupla marca apenas dois campos: qual documento eletrônico e qual cadastro precisa estar pronto antes da emissão. A atribuição de responsabilidade por área é lida pela instrutora na correção.
#
Situação
Documento eletrônico
Cadastro que precisa estar pronto antes
1
Venda de mercadoria com entrega em outro estado


2
Prestação de serviço a tomador de outro município


3
Locação de imóvel residencial


4
Transporte intermunicipal de carga


5
Fornecimento de energia a consumidor final


6
Importação de bem material



Como trabalhar: leitura das seis situações · marcação em duplas · correção comentada em plenária, contrapondo as respostas.
Fontes: Ato 4/2026 art. 1º (identificação do modelo); Anexo VIII v1.01.00 (serviços)
Espaço para a sua resposta', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-118-apostila-01', 'CT-118', 'texto', 'Apostila — CST, cClassTrib e tributação no documento (parte 1/2)', 'MÓDULO 2 — O NÚCLEO TRIBUTÁRIO: IBS, CBS E IS NO DOCUMENTO
divisória no slide 18 · conteúdo nos slides 19 a 40
19. Onde IBS, CBS e Imposto Seletivo moram no documento
O Grupo UB fica no nível do item, não no cabeçalho nem no total. Dentro dele, dois ramos independentes: IS (UB01), com o Imposto Seletivo, e IBSCBS (UB12), que abre com dois campos — CST (3 dígitos) e cClassTrib (6 dígitos). Um item pode ter tributação diferente do item ao lado na mesma nota. Como o preenchimento completo é matéria do M3 (NF-e/NFC-e) e do M4 (NFS-e), aqui interessa só a arquitetura: a classificação é declarada por item, e é ela que abre ou fecha os demais grupos
Fontes: NT 2025.002 v1.52 — leiaute UB01, UB12, UB13, UB14
20. Informar, calcular e totalizar são três coisas diferentes
Informar é declarar a situação tributária: CST e cClassTrib. Calcular é obter base, alíquota efetiva e valor por item. Totalizar é consolidar os valores no total do documento. Cada camada tem campos próprios e rejeições próprias. Erro na primeira camada derruba as outras duas, porque a classificação determina quais grupos de cálculo podem existir. Mensagem: quem começa pelo valor e depois procura um CST que "feche a conta" está invertendo a ordem
Fontes: NT v1.52 — leiaute UB12 a UB16 e grupo de totalização W03
21. Os 18 CST do IBS e da CBS
Os 18 códigos vigentes, com a descrição literal da tabela: 000 Tributação integral · 010 Tributação com alíquotas uniformes · 011 Tributação com alíquotas uniformes reduzidas · 200 Alíquota reduzida · 220 Alíquota fixa · 221 Alíquota fixa proporcional · 222 Redução de base de cálculo · 400 Isenção · 410 Imunidade e não incidência · 510 Diferimento · 515 Diferimento com redução de alíquota · 550 Suspensão · 620 Tributação monofásica · 800 Transferência de crédito · 810 Ajuste de IBS na ZFM · 811 Ajustes · 820 Tributação em documento específico · 830 Exclusão de base de cálculo. Observação de leitura: a planilha lista o 222 antes do 221 — é a ordem física do arquivo, não erro
Fontes: Tabela CST, aba "CST 2026-06-01 Pub", linhas 2 a 19
22. Os oito indicadores: o CST comanda a estrutura do XML
Cada CST traz oito indicadores: ind_gIBSCBS, ind_gIBSCBSMono, ind_gRed, ind_gDif, ind_gTransfCred, ind_gCredPresIBSZFM, ind_gAjusteCompet e ind_RedutorBC. Legenda oficial da própria tabela: 0 = não é permitido, 1 = exige — não existe "opcional" nessa leitura. Conferir também as exceções da regra: compra governamental possui tratamento específico — as UB26-10/20, UB45-10/20 e UB64-10/20 admitem o grupo de redução com pRedAliq igual a zero quando informado o gCompraGov/pRedutor, ainda que o indicador do CST seja 0. O indicador, isoladamente, não é condição suficiente para qualquer operação. Exemplos conferidos: o CST 510 exige o grupo de diferimento (ind_gDif = 1); o CST 515 exige diferimento e redução (ind_gDif = 1 e ind_gRed = 1); o CST 620 proíbe o grupo padrão e exige o monofásico; o CST 400 e o 410 proíbem o grupo padrão. As regras UB13-20 e UB13-30 rejeitam o documento quando o grupo é informado indevidamente ou deixa de ser informado, e mandam consultar a tabela de indicadores
Fontes: Tabela CST, colunas C a J e legenda (linhas 21 a 23) · IT 2025.002 v1.70, seção 03 · NT v1.52, RV UB13-20, UB13-30, UB13-39, UB13-40, UB13-44, UB13-45, UB22-10, UB22-20
23. CST e cClassTrib não são a mesma coisa
CST tem 3 dígitos e descreve a natureza do tratamento. cClassTrib tem 6 dígitos, dos quais os três primeiros são exatamente o CST, e identifica a hipótese legal concreta. Exemplo: CST 200 é "alíquota reduzida"; 200047 é "Bares e Restaurantes", art. 275. Consequência prática: 811001, 811002 e 811003 são cClassTrib, não CST — o CST é o 811, cuja descrição oficial é "Ajustes". Material que chama 811001 de "CST 811" está impreciso. A regra UB14-20 rejeita o documento quando o cClassTrib é incompatível com o CST informado
Fontes: Tabela cClassTrib, colunas A e C · IT v1.70, seção 03 · NT v1.52, RV UB14-20
24. A tabela cClassTrib: o que é e como está organizada
A versão vigente conferida é o IT 2025.002 v1.70, de 01/10/2026, aba "cClass 2026-09-01": 173 códigos e 43 colunas preenchidas. Distribuição por CST: 200 com 56 códigos, 410 com 38, 550 com 29, 820 com 9, 620 com 7, 000 com 6, 011 com 5, 221 com 4, 400 com 4, 220 com 3, 811 com 3, 010 com 2, 800 com 2, e um código único em 222, 510, 515, 810 e 830. A tabela não se percorre de ponta a ponta — consulta-se pela hipótese da operação. Advertência: NCM ou NBS, isoladamente, não resolvem a classificação — eles ajudam a localizar a hipótese, mas quem determina o tratamento é o par CST + cClassTrib
Fontes: Tabela cClassTrib, aba "cClass 2026-09-01" (IT 2025.002 v1.70) — contagem conferida
25. As colunas que você realmente usa
Colunas de identificação: CST-IBS/CBS, cClassTrib, Nome cClassTrib, Descrição cClassTrib. Colunas de fundamento: LC 214/25, LC Redação, Regulamento CBS (Decreto nº 12.955/2026), Regulamento IBS (Resolução CGIBS nº 6/2026), ANEXO e Link. Colunas de cálculo: Tipo de Alíquota, pRedIBS, pRedCBS. Indicadores de grupo: ind_gTribRegular, ind_gCredPresOper, ind_gEstornoCred e os quatro indicadores monofásicos. Vigência: dIniVig, dFimVig, DataAtualização. E 17 indicadores por modelo de DF-e (indNFe, indNFCe, indNFSe, indCTe, indNFCom, indNF3e, indDUIMP e outros), que dizem em qual documento aquele código pode ser usado — a regra UB14-25 rejeita o cClassTrib não permitido no modelo
Fontes: Tabela cClassTrib, linha 1 · IT v1.70, seção 03 · NT v1.52, RV UB14-25
26. Leitura completa de uma linha
Leitura integral do código 200052, conferida na planilha: CST 200; Nome "Prestação de serviços de profissões intelectuais"; LC 214/25 art. 127, I a XVIII; Tipo de Alíquota Padrão; pRedIBS 30 e pRedCBS 30; ind_gTribRegular 0; ind_gCredPresOper 0; ind_gEstornoCred 0; dIniVig 01/01/2026, sem dFimVig; indNFe = 0 e indNFSe = 1 — código de documento de serviço, não cabe em NF-e; ANEXO 91271; coluna Link apontando para o dispositivo. Conclusão que o aluno tira sozinho: essa única linha já informa o percentual de redução, o documento cabível, os grupos exigidos e o fundamento legal
Fontes: Tabela cClassTrib, código 200052 — leitura integral conferida
27. Dez situações que a turma confunde
Quadro comparativo, todos os pares conferidos na tabela vigente: alíquota zero — não é CST próprio; é CST 200 com pRed = 100 (ex.: 200003, cesta básica, art. 125, Anexo I). Isenção — CST 400 (ex.: 400001, transporte público coletivo, art. 157). Imunidade e não incidência — CST 410 (ex.: 410004, exportações de bens e serviços, art. 8º). Suspensão — CST 550 (ex.: 550001, exportações de bens materiais, art. 82). Diferimento — CST 510 (ex.: 510001, energia elétrica, art. 28, §1º). Diferimento com redução — CST 515 (ex.: 515001, insumos agropecuários, art. 138, §2º, redução de 60%). Redução de alíquota — CST 200 com pRed entre 30 e 100. Alíquota fixa — CST 220 e 221 (ex.: 221001, locação de imóvel sobre a receita bruta, art. 487, §2º). Redução de base de cálculo — CST 222 (222001, transporte internacional de passageiros ida e volta, art. 12, §8º). Monofasia — CST 620 (ex.: 620001, combustíveis, art. 172). Exportação aparece em dois CST distintos: 410 (imunidade) e 550 (suspensão) — e isso não é contradição, são momentos e efeitos diferentes
Fontes: Tabela cClassTrib — todos os códigos citados conferidos linha a linha
28. Três armadilhas de classificação
Primeira: confundir alíquota zero com isenção. São CST diferentes, com grupos diferentes — o 200 exige o grupo de redução, o 400 proíbe o grupo padrão. Segunda: escolher o cClassTrib pelo nome do produto ou do serviço, sem conferir o indicador do modelo de DF-e. Códigos como 200046, 200027 e 200052 só valem em NFS-e; 200049 não vale nem em NF-e nem em NFS-e. Terceira: usar código fora de vigência. Os três códigos do CST 220 têm dFimVig em 01/01/2026 e foram sucedidos pelos códigos do CST 221 — quem copiar tabela antiga erra
Fontes: Tabela cClassTrib — colunas indNFe, indNFSe, dIniVig, dFimVig conferidas · NT v1.52, RV UB14-25
29. Quatro sentidos da palavra "alíquota"
Alíquota legal: a definida em legislação específica para o ano. Alíquota de referência: a que se aplica quando o ente não fixa a sua por lei própria — fixada por resolução do Senado. Alíquota aplicada: a informada no documento (pIBSUF, pIBSMun, pCBS). Alíquota efetiva: o resultado depois de aplicada a redução (pAliqEfet). O que entra no cálculo do valor do tributo é a efetiva, e a NT é expressa: havendo grupo de redução, usa-se pAliqEfet no lugar da alíquota cheia
Fontes: IT v1.70, item 05 e notas (arts. 14 e 18 da LC 214/2025) · NT v1.52, RV UB35-10, UB47-10
30. As alíquotas da fase de teste
Tabela oficial: 2026 — IBS-UF 0,1%, IBS-Município 0%, CBS 0,9%. 2027 e 2028 — IBS-UF 0,05%, IBS-Município 0,05%, CBS "aguardar legislação". 2029 em diante — "aguardar legislação" nos três. Nota da fonte: cada ente define suas alíquotas por lei própria (art. 14 da LC 214/2025); na omissão, aplica-se a alíquota de referência fixada por resolução do Senado (art. 18). As regras de validação da NT confirmam esses percentuais e trazem exceções: se o cClassTrib tiver ind_gTribRegular = 1, a alíquota informada deve ser zero
Fontes: IT 2025.002 v1.70, item 05 · IT 2026.002 v1.00 · NT v1.52, RV UB18-10, UB37-10, UB56-10
31. A base de cálculo do IBS e da CBS
Composição que a RV UB16-10 publicava, reproduzida por inteiro: (+) vProd, vServ, vFrete, vSeg, vOutro e vII; (−) vDesc, vPIS, vCOFINS, vICMS, vICMSUFDest, vFCP, vFCPUFDest, vICMSMono e vISSQN; (+) vIS — o Imposto Seletivo soma-se à base. Duas exceções da própria regra afastam a subtração do PIS-ST e do COFINS-ST quando esses valores compuserem o total da NF-e. Status da validação, que é coisa distinta da disciplina legal da base: a UB16-10 trazia a nota literal "Implementação Futura, aguardando orientação normativa" e foi removida pela NT 2026.008 v1.00 — não há hoje regra de validação que confronte a base com seus componentes, e a ausência de validação não dispensa observar a legislação. O IBS e a CBS são calculados por fora e não integram as próprias bases de cálculo; a base deve ser determinada conforme a legislação aplicável. O campo é vBC (UB16), com 13 inteiros e 2 decimais, e é um só para os dois tributos — IBS e CBS partem da mesma base, e é por isso que os dois compartilham o grupo gIBSCBS
Fontes: NT v1.52 — leiaute UB16 e RV UB16-10 · NT 2026.008 v1.00 — remoção da RV UB16-10 [PRIMÁRIA]
32. Redução de alíquota, alíquota efetiva e o caso da base de cálculo
Fórmula literal da NT: pAliqEfet = pIBSUF × (1 − pRedAliq / 100). Havendo compra governamental: pAliqEfet = pIBSUF × (1 − pRedAliq / 100) × (1 − pRedutor / 100). Exemplo da própria NT: alíquota 10%, redução 40%, redutor governamental 5% → E = 10 × (1 − 0,4) × (1 − 0,05) = 5,7. Regra de precisão, também literal: o cálculo da pAliqEfet deve considerar 4 casas decimais, com arredondamento na última casa decimal; as regras de valor aceitam tolerância de 0,01 para mais ou para menos. Distinção que precisa ficar clara: percentual de redução é o que consta da tabela (pRedIBS / pRedCBS); alíquota efetiva é o resultado do cálculo. E a diferença entre reduzir a alíquota e reduzir a base: o CST 200 reduz a alíquota; o CST 222 reduz a base. PENDENTE DE VALIDAÇÃO — o indicador ind_RedutorBC existe na tabela CST e vale 1 apenas para o CST 222, mas a NT 2025.002 v1.52 não traz grupo, campo nem regra de validação de redução de base de cálculo para a NF-e/NFC-e. Até que seja publicado, não há como demonstrar o preenchimento desse caso — e o único código do CST 222, o 222001, tem indNFe = 0 e indNFSe = 0: não é admitido nem na NF-e nem na NFS-e. A pendência não é só de campo: é de admissão do código nos dois modelos.
Fontes: NT v1.52, RV UB28-10 (fórmula, exemplo, 4 casas e arredondamento), UB47-10, UB66-10, UB35-10 · Tabela CST, coluna ind_RedutorBC · IT v1.70, seções 03 e 07
33. Cálculo passo a passo, do vBC ao vIBS
Exemplo integral com item de R$ 10.000,00, cClassTrib 200047 (Bares e Restaurantes, art. 275, pRed = 40), ano-calendário de teste. Passo 1 — base de cálculo: vBC = 10.000,00. Passo 2 — alíquota efetiva do IBS-UF: 0,1 × (1 − 0,40) = 0,0600. Passo 3 — valor: vIBSUF = 10.000,00 × 0,0600 / 100 = 6,00. Passo 4 — IBS municipal, com pIBSMun = 0 no ano de teste: vIBSMun = 0,00. Passo 5 — soma do item: vIBS = vIBSUF + vIBSMun = 6,00. Passo 6 — CBS: 0,9 × (1 − 0,40) = 0,5400, vCBS = 54,00. Fecho: a regra UB54a-10 é a que valida a soma do item e prevê a dedução do crédito presumido quando o cCredPres tiver o indicador de dedução — a apropriação do crédito é assunto do M6, aqui interessa só o efeito no valor
Fontes: NT v1.52, RV UB28-10, UB35-10, UB37-10, UB47-10, UB54a-10, UB56-10, UB66-10 · Tabela cClassTrib, código 200047 · IT v1.70, item 05
34. Regimes recorrentes no escritório
Seleção conferida, todos com dIniVig 01/01/2026: Cesta Básica 200003, redução 100%, art. 125, Anexo I, indNFe = 1. Profissões intelectuais 200052, redução 30%, art. 127, I a XVIII — inclui contabilistas —, indNFSe = 1. Bares e restaurantes 200047, redução 40%, art. 275, indNFe = 1. Hotelaria, parques de diversão e temáticos 200048, redução 40%, art. 281, indNFSe = 1. Agências de turismo 200051, redução 40%, art. 289, II. Operações com bens imóveis 200046, redução 50%, art. 261; locação, cessão onerosa e arrendamento 200027, redução 70%, art. 261, parágrafo único. Produtor rural não contribuinte 410014, art. 164, com ind_gCredPresOper = 1. Resíduos sólidos 410016, art. 170, também com ind_gCredPresOper = 1. Bens móveis usados 410017, art. 171
Fontes: Tabela cClassTrib — os dez códigos conferidos individualmente
35. ZFM e Áreas de Livre Comércio: só o necessário para classificar
Três situações distintas, cada uma com CST próprio: 200022 — operação originada fora da ZFM que destine bem material industrializado a contribuinte na ZFM, art. 445, pRed 100 e ind_gTribRegular = 1, ou seja, exige informar quanto seria devido sem o benefício. 550019 — importação por indústria incentivada para uso na ZFM, art. 443, CST de suspensão, também com ind_gTribRegular = 1. 810001 — crédito presumido de IBS sobre o valor apurado nos fornecimentos a partir da ZFM, art. 450, §1º, CST 810, cujo indicador exige o grupo próprio. Espelho nas Áreas de Livre Comércio: 200024, art. 463, e 550020, art. 461. O que o aluno precisa levar: nessas hipóteses, além de classificar, o documento carrega a tributação regular — a informação do que seria devido sem o incentivo
Fontes: Tabela cClassTrib, códigos 200022, 200024, 550019, 550020, 810001 · Tabela CST, indicador ind_ gCredPresIBSZFM
36. cCredPres: o terceiro código
O que é: código que identifica a hipótese legal de crédito presumido do IBS e da CBS. Diferença: CST diz a natureza do tratamento; cClassTrib diz a hipótese legal da operação; cCredPres diz a hipótese legal do crédito presumido — são três tabelas distintas e não se substituem. Onde entra: no grupo de crédito presumido da operação, ao lado da base e do percentual. Dimensão conferida: a tabela oficial do IT 2025.002 v1.70 tem 13 códigos e 23 colunas na aba cCredPres, com indicadores de apropriação via DF-e ou via evento, indicadores de exigência dos grupos de IBS e de CBS, alíquotas, o cClassTrib da nota referenciada e datas de vigência separadas para IBS e para CBS. Exemplo de leitura — código 4, "crédito presumido da aquisição de bens móveis usados de pessoa física não contribuinte para revenda", art. 171: Apropria via NF? = 1 · Apropria via evento? = 0 · ind_DeduzCredPres = 1 · exige os grupos de IBS e de CBS · alíquota = "alíquota efetiva" nos dois tributos · cClass nota referenciada = 410017 · vigência a partir de 01/01/2027 para IBS e CBS. A apropriação do crédito, os eventos e a conta-corrente por operação ficam nos Módulos 5 e 6
Fontes: Tabela cCredPres (IT 2025.002 v1.70), aba cCredPres — estrutura e linha 4 conferidas · NT v1.52, leiaute UB120 a UB130 e RV UB54a-10
37. O Imposto Seletivo no documento: posição e campos
O IS ocupa o ramo IS (UB01), irmão do ramo IBSCBS e não parte dele. Campos previstos no leiaute: CSTIS (3 posições), cClassTribIS (6 posições), vBCIS, pIS (alíquota ad valorem), pISEspec (alíquota específica, ad rem), uTrib, qTrib e vIS. Base de cálculo conferida na regra UB05-10: somam-se vProd, vServ, vFrete, vSeg, vOutro e vII, e subtraem-se vDesc, vPIS, vCOFINS, vICMS, vICMSUFDest, vFCP, vFCPUFDest, vICMSMono e vISSQN — ou seja, base própria, diferente da base do IBS e da CBS. Três distinções que precisam ficar ditas: o IS tem base própria; tem tabelas próprias; e não se confunde com crédito de IBS/CBS — o IS tem tratamento próprio e compõe a base de IBS/CBS prevista para a operação, como parcela (+) vIS da composição que a UB16-10 publicava — regra removida pela NT 2026.008 v1.00; a apropriação de crédito desses tributos depende das condições legais aplicáveis. Não se promete crédito automático nem se deduz vedação geral ao crédito de IBS/CBS a partir da existência de IS. PENDENTE DE IMPLEMENTAÇÃO TÉCNICA: as tabelas de NCM sujeitos ao IS e de cClassTribIS constam como "tabela a ser publicada" — nenhum código será apresentado
Fontes: NT v1.52 — leiaute UB01 a UB11 e RV UB05-10 · IT v1.70, seção 02
38. O que já existe e o que ainda não está ligado no IS
Fórmulas previstas: vIS = vBCIS × (pIS / 100) e, havendo alíquota específica, vIS = vBCIS × (pIS / 100) + qTrib × (pISEspec / 100), com tolerância de 0,01. A alíquota específica é exigida quando o NCM do item for 2401, 2402, 2403, 2404, 2203, 2204, 2205, 2206 ou 2208. PENDENTE DE IMPLEMENTAÇÃO TÉCNICA: todas as regras de validação do grupo IS na NT v1.52 — UB01-10, UB01-20, UB01-30, UB02-10, UB03-10, UB05-10, UB06-10, UB07-10, UB08-10 e UB11-10 — trazem a nota "Implementação Futura". Mensagem final do bloco: existir campo no leiaute não é o mesmo que haver obrigação de preenchimento em produção. A estrutura está publicada; a exigência, não
Fontes: NT v1.52, RV UB01-10 a UB11-10 (todas com nota "Implementação Futura") e leiaute UB07
39. Exercício 2 — classificar cinco operações
Cinco operações, sem resposta no enunciado. Para cada uma, a dupla marca apenas dois campos: CST e cClassTrib. Os grupos que o XML passa a exigir e a proibir são lidos pela instrutora na correção.
#
Operação
CST
cClassTrib
Coluna, indicador ou dispositivo que fundamenta
1
Atacadista vende arroz da Cesta Básica Nacional de Alimentos, em NF-e



2
Escritório de contabilidade emite documento de honorários profissionais



3
Indústria exporta bem material, com suspensão



4
Distribuidora de energia elétrica realiza operação sujeita a diferimento



5
Imobiliária documenta locação de imóvel residencial




Instrução: cada resposta deve vir acompanhada da coluna da tabela, do indicador ou do dispositivo que a fundamenta. Gabarito no slide seguinte.
Fontes: Tabela cClassTrib e Tabela CST — códigos 200003, 200052, 550001, 510001 e 200027
Espaço para a sua resposta







40. Exercício 2 — correção comentada', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-118-apostila-02', 'CT-118', 'texto', 'Apostila — CST, cClassTrib e tributação no documento (parte 2/2)', 'Gabarito: (1) CST 200, cClassTrib 200003, art. 125 e Anexo I, pRed 100 → alíquota efetiva zero; ind_gIBSCBS = 1 exige o grupo padrão e ind_gRed = 1 exige o grupo de redução; diferimento e transferência de crédito proibidos; indNFe = 1 confirma o modelo. (2) CST 200, 200052, art. 127, I a XVIII, pRed 30 — e o ponto de virada: indNFe = 0 e indNFSe = 1, o documento é de serviço. (3) CST 550, 550001, art. 82; ind_gIBSCBS = 1; ind_gTribRegular = 1 exige a tributação regular, e as exceções das regras UB18-10 e UB56-10 determinam alíquota zero nesse caso. (4) CST 510, 510001, art. 28, §1º; ind_gDif = 1 torna o grupo de diferimento obrigatório e ind_gRed = 0 o proíbe. (5) CST 200, 200027, art. 261, parágrafo único, pRed 70, ANEXO 92611, indNFSe = 1. Fechamento: em todos os cinco, quem determinou a estrutura do XML foi a classificação, não o valor
Fontes: Tabela cClassTrib e Tabela CST (linhas dos cinco códigos) · NT v1.52, RV UB13-20, UB13-30, UB18-10, UB22-20, UB56-10
Anotações da correção', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-119-apostila-01', 'CT-119', 'texto', 'Apostila — NF-e e NFC-e na Reforma Tributária (parte 1/3)', 'MÓDULO 3 — NF-E E NFC-E NA REFORMA TRIBUTÁRIA
divisória no slide 41 · conteúdo nos slides 42 a 73
42. A ordem real do arquivo: como o XML se lê de cima a baixo
O XML não se lê por assunto, se lê por posição. Sequência real: bloco ide (identificação, onde ficam finNFe, cIndOp, dPrevEntrega, cMunFGIBS) → emit → dest → det, repetido por item, cada um com prod e depois imposto, e é dentro de imposto que estão IS e IBSCBS → total → transp, pag, infAdic. Consequência prática: o mesmo dado aparece duas vezes em posições distantes — uma no item e outra no total — e é essa distância que produz a maioria das divergências não percebidas. Quem confere pelo meio do arquivo perde o vínculo
Fontes: NT v1.52 — estrutura do leiaute: grupos B, C, E, I/M/UB, W
43. Cardinalidade: o que muda quando um grupo é aberto
Três notações e o que significam na prática: 1-1 obrigatório e único; 0-1 opcional, mas se existir, seus filhos obrigatórios passam a ser exigidos; 0-n repetível. Aplicação ao Grupo UB: IS é 0-1; IBSCBS é 0-1; dentro de gIBSCBS, os três filhos gIBSUF, gIBSMun e gCBS são 1-1 — abrir o grupo padrão obriga os três; já gDif, gDevTrib e gRed são 0-1 dentro de cada um. Regra de ouro do módulo: abrir um grupo não é um ato neutro — cada grupo aberto traz obrigações próprias e passa a ser conferido por regras próprias. Exemplo de efeito em cadeia: abrir gRed faz as regras de valor deixarem de usar a alíquota cheia e passarem a usar a alíquota efetiva
Fontes: NT v1.52 — coluna Ocorrência do leiaute UB01 a UB67
44. Do item ao total e o roteiro de conferência
Cada campo de total é a soma do campo correspondente dos itens, e há regra própria para cada par. A simetria que resume o bloco: se nenhum item tem IBS/CBS, informar o IBSCBSTot é rejeição (W34-10, msg 1118); se pelo menos um tem, omitir o total também é (W34-20, msg 1119). Sobre essa base, o roteiro de conferência em seis passos, que o aluno usará no exercício: 1) ler ide e identificar a espécie e o emitente; 2) em cada item, ler CST e cClassTrib e conferir se o código é admitido no modelo; 3) conferir se os grupos abertos correspondem ao que a classificação permite ou exige; 4) refazer alíquota efetiva e valor de cada tributo no item; 5) somar os itens e comparar campo a campo com o bloco total; 6) separar o que é erro do que é regra ainda não aplicada
Fontes: NT v1.52 — RV W34-10, W34-20, W35-10, W41-10, W47-10, W56-10
45. Campos do cabeçalho que alteram o tratamento tributário
Campos do nível nota com efeito em IBS e CBS: dPrevEntrega (B10a) e cMunFGIBS (B12a); finNFe (B25), que define a espécie; cIndOp (B25d), código indicador do local da operação de fornecimento, com preenchimento obrigatório em duas hipóteses expressas — leilão judicial ou licitação promovida pelo poder público (cIndOp = 010104) e constatação de irregularidade por falta de documentação fiscal ou acobertamento por documentação inidônea (cIndOp = 010105); gCompraGov (BB01), com tpEnteGov (BB02), pRedutor (BB03), tpOperGov (BB04) e refDFeAnt (BB05); e gPagAntecipado (BC01). Duas regras correlatas: B25d-30 (msg 1110) torna o grupo de Local de Retirada obrigatório quando o cIndOp for 010104 ou 010105; e o pRedutor do gCompraGov entra na fórmula da alíquota efetiva de todos os três tributos
Fontes: NT v1.52 — leiaute B10a, B12a, B25, B25d, BB01–BB05, BC01; RV B25d-30
46. Disponível, permitido, obrigatório — e efetivamente aplicado
Quatro estados distintos. Campo disponível: existe no schema, de modo que sua presença não quebra a estrutura do arquivo — mas isso não significa que o documento será aceito: o conteúdo informado ainda passa por regras de classificação, de contexto, de modelo de documento e de cálculo, e qualquer uma delas pode rejeitar. Preenchimento permitido: a classificação autoriza sem exigir. Preenchimento obrigatório: há regra que rejeita a ausência. Regra publicada mas ainda não aplicada: a própria NT registra que as validações "serão aplicadas exclusivamente nos documentos fiscais que contenham o preenchimento dos campos" de IBS, CBS e IS — se os campos não forem preenchidos, as validações específicas não são executadas. E a regra que exigiria o grupo de forma geral, a UB12-10, teve o cronograma alterado na v1.52, com a obrigatoriedade em produção passada a "implementação futura". Conclusão: não se pode afirmar que o Grupo UB está obrigatório para todos os contribuintes
Fontes: NT v1.52 — notas de rodapé do cronograma; RV UB12-10
47. Emissão por contribuinte exclusivo do IBS/CBS
A NT 2026.007 v1.10 da NF-e permite que contribuintes exclusivos do IBS/CBS — não contribuintes do ICMS — emitam NF-e sem Inscrição Estadual. Definição literal: é exclusivo quem, simultaneamente, não informa emit/IE, tem CNPJ com situação cadastral "Ativa" na RFB e não possui IE habilitada para ICMS na UF do emitente, conforme consulta ao CCC. O campo IE (C17) passou a ocorrência 0-1 e a regra C17-10 foi excluída. Consequências, todas restritas a essa hipótese: autorização somente pela SVRS (C17-11, msg 166); CNPJ obrigatório (C17-43, msg 157); IEST proibida (C18-50, msg 158); ICMS e ICMSUFDest proibidos (N01-10, msg 161); grupo IBSCBS obrigatório (UB12-11, msg 162); CFOP restrito à tabela do Portal Nacional, coluna indExcIBSCBS (I08-191, msg 159). Cronograma próprio, já atualizado: homologação em 26/10/2026 e produção em 16/11/2026, conforme o aviso oficial do Portal Nacional da NF-e de 05/10/2026, que postergou as datas de 05/10/2026 e 03/11/2026 constantes da própria NT. Operações citadas pela própria NT: alienação de bens do ativo imobilizado e transferências de bens entre estabelecimentos. A tabela de CFOP e a coluna estão conferidas em fonte oficial: o Informe Técnico 2023.002, versão 2.00, de agosto de 2026, registra no controle de versões a "Inclusão da coluna indExcIBSCBS, que identifica os CFOP autorizados na emissão de NF-e (modelo 55) por contribuinte exclusivo do IBS/CBS, previstos na NT 2026.007 da NF-e", com homologação em 01/09/2026 e produção em 03/11/2026. O Informe Técnico 2023.002 registra o cronograma originalmente associado à inclusão da coluna indExcIBSCBS. Para a implantação das regras da NT 2026.007 v1.10, prevalece o aviso oficial de 05/10/2026: homologação em 26/10/2026 e produção em 16/11/2026. O aviso não menciona o Informe Técnico nem o altera formalmente. A descrição literal da coluna, na seção 02 do IT: "indExcIBSCBS — Indica se o CFOP é permitido na NF-e (modelo 55) emitida por contribuinte exclusivo do IBS/CBS", situação "Nova". A versão vigente é a 2.10, de setembro de 2026, que apenas acrescentou as colunas Título e Descrição, reproduzindo o Anexo II do Convênio SINIEF s/nº de 15/12/1970, e que declara não alterar "as demais colunas nem os indicadores já publicados" O que a versão 1.10, de setembro de 2026, alterou: orientação para utilizar sempre a LCC-RFB do ambiente de Produção, inclusive nos Web Services de Homologação; ajustes nas regras 12C02-10, 12C02-20, 12C21-20, 1P10-30, 1P10-32, 12E02-10/20, 12F02-10/20 e 12G02-10/20, para permitir testes em Homologação; melhoria na redação da C17-20; e correção da 1C17-04. A definição de contribuinte exclusivo e as consequências acima não foram alteradas. A caracterização do contribuinte exclusivo e as validações cadastrais consideram a Lista Centralizada de Contribuintes da Receita Federal (LCC-RFB) e o Cadastro Centralizado de Contribuintes (CCC), conforme as regras da NT 2026.007 v1.10.
Fontes: NT 2026.007 v1.10 da NF-e — seções 1, 2, 3.1, 4.1; RV C17-10/11/42/43, C18-50, N01-10, UB12-11, I08-191, B02-10, B25-90, C12-10 · Informe Técnico 2023.002 v.2.10, Portal Nacional da NF-e — controle de versões e seção 02, Tabela de CFOP [PRIMÁRIA] · Aviso do Portal Nacional da NF-e de 05/10/2026 · Ato Técnico Conjunto RFB/SUFIS/CGIBS nº 8/2026, de 29/09/2026 [PRIMÁRIA]
48. gIBSCBS e a base única do item
O grupo gIBSCBS (UB15) carrega um único campo próprio — vBC (UB16), 13v2 — e dele descem os três filhos 1-1: gIBSUF, gIBSMun e gCBS. A base é uma só para os dois tributos. Sua composição está na UB16-10 (msg 1104): soma vProd, vServ, vFrete, vSeg, vOutro, vII e vIS; subtrai vDesc, vPIS, vCOFINS, vICMS, vICMSUFDest, vFCP, vFCPUFDest, vICMSMono e vISSQN — trazia a nota literal "Implementação Futura, aguardando orientação normativa" e foi removida pela NT 2026.008 v1.00 — a disciplina legal da base permanece; o que deixou de existir é a validação. A existência do grupo é governada pelo indicador do CST: informá-lo quando vedado gera a UB13-20 (msg 1021); omiti-lo quando exigido gera a UB13-30 (msg 1022) — esta com exceção expressa para uma espécie de nota de débito
Fontes: NT v1.52 — leiaute UB15, UB16; RV UB13-20, UB13-30, UB16-10 · NT 2026.008 v1.00
49. IBS estadual: alíquota, valor e as parcelas que o reduzem
gIBSUF (UB17): pIBSUF (UB18) e vIBSUF (UB35). Regra de alíquota: UB18-10 (msg 1026). Regra de valor: UB35-10 (msg 1041) — vIBSUF = (vBC × pIBSUF/100) − vDif − vDevTrib, com tolerância de 0,01 e a observação de que, havendo gRed, a alíquota usada passa a ser pAliqEfet. Subgrupos 0-1: gDif (UB21), gDevTrib (UB24) e gRed (UB26). Se o CST não permitir redução, abrir o gRed estadual é rejeição pela UB26-10 (msg 1032)
Fontes: NT v1.52 — leiaute UB17, UB18, UB21, UB24, UB26, UB35; RV UB18-10, UB26-10, UB35-10
50. IBS municipal e o fechamento do vIBS
gIBSMun (UB36): pIBSMun (UB37) e vIBSMun (UB54). Regra de alíquota: UB37-10 (msg 1036). Regra de valor: UB54-10 (msg 1052) — "Valor do IBS Municipal difere do calculado": vIBSMun = (vBC × pIBSMun/100) − vDif − vDevTrib, com tolerância de 0,01 e uso da pAliqEfet quando houver gRed. Atenção ao identificador: a UB47-10 (msg 1047) não valida o valor — ela valida a alíquota efetiva municipal, campo pAliqEfet (UB47) do grupo gIBSMun/gRed. Abrir o gRed municipal quando vedado é rejeição pela UB45-10 (msg 1007). O item se fecha em vIBS (UB54a), validado pela UB54a-10 (msg 1150): vIBS = vIBSUF + vIBSMun, subtraindo o vCredPres apenas quando o cCredPres utilizado tiver o indicador de dedução — e a tabela oficial mostra que esse indicador varia por código
Fontes: NT v1.52 — leiaute UB36, UB37, UB45, UB47, UB54, UB54a; RV UB37-10, UB45-10, UB47-10, UB54-10, UB54a-10 · Tabela cCredPres (IT 2025.002 v1.70), coluna ind_DeduzCredPres
51. CBS: alíquota, valor e as exceções da regra
gCBS (UB55): pCBS (UB56) e vCBS (UB67). Regra de alíquota: UB56-10 (msg 1037). Regra de valor: UB67-10 (msg 1069) — vCBS = (vBC × pCBS/100) − vDif − vDevTrib, tolerância de 0,01, usando pAliqEfet quando houver gRed. Subgrupos: gDif (UB59), gDevTrib (UB62), gRed (UB64) — este último com a vedação da UB64-10 (msg 1028) — e o exclusivo gALCZFMCBS (UB66a), com tpALCZFMCBS, nProcSuframa, pAliqEfetRegCBS e vTribRegCBS. A UB56-10 traz três ressalvas que precisam ser lidas como tais: alíquota zero quando o cClassTrib tiver indicador de tributação regular; não aplicação em uma espécie específica de nota de crédito — ressalva registrada aqui apenas como limite da regra, sendo a espécie tratada no M5; e possibilidade de alíquota zero em áreas incentivadas, sujeita a duas condições cumulativas da própria regra — Condição 01: o NCM do produto não iniciar por 93 (armas e munições), 24 (fumos e derivados), 2203 a 2208 (bebidas alcoólicas), 8703 (automóveis de passageiros) nem 33, exceto 3303 a 3307 (perfumaria e toucador); Condição 02: emitente e destinatário na mesma área incentivada, conforme a relação de municípios da ZFM e das ALC na própria regra. A enumeração acima é resumo: o requisito completo se confere na UB56-10. A UB56-10 vale para 2025 e 2026; a partir de 2027 aplica-se a UB56-20 — regras de períodos distintos, que não se misturam
Fontes: NT v1.52 — leiaute UB55, UB56, UB59, UB62, UB64, UB66a–UB67; RV UB56-10, UB64-10, UB67-10
52. gRed nas três posições
O grupo gRed aparece três vezes, sempre com dois campos — pRedAliq, que vem da tabela, e pAliqEfet, que é resultado de cálculo, ambos no formato 3v2-4: gIBSUF/gRed (UB26, com UB27 e UB28), gIBSMun/gRed (UB45, com UB46 e UB47) e gCBS/gRed (UB64, com UB65 e UB66). Cada posição tem sua própria regra de conferência da alíquota efetiva: UB28-10 (msg 1035), UB47-10 (msg 1047) e UB66-10 (msg 1064). As três exigem o mesmo: 4 casas decimais, com arredondamento na última. E as três incorporam o pRedutor do gCompraGov como segundo fator, quando esse grupo existir
Fontes: NT v1.52 — leiaute UB26–UB28, UB45–UB47, UB64–UB66; RV UB28-10, UB47-10, UB66-10
53. gDif e gDevTrib: as duas parcelas que abatem o valor
gDif (UB21, UB40, UB59): pDif e vDif, com a UB23-10 (msg 1031) — vDif = vBC × (alíquota/100) × (pDif/100), usando a alíquota efetiva quando houver gRed. Existência governada pelo indicador: informado indevidamente, UB22-10 (msg 1029); ausente quando exigido, UB22-20 (msg 1030). gDevTrib aparece nos três ramos do leiaute — UB24 no IBS da UF, UB43 no IBS municipal e UB62 na CBS —, mas existir no schema não significa uso permitido nos três. A UB24-10 (msg 1111) e a UB43-10 (msg 1112) rejeitam os grupos de devolução do IBS da UF e do IBS municipal como informados indevidamente. Na CBS, a UB62-10 (msg 1187) rejeita o grupo na NFC-e; no modelo 55 ele é disciplinado pela UB62a-10 (msg 1188), que exige o pDevTrib, e pela UB63-10 (msg 1189): vDevTrib = vBC × (pCBS/100) × (pDevTrib/100), com a alíquota efetiva quando houver gRed. Não se oferece preenchimento operacional de gDevTrib de IBS só porque o grupo consta do schema. Ponto de conferência: as duas parcelas entram como subtração nas fórmulas de valor dos três tributos, e é por isso que um vDif errado derruba o vIBSUF, o vIBSMun ou o vCBS sem que o erro pareça estar ali
Fontes: NT v1.52 — leiaute UB21–UB24, UB40–UB44, UB59–UB63; RV UB22-10, UB22-20, UB23-10, UB63-10
54. gTribRegular e gTribCompraGov: os grupos de contexto
gTribRegular (UB68) declara quanto seria devido se a condição suspensiva ou resolutória não se cumprisse: CSTReg, cClassTribReg e os pares pAliqEfetRegIBSUF/vTribRegIBSUF (UB71), pAliqEfetRegIBSMun/vTribRegIBSMun (UB72a) e pAliqEfetRegCBS/vTribRegCBS (UB72c). Sua ausência, quando o cClassTrib o exige, é rejeição pela UB68-10 (msg 1065). Efeito colateral que confunde: quando o indicador de tributação regular vale 1, as alíquotas do grupo principal devem ser zero — é a exceção 1 das regras UB18-10 e UB56-10. gTribCompraGov (UB82a) registra a composição do valor em compras governamentais, com os pares de alíquota e valor por tributo. Os dois grupos não têm a mesma função. O gTribRegular declara como seria a tributação caso não cumprida a condição resolutória ou suspensiva, nas hipóteses próprias. O gTribCompraGov registra a composição do valor do IBS e da CBS nas compras governamentais — a descrição do leiaute manda informá-lo somente nessa hipótese. Funções distintas, sem objetivo comum e sem equiparação ao "tributo que deixou de ser cobrado"
Fontes: NT v1.52 — leiaute UB68–UB72c, UB82a; RV UB68-10, UB18-10, UB56-10
55. Os demais grupos: posição na árvore e status
Posição, tag e uma linha de finalidade: gIBSCBSMono (UB84), raiz da monofasia, com quatro ramos — gIBSMonoAdRem, gIBSMonoAdValorem, gCBSMonoAdRem, gCBSMonoAdValorem — cujas regras de exigência (UB13-40) estão marcadas como implementação futura em produção e em homologação. gTransfCred (UB106). gAjusteCompet (UB112). gEstornoCred (UB116). gCredPresOper (UB120) e gCredPresIBSZFM (UB131). O funcionamento de cada um é do M5 e do M6; aqui interessa saber onde procurá-los no arquivo. Uma linha de reafirmação: PENDENTE DE VALIDAÇÃO — o indicador ind_RedutorBC continua sem grupo ou campo correspondente no leiaute da NF-e
Fontes: NT v1.52 — leiaute UB84, UB106, UB112, UB116, UB120, UB131; RV UB13-40
56. O grupo IS no XML: posição, campos e status técnico
Posição: o grupo IS (UB01) é filho direto de det/imposto, irmão do IBSCBS, ocorrência 0-1. Campos com identificador e formato: CSTIS (UB02, 3), cClassTribIS (UB03, 6), vBCIS (UB05, 13v2), pIS (UB06, 3v2-4), pISEspec (UB07, 3v2-4), uTrib (UB09, 1-6), qTrib (UB10, 11v0-4), vIS (UB11, 13v2). No total, ISTot (W31) com vIS (W33), regido pela mesma simetria dos demais totais (W31-10, msg 1073, e W31-20, msg 1117). Status técnico — PENDENTE DE IMPLEMENTAÇÃO TÉCNICA: todas as dez regras do grupo IS na NT v1.52 trazem a nota literal "Implementação Futura", e, nas fontes e tabelas técnicas consultadas nesta base, os Anexos I e II da própria NT constam como "Tabela a ser publicada" — ao contrário dos Anexos III e IV, que remetem a tabelas efetivamente publicadas no Portal Nacional. Conclusão, limitada a essa base: não há aqui código, alíquota ou NCM do IS para preencher
Fontes: NT v1.52 — leiaute UB01–UB11, W31–W33; RV UB01-10 a UB11-10, W31-10, W31-20; Anexos I a IV
57. XML comentado 1 — tributação integral
<det nItem="1">
 <imposto>
  <IBSCBS>
   <CST>000</CST>
   <cClassTrib>000001</cClassTrib>
   <gIBSCBS>
    <vBC>10000.00</vBC>
    <gIBSUF>
     <pIBSUF>0.1000</pIBSUF>
     <vIBSUF>10.00</vIBSUF>
    </gIBSUF>
    <gIBSMun>
     <pIBSMun>0.0000</pIBSMun>
     <vIBSMun>0.00</vIBSMun>
    </gIBSMun>
    <vIBS>10.00</vIBS>
    <gCBS>
     <pCBS>0.9000</pCBS>
     <vCBS>90.00</vCBS>
    </gCBS>
   </gIBSCBS>
  </IBSCBS>
 </imposto>
</det>

Três leituras de margem — ① não há gRed nem gDif: o CST 000 tem ind_gRed = 0 e ind_gDif = 0, e o indicador não os permite · ② os três filhos do gIBSCBS — gIBSUF, gIBSMun e gCBS — estão presentes porque são 1-1 · ③ vIBS é a soma de vIBSUF e vIBSMun.
Trecho didático, não documento pronto para autorização. As alíquotas usadas são as do caso do exercício 3 e servem só para a leitura; as vigentes vêm da tabela de alíquotas do IBS e da CBS.
Fontes: NT v1.52 — leiaute UB12–UB67 · Tabela cClassTrib, código 000001
58. XML comentado 2 — redução de alíquota
Mesmo esqueleto do slide anterior, com CST 200 e cClassTrib 200047 — Bares e Restaurantes, pRedIBS = pRedCBS = 40, indNFe = 1.
<IBSCBS>
 <CST>200</CST>
 <cClassTrib>200047</cClassTrib>
 <gIBSCBS>
  <vBC>20000.00</vBC>
  <gIBSUF>
   <pIBSUF>0.1000</pIBSUF>
   <gRed>
    <pRedAliq>40.00</pRedAliq>
    <pAliqEfet>0.0600</pAliqEfet>
   </gRed>
   <vIBSUF>12.00</vIBSUF>
  </gIBSUF>
  <!-- gIBSMun: mesma estrutura, com pIBSMun 0.0000, gRed 40.00 / 0.0000 e vIBSMun 0.00 -->
  <vIBS>12.00</vIBS>
  <gCBS>
   <pCBS>0.9000</pCBS>
   <gRed>
    <pRedAliq>40.00</pRedAliq>
    <pAliqEfet>0.5400</pAliqEfet>
   </gRed>
   <vCBS>108.00</vCBS>
  </gCBS>
 </gIBSCBS>
</IBSCBS>

Três comentários — ① o gRed só pode existir porque o indicador ind_gRed do CST 200 o exige · ② a alíquota efetiva é informada com 4 casas, com arredondamento na última · ③ a partir daí as regras de valor deixam de usar a alíquota cheia: vIBSUF pela UB35-10, vIBSMun pela UB54-10 e vCBS pela UB67-10, todas com a observação de uso da pAliqEfet.
Trecho didático, não documento pronto para autorização.
Fontes: NT v1.52 — leiaute UB26–UB28, UB45–UB47, UB64–UB66; RV UB28-10, UB35-10, UB47-10, UB54-10, UB66-10, UB67-10 · Tabela cClassTrib, código 200047
59. XML comentado 3 — grupo exigido pela classificação e a totalização', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-119-apostila-02', 'CT-119', 'texto', 'Apostila — NF-e e NFC-e na Reforma Tributária (parte 2/3)', 'CST 550 com cClassTrib 550001 — Exportações de bens materiais, ind_gTribRegular = 1, indNFe = 1. A classificação exige o grupo gTribRegular, cuja ausência é rejeitada pela UB68-10 (msg 1065); e, pela exceção 1 das regras UB18-10 e UB56-10, as alíquotas do grupo principal ficam em zero.
<gIBSCBS>
 <vBC>30000.00</vBC>
 <gIBSUF><pIBSUF>0.0000</pIBSUF><vIBSUF>0.00</vIBSUF></gIBSUF>
 <gIBSMun><pIBSMun>0.0000</pIBSMun><vIBSMun>0.00</vIBSMun></gIBSMun>
 <vIBS>0.00</vIBS>
 <gCBS><pCBS>0.0000</pCBS><vCBS>0.00</vCBS></gCBS>
 <gTribRegular>
  <CSTReg>000</CSTReg>
  <cClassTribReg>000001</cClassTribReg>
  <pAliqEfetRegIBSUF>0.1000</pAliqEfetRegIBSUF>
  <vTribRegIBSUF>30.00</vTribRegIBSUF>
  <pAliqEfetRegIBSMun>0.0000</pAliqEfetRegIBSMun>
  <vTribRegIBSMun>0.00</vTribRegIBSMun>
  <pAliqEfetRegCBS>0.9000</pAliqEfetRegCBS>
  <vTribRegCBS>270.00</vTribRegCBS>
 </gTribRegular>
</gIBSCBS>
 
<total>
 <IBSCBSTot>
  <vBCIBSCBS>30000.00</vBCIBSCBS>
  <gIBS>
   <gIBSUF><vDif>0.00</vDif><vDevTrib>0.00</vDevTrib><vIBSUF>0.00</vIBSUF></gIBSUF>
   <gIBSMun><vDif>0.00</vDif><vDevTrib>0.00</vDevTrib><vIBSMun>0.00</vIBSMun></gIBSMun>
   <vIBS>0.00</vIBS>
  </gIBS>
  <gCBS><vDif>0.00</vDif><vDevTrib>0.00</vDevTrib><vCBS>0.00</vCBS></gCBS>
 </IBSCBSTot>
</total>

Comentário de fechamento: este é o formato da conferência — ler o item, ler o total, comparar campo a campo, exatamente o passo 5 do roteiro. O gTribRegular informa como seria a tributação caso não cumprida a condição resolutória ou suspensiva; ele não compõe os totais.
Trecho didático, não documento pronto para autorização.
Fontes: NT v1.52 — leiaute UB68–UB72c, W34–W56; RV UB68-10, UB18-10, UB56-10, W35-10, W41-10, W47-10, W56-10 · Tabela cClassTrib, código 550001
60. Os totais do IBS
gIBSUF (W37): vDif (W38), vDevTrib (W39), vIBSUF (W41). gIBSMun (W42): vDif (W43), vDevTrib (W44), vIBSMun (W46). No nível acima, em gIBS (W36): vIBS (W47), vCredPres (W48) e vCredPresCondSus (W49). Cada campo tem regra própria de soma: W38-10 (1077), W39-10 (1078), W41-10 (1080), W43-10 (1081), W44-10 (1082), W47-10 (1085) e W48-10 (1086). Vantagem prática dessa granularidade: a rejeição aponta qual campo divergiu, o que reduz a busca do item defeituoso
Fontes: NT v1.52 — leiaute W36–W49; RV W38-10, W39-10, W41-10, W43-10, W44-10, W47-10, W48-10
61. Os totais da CBS, da monofasia e do estorno
gCBS (W50): vDif (W53), vDevTrib (W54), vCBS (W56), vCredPres (W56a), vCredPresCondSus (W56b) — regras W53-10 (1088), W54-10 (1089), W56-10 (1091) e W56a-10 (1087). gMono (W57): vIBSMono (W58), vCBSMono (W59), vIBSMonoReten (W59a), vCBSMonoReten (W59b), vIBSMonoRet (W59c), vCBSMonoRet (W59d). gEstornoCred (W59e): vIBSEstCred (W59f) e vCBSEstCred (W59g). Escopo: monofasia e estorno aparecem aqui como estrutura de totalização; sua mecânica é do M5 e do M6
Fontes: NT v1.52 — leiaute W50–W59g; RV W53-10, W54-10, W56-10, W56a-10
62. vNFTot e os três valores que não se confundem
Valor do item é vItem (VB01). Valor dos tributos são vIBS, vCBS e vIS. Valor total da nota com os novos tributos é vNFTot (W60), que coexiste com o vNF tradicional e não o substitui — ocorrência 0-1, ou seja, não é de preenchimento obrigatório. A regra W60-10 (msg 1094) determina que o vNFTot, quando informado, seja a soma dos vItem, e traz a observação literal "Implementação futura". Para a conferência: quando informado, é o campo que mostra o efeito financeiro dos novos tributos no documento A NT 2026.008 v1.00 esclarece que, por já estarem compreendidos no vProd, os valores do IBS e da CBS não são adicionados novamente na composição do valor total da NF-e, evitando duplicidade; os valores permanecem destacados nos respectivos grupos tributários, com caráter informativo.
Fontes: NT v1.52 — leiaute W60, VB01; RV W60-10
63. Quando os novos tributos entram no valor
Regra jurídica: o IBS e a CBS são calculados por fora e não integram as próprias bases de cálculo. Para o preenchimento da NF-e e da NFC-e, a NT 2026.008 v1.00 determina que seus valores sejam acrescidos ao valor do produto ou serviço, compondo o campo vProd — e essa inclusão não implica inclusão na base de cálculo desses tributos. Regra de leiaute: o vProd (I11) é o Valor Total Bruto dos Produtos ou Serviços e, conforme a observação incluída pela NT 2026.008 v1.00, a partir de 2027 os valores de IBS, CBS e IS passam a compor esse valor bruto, exceto nas notas de importação. O vItem (VB01) tem fórmula que soma o vProd — que já contém vIBS, vCBS e vIS — e também vIBS, vCBS, vIS, vTotIBSMonoItem e vTotCBSMonoItem, com a exceção literal "Em 2025 e 2026 não somar" esses cinco valores. Regra de validação: a VB01-05 (msg 1137) está marcada como "Implementação Futura" e, com a NT 2026.008 v1.00, a VB01-10 e a VB01-20 (msg 1105) foram alteradas e passaram a trazer a mesma observação — nenhuma das três rejeita hoje. Leitura segura: os campos são preenchidos desde já, o efeito no valor do item é escalonado, e a validação da ausência do vItem ainda não está ativaQuatro valores que não se confundem, na redação da NT 2026.008 v1.00: (a) valor líquido unitário do produto ou serviço, sem tributos — vUnComLiq (I11b); (b) valor líquido do produto ou serviço, sem tributos — vProdLiq (I11c), com o totalizador vProdLiqTot (W01a), soma dos vProdLiq dos itens; (c) valor bruto do produto — vProd (I11), que a partir de 2027 já contém IBS, CBS e IS; e (d) valor total do item — vItem (VB01). A base de cálculo do IBS e da CBS — vBC (UB16) — é determinada pela legislação e não se confunde com nenhum deles: são tributos que compõem o valor informado sem integrarem a própria base. Regras de validação criadas: I11c-10 (valor líquido do produto não informado — com a observação "Implementação futura"), I11c-20 (vProdLiq diferente de vUnComLiq × qCom, com tolerância de 0,01), W01a-10 e W01a-20 (total líquido não informado ou diferente do somatório dos itens). Cronograma de implantação da NT: homologação em 26/10/2026 e produção em 16/11/2026, pelo aviso oficial de 05/10/2026, que postergou as datas de 05/10/2026 e 03/11/2026 constantes da própria NT. Esse cronograma é o da Nota Técnica e não se sobrepõe ao marcador próprio de cada regra: a I11c-10 permanece com a observação "Implementação futura". A regra NB01-30 tem cronograma próprio: homologação em 01/02/2027 e produção em 01/03/2027.
Fontes: NT v1.52 — leiaute VB01, W31, W34; RV VB01-05, VB01-10, VB01-20 · NT 2026.008 v1.00 — Grupos I, NB e W; RV I11c-10, I11c-20, NB01-10, NB01-20, NB01-30, W01a-10, W01a-20, VB01-10, VB01-20, B25-80 · Aviso do Portal Nacional da NF-e de 05/10/2026
64. NF-e × NFC-e: as cinco vedações da NFC-e
Quadro comparativo com as cinco vedações conferidas: referenciamento — a NFC-e não pode referenciar outros documentos (VC02-04, msg 708); crédito presumido da operação — proibido (UB120-10, msg 1049); código indicador do local da operação — o cIndOp não é permitido (B25d-10, msg 1099); compra governamental — o gCompraGov informado na NFC-e é rejeição (BB01-10, msg 1006); contribuinte exclusivo do IBS/CBS — proibido emitir NFC-e, com a exceção literal de que a regra não se aplica a partir de 2033 (C17-42, msg 156). Na NF-e, ao contrário, a ausência de IE do emitente passou a caracterizar o contribuinte exclusivo
Fontes: NT v1.52 — RV VC02-04, UB120-10, B25d-10, BB01-10 · NT 2026.007 v1.10 da NF-e — RV C17-42
65. NFC-e: o que se mantém e o limite por UF
Idêntico nos dois modelos: a estrutura do Grupo UB no item; a validade do cClassTrib, com a ressalva de que o código precisa ter indNFCe = 1 para o modelo 65 (UB14-25, msg 1025); e todo o bloco de totalização, cujas regras são aplicáveis a "55/65". Identificação do consumidor: a NT 2026.002 da NF-e, na versão vigente 1.10a, de 25/08/2026, alterou a regra W16-40 para que cada UF defina o valor limite de emissão de NFC-e sem identificação do destinatário, prevendo tabela de limites por UF e mantendo, na ausência de definição, o limite de R$ 10.000,00. A versão 1.10a não alterou essa regra: seu objeto foi apenas a regra BA10-20, de contranota de produtor, assunto fora deste curso. Aplicação do roteiro do slide 44 à NFC-e: os seis passos valem integralmente, com a diferença de que os passos de referenciamento não se aplicam
Fontes: NT v1.52 — RV UB14-25 e regras de total "55/65" · NT 2026.002 v.1.10a da NF-e, de 25/08/2026 — RV W16-40
66. Referenciamento no nível da nota
O Grupo BA — Documento Fiscal Referenciado é o referenciamento no nível da nota, pela tag NFref / refNFe, posicionado no bloco ide. A NT v1.52 registra literalmente que esse grupo está "Sem alterações" — a Reforma não o modificou. As regras que o cercam estão no bloco 3A (Banco de Dados: NF-e Referenciada), entre elas a 3BA02-10 (msg 267), que rejeita chave de acesso referenciada inexistente. Aqui interessa apenas onde a chave aparece no arquivo e como conferi-la; as hipóteses concretas de uso são do Módulo 5
Fontes: NT v1.52 — Grupo BA ("Sem alterações"); RV 3BA02-10
67. Referenciamento no nível do item
O grupo DFeReferenciado (VC01) fica dentro do item, com dois campos: chaveAcesso (VC02), 44 posições, ocorrência 1-1, e nItem (VC03), 3 posições, ocorrência 0-1, correspondente ao atributo nItem do elemento det do documento original. Extensão exata da VC02-05 (msg 1010), reproduzida: aplica-se ao modelo 55 e dispõe que, "se item possui DFe referenciado (tag: DFeReferenciado/chaveAcesso)", é rejeição "existe documento referenciado a nível de nota (tag: NFref)". O texto da regra não traz exceção, condição de finalidade nem restrição adicional — a exclusividade, tal como redigida, é plena dentro do modelo 55. No modelo 65 a questão não se coloca, porque a VC02-04 veda o referenciamento por item. Duas regras vizinhas, citadas apenas como estrutura: VC02-20 (msg 1072), duplicidade de chave e item, e VC02-30 (msg 1130), que exige documento único, com exceções que dependem da espécie do documento — espécies tratadas no M5
Fontes: NT v1.52 — leiaute VC01–VC03; RV VC02-04, VC02-05 (texto integral), VC02-20, VC02-30
68. NF-e ABI: obrigatoriedade jurídica e leiaute técnico são coisas distintas
Plano jurídico — confirmado: a Nota Fiscal Eletrônica de Alienação de Bens Imóveis, NF-e ABI, modelo 77 está relacionada no art. 1º, XVIII, do Ato Conjunto RFB/CGIBS nº 4/2026, com obrigatoriedade a partir de 1º de dezembro de 2026. A tabela cClassTrib traz a coluna indNFeABI, definida no IT 2025.002 v1.70, com 20 códigos marcados. Plano técnico — PENDENTE DE IMPLEMENTAÇÃO TÉCNICA: a NT 2025.002 v1.52 não menciona o modelo 77 em nenhum ponto, e nem o Ato Técnico Conjunto RFB/CGIBS nº 1/2026 nem o Ato Técnico Conjunto RFB/SUFIS/CGIBS nº 8/2026, de 29/09/2026, aprovam ou ratificam documentação técnica para esse modelo — seus arts. 1º e 2º relacionam NF-e 55, NFC-e 65, CT-e 57, CT-e OS 67, GTV-e 64, BP-e 63, NF3e 66, NFCom 62, NFGás 76 e NFAg 75. Estar relacionado no ato normativo não significa que o modelo já esteja operacional: sem leiaute aprovado, não há campo, regra de validação nem estrutura a ensinar. Posição no ecossistema: é documento irmão da NF-e, não uma finalidade dela
Fontes: Ato Conjunto nº 4/2026, art. 1º, XVIII · IT 2025.002 v1.70, definição de indNFeABI · Ato Técnico Conjunto nº 1/2026, arts. 1º e 2º · NT 2025.002 v1.52 (ausência conferida) · Ato Técnico Conjunto RFB/SUFIS/CGIBS nº 8/2026 (relação dos modelos alcançados)
69. XML autorizado e representação gráfica
O que é transmitido e autorizado é o XML; o DANFE é representação gráfica dele. Texto literal do capítulo 9 da NT 2025.002 v1.52: "alterações no DANFE para exibir informações relativas aos novos tributos estão em estudo, e serão publicadas em uma nova versão desta Nota Técnica". Três esclarecimentos: não se pode afirmar que o DANFE já apresente os novos tributos em produção antes de 01/12/2026; a Nota Técnica SE/CGNFS-e nº 008 trata do DANFSe, documento auxiliar da NFS-e, e não resolve o DANFE da NF-e; e a NT 2026.007 da NF-e não trata de representação gráfica — seu objeto é cadastro, identificação do emitente e regras de validação. Conclusão operacional, que fecha o roteiro do slide 44: a conferência técnica se faz no XML, contra a versão vigente do leiaute Atualização: essa continua sendo a redação do capítulo 9 da NT 2025.002, inclusive na versão 1.52. A representação gráfica dos novos tributos passou a ser disciplinada pela NT 2026.010 v1.00, de outubro de 2026, que publicou o leiaute do DANFE modelo 55: novo bloco de totais "Total do IBS/CBS/IS" logo após o bloco "Total do ICMS/IPI"; Código do Regime Tributário (CRT) no quadro de identificação do emitente, com área reservada para o Tipo de Regime de Apuração do IBS e da CBS, cuja tag será publicada em nota técnica futura; e, no quadro dos produtos e serviços, cClassTrib, base de cálculo, alíquotas e valores do IBS UF, do IBS Município, da CBS e do Imposto Seletivo, exibindo-se a alíquota efetiva quando informado o grupo de redução. A NT indica implantação em produção em 01/12/2026 — leiaute publicado, produção futura: não se afirma que o novo DANFE já esteja disponível antes dessa data.
Fontes: NT v1.52, capítulo 9 (texto literal) · NT 2026.010 v1.00 — DANFE Reforma Tributária [PRIMÁRIA] · NT 2026.007 v1.10 da NF-e, seção 1 · Nota Técnica SE/CGNFS-e nº 008 (identificação do objeto)
70. Rejeições por causa — classificação e estrutura
Quatro causas, com mensagem, o que provocou e onde corrigir. Causa 1 — código inexistente ou par incompatível: UB13-10 (1020), UB14-10 (1023) e UB14-20 (1024) — corrigir conferindo os três primeiros dígitos. Causa 2 — código fora do modelo: UB14-25 (1025), que consulta indNFe ou indNFCe; e B25d-20 (1102) para o cIndOp. Causa 3 — grupo informado indevidamente: UB13-20 (1021) grupo padrão; UB22-10 (1029) diferimento estadual; UB26-10 (1032), UB45-10 (1007) e UB64-10 (1028) para as três posições do gRed; UB120-20 (1175) crédito presumido. Causa 4 — grupo obrigatório ausente: UB13-30 (1022) grupo padrão; UB22-20 (1030) diferimento; UB68-10 (1065) tributação regular
Fontes: NT v1.52 — RV UB13-10/20/30, UB14-10/20/25, UB22-10/20, UB26-10, UB45-10, UB64-10, UB68-10, UB120-20, B25d-20
71. Rejeições por causa — cálculo, total e regras ainda inativas
Causa 5 — alíquota incompatível: UB18-10 (1026) IBS da UF, UB37-10 (1036) IBS do Município, UB56-10 (1037) CBS. Causa 6 — alíquota efetiva incorreta: UB28-10 (1035) estadual, UB47-10 (1047) municipal, UB66-10 (1064) CBS — refazer com 4 casas e arredondamento na última. Causa 7 — valor do item divergente: UB35-10 (1041) vIBSUF, UB54-10 (1052) vIBSMun, UB67-10 (1069) vCBS, UB54a-10 (1150) vIBS, UB23-10 (1031) vDif — todas com tolerância de 0,01. Causa 8 — divergência entre item e total: W35-10, W41-10, W47-10, W56-10 e a simetria das W34-10 (1118) e W34-20 (1119). Causa 9 — regras ainda inativas ou com cronogramas distintos: UB12-10, UB13-40, VB01-05, W60-10, VB01-10 e VB01-20 permanecem sujeitas aos respectivos marcadores de implementação futura, assim como todas as do grupo IS — conhecê-las não é o mesmo que estar sujeito a elas hoje. A VC02-14 possui cronograma definido: produção em 16/11/2026, após o adiamento comunicado pelo Portal Nacional da NF-e em 05/10/2026. Publicação da versão, implantação da NT e ativação de cada regra de validação não são necessariamente o mesmo marco, e a data de 16/11/2026 não se estende às regras marcadas como implementação futura. A VB01-10 e a VB01-20 foram alteradas pela NT 2026.008 v1.00 e passaram a trazer a observação "Implementação Futura" — permanece a exceção literal que, em 2025 e 2026, afasta a soma desses valores ao vItem. Quanto à VC02-14, a NT 2025.002-RTC v1.52 mudou a implantação em produção de 05/10/2026 para 03/11/2026 e o aviso oficial de 05/10/2026 postergou a implantação da própria v1.52 para 26/10/2026 em homologação e 16/11/2026 em produção; a regra continua exigindo, na devolução, o referenciamento no grupo DFeReferenciado, e a v1.52 também corrigiu a RV VC02-50. Não se estende esse adiamento às demais regras da NT que já estavam implantadas.
Fontes: NT v1.52 — RV UB18-10, UB23-10, UB28-10, UB35-10, UB37-10, UB47-10, UB54-10, UB54a-10, UB56-10, UB66-10, UB67-10, W34-10/20, W35-10, W41-10, W47-10, W56-10, W60-10, VB01-05/10/20, VC02-14, UB12-10, UB13-40 · NT 2025.002-RTC v1.52 (VC02-14 e correção da VC02-50) · NT 2026.008 v1.00 (VB01-10 e VB01-20) · Aviso do Portal Nacional da NF-e de 05/10/2026
72. Exercício 3 — encontrar os quatro erros do XML
Trecho de NF-e modelo 55 com bloco ide, quatro itens e o bloco de totalização, contendo quatro erros plantados — um por item. Trabalho em duplas. Para cada erro, a dupla registra: qual é o erro, qual regra foi violada (código e mensagem) e qual a correção. O enunciado informa apenas que há quatro erros.
Advertência de leitura: este é um trecho didático, montado para o exercício. Não é documento completo pronto para autorização — os blocos de emitente, destinatário, produto e assinatura foram omitidos, e só o núcleo tributário do item e a totalização estão reproduzidos. Todos os quatro erros usam regras vigentes, nenhuma marcada como implementação futura, e dependem apenas de conteúdo dos Módulos 2 e 3.
O trecho:
<ide>
 <mod>55</mod>
 <serie>1</serie>
 <nNF>4471</nNF>
 <tpNF>1</tpNF>
 <finNFe>1</finNFe>
</ide>
 
<det nItem="1">
 <imposto>
  <IBSCBS>
   <CST>000</CST>
   <cClassTrib>000001</cClassTrib>
   <gIBSCBS>
    <vBC>10000.00</vBC>
    <gIBSUF>
     <pIBSUF>0.1000</pIBSUF>
     <gDif>
      <pDif>50.00</pDif>
      <vDif>5.00</vDif>
     </gDif>
     <vIBSUF>5.00</vIBSUF>
    </gIBSUF>
    <gIBSMun>
     <pIBSMun>0.0000</pIBSMun>
     <vIBSMun>0.00</vIBSMun>
    </gIBSMun>
    <vIBS>5.00</vIBS>
    <gCBS>
     <pCBS>0.9000</pCBS>
     <vCBS>90.00</vCBS>
    </gCBS>
   </gIBSCBS>
  </IBSCBS>
 </imposto>
</det>
 
<det nItem="2">
 <imposto>
  <IBSCBS>
   <CST>200</CST>
   <cClassTrib>200047</cClassTrib>
   <gIBSCBS>
    <vBC>20000.00</vBC>
    <gIBSUF>
     <pIBSUF>0.1000</pIBSUF>
     <gRed>
      <pRedAliq>40.00</pRedAliq>
      <pAliqEfet>0.1000</pAliqEfet>
     </gRed>
     <vIBSUF>20.00</vIBSUF>
    </gIBSUF>
    <gIBSMun>
     <pIBSMun>0.0000</pIBSMun>
     <gRed>
      <pRedAliq>40.00</pRedAliq>
      <pAliqEfet>0.0000</pAliqEfet>
     </gRed>
     <vIBSMun>0.00</vIBSMun>
    </gIBSMun>
    <vIBS>20.00</vIBS>
    <gCBS>
     <pCBS>0.9000</pCBS>
     <gRed>
      <pRedAliq>40.00</pRedAliq>
      <pAliqEfet>0.5400</pAliqEfet>
     </gRed>
     <vCBS>108.00</vCBS>
    </gCBS>
   </gIBSCBS>
  </IBSCBS>
 </imposto>
</det>
 
<det nItem="3">
 <imposto>
  <IBSCBS>
   <CST>200</CST>
   <cClassTrib>200052</cClassTrib>
   <gIBSCBS>
    <vBC>5000.00</vBC>
    <gIBSUF>
     <pIBSUF>0.1000</pIBSUF>
     <gRed>
      <pRedAliq>30.00</pRedAliq>
      <pAliqEfet>0.0700</pAliqEfet>
     </gRed>
     <vIBSUF>3.50</vIBSUF>
    </gIBSUF>
    <gIBSMun>
     <pIBSMun>0.0000</pIBSMun>
     <gRed>
      <pRedAliq>30.00</pRedAliq>
      <pAliqEfet>0.0000</pAliqEfet>
     </gRed>
     <vIBSMun>0.00</vIBSMun>
    </gIBSMun>
    <vIBS>3.50</vIBS>
    <gCBS>
     <pCBS>0.9000</pCBS>
     <gRed>', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-119-apostila-03', 'CT-119', 'texto', 'Apostila — NF-e e NFC-e na Reforma Tributária (parte 3/3)', '      <pRedAliq>30.00</pRedAliq>
      <pAliqEfet>0.6300</pAliqEfet>
     </gRed>
     <vCBS>31.50</vCBS>
    </gCBS>
   </gIBSCBS>
  </IBSCBS>
 </imposto>
</det>
 
<det nItem="4">
 <imposto>
  <IBSCBS>
   <CST>550</CST>
   <cClassTrib>200047</cClassTrib>
   <gIBSCBS>
    <vBC>5000.00</vBC>
    <gIBSUF>
     <pIBSUF>0.1000</pIBSUF>
     <vIBSUF>5.00</vIBSUF>
    </gIBSUF>
    <gIBSMun>
     <pIBSMun>0.0000</pIBSMun>
     <vIBSMun>0.00</vIBSMun>
    </gIBSMun>
    <vIBS>5.00</vIBS>
    <gCBS>
     <pCBS>0.9000</pCBS>
     <vCBS>45.00</vCBS>
    </gCBS>
   </gIBSCBS>
  </IBSCBS>
 </imposto>
</det>
 
<total>
 <IBSCBSTot>
  <vBCIBSCBS>40000.00</vBCIBSCBS>
  <gIBS>
   <gIBSUF>
    <vDif>5.00</vDif>
    <vDevTrib>0.00</vDevTrib>
    <vIBSUF>33.50</vIBSUF>
   </gIBSUF>
   <gIBSMun>
    <vDif>0.00</vDif>
    <vDevTrib>0.00</vDevTrib>
    <vIBSMun>0.00</vIBSMun>
   </gIBSMun>
   <vIBS>33.50</vIBS>
  </gIBS>
  <gCBS>
   <vDif>0.00</vDif>
   <vDevTrib>0.00</vDevTrib>
   <vCBS>274.50</vCBS>
  </gCBS>
 </IBSCBSTot>
</total>

Conferência aritmética do trecho — para que a dupla não perca tempo recalculando o que está certo:
#
vBC
CST
cClassTrib
Grupos informados no item
Valores informados
1
10.000,00
000
000001
gIBSUF com gDif (pDif 50,00 · vDif 5,00)
pIBSUF 0,1000 · vIBSUF 5,00 · pIBSMun 0,0000 · vIBSMun 0,00 · vIBS 5,00 · pCBS 0,9000 · vCBS 90,00
2
20.000,00
200
200047
gRed nos três grupos
pIBSUF 0,1000 · gRed 40,00 / 0,1000 · vIBSUF 20,00 · vIBSMun 0,00 · vIBS 20,00 · pCBS 0,9000 · gRed 40,00 / 0,5400 · vCBS 108,00
3
5.000,00
200
200052
gRed nos três grupos
gRed 30,00 / 0,0700 · vIBSUF 3,50 · vIBSMun 0,00 · vIBS 3,50 · gRed 30,00 / 0,6300 · vCBS 31,50
4
5.000,00
550
200047
sem gRed e sem gDif
pIBSUF 0,1000 · vIBSUF 5,00 · vIBSMun 0,00 · vIBS 5,00 · pCBS 0,9000 · vCBS 45,00
Total
40.000,00


IBSCBSTot
vBCIBSCBS 40.000,00 · vDif da UF 5,00 · vIBSUF 33,50 · vIBSMun 0,00 · vIBS 33,50 · vCBS 274,50

vIBSUF total = 5,00 + 20,00 + 3,50 + 5,00 = 33,50. vCBS total = 90,00 + 108,00 + 31,50 + 45,00 = 274,50. vBCIBSCBS = 10.000 + 20.000 + 5.000 + 5.000 = 40.000,00. Os totais fecham contra os itens — e é justamente por isso que um dos quatro erros não aparece na totalização.
Quadro de respostas:
Erro
Qual é o erro
Regra violada (código e mensagem)
Correção
1



2



3



4




Fontes: NT v1.52 — RV UB22-10, UB28-10, UB14-25, UB14-20 · Tabela CST e cClassTrib
Espaço para a sua resposta







73. Exercício 3 — gabarito comentado
#
Erro plantado
Regra violada
Correção do campo
Efeito nos valores do item
1
CST 000 com cClassTrib 000001 abre gIBSUF/gDif (pDif 50,00 · vDif 5,00). O cálculo está certo e os totais fecham, mas o CST 000 não permite diferimento — ind_gDif = 0
UB22-10, msg 1029
Remover o grupo gDif do item
Sem vDif, vIBSUF = 10.000,00 × 0,1000% = 10,00 · vIBSMun 0,00 · vIBS 10,00 (era 5,00) · vCBS 90,00, inalterado
2
CST 200, cClassTrib 200047 (pRedIBS/pRedCBS 40). O pRedAliq 40,00 está certo, mas o pAliqEfet foi informado como 0,1000
UB28-10, msg 1035
pAliqEfet = 0,1000 × (1 − 40/100) = 0,0600
vIBSUF = 20.000,00 × 0,0600% = 12,00 · vIBS 12,00 (era 20,00) · a CBS já estava correta: pAliqEfet 0,5400 → vCBS 108,00
3
CST 200 com cClassTrib 200052: o par CST/cClassTrib é compatível, mas o código tem indNFe = 0 — é código de documento de serviço, indevido na NF-e modelo 55
UB14-25, msg 1025
Identificar a rejeição é o que o exercício pede. O código substituto depende do enquadramento da operação — fatos que o enunciado não traz. Não se escolhe um código aqui
Como o cClassTrib válido define o pRedAliq aplicável, os valores do item ficam em aberto enquanto o enquadramento não for definido
4
CST 550 com cClassTrib 200047: os três primeiros dígitos não coincidem
UB14-20, msg 1024
Corrige-se o CST ou o cClassTrib — qual dos dois depende de qual reflete a operação real, que o enunciado não descreve
Cada saída leva a um tratamento diferente, logo os valores do item também ficam em aberto

Por que "identificar a rejeição" não é o mesmo que "escolher o tratamento correto". Nos itens 1 e 2 a regra violada já contém a correção: o campo a remover e a fórmula a aplicar estão na própria regra. Nos itens 3 e 4 a regra diz o que não pode, não o que deve — e o que deve depende de fatos da operação. Inventar aqui um código ou um CST substituto seria criar norma.
Os totais acompanham a correção dos itens. Corrigidos apenas os itens 1 e 2, e mantidos os itens 3 e 4 como informados, a totalização passa a: vDif da UF 0,00 (era 5,00) · vIBSUF 30,50 (era 33,50) · vIBSMun 0,00 · vIBS 30,50 · vCBS 274,50, inalterado. Este não é um total final: ele só se fecha quando o enquadramento dos itens 3 e 4 estiver definido, e o exercício não fornece os fatos para isso.
Fechamento: três dos quatro erros nasceram da classificação, não do cálculo — e o único de cálculo passou despercebido justamente porque os totais fechavam contra a alíquota errada que foi informada.
Fontes: NT v1.52 — RV UB14-20, UB14-25, UB22-10, UB28-10, UB35-10, UB54-10, UB67-10 · Tabela cClassTrib, códigos 000001, 200047 e 200052
Anotações da correção', NULL, NULL, NULL, NULL, NULL, 3, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-120-apostila-01', 'CT-120', 'texto', 'Apostila — NFS-e e DPS na Reforma Tributária (parte 1/3)', 'MÓDULO 4 — NFS-E E DPS NA REFORMA TRIBUTÁRIA
divisória no slide 74 · conteúdo nos slides 75 a 102
75. DPS e NFS-e: quem declara e quem gera
A DPS — Declaração de Prestação de Serviços é o que o emitente declara; a NFS-e é o documento que o sistema gera a partir dela, e o XML final carrega a DPS aninhada: NFSe/infNFSe/DPS/infDPS/... é o declarado, NFSe/infNFSe/... é o gerado. Quem emite a DPS vem de tpEmit: 1 prestador, 2 tomador, 3 intermediário. A DPS é assinada pelo emitente; a NFS-e, pelo ambiente que a gerou. Consequência de conferência: erro de declaração está no ramo DPS; erro de cálculo está no ramo NFS-e
Fontes: Anexo VI v1.04.00 — raízes infNFSe e DPS/infDPS; campo tpEmit
76. O caminho da DPS até a NFS-e autorizada
Cinco etapas: o emitente monta e assina a DPS → envia ao ambiente autorizador → o ambiente valida, reserva o número sequencial, calcula e gera a NFS-e → a NFS-e é persistida e distribuída → o DANFSe pode ser gerado a partir do XML autorizado. Dois campos descrevem esse caminho: ambGer (1 Sistema Próprio do Município, 2 Sefin Nacional NFS-e) e procEmi (1 aplicativo do contribuinte via API, 2 aplicativo web do fisco, 3 aplicativo do fisco), este último preenchível somente em NFS-e emitidas pelo Sistema Nacional. NFS-e Via — documentação e leiaute próprios, já publicados. As operações de exploração de vias (subitem 22.01) são formalizadas pela NFS-e Via, que possui documentação técnica e leiaute próprios, publicados pela Nota Técnica SE/CGNFS-e nº 006, versão 1.00, de 22/01/2026 — a Nota Técnica ratifica a documentação publicada em 23/12/2025 no portal nacional da NFS-e e torna pública a primeira versão do leiaute, com as abas de leiaute e de regras de negócio da NFS-e Via e dos seus eventos. Seu fluxo, leiaute, ambientes e etapas de implantação devem ser analisados separadamente do leiaute geral da DPS e da NFS-e, tratado pelas Notas Técnicas SE/CGNFS-e nº 008 e nº 009. Leiaute publicado não é funcionalidade implantada: as cinco camadas — documentação publicada · leiaute publicado · ambiente disponível · regra de validação ativa · funcionalidade efetivamente implantada — permanecem distintas, e nada aqui afirma que todas as funcionalidades da NFS-e Via estejam plenamente implantadas. A ressalva do Anexo VI de que o layout "seria publicado em breve" está superada pela Nota Técnica SE/CGNFS-e nº 006
Fontes: Anexo VI — campos ambGer, procEmi, nNFSe e nota do campo cLocIncid · Nota Técnica SE/CGNFS-e nº 006, versão 1.00, de 22/01/2026 — leiaute e documentação técnica da NFS-e Via [PRIMÁRIA] · Nota Técnica SE/CGNFS-e nº 007, quanto ao estágio das evoluções da plataforma [TÉCNICA]
77. Emissor Nacional, sistema municipal integrado e ADN
Emissor Nacional (Sefin Nacional NFS-e): o contribuinte emite diretamente; gera NFS-e com ambGer = 2 e tpEmis = 1. Sistema municipal integrado: a NFS-e nasce com ambGer = 1; o município pode emitir já no modelo nacional (tpEmis = 1) ou manter leiaute próprio e transcrever para o modelo nacional, assinando o documento transcrito (tpEmis = 2). ADN — Ambiente de Dados Nacional: repositório para onde as NFS-e são compartilhadas; texto literal: "NFS-e compartilhada pelo município para o ADN NFS-e sempre tem ambGer = 1". Fecho: emitir, transcrever e compartilhar são três atos distintos, e o XML registra qual deles ocorreu
Fontes: Anexo VI — campos ambGer, tpEmis, procEmi e respectivas notas
78. Três obrigações que não se confundem
Eixo 1 — por onde emitir: obrigação de usar o Emissor Nacional, das Resoluções CGSN. Eixo 2 — o que informar: obrigação de preencher os campos de IBS e CBS, da legislação da Reforma e do cronograma dos documentos fiscais. Eixo 3 — por qual ambiente o documento passa: adesão do município ao ambiente nacional e ao ADN, decisão da administração municipal. Um contribuinte pode estar obrigado ao Emissor Nacional sem que os campos de IBS/CBS lhe sejam exigidos; um município pode estar integrado sem que isso altere a obrigação do contribuinte. Nenhum dos três implica os outros dois
Fontes: Resolução CGSN nº 191, de 04/08/2026, art. 1º — nova redação do art. 59, § 1º, da Resolução CGSN nº 140/2018, que revogou a Resolução CGSN nº 189/2026 (texto normativo lido em fonte oficial) · Anexo VI (ambGer, tpEmis) · Orientação CGNFS-e de 07/08/2026
79. CNC: quando ele entra na validação, e as três situações do MEI
O CNC — Cadastro Nacional Complementar de Contribuintes é um módulo do Sistema Nacional NFS-e disponível apenas para municípios conveniados, mantido por cada prefeitura para complementar dados que a Receita Federal não tem (Inscrição Municipal, contato, vínculo com regime especial) e, quando necessário, sobrepor os dados da RFB. Seu uso é opcional. O município escolhe, na Configuração do Convênio, se a validação das emissões será feita pela base da Receita Federal ou pelo CNC. Optando pela base RFB, o sistema valida direto pelos dados de CNPJ/CPF na Receita. Optando pelo CNC, as emissões dos contribuintes daquele município passam a ser validadas pelo que estiver cadastrado no CNC na data de competência. Segundo o Perguntas e Respostas, o CNC se torna obrigatório, independentemente dessa escolha, em três situações: emissão por pessoa física (CPF), uso da Inscrição Municipal como chave de validação e bloqueio ou suspensão de um contribuinte. As regras cadastrais do Anexo VI operam dentro dessa condição. Todas partem da mesma premissa — "se houver registro complementar do contribuinte no CNC do município correspondente ao município emissor": a IM deve ser informada quando houver esse registro (E0116) e não deve ser informada quando não houver (E0120); a IM precisa estar autorizada a emitir (E0119) e ativa na data de competência (E0124); a data de competência não pode ser anterior à data do indicador municipal (E0023) nem à data de autorização de uso do emissor (E0025). Já as regras E0084 (CNPJ) e E0099 (CPF) verificam a correspondência entre o município emissor e o endereço do prestador, no cadastro CNPJ da RFB ou no CNC — a própria regra admite as duas fontes. Três coisas distintas sobre o MEI: (a) padrão de emissão — quando houver obrigação de emitir NFS-e, o MEI prestador utiliza o padrão nacional, adotado em todo o país desde 1º/09/2023, e a adoção do padrão não elimina as hipóteses de dispensa de emissão: o portal oficial registra que o MEI é dispensado de emitir para consumidor pessoa física, salvo quando solicitado, e que a emissão é obrigatória quando o destinatário for outra empresa (Resolução CGSN nº 140/2018, art. 106, § 1º). Isso não se generaliza para mercadorias nem antecipa regras futuras; (b) nova obrigação — a de 1º/11/2026 é dirigida a ME e EPP, não é a entrada do MEI no padrão nacional; (c) exceção cadastral — as regras E0084, E0116 e E0119 trazem a ressalva literal "exceto quando o emitente da DPS for MEI", que é dispensa de verificação cadastral, não dispensa de emitir. Parametrização, cruzamentos e plano de implantação: M7.
Fontes: Anexo VI — regras E0023, E0025, E0084, E0099, E0116, E0119, E0120, E0124 · Perguntas e Respostas v1.00, temas 2.1 e 2.2 (orientação operacional) · Resolução CGSN nº 169/2022 e Resolução CGNFS-e nº 3/2023, conforme publicação oficial do Portal da NFS-e.
80. O organograma da DPS e da NFS-e
Ramo NFS-e (gerado): infNFSe → cLocIncid, ambGer, tpEmis → valores (base do ISSQN) → IBSCBS → cLocalidadeIncid, valores (uf, mun, fed) e totCIBS (gIBS, gCBS, gTribRegular, gTribCompraGov, gTribSN). Ramo DPS (declarado): DPS/infDPS → prest, toma, interm, serv, valores → IBSCBS → cIndOp, indFinal, indZFMALC, tpOper, indDest, gRefNFSe, dest, imovel, bensMoveis, gPgtoVinc e valores/trib/gIBSCBS. Orientação: tudo que o emitente decide está no ramo DPS; tudo que o sistema calcula está no ramo NFS-e
Fontes: Anexo VI v1.04.00 — leiaute integral · Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seções 2.2, 2.5, 2.6, 2.7 e 2.8
81. Prestador, tomador, intermediário e destinatário
prest — prestador/fornecedor, com o subgrupo regTrib dos campos do Simples Nacional. toma — tomador/adquirente. interm — intermediário. E o quarto papel: indDest, obrigatório 1-1, com dois valores — 0 o destinatário é o próprio tomador/adquirente; 1 o destinatário não é o adquirente, podendo ser outra pessoa ou outro estabelecimento. Quando indDest = 1, o grupo dest passa a ser exigido. Consequência: adquirente e destinatário podem ser pessoas diferentes, e o DANFSe exibe o destinatário em bloco próprio
Fontes: Anexo VI — grupos prest, toma, interm, dest; campo indDest
82. Onde estão IBS e CBS na DPS e na NFS-e
No declarado: DPS/infDPS/IBSCBS/valores/trib/gIBSCBS traz CST, cClassTrib e cCredPres; ao lado, gTribRegular, gDif, gEstornoCred, gPagAntecipado e, pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0, gIBSCBSAjuste. No calculado: infNFSe/IBSCBS/valores traz uf (pIBSUF, pRedAliqUF, pAliqEfetUF), mun (pIBSMun, pRedAliqMun, pAliqEfetMun) e fed (pCBS, pRedAliqCBS, pAliqEfetCBS), mais o totCIBS. Alerta de nomenclatura: não existe grupo gRed no XML da NFS-e — a redução de alíquota é feita por campos soltos e pelo pRedutor de compra governamental. Quem procurar pelo nome usado na NF-e não encontra
Fontes: Anexo VI — grupos IBSCBS da DPS e da NFS-e; campos pAliqEfetUF, pAliqEfetMun, pAliqEfetCBS, pRedutor · Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.2
83. Seis estados de uma regra no leiaute da NFS-e
1 — Campo publicado: consta do Anexo VI v1.04.00; diz o que pode existir no XML. 2 — Regra documentada com código definitivo (E0xxx/E1xxx): a regra está redigida e identificada — isso prova documentação, não ativação. 3 — Regra com marcador EXXXX: código ainda não atribuído; regra não fechada. É o caso de boa parte das regras de gTribSN, gEstornoCred, gPagAntecipado, bensMoveis, gLocacao, gAjusteBCLocImoveis e vCalcAjusteBCLocImoveis. 4 — Regra tachada: presente na planilha mas riscada; a Nota Técnica SE/CGNFS-e nº 009, versão 1.0 diz que as regras das notas de ajuste "foram tachadas uma vez que essas regras ainda estão em evolução e deverão passar por alterações" — assunto do M5. 5 — Cronograma de implantação: a Nota Técnica SE/CGNFS-e nº 009, versão 1.0 registra que "nas próximas semanas, será publicado no portal da NFS-e o cronograma de implantação das funcionalidades e evoluções presentes nesta Nota Técnica" — ainda não publicado. 6 — Ativação efetiva em homologação ou produção: só se afirma com cronograma, nota técnica ou ato oficial que a confirme. Conclusão operacional: na NFS-e, o estado 6 não está documentado para as evoluções da Nota Técnica SE/CGNFS-e nº 009, versão 1.0. Some-se a isso que cerca de oito regras dependem de uma "Calculadora" externa não especificada em nenhum documento
Fontes: Anexo VI — aba "RN DPS_NFS-e" (códigos EXXXX e regras tachadas) · Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seções 1 e 2.2
84. Seis elementos, seis funções distintas
Item e subitem da LC 116/2003: natureza do serviço para o ISSQN. cTribNac (6 posições): código de tributação nacional, da Lista Nacional de Serviços, que o Anexo VI descreve como "derivação direta da lista de serviços anexa à LC 116/03", com subitens desdobrados — o que explica códigos de três pares como 99.03.01. cTribMun (3): código municipal, opcional. cNBS (9, versão 2.0): identifica o serviço na Nomenclatura Brasileira de Serviços. cIndOp (6): determina o local da operação para IBS e CBS. CST + cClassTrib: definem o tratamento tributário. Regra de fecho: nenhum substitui outro, e CNAE não entra nessa cadeia — CNAE descreve atividade econômica, não operação
Fontes: Anexo VI — campos cTribNac, cTribMun, cNBS, cIndOp; nota sobre a Lista Nacional de Serviços
85. A ordem segura de decisão
Seis passos: 1) descrever a operação concreta — o que foi fornecido, a quem, onde, em que condições; 2) localizar o item/subitem da LC 116 e o cTribNac; 3) escolher o NBS dentro daquele item, porque um item comporta vários; 4) responder às condições do Anexo VIII — onerosa? adquirente no exterior? — quando a operação cair na regra geral; 5) ler o cIndOp e, com ele, o local da operação; 6) ler o cClassTrib e, dele, o CST. Erro clássico: partir da descrição comercial ou do CNAE e pular ao cClassTrib. A NBS auxilia a classificação; o cClassTrib depende da operação concreta, dos fatos, do regime e do fundamento legal. A correlação não substitui essa análise. E o Anexo VIII é correlação auxiliar em desenvolvimento, sem regras de negócio no Piloto nem em produção: o passo 6 orienta a leitura, não substitui a conferência dos fatos e da legislação
Fontes: Anexo VIII v1.01.00 — colunas e aba "REGRA inc. X" · Anexo VI
86. Infográfico da decisão do cIndOp
O cIndOp tem 6 posições em três pares: família (inciso do art. 11 da LC 214/2025) → subtipo → variante concreta. As 13 famílias: 01 bens móveis materiais e veículos · 02 bens imóveis e imateriais relacionados a imóvel · 03 serviço sobre a pessoa · 04 feiras e congêneres · 05 serviço sobre bem móvel e portuários · 06 transporte de passageiros · 07 transporte de carga · 08 exploração de via · 09 telefonia e cabos · 10 regra geral residual · 11 água, gás e energia · 12 energia em aquisições multilaterais · 13 dutoviário de gás. Para a família 10, a matriz 2 × 2: onerosa ou não, adquirente no Brasil ou no exterior. Do Anexo VII: 39 códigos, 24 marcados como aplicáveis à NFS-e. Validação: E0901 rejeita código indicador inexistente
Fontes: Anexo VII v1.02.00 · Anexo VIII, aba "REGRA inc. X" · Anexo VI, regra E0901
87. Percorrendo o Anexo VIII na prática
1.521 linhas e 10 colunas: Item LC 116, Descrição Item, NBS, Descrição NBS, PS onerosa? (S/N), ADQ exterior? (S/N), INDOP, Local incidência IBS, cClassTrib, nome cClassTrib. A planilha é esparsa: o item só aparece na primeira linha do bloco. Demonstração ao vivo com o item 17.19 — Contabilidade: NBS 1.1302.21.00, onerosa S, exterior N, INDOP 100301, local "Domicílio principal do adquirente", cClassTrib 200052. O que a leitura revela: o mesmo item leva a cClassTrib diferentes conforme o NBS — no item 17.12, um NBS leva a 200046 e outro a 000001. O que o próprio portal declara sobre este anexo, e que se diz antes da demonstração: "Este Anexo é apenas um trabalho inicial, ainda em desenvolvimento" e "Não há regras de negócio baseadas neste anexo no ambiente do Piloto RTC (Produção Restrita) nem em Produção". Ele é correlação auxiliar, não enquadramento jurídico automático: o cClassTrib se confirma nos fatos, na legislação, na tabela de classificação e no modelo admitido — nunca no nome do serviço nem na primeira linha de uma célula mesclada. PENDENTE DE VALIDAÇÃO: há códigos de cIndOp usados no Anexo VIII ausentes do Anexo VII v1.02.00, e vice-versa
Fontes: Anexo VIII v1.01.00 — estrutura e linha conferida
88. Três localizações no mesmo documento
Local da prestação (cLocPrestacao): onde o serviço foi materialmente prestado; aceita município do IBGE, trecho de concessão de rodovia ou 0000000 para Águas Marítimas. Localidade de incidência do ISSQN (cLocIncid): identificada pelo sistema conforme as regras da LC 116/2003. Localidade de incidência do IBS e da CBS (cLocalidadeIncid, com o par xLocalidadeIncid): o local da operação, resolvido pelo cIndOp, segundo o art. 11 da LC 214/2025. As três podem ser municípios diferentes na mesma NFS-e. Advertência: a regra do ISSQN não determina o destino do IBS e da CBS — são critérios legais distintos, e por isso existem dois campos
Fontes: Anexo VI — cLocPrestacao, cLocIncid, cLocalidadeIncid, xLocalidadeIncid
89. Quando o sistema não identifica a localidade de incidência do ISSQN
A nota do campo cLocIncid diz que o Sistema Nacional identifica a localidade de incidência do ISSQN conforme a LC 116/03, e que existem situações em que o sistema não identifica a localidade de incidência nem haverá destaque do ISSQN na emissão da NFS-e. São três situações listadas: 1) imunidade — não existe localidade de incidência para o ISSQN; 2) exportação de serviço — idem; 3) serviços sem incidência de ISSQN (cTribNac igual a 990101) — idem. O texto fecha com uma regra afirmativa, não com uma quarta hipótese: "em caso de operação tributável deve existir localidade de incidência para o ISSQN". Duas observações do mesmo campo: para o subitem 03.04, o município de incidência é o do local de prestação informado na DPS; e há regra segundo a qual, se o município de incidência não for o do tomador, o sistema deve rejeitar eventuais retenções. Ligação com o slide anterior: nada disso afeta o cLocalidadeIncid do IBS/CBS, que segue regra própria
Fontes: Anexo VI — nota integral do campo cLocIncid e regra sobre retenções
90. Município, endereço, CEP e cadastro: onde a emissão trava
O cIndOp puxa a obrigatoriedade do grupo tomador: se o código estiver entre 030102, 050102, 100101, 100301, 100501, 100102, 100201, 100302, 100401, 100502 ou 100601, o grupo toma passa a ser obrigatório (E0187) e o endereço do tomador também (E0234). O cLocEmi não é o local de incidência: é onde o emitente está cadastrado e autorizado, e o município precisa estar conveniado e ativo. CEP e código IBGE são campos estruturais: aparecem no endereço do prestador, do tomador, do destinatário, do fornecedor do ajuste de base e, no grupo de imóveis, na própria unidade imobiliária. O indZFMALC, que zera a alíquota da CBS, só pode ser informado se o cIndOp estiver em lista fechada e fornecedor e destinatário estiverem dentro da ZFM ou da mesma Área de Livre Comércio
Fontes: Anexo VI — regras E0187, E0234; campos cLocEmi, indZFMALC
91. Simples Nacional: a obrigação de usar o Emissor Nacional', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-120-apostila-02', 'CT-120', 'texto', 'Apostila — NFS-e e DPS na Reforma Tributária (parte 2/3)', 'A Resolução CGSN nº 189, de 23 de abril de 2026 (DOU de 28/04/2026), deu nova redação ao art. 59, § 1º, da Resolução CGSN nº 140/2018: relativamente à prestação de serviços sujeita à Nota Fiscal de Serviços, a ME ou EPP optante pelo Simples Nacional "utilizará, obrigatoriamente, a Nota Fiscal de Serviço eletrônica (NFS-e) de padrão nacional, emitida pelo Emissor Nacional da NFS-e", com vigência em 01/09/2026. A técnica seguinte não foi prorrogação: foi revogação e reedição. A Resolução CGSN nº 191, de 4 de agosto de 2026 (DOU de 10/08/2026), revogou expressamente a Resolução nº 189 (art. 2º) e reeditou a mesma alteração, produzindo efeitos, quanto ao art. 1º, a partir de 1º de novembro de 2026 (art. 3º, I). É a Resolução nº 191 que está em vigor. Quatro delimitações que fecham o slide: (a) essa é obrigação de por onde emitir — não torna o IBS e a CBS devidos nem altera o regime tributário; (b) para o MEI isso não é novidade: ele já emite NFS-e pelo padrão nacional desde 1º/09/2023, e a obrigação de 2026 não o alcança como novidade — ver slide 79; (c) o rol normativo de versões do Emissor Nacional, no art. 59, § 1º, é de duas e só duas: "I - emissor de NFS-e web; e II - serviço de comunicação do tipo Interface de Programação de Aplicativos (API)". A descrição operacional do portal, que menciona também versão Mobile, é orientação de uso e não o rol da norma; (d) o eixo tributário corre em separado: a Resolução CGSN nº 190, de 4 de agosto de 2026 (DOU de 10/08/2026), inseriu a CBS (art. 4º, IX) e o IBS (art. 4º, X) entre os tributos recolhidos no documento único do Simples Nacional, com as exclusões do art. 5º, XVI a XXI, e produz efeitos a partir de 1º de janeiro de 2027 (art. 9º) — sem ressalva. O art. 59 traz ainda, na mesma redação, duas regras de fronteira: é vedada a emissão dessa NFS-e em operações sujeitas apenas ao ICMS (§ 1º-B), e a nota tem validade em todo o território nacional e é elemento suficiente para a constituição do crédito tributário (§ 1º-C). Textos normativos lidos integralmente em fonte oficial
Atualização operacional — escolha do modelo de recolhimento para 2027. Para o período de janeiro a junho de 2027, a empresa já optante pelo Simples Nacional poderá optar pela apuração e pelo recolhimento do IBS e da CBS pelo regime regular entre 1º de setembro e 30 de outubro de 2026. Sem essa opção, os tributos permanecem no regime aplicável ao Simples Nacional. O cancelamento da opção poderá ser realizado entre 3 de novembro e 20 de dezembro de 2026. Essa escolha não se confunde com o ingresso ou o retorno ao Simples Nacional em 2027, cujo prazo termina em 15 de outubro de 2026. O MEI não possui opção pelo regime regular ou híbrido do IBS e da CBS. O fundamento normativo é a Resolução CGSN nº 194/2026 [PRIMÁRIA]; o comunicado do CGIBS de 30/09/2026 é orientação operacional, que divulga os prazos — não é o ato que criou a regra [ORIENTATIVO].
Fontes: Resolução CGSN nº 189/2026 (revogada), Resolução CGSN nº 190/2026, arts. 1º, 4º, 5º e 9º, e Resolução CGSN nº 191/2026, arts. 1º a 3º — textos oficiais na base de normas da Receita Federal, conferidos em 16/09/2026 [PRIMÁRIA] · Resolução CGSN nº 194/2026, quanto aos prazos de opção e de cancelamento [PRIMÁRIA] · CGIBS, comunicado de 30/09/2026 [ORIENTATIVO]
92. Os campos do Simples Nacional na DPS
opSimpNac (1-1): 1 não optante · 2 optante MEI · 3 optante ME/EPP · 4 optante pendente, valor criado pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0 para a opção pendente de regularização ou julgamento. regApTribSN (0-1): regime dos tributos federais e municipal — 1 tudo pelo SN · 2 federais pelo SN e ISSQN pela NFS-e · 3 ambos pela NFS-e; nota literal: "esta informação não leva em consideração o regime de apuração do IBS e da CBS". regApIBSCBSSN (0-1), criado pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0: 1 IBS e CBS pelo SN · 2 CBS pelo SN e IBS pelo regime regular · 3 ambos pelo regime regular. cAtvSN (0-1), também criado pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0: código da atividade conforme a LC 123/2006, domínio 7, 8, 9, 10, 11, 12, 13, 14 e 90 — entre eles o 8, serviços contábeis autorizados a pagar ISS em valor fixo. Regra de cadastro: o MEI "será tratado sempre como MEI", conforme a base do Simples Nacional na data de competência. PENDENTE DE VALIDAÇÃO: o campo tpRBSN, citado em materiais de mercado, não existe no leiaute da NFS-e — é coluna da tabela cClassTrib, sem dicionário de valores em nenhuma fonte
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.4 · Anexo VI — opSimpNac, regApTribSN, regApIBSCBSSN, cAtvSN
93. gTribSN e vReceitaBrutaSN no documento gerado
vReceitaBrutaSN, criado pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0, que o define, literalmente, como o campo que "representará o valor da receita bruta para os optantes pelo regime do Simples Nacional e servirá de base para a apuração dos tributos abarcados por este regime". Ressalva necessária: a NT define o campo e a fórmula dentro do documento fiscal; a base jurídica da apuração do Simples Nacional decorre da LC 123/2006 e das Resoluções CGSN, não do leiaute. Fórmula literal: vReceitaBrutaSN = vServ − descIncond − vCalcAjusteBCIBSCBS − vCalcAjusteBCISSQN, este último apenas quando o valor se referir a ajuste do tipo "9 – Profissional parceiro". O grupo gTribSN, em IBSCBS/totCIBS, traz pIBSSN, vIBSSN, pCBSSN e vCBSSN; regra de valor: vCBSSN = vReceitaBrutaSN × pCBSSN. Sobre os totalizadores, com precisão: a NT registra que a criação do grupo exigiu mudança da ocorrência de campos "que antes eram obrigatórios" — vIBSTot, gIBSUFTot, gIBSMunTot, pCredPresCBS, vCredPresCBS e vCBS —, o que os torna não obrigatórios, e não vedados. A vedação existe em regra separada e específica: o gTribSN "não deve ser destacado quando opSimpNac = 1 ou 2, ou quando opSimpNac = 3 ou 4 e regApIBSCBSSN = 3". PENDENTE DE IMPLEMENTAÇÃO TÉCNICA: essas regras ainda trazem marcador EXXXX
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.4 · Anexo VI — grupo gTribSN, campo vReceitaBrutaSN, regras dos campos gTribSN, pIBSSN, vIBSSN, pCBSSN, vCBSSN e vTotNF (E1555)
94. Operações com imóveis: o que está em produção e o que é estrutura futura
Três planos, nesta ordem, e nenhum deles se confunde com o outro. 1 — Situação operacional atual. Para locação, cessão onerosa e arrendamento de imóveis, o código operacional é o 99.01.01 — "Outros serviços sem a incidência de ISSQN e ICMS". Segundo o Perguntas e Respostas, é "o único código operacional hoje para esses fatos geradores", e os códigos específicos "ainda não foram implementados no ambiente de produção". Consequência prática: o código transitório não tem campos estruturados para detalhar a operação — não há grupo de imóvel, de unidade imobiliária nem de ajuste de base. 2 — Estrutura publicada na Nota Técnica SE/CGNFS-e nº 009, versão 1.0. O grupo imovel (0-1), para operações com bens imóveis exceto obras, com cMun; dentro dele, gLocacao (0-1), com pCopropriedade, vTotOper (valor total da operação, art. 255 da LC 214/2025, sem proporcionalizar pelo coproprietário), vDescIncondTot, vDescCondTot e dVencOrig; e gUnidImob (0-99), com inscImobFisc, cCIB e endereço, permitindo uma única NFS-e para até 99 unidades no mesmo contexto — mesmos prestador e tomador, mesmo município e mesmo percentual de copropriedade. Fronteiras do leiaute: o grupo é vedado para os subitens de construção civil (E0931) e obrigatório quando o cIndOp for 020101, 020201, 020202, 020301 ou 020401 (E0932). 3 — Implantação em produção: PENDENTE DE IMPLEMENTAÇÃO TÉCNICA. A Nota Técnica SE/CGNFS-e nº 007, p. 8, é literal: "as evoluções da plataforma NFS-e para a formalização dos documentos fiscais dessas operações estão em desenvolvimento [...] ainda não estão disponíveis e o cronograma dessas implantações será publicado no portal da NFS-e" — e isso vale tanto para o layout quanto para os Emissores Públicos Nacionais. A Nota Técnica SE/CGNFS-e nº 009, versão 1.0 registra separadamente que o cronograma de implantação de suas evoluções também será publicado.
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.6 · Anexo VI — grupo imovel, regras E0931 e E0932 · Nota Técnica SE/CGNFS-e nº 007, p. 8 · Perguntas e Respostas v1.00, temas 16.1 e 16.6.
95. O ajuste de base na locação: estrutura prevista, ainda não disponível
PENDENTE DE IMPLEMENTAÇÃO TÉCNICA — nada neste slide está disponível em produção. gAjusteBCLocImoveis (0-1000), renomeado pela Nota Técnica SE/CGNFS-e nº 009, versão 1.0 a partir de gDedRedIBSCBS, registrará parcelas que não integram a base do IBS e da CBS na locação. Domínio de tpAjusteBCLocImoveis: 01 tributos inclusos no aluguel, como IPTU e contribuição de melhoria — apenas para NBS 1.1002.10.00 ou 1.1002.20.00; 02 emolumento incluso; 03 condomínio incluso; 04 Redutor Social, apenas para a NBS 1.1002.10.00; 99 outras parcelas, com descrição. O valor informado é o total da parcela, "não devendo ser inserido o valor proporcional do coproprietário". Em razão do gLocacao, a Nota Técnica SE/CGNFS-e nº 009, versão 1.0 alterou a regra de três campos: para os códigos do subitem 99.03, vServ = pCopropriedade × vTotOper, e o mesmo produto define vDescIncond e vDescCond. O resultado chegará ao campo vCalcAjusteBCLocImoveis, que deduzirá a base do IBS e da CBS dessas operações. Como fica hoje, na prática. Sem esses campos, o Perguntas e Respostas orienta o uso dos campos descritivos disponíveis no código transitório: xDescServ para descrever a operação, docRef para o número do contrato e xInfComp (até 2.000 caracteres) para o detalhamento do bem e das parcelas que ainda não têm campo próprio. Isso é orientação operacional do documento de Perguntas e Respostas, não regra de leiaute — e não substitui campo estruturado. Nota de nomenclatura: o Perguntas e Respostas ainda se refere ao grupo como gDedRedIBSCBS; prevalece a Nota Técnica SE/CGNFS-e nº 009, versão 1.0, que o renomeou para gAjusteBCLocImoveis.
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seções 2.3 e 2.6 · Anexo VI — gAjusteBCLocImoveis, vServ, vDescIncond, vDescCond · Perguntas e Respostas v1.00, temas 16.6 e 16.9 (orientação operacional).
96. bensMoveis e os quatro planos que não se confundem
Situação atual: locação de bens móveis é emitida hoje sob o mesmo código transitório 99.01.01, sem campos estruturados. Estrutura publicada na Nota Técnica SE/CGNFS-e nº 009, versão 1.0: o grupo gLocBensMoveis foi renomeado para bensMoveis e passou a admitir até 1.000 registros, com cNCMBemMovel, xNCMBemMovel e qtdNCMBemMovel, aplicável ao código 99.04.01. Implantação: PENDENTE DE IMPLEMENTAÇÃO TÉCNICA — mesma situação do slide 94. Quatro planos distintos, que o aluno precisa saber separar: Plano O que é O que comprova cada fonte 1 Existir código ou grupo publicado A Nota Técnica SE/CGNFS-e nº 009, versão 1.0 e o Anexo VIII comprovam 2 Ser tecnicamente possível emitir hoje Não comprovado para os códigos específicos — a Nota Técnica SE/CGNFS-e nº 007 diz que as evoluções estão em desenvolvimento. Hoje emite-se pelo código transitório 3 Haver obrigação jurídica de emitir Não decorre do leiaute. O critério de receita e de quantidade de imóveis é do regime de bens imóveis — art. 251, §§ 1º, 2º e 5º, da LC 214/2025 — e não é condição geral para locação de equipamentos; por isso não entra neste quadro. Para bens móveis, enquadramento como contribuinte, disponibilidade de emissor e obrigação documental não se equiparam automaticamente 4 Haver competência ou regulamentação municipal aplicável Nada aqui afirma competência municipal. O Perguntas e Respostas sustenta que documentos do item 99 só podem ser autorizados pela Sefin Nacional e que sistema próprio que tente compartilhá-los pelo ADN terá a nota rejeitada — orientação operacional, dependente de confirmação em fonte primária O que o slide não afirma: que a existência do item 99 ou dos grupos crie obrigação universal de emissão; que todo CPF ou CNPJ esteja habilitado ou obrigado; e que haja penalidade específica. Nota de consistência: as regras de negócio do Anexo VI ainda chamam o grupo pelo nome antigo, gLocBensMoveis.
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.7 · Anexo VI — grupo bensMoveis · Nota Técnica SE/CGNFS-e nº 007, p. 8 · Perguntas e Respostas v1.00, temas 16.1, 16.3, 16.4 e 16.7 (orientação operacional; afirmações fortes não reproduzidas como norma).
97. vAjusteBC: a unificação que mudou a rotina
Os grupos vDedRed e gReeRepRes foram unificados em vAjusteBC, com justificativa literal de "maior clareza, economia e concentração de campos com o mesmo teor informacional". Estrutura: pAjusteBCISSQN e vAjusteBCISSQN para o ajuste percentual do ISSQN, e o subgrupo documentos/docAjusteBC (1-1000) para o ajuste por documento, com tpAjusteBC, vTotDoc, vAjusteAplic, datas, os grupos alternativos dFeNacional / docFiscalOutro / docOutro e o grupo fornec. Três tipos descontinuados, com razão declarada: "1 – Alimentação e bebidas/frigobar", porque essa inclusão não pode se dar na NFS-e por conta do IBS e da CBS, já que tais fornecimentos são registrados em outros documentos fiscais do mesmo fornecedor; "3 – Produção Externa", redundante com o tipo 103; "4 – Reembolso de despesas", redundante com 103, 104 ou 199. Distinção obrigatória: redução de base ≠ redução de alíquota ≠ dedução ≠ repasse ≠ reembolso ≠ ressarcimento — os quatro últimos entram pelo vAjusteBC; a redução de alíquota entra pelos campos pRedAliq*
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 2.3 · Anexo VI — grupo vAjusteBC
98. As duas bases e o pagamento vinculado
Base do ISSQN: vBC = vServ − descIncond − (vAjusteBCISSQN + vCalcAjusteBCISSQN) − (vRedBCBM ou vCalcBM) — campo renomeado de vCalcDR, que passou a contemplar ajustes por percentual e por documentos. Base do IBS e da CBS, nas duas redações literais do leiaute, com os parênteses que tornam explícita a alternativa entre os dois campos de ajuste: até 2026 — vBC = vServ − descIncond − (vCalcAjusteBCIBSCBS ou vCalcAjusteBCLocImoveis) − vISSQN − vPIS − vCOFINS; de 2027 até 2032 — vBC = vServ − descIncond − (vCalcAjusteBCIBSCBS ou vCalcAjusteBCLocImoveis) − vISSQN, a mesma expressão sem vPIS e vCOFINS. Leitura dos operadores, conferida: o "ou" entre vCalcAjusteBCIBSCBS e vCalcAjusteBCLocImoveis é alternativo — usa-se um ou o outro, conforme a operação, sendo o segundo exclusivo do subitem 99.03; o outro "ou" separa as duas fórmulas por período. PENDENTE DE VALIDAÇÃO: o leiaute não apresenta fórmula para o período posterior a 2032. Por fim, gPgtoVinc (0-1), com o subgrupo pgto (1-99): nPag, idTransacao — "identificador específico da transação financeira, de acordo com o pagamento" —, tpMeioPgto (15 boleto, 17 Pix QRCode dinâmico, 18 TED, 20 Pix chave ou QRCode estático, 23 Pix automático, 24 TEF/booktransfer), CNPJReceb e CNPJBasePSP. Escopo deste módulo: gPgtoVinc é vínculo documental entre a NFS-e e a transação de pagamento — nada além disso. A NT registra que um evento de mesma estrutura será implementado para quando a informação só existir após a emissão; isso é matéria do M5
Fontes: Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seções 2.3 e 2.8 · Anexo VI — campos vBC do ISSQN e do IBS/CBS, grupo gPgtoVinc
99. O DANFSe e o bloco de IBS/CBS
Finalidade declarada: facilitar a consulta resumida dos dados da NFS-e e auxiliar os processos administrativos e financeiros do destinatário não credenciado como emissor. Regra estruturante: "os campos do DANFSe deverão representar o conteúdo das respectivas TAG XML da NFS-e emitida. Não poderão ser impressas informações que não constem do arquivo da NFS-e". Blocos: chave de acesso com 50 dígitos, identificação, prestador/fornecedor, tomador/adquirente, destinatário, intermediário, serviço prestado, tributação municipal, tributação federal exceto CBS, tributação IBS/CBS, valor total, informações complementares e canhoto opcional. Bloco de IBS/CBS, item 2.1.10: CST e cClassTrib · indicador de operação, código IBGE e nome do município de incidência com a UF · exclusões e reduções da base · base após exclusões e reduções · reduções da alíquota do IBS e da CBS · alíquota do IBS estadual e municipal · alíquota efetiva e valor apurado de cada um · valor total apurado do IBS · alíquota da CBS, alíquota efetiva e valor total apurado. No bloco de totais: "Total do IBS/CBS" e "Valor Líquido da NFS-e + IBS/CBS". Fato operacional: a API de geração do DANFSe foi descontinuada — a geração passa ao emissor e ao ERP. A comunicação oficial do Portal Nacional da NFS-e emprega o termo "descontinuada"; o texto da Nota Técnica diz "sobrestada (suspensa)". A data foi alterada duas vezes: 1º/07/2026 na versão 1.0, 15/07/2026 na versão 1.01 e 03/08/2026 na versão 1.02, de 14/07/2026, que é a vigente — a mesma data-limite de adequação ao novo leiaute do DANFSe
Fontes: Nota Técnica SE/CGNFS-e nº 008, versão 1.02, de 14/07/2026 — introdução e itens 2.1.1 a 2.1.13 [PRIMÁRIA] · Portal Nacional da NFS-e, comunicados de 30/06/2026 e 14/07/2026, quanto ao termo e à prorrogação [ORIENTATIVO]
100. XML, DANFSe e as quatro camadas da pendência
O que tem validade é o XML autorizado; o DANFSe é representação gráfica dele. Forma confirmada pela Nota Técnica SE/CGNFS-e nº 008: impressão obrigatoriamente em uma única página, modo retrato, mínimo A4, qualquer papel exceto jornal, fontes Arial para títulos e Microsoft Sans Serif para conteúdo, modelo do Anexo I com disposição obrigatória; em homologação (tpAmb = 2), o cabeçalho deve trazer "NFS-e SEM VALIDADE JURÍDICA". Para as operações tratadas pela documentação técnica como novos fatos geradores, a pendência tem quatro camadas, e elas não se confundem: Camada Situação 1 — Emissão hoje Ocorre pelo código transitório 99.01.01, quando cabível, sem campos estruturados específicos 2 — Leiaute específico Publicado na Nota Técnica SE/CGNFS-e nº 009, versão 1.0, não disponível em produção — Nota Técnica SE/CGNFS-e nº 007, p. 8: as evoluções "estão em desenvolvimento", tanto do layout quanto dos Emissores Públicos Nacionais 3 — DANFSe específico A Nota Técnica SE/CGNFS-e nº 008 declara que "será publicada uma nota técnica específica com as especificações do DANFSe para essas operações" — ainda não publicada 4 — Cronograma Não publicado, nem para as evoluções da Nota Técnica SE/CGNFS-e nº 009, versão 1.0 nem para a plataforma Correção de leitura em relação à versão anterior: a pendência não é apenas do DANFSe. As camadas 2 e 4 também estão abertas, e por isso não se afirma que a NFS-e dessas operações já seja gerada e autorizada segundo o leiaute específico. Duas fronteiras que permanecem: DANFSe não é DANFE, e a Nota Técnica SE/CGNFS-e nº 008 não resolve a representação de IBS, CBS e IS no DANFE da NF-e, tratada no M3.
Fontes: Nota Técnica SE/CGNFS-e nº 008, versão 1.02 — introdução, itens 2.2 e 2.4; remissão à Nota Técnica SE/CGNFS-e nº 007, seção "3.a" · Nota Técnica SE/CGNFS-e nº 007, p. 8 · Nota Técnica SE/CGNFS-e nº 009, versão 1.0, seção 1 · Perguntas e Respostas v1.00, tema 16.1.', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-120-apostila-03', 'CT-120', 'texto', 'Apostila — NFS-e e DPS na Reforma Tributária (parte 3/3)', '101. Exercício 4: classificar quatro operações e comparar duas
Seis situações, em duplas. Nas quatro primeiras, a dupla preenche a matriz de três colunas. Nas duas últimas, preenche duas linhas cada — situação operacional atual × estrutura futura da Nota Técnica SE/CGNFS-e nº 009, versão 1.0.
#
Situação
Item nacional
cIndOp
cClassTrib
1
Contabilidade em Recife presta serviço contábil oneroso a contribuinte em Fortaleza; sem intermediário



2
Software house em Recife presta análise e desenvolvimento de sistemas a PJ no Brasil; sem intermediário



3
Transporte coletivo municipal rodoviário de passageiros, integralmente em Recife, sem medição por km



4
Empresa executa demolição de edificação em Jaboatão dos Guararapes, sem enquadramento em reabilitação urbana




#
Situação de comparação
Leitura
cClassTrib
O que hoje impede o uso do código específico
5
PJ loca imóvel residencial em Olinda a pessoa física, sem IPTU ou condomínio inclusos e sem copropriedade
Atual




Futura (Nota Técnica SE/CGNFS-e nº 009, versão 1.0)


6
Empresa loca equipamentos — bens móveis — com entrega no estabelecimento do locatário, em Recife
Atual




Futura (Nota Técnica SE/CGNFS-e nº 009, versão 1.0)



Instrução: cada resposta deve indicar a linha do Anexo VIII, o campo do leiaute ou o tema do Perguntas e Respostas que a fundamenta.
Fontes: casos construídos sobre o Anexo VIII v1.01.00 [TABELA OFICIAL], a tabela cClassTrib de 22/06/2026 [TABELA OFICIAL], o Anexo VI v1.04.00 e a Nota Técnica SE/CGNFS-e nº 009 [TÉCNICA], o Perguntas e Respostas da NFS-e v1.00 [ORIENTATIVO] e a LC 116/2003.
Espaço para a sua resposta







102. Exercício 4: gabarito comentado
#
NBS
cIndOp
Local
cClassTrib
indNFSe
1 — contabilidade (item 17.19)
1.1302.21.00
100301
Domicílio principal do adquirente
200052
1
2 — software (item 01.01)
1.1502.10.00
100301
Domicílio principal do adquirente
000001
1
3 — transporte municipal (16.01)
1.0401.11.19
060101
Local da prestação
400001
1
4 — demolição (07.04)
1.0103.10.00
020201
Local do imóvel
200046
1

Nos casos 3 e 4, as ressalvas do enunciado fecham a resposta: "sem medição por quilômetro rodado" afasta o 400002; "sem projeto de reabilitação urbana" afasta o 200045.

Caso 5 — imóvel residencial
Caso 6 — locação de equipamentos
Atual
99.01.01; cTribNac é o único campo de classificação; sem NBS, cIndOp ou cClassTrib no Anexo VIII
Mesmo 99.01.01, mesma ausência de campos e de correlação
Futura (Nota Técnica SE/CGNFS-e nº 009, versão 1.0)
99.03.01, NBS 1.1002.10.00 (locação de imóveis residenciais), cIndOp 020201, local do imóvel, com imovel, gLocacao, gUnidImob e gAjusteBCLocImoveis
99.04.01, com bensMoveis. A NBS depende de qual equipamento é locado — o enunciado não identifica
Armadilha
A linha traz três cClassTrib, e eles não são intercambiáveis: 200027 é a regra geral de locação, cessão onerosa e arrendamento de imóveis; 200026 é locação de imóveis em zonas reabilitadas; 200048 é hotelaria, parques de diversão e parques temáticos, com cIndOp 030101. Os fatos do enunciado não bastam para enquadrar em 200026 nem em 200048
A NBS 1.1101.11.00 do Anexo VIII é "arrendamento mercantil operacional ou locação de veículos rodoviários automotores para o transporte de até oito passageiros, sem operador" — não serve para "equipamentos" em geral. A família 1.1101 se divide por tipo de bem: .12.00 veículos de carga, .13.00 ferroviário, .14.00 outros equipamentos de transporte terrestre
O que impede
Nota Técnica SE/CGNFS-e nº 007, p. 8 — plataforma e emissores em desenvolvimento; cronograma não publicado
Idêntico ao caso 5 · e, antes disso, falta o fato: sem identificar o equipamento não há NBS a preencher

Resposta do caso 6, como deve ser dada: a NBS depende da identificação do equipamento; com os fatos do enunciado, a resposta correta é condicionada, não um código. Se a turma quiser fechar o código, é preciso acrescentar o fato — por exemplo, veículo rodoviário automotor de até oito passageiros, sem operador — e conferir a NBS correspondente.
Os três pontos que o exercício prova: ① nos casos 1 e 2 o ISSQN segue a LC 116/2003 pelo estabelecimento do prestador enquanto IBS e CBS vão para o domicílio do adquirente — dois municípios no mesmo documento · ② uma linha no Anexo VIII não comprova implantação — o portal declara que não há regras de negócio baseadas nele no Piloto nem em produção · ③ existir código, poder emitir e estar obrigado a emitir são três coisas diferentes.
Fontes: Anexo VIII v1.01.00, linhas 1430-1434 e 1443-1447 e família NBS 1.1101, com a observação oficial do Portal NFS-e [TABELA OFICIAL] · Tabela cClassTrib de 22/06/2026 — 000001, 200026, 200027, 200046, 200048, 200052, 400001 e 400002 [TABELA OFICIAL] · Anexo VI v1.04.00 (cTribNac, cIndOp, NBS) · Nota Técnica SE/CGNFS-e nº 009 (estrutura futura) · Nota Técnica SE/CGNFS-e nº 007, p. 8 · LC 116/2003, itens 01.01, 07.04, 16.01 e 17.19
Anotações da correção', NULL, NULL, NULL, NULL, NULL, 3, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-121-apostila-01', 'CT-121', 'texto', 'Apostila — Correções, ajustes e eventos fiscais (parte 1/4)', 'MÓDULO 5 — CORREÇÕES E AJUSTES: ND, NC, EVENTOS E GAJUSTECOMPET
divisória no slide 103 · conteúdo nos slides 104 a 129
104. Depois de autorizado, o XML original não é reescrito
Depois de autorizado, o XML original não é reescrito. A correção ocorre pelos instrumentos admitidos para o fato posterior. Três perguntas, nesta ordem, selecionam o instrumento: (1) qual é a causa — erro que já existia na emissão, fato novo posterior, ou fato que deixou de ocorrer? (2) houve fornecimento, isto é, entrega ou disponibilização do bem? (3) o documento ainda admite cancelamento ou substituição? A terceira pergunta é sempre verificada primeiro, porque fecha ou abre todas as demais. Apoio conceitual conferido em fonte primária: LC 214/2025, art. 3º, II, "a" — "entrega ou disponibilização de bem material" — e art. 10, caput — "Considera-se ocorrido o fato gerador do IBS e da CBS no momento do fornecimento nas operações com bens ou com serviços, ainda que de execução continuada ou fracionada." Frase de fronteira: O documento ou evento alimentará a apuração; a forma de débito, crédito, extinção e apropriação será estudada no M6.
Fontes: LC 214/2025, arts. 3º, II, "a" e 10, caput [PRIMÁRIA].
105. Cinco instrumentos, cinco alcances
Instrumento
Alcança
Não alcança
Cancelamento
Desfaz o documento inteiro, quando admitido
Não é universalmente disponível — depende de prazo e, na NFS-e, de parametrização municipal
Substituição (NFS-e)
Cancela a original e gera a substituta vinculada
Não altera a identificação do tomador (Regra E0058)
CC-e
Regida pelo Ajuste SINIEF 07/05 — não mencionada na NT 2025.002 v1.52
Alcance no IBS/CBS não conferido neste curso
Nota de débito (finNFe=6)
Documento de saída que registra valor acrescido ou ajuste de saldo
Não corrige dado cadastral; não substitui documento
Nota de crédito (finNFe=5)
Documento de entrada que registra redução ou desfazimento
Não é devolução (finNFe=4) nem complementar (finNFe=2)

Frase de fronteira: o que cada um desses documentos produz na apuração é objeto do M6.
Fontes: NT 2025.002 v1.52, campo B25 [PRIMÁRIA]; Anexo VI, regra E0058 [PRIMÁRIA].
106. Infográfico: da causa ao instrumento
QUAL É A CAUSA?
│
├─ [A] ERRO QUE JÁ EXISTIA NA EMISSÃO
│    ├─ o documento ainda admite cancelamento/substituição? → SIM: cancelar/substituir
│    ├─ NÃO, é NF-e, erro no ato da entrega, sem circulação de mercadoria
│    │        e sem alterar valor/quantidade nem CNPJ base → AJUSTE SINIEF 13/24
│    └─ NÃO, demais casos → CC-e, nos limites da cl. décima quarta-A
│                            (Ajuste SINIEF 07/05 — conferido; ver slide 108)
│
├─ [B] FATO POSTERIOR QUE AUMENTA O VALOR
│    ├─ diferença do próprio documento original (destaque a menor) → NF-e complementar (finNFe=2)
│    ├─ juros/multa recebidos por atraso                           → ND tipo 04
│    └─ recebimento antecipado de fornecimento futuro              → ND tipo 06  [Aj.49/25 cl.2ª]
│
├─ [C] FATO POSTERIOR QUE REDUZ O VALOR
│    └─ só quando NÃO for possível cancelar a NF-e de saída        → NC tipo 04  [Aj.49/25 cl.4ª]
│       (se o cancelamento ainda for possível, o caminho é cancelar)
│
├─ [D] ENTREGA RECUSADA / DESTINATÁRIO NÃO LOCALIZADO
│    ├─ recusa TOTAL ou não localização                       → NC tipo 03  [cl.5ª,I]
│    ├─ recusa PARCIAL, destinatário NÃO contribuinte         → NC tipo 06  [cl.5ª,II,"a"]
│    └─ recusa PARCIAL, destinatário CONTRIBUINTE             → ND tipo 09  [cl.5ª,II,"b"]
│
├─ [E] ANTECIPAÇÃO PAGA E FORNECIMENTO QUE NÃO OCORREU
│    └─ desfazimento total ou parcial, quando se puder afirmar que
│       não haverá mais fornecimento                               → EVENTO 112140
│       (se houver fornecimento parcial futuro, o caminho não é este)
│
├─ [F] PERDA DE BENS
│    ├─ em ESTOQUE                                                 → ND tipo 07  [Aj.49/25 cl.3ª]
│    └─ em TRÂNSITO → eventos 112130 (CIF) ou 211124 (FOB)
│
├─ [G] AJUSTE DE SALDO SEM OPERAÇÃO ESPECÍFICA
│    ├─ anulação por saídas imunes/isentas  → ND tipo 02 + gAjusteCompet
│    ├─ NF não processada na apuração       → ND tipo 03 + gAjusteCompet
│    └─ desenquadramento do SN              → ND tipo 08 + gAjusteCompet
│
└─ [H] CORREÇÃO CADASTRAL
     ├─ NFS-e, sem alterar a identificação do tomador → substituição (chSubstda + cMotivo)
     ├─ NFS-e, alterando a identificação do tomador   → VEDADO (E0058)
     └─ NF-e → não é caso de ND/NC; avaliar norma geral

Quatro advertências que fecham o mapa: nem todo aumento gera NF-e complementar; nem toda redução gera NC tipo 04; nem todo fornecimento não realizado gera o evento 112140; cancelamento e substituição não estão sempre disponíveis. Advertência acrescentada pelo Ajuste SINIEF nº 34/2026: a recusa parcial deixou de ter instrumento único — o remetente emite NC tipo 06 quando o destinatário não é contribuinte, e o próprio destinatário emite ND tipo 09 quando é contribuinte. A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente.
Fontes: Ajuste SINIEF 49/2025 e 13/2024 [PRIMÁRIA]; NT 2025.002 v1.52, cap. 8 e RV UB14-70 [PRIMÁRIA]; Anexo VI, E0058 [PRIMÁRIA]; Cartilha Vol. 1, itens 4.2 a 4.4 [ORIENTATIVO]. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
107. Cancelamento e substituição: o que é regra técnica e o que é parametrização
Separação em três planos.
Plano 1 — o que está em documentação técnica [PRIMÁRIA]. Na NF-e, a NT 2025.002 v1.52 não altera o regime de cancelamento; ela o toca uma única vez, na RV P23-10, que veda o uso do evento genérico 110001 para cancelar eventos dos tipos 110001, 110111, 110112 e outros. O regime que ela não altera está no Ajuste SINIEF 07/2005, conferido em fonte primária: cláusula décima segunda — cancelamento em prazo não superior a 24 horas da Autorização de Uso, desde que não tenha havido circulação da mercadoria, prestação do serviço ou vinculação à Duplicata Escritural, com o parágrafo único admitindo pedido extemporâneo a critério de cada UF, em casos excepcionais; cláusula décima segunda-A, acrescida pelo Ajuste SINIEF 13/25, efeitos a partir de 03/08/2026 — 168 horas na hipótese do § 16-B da cláusula nona, desde que emitida outra NF-e em contingência para a mesma operação, prazo redutível por cada UF; e cláusula décima terceira, § 1º — o Pedido de Cancelamento atende ao leiaute estabelecido no MOC. Na NFS-e, o Anexo VI define o grupo subst com três campos — chSubstda, cMotivo, xMotivo — e as regras E0056 e E0058, com naturezas diferentes: E0056 é parametrizável pelo município; E0058 não é e proíbe a substituição que altere a identificação do tomador.
Plano 2 — o que é orientação operacional do Perguntas e Respostas [ORIENTATIVO]. Segundo o P&R v1.00: o prazo de cancelamento da NFS-e é definido por parametrização municipal; expirado, existe a Solicitação de Análise Fiscal para Cancelamento, cujo deferimento gera evento de efeito equivalente ao do cancelamento comum e cujo indeferimento mantém a nota válida; existe Cancelamento por Ofício, privativo da autoridade municipal; e existe Bloqueio de NFS-e por Ofício, que trava um evento de cancelamento por vez. O P&R registra ainda que, ocorrida a confirmação do tomador — inclusive a tácita, "o sistema pode bloquear certas ações sobre a nota, incluindo a substituição".
Plano 3 — o que não se pode afirmar. Não existe janela nacional única de manifestação: o prazo é municipal. A confirmação tácita é descrita pelo P&R como gerada "quando o tomador não se manifesta dentro do prazo legal/municipal" — está condicionada à parametrização e não deve ser apresentada como aplicável a toda NFS-e. O bloqueio da substituição após a confirmação é descrito com o verbo "pode", não como efeito necessário.
Fontes: NT 2025.002 v1.52, RV P23-10 [PRIMÁRIA]; Ajuste SINIEF 07/2005, cl. décima segunda, décima segunda-A e décima terceira, § 1º — texto consolidado do CONFAZ [PRIMÁRIA]; Anexo VI, grupo subst, E0056, E0058 [PRIMÁRIA]; P&R NFS-e v1.00, assuntos 9.2 a 9.5, 25.1 e 25.5 [ORIENTATIVO].
108. Carta de Correção: o que as fontes deste curso permitem afirmar
A expressão "Carta de Correção" não aparece nenhuma vez na NT 2025.002-RTC v1.52 — verificação por varredura integral do texto. A NT não cria, não altera e não restringe a CC-e. Ela aparece nas fontes deste curso em um único lugar, como hipótese negativa: o Ajuste SINIEF 13/2024 só se aplica "quando não permitida a emissão de nota fiscal complementar, de nota de crédito do tipo ''Redução de valores'' ou de Carta de Correção eletrônica". A disciplina da CC-e, agora conferida no texto consolidado do CONFAZ. O regime está no Ajuste SINIEF nº 7, de 30/09/2005, cláusula décima quarta-A: após a concessão da Autorização de Uso, o emitente poderá sanar erros em campos específicos por meio de CC-e transmitida à administração tributária da UF do emitente, desde que o erro não esteja relacionado com — I, as variáveis que determinam o valor do imposto, tais como base de cálculo, alíquota, diferença de preço, quantidade, valor da operação ou da prestação; II, a correção de dados cadastrais que implique mudança do remetente ou do destinatário; III, a data de emissão ou de saída; IV, campos da NF-e de exportação informados na DU-E; V, a inclusão ou alteração de parcelas de vendas a prazo — os incisos IV e V acrescidos pelo Ajuste SINIEF 44/20, efeitos desde 11/12/2020. Três regras de operação fecham a cláusula: § 4º — havendo mais de uma CC-e para a mesma NF-e, o emitente deve consolidar na última todas as informações anteriormente retificadas; § 6º — o protocolo de recepção não implica validação das informações; § 7º — é vedada a carta de correção em papel para sanar erros em campos específicos de NF-e. A CC-e é, tecnicamente, um evento da NF-e (cl. décima quinta-A, § 1º, II), e seu leiaute está no MOC (cl. décima quarta-A, § 1º). O que a conferência também mostra: o texto consolidado do Ajuste SINIEF 07/2005, com alterações até o Ajuste SINIEF 25/26, não contém nenhuma menção a IBS, CBS ou Imposto Seletivo — varredura integral do ato. A Reforma não tocou a cláusula décima quarta-A. Decisão didática preservada: nenhum caso é encaminhado à CC-e como resposta, porque nenhum deles cabe nas hipóteses da cláusula décima quarta-A; o fluxograma remete a CC-e aos limites dessa cláusula; e a CC-e não aparece no exercício. É recorte de cabimento, não ausência de fonte.
Fontes: NT 2025.002 v1.52 (ausência verificada) [PRIMÁRIA]; Ajuste SINIEF 13/2024, ementa e cl. 1ª, redação do Aj. 6/26 [CONSOLIDADO]; Ajuste SINIEF 07/2005, cl. décima quarta-A, caput, incisos I a V e §§ 1º a 7º, e cl. décima quinta-A, § 1º, II — texto consolidado do CONFAZ, conferido em 16/09/2026 [PRIMÁRIA].
109. Ajuste SINIEF 13/2024: a correção no ato da entrega
Cabimento (cl. 1ª, redação do Aj. 6/26, efeitos desde 01.06.26): erro identificado no ato da entrega, operação interna ou interestadual, quando não permitida nota complementar, NC tipo "Redução de valores" ou CC-e, em até 168 horas do ato da entrega, desde que não ocorra circulação de mercadoria decorrente da correção. Não se aplica (§ 1º): devoluções simbólicas parciais; correções que alterem o CNPJ base do destinatário. Fronteira expressa (§ 2º): havendo alteração de valores ou quantidades, o caminho é a nota complementar ou a NC tipo 04. Procedimento — dois documentos: (a) NF-e de devolução simbólica anulando a saída original — emitida pelo remetente se o destinatário for não contribuinte, ou pelo destinatário se for contribuinte (§ 1º da cl. 2ª); mesmos itens; natOp "Anulação de operação - Ajuste SINIEF 13/24"; refNFe da original. (b) NF-e de saída com as informações corrigidas, finNFe=1, infAdFisco "Procedimento autorizado pelo Ajuste SINIEF 13/24" e refNFe com as duas chaves. Eventos exigidos: "Operação não Realizada" na original e "Confirmação da Operação" na corrigida.
Fontes: Ajuste SINIEF 13/2024, cl. 1ª a 3ª [PRIMÁRIA], com as redações dadas pelo Aj. 6/26 [CONSOLIDADO].
110. finNFe 5 e 6: arquitetura e amarras estruturais
O campo B25 finNFe tem seis valores — 1 normal, 2 complementar, 3 de ajuste, 4 devolução, 5 nota de crédito, 6 nota de débito. Os dois últimos abrem campos condicionais: B25.1 tpNFDebito e B25.2 tpNFCredito, ambos ocorrência 0-1, tamanho 2.
Seis amarras estruturais, com a mensagem de rejeição:
RV
Msg
Conteúdo
B25.1-10 / B25.2-10
1139 / 1163
Tipo informado sem a finalidade correspondente
B25.1-20 / B25.2-20
1009 / 1164
Finalidade 6 ou 5 sem o tipo
B25-110
1161
NC exige tpNF = 0 (Entrada)
B25-120
1162
ND exige tpNF = 1 (Saída)
B25-80
1001
Em finNFe 5 ou 6 é vedado informar ICMS, ISSQN, IPI, II, PIS, PISST, COFINS, COFINSST, ICMSUFDest e impostoDevol
B25-90
1002
Fora de 5 e 6, ICMS ou ISSQN devem estar presentes

As exceções da B25-80 importam para escolher o instrumento: os tipos de crédito 03, 04 e 06 e o tipo de débito 07 escapam integralmente da vedação; tpNFDebito=06 admite PIS/PISST/COFINS/COFINSST em NF-e emitida em 2026, admite IPI e, pela NT 2026.008 v1.00, admite também o grupo ICMS/ICMSPrevistoPagtoAntecip (NB01), com o campo vICMSPrevisto (NB02) — valor do ICMS que incidirá no momento do fornecimento futuro. O grupo só é admitido no modelo 55 e apenas quando tpNFDebito=06 ou tpOperGov=4 (NB01-10 e NB01-20); a partir de 01/03/2027, a NB01-30 passará a exigi-lo nessas hipóteses.
Fontes: NT 2025.002 v1.52, campos B25/B25.1/B25.2 e RV citadas [PRIMÁRIA].
111. MATRIZ COMPARATIVA DAS NOTAS DE DÉBITO
tpNFDebito
Hipótese
cClassTrib (UB14-70)
CST
Grupo exigido
Referenciamento
Base
01
Transferência de créditos para Cooperativas
800002
800
gTransfCred (UB106)
—
LC art. 272 [TABELA OFICIAL]
02
Anulação de Crédito por Saídas Imunes/Isentas
811001
811
gAjusteCompet (UB112)
—
LC art. 51 [TABELA OFICIAL]
03
Débitos de NF não processadas na apuração
811002
811
gAjusteCompet (UB112)
DFeReferenciado obrigatório, sem nItem, várias chaves
LC art. 45 [TABELA OFICIAL]
04
Multa e juros
Não limitar
conforme item original
—
DFeReferenciado obrigatório
LC art. 12 [TABELA OFICIAL]
05
Transferência de crédito na sucessão
800001
800
gTransfCred (UB106)
—
LC art. 55 [TABELA OFICIAL]
06
Pagamento antecipado
Não limitar
conforme bem/serviço futuro
—
—
Aj. 49/25, cl. 2ª [PRIMÁRIA]
07
Perda em estoque
410030
410
gEstornoCred (UB116)
Aquisição e serviços vinculados
Aj. 49/25, cl. 3ª [PRIMÁRIA]
08
Desenquadramento do SN
811003
811
gAjusteCompet (UB112)
—
LC art. 41 [TABELA OFICIAL]
09
Retorno por Recusa Parcial na Entrega — destinatário contribuinte
Não publicado no domínio do leiaute
Não publicado no domínio do leiaute
Não publicado no domínio do leiaute
refNFe da NF-e de saída original (Aj. 34/2026, cl. 1ª)
Aj. SINIEF 34/2026, cl. 1ª [PRIMÁRIA]

Leitura do quadro: os três únicos tipos que exigem gAjusteCompet são 02, 03 e 08, porque são os únicos cujo cClassTrib está no CST 811. Os tipos 01 e 05 abrem gTransfCred; o 07 abre gEstornoCred; os tipos 04 e 06 não abrem grupo de ajuste algum. O tipo 09, acrescido pelo Ajuste SINIEF nº 34/2026, não consta do domínio publicado do campo tpNFDebito na NT 2025.002-RTC v1.52, cujos valores publicados vão de 01 a 08; o código 09 ainda não consta do domínio técnico publicado. A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente. Não se atribuem ao tipo 09 CST, cClassTrib, grupo de IBS/CBS, regra de validação, CFOP ou efeito na apuração: as fontes disponíveis não os confirmam e este material não os completa por analogia.
Fontes: NT 2025.002 v1.52, RV UB14-60 e UB14-70 [PRIMÁRIA]; Tabelas CST e cClassTrib 22/06/2026 [PRIMÁRIA]; redações legais [TABELA OFICIAL]. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
112. Quem emite, quem recebe e o que se referencia em cada ND
tpNFDebito
Emitente
Destinatário no XML
Direção
Documento posterior exigido
Status técnico
01
Associado / cooperativa singular
A cooperativa
Saída
—
Campo e grupo publicados
02
O próprio contribuinte
—
Saída
—
Publicado
03
O próprio contribuinte
O próprio contribuinte (mesmo CNPJ base)
Saída
—
Publicado
04
O fornecedor
O adquirente
Saída
—
Publicado
05
A empresa sucedida
A empresa sucessora (uma nota por sucessora)
Saída
Eventos 212110/212120 (sucessora) e 412120/412130 (fisco)
Publicado
06
O fornecedor
O adquirente
Saída
NF-e de fornecimento com finNFe=1 e refNFe da ND (Aj. 49/25, cl. 2ª, p. único)
Publicado
07
O próprio contribuinte
O próprio emitente (Aj. 49/25, cl. 3ª, VII)
Saída
—
Publicado
08
O próprio contribuinte
Não conferido em fonte específica do tipo 08
Saída
—
Publicado
09
O destinatário da NF-e de saída original, quando contribuinte
Não expresso no Ajuste SINIEF 34/2026 — não preenchido por analogia
Saída
—
Hipótese normativa publicada — implementação técnica pendente

Três leituras operacionais: (a) dois tipos — 03 e 07 — são notas em que o contribuinte é, com base conferida, simultaneamente emitente e parte destinatária; conferir isso é o primeiro teste de consistência do arquivo. Para o tipo 08 a fonte específica do destinatário não foi conferida, e a matriz não o preenche por analogia. (b) apenas o tipo 06 tem documento posterior obrigatório; a emissão da ND não dispensa a NF-e de venda no momento da saída efetiva. (c) apenas o tipo 05 depende de eventos de terceiros — da sucessora e do fisco — para completar o circuito documental. Frase de fronteira: O documento ou evento alimentará a apuração; a forma de débito, crédito, extinção e apropriação será estudada no M6. (d) o tipo 09, acrescido pelo Ajuste SINIEF nº 34/2026, é o único em que a nota de débito é emitida pelo destinatário da operação original, e não pelo contribuinte que praticou a saída. A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente. Por isso a coluna de status técnico deste quadro deixou de valer para todos os tipos: os tipos 01 a 08 têm campo e grupo publicados; o tipo 09, não.
Fontes: Ajuste SINIEF 49/2025, cl. 2ª e 3ª [PRIMÁRIA]; NT 2025.002 v1.52, cap. 8.1 e RV B25-120 [PRIMÁRIA]; Cartilha Vol. 1, itens 2.1, 2.3, 2.5 e 2.7, quanto à identificação das partes [ORIENTATIVO]. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
113. MATRIZ COMPARATIVA DAS NOTAS DE CRÉDITO
tpNFCredito
Hipótese
cClassTrib (UB14-80)
Referenciamento
Regra decisiva
Base
01
Multa e juros
Não limitar
NFref obrigatório', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-121-apostila-02', 'CT-121', 'texto', 'Apostila — Correções, ajustes e eventos fiscais (parte 2/4)', 'B25-30 (254) exige NFref; B25-40 (255) rejeita NFref com mais de uma ocorrência neste caso
LC art. 12 [TABELA OFICIAL]
02
Crédito presumido de IBS sobre saldo devedor na ZFM
810001
NFref vedado
B25-65 (1027): informar NFref → rejeição. B25.2-30 (1145): rejeição se ano de emissão < 2029
LC art. 450 [TABELA OFICIAL]
03
Retorno por recusa total ou não localização
Não limitar
NFref obrigatório, nível de nota
B25-100 (1003) admite NFref modelo 65 só neste tipo; B25.2-40 (1152) exige tpNF=Entrada
Aj. 49/25, cl. 5ª, I, na redação do Aj. 34/2026 [PRIMÁRIA]
04
Redução de valores (ou quantidades)
Não limitar
NFref obrigatório, nível de nota
B25-50 (269): emitente da referenciada = emitente desta; B25-60 (678): mesma UF
Aj. 49/25, cl. 4ª [PRIMÁRIA]
05
Transferência de crédito na sucessão
800001
Nenhuma regra de referenciamento o exige
UB14-80 vincula ao cClassTrib 800001
LC art. 55 [TABELA OFICIAL]
06
Retorno por recusa parcial — destinatário não contribuinte
Não limitar
DFeReferenciado por item, nItem obrigatório, pelas regras de validação vigentes — o Ajuste 34/2026 aponta refNFe: divergência declarada abaixo
VC02-07 (exceção); VC02-10 (1038); VC03-20 (1048)
Aj. 49/25, cl. 5ª, II, "a", na redação do Aj. 34/2026 [PRIMÁRIA]

Quatro esclarecimentos exigidos pela leitura correta da matriz:
"Ocorrência única" não é atributo do NFref. O campo NFref, no Grupo BA, é de ocorrência múltipla no leiaute geral da NF-e. A restrição a uma única ocorrência decorre exclusivamente da RV B25-40 (msg 255), e apenas nas hipóteses que ela enumera: finNFe=2 e tpNFCredito 1, 3 ou 4. Fora dessas hipóteses, a regra não incide.
O NFref é vedado no tipo 02 — confirmado: a RV B25-65 (msg 1027) rejeita a NF-e de crédito tipo 02 que informe NFref, com a descrição "NF referenciada informada indevidamente".
A barreira anterior a 2029 está na B25.2-30 — confirmado: "Se tpNFCredito igual a 02 ... - Ano de emissão < 2029", msg 1145, "Tipo de nota de crédito só pode ser usado a partir de janeiro/2029". Formulação adotada: entre os seis tipos de NC analisados, o tipo 02 é o único com barreira temporal expressa em regra de validação. Não se afirma que seja o único do leiaute inteiro — essa varredura não foi feita.
A NC tipo 05 não tem exigência de referência — confirmado: nenhuma das RV das famílias B25, B25.2, VC02 e VC03 menciona o tipo 05. A Cartilha Vol. 1, item 3.4, descreve o tipo 05 como uso subsidiário, cabível quando o CNPJ da sucedida se tornar inapto — isso é orientação [ORIENTATIVO], não regra de validação.
Par de contraste a fixar: os tipos 03 e 06 tratam do mesmo fato — a recusa — e se separam pela extensão e, depois do Ajuste SINIEF nº 34/2026, também pela qualidade do destinatário: recusa total ou não localização → NC 03, no nível da nota; recusa parcial com destinatário não contribuinte → NC 06; recusa parcial com destinatário contribuinte → ND 09, emitida pelo próprio destinatário. Os mecanismos de referenciamento continuam tecnicamente opostos entre a NC 03 e a NC 06: nota contra item.
Divergência normativa e técnica: o Ajuste SINIEF nº 34/2026 aponta refNFe e identificação dos itens recusados em prod; as regras de validação vigentes da NT 2025.002-RTC v1.52 ainda exigem DFeReferenciado na NC tipo 06. A emissão dependerá da atualização e compatibilização da documentação técnica.
A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente. Não se atribuem ao tipo 09 CST, cClassTrib, grupo de IBS/CBS, regra de validação, CFOP ou efeito na apuração: as fontes disponíveis não os confirmam e este material não os completa por analogia.
Fontes: NT 2025.002 v1.52, RV B25-30, B25-40, B25-50, B25-60, B25-65, B25-100, B25.2-30, B25.2-40, UB14-80, VC02-07, VC02-10, VC03-20 [PRIMÁRIA]; Ajuste SINIEF 49/2025, cl. 4ª e 5ª [PRIMÁRIA]; Cartilha Vol. 1, item 3.4 [ORIENTATIVO]. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
114. Ajuste SINIEF 49/2025: as quatro hipóteses e onde cada uma está
A cláusula primeira delimita quatro operações: I venda para entrega futura com pagamento antecipado total ou parcial; II perda no estoque por extravio, perecimento, deterioração, furto ou roubo; III redução de valores ou quantidades quando não for possível cancelar a NF-e de saída; IV retorno por recusa, total ou parcial, ou por não localização do destinatário.
Hip.
Cláusula
Documento
finNFe / tipo
CFOP
natOp
I
2ª
NF-e de saída
6 / ND 06
5.922 ou 6.922
"Venda para entrega futura - Pagamento antecipado"
II
3ª
NF-e de saída
6 / ND 07
5.927
"Baixa de Estoque"
III
4ª
NF-e de entrada
5 / NC 04
inverso do documento reduzido
"Redução de valores ou quantidades"
IV
5ª (redação do Aj. 34/2026)
NF-e de entrada · NF-e de saída
5 / NC 03 ou 06 · 6 / ND 09
—
"Retorno por Recusa ou não localização" · "Retorno por Recusa Parcial"

Detalhes expressos que costumam ser omitidos: hipótese I — a ND não dispensa a NF-e de venda na saída efetiva, com refNFe da ND e finNFe=1 (cl. 2ª, p. único). Hipótese II — próprio emitente no grupo de destinatário (cl. 3ª, VII); justificativa em infAdFisco (VI); destaque do ICMS quando houver (V, redação do Aj. 20/26, efeitos desde 03.08.26 — [CONSOLIDADO]); estorno do ICMS creditado (§ 2º). Hipótese III — a NF-e de entrada é emitida pelo remetente da saída original, com os valores que serão deduzidos da nota original (p. único) e o destinatário original no grupo dest (VII, acrescido pelo Aj. 20/26 — [CONSOLIDADO]).
Hipótese IV — a cláusula quinta ganhou nova redação pelo Ajuste SINIEF nº 34/2026, e a hipótese do inciso IV da cláusula primeira passou a ser tratada em dois incisos. Inciso I — recusa total ou não localização do destinatário na tentativa de entrega: o remetente da NF-e de saída original emite NF-e de entrada para anulação total da operação, com finNFe = "5 — Nota de crédito"; tpNFCredito = "03 — Retorno por Recusa na Entrega ou Por Não Localização do Destinatário na Tentativa de Entrega"; natOp "Retorno por Recusa ou não localização"; grupo prod com as informações dos itens não entregues; refNFe com a chave de acesso da NF-e de saída original; destaque do ICMS quando houver; e grupo dest com as informações do destinatário da NF-e de saída original. Inciso II — recusa parcial: se o destinatário não for contribuinte, o remetente emite a NF-e de entrada na forma das alíneas do inciso I, com tpNFCredito = "06 — Retorno por recusa parcial na entrega"; se o destinatário for contribuinte, é ele próprio quem emite NF-e de saída, com finNFe = "6 — Nota de débito"; tpNFDebito = "09 — Retorno por Recusa Parcial na Entrega"; natOp "Retorno por Recusa Parcial"; grupo prod com as informações dos itens não entregues; refNFe com a chave de acesso da NF-e de saída original; e destaque do ICMS quando houver.
A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente. Não se atribuem ao tipo 09 CST, cClassTrib, grupo de IBS/CBS, regra de validação, CFOP ou efeito na apuração: as fontes disponíveis não os confirmam e este material não os completa por analogia.
Divergência normativa e técnica: o Ajuste SINIEF nº 34/2026 aponta refNFe e identificação dos itens recusados em prod; as regras de validação vigentes da NT 2025.002-RTC v1.52 ainda exigem DFeReferenciado na NC tipo 06. A emissão dependerá da atualização e compatibilização da documentação técnica.
O Ajuste SINIEF nº 34/2026 entra em vigor na data de sua publicação (cláusula segunda). Isso não altera a cláusula quinta-A do Ajuste SINIEF nº 49/2025: a obrigatoriedade de seguir os procedimentos desse ajuste permanece a partir de 1º de janeiro de 2027, salvo alteração expressa posterior. Entrada em vigor do ato e início da obrigatoriedade dos procedimentos não são a mesma coisa.
Fontes: Ajuste SINIEF 49/2025, cl. 1ª a 5ª [PRIMÁRIA]; alterações do Aj. 20/26 [CONSOLIDADO]. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
115. Ajuste SINIEF 8/2026: por que a recusa se partiu em duas
O Ajuste SINIEF nº 8, de 06/04/2026 (DOU 09.04.26), efeitos a partir de 4 de maio de 2026, alterou a cláusula quinta do Ajuste 49/25 em quatro pontos e revogou um:
cl. 1ª, I — o caput perdeu a expressão "para anulação total da operação de saída original";
cl. 1ª, II — o inciso II passou a admitir dois códigos: 03 (recusa total ou não localização) ou 06 (recusa parcial), "conforme o caso";
cl. 1ª, III — o inciso IV passou a falar em itens "recusados ou não entregues"; o inciso V foi desdobrado em alínea "a" (recusa total ou não localização → refNFe) e alínea "b" (recusa parcial → grupo DFeReferenciado);
cl. 2ª — acrescentou o inciso VII: no grupo dest, as informações do destinatário da NF-e de saída original;
cl. 3ª — revogou o § 1º da cláusula quinta.
Consequência técnica: antes de 04/05/2026 a recusa parcial não tinha instrumento próprio. Depois, tem tipo próprio e mecanismo de referenciamento próprio — e a NT espelha isso na exceção da VC02-07, única hipótese em que finNFe=5 admite referenciamento a nível de item.
Atualização posterior — Ajuste SINIEF nº 34/2026 (DOU 14.09.2026): a cláusula quinta recebeu nova redação e o desdobramento entre as alíneas "a" e "b" do antigo inciso V, introduzido pelo Ajuste 8/2026, foi substituído pela estrutura dos incisos I e II, descrita no tópico 114. A recusa parcial deixou de ter um único instrumento: o remetente emite NC tipo 06 quando o destinatário não é contribuinte; quando é, o próprio destinatário emite ND tipo 09. O Ajuste SINIEF nº 34/2026 entra em vigor na data de sua publicação (cláusula segunda). Isso não altera a cláusula quinta-A do Ajuste SINIEF nº 49/2025: a obrigatoriedade de seguir os procedimentos desse ajuste permanece a partir de 1º de janeiro de 2027, salvo alteração expressa posterior. Entrada em vigor do ato e início da obrigatoriedade dos procedimentos não são a mesma coisa.
Atualização da validação de CFOP. A NT 2026.009 v.1.00 da NF-e, publicada em 09/09/2026, alterou a regra de validação I08-140 para admitir os CFOP 1.949 e 2.949 nas situações abrangidas pela própria regra — ou seja, nas NF-e com finNFe = 4 (devolução de mercadoria) e nas Notas de Crédito finNFe = 5 dos tipos 03 (retorno por recusa total na entrega ou por não localização do destinatário) e 06 (retorno por recusa parcial na entrega). A justificativa declarada na própria Nota Técnica é que nem todos os CFOP de saída existentes possuem CFOP de devolução correspondente. A permissão não é geral: está limitada às situações abrangidas pela regra de validação. A alteração é pontual e não modifica o leiaute da NF-e nem os schemas XML, e não altera CST, cClassTrib, IBS ou CBS. Implantação nos ambientes de homologação e de produção até 17/09/2026 [PRIMÁRIA].
Fontes: Ajuste SINIEF 8/2026, cl. 1ª a 4ª [PRIMÁRIA]; NT 2025.002 v1.52, RV VC02-07 [PRIMÁRIA]. · NT 2026.009 v.1.00 da NF-e, de 09/09/2026 — RV I08-140 [PRIMÁRIA] · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
116. Ajuste SINIEF 27/2026: quando os procedimentos passam a obrigar
O Ajuste SINIEF nº 27, de 12/08/2026 (DOU 14.08.26), acresceu ao Ajuste 49/2025 uma única cláusula, transcrita literalmente:
"Cláusula quinta-A Os contribuintes ficam obrigados a seguir o disposto neste ajuste, a partir de 1º de janeiro de 2027."
O próprio Ajuste 27/26 entra em vigor na data da publicação (cl. 2ª). Três leituras, nesta ordem: (1) a obrigatoriedade de seguir os procedimentos do 49/25 é a da cláusula quinta-A; (2) isso não significa que os campos só existam a partir dessa data — eles já constam do leiaute e são validados; (3) isso não dispensa a verificação das demais datas de produção fixadas pela NT para regras específicas, que são independentes deste ajuste. O Ajuste SINIEF nº 34/2026, que deu nova redação à cláusula quinta, também entra em vigor na data de sua publicação (cl. 2ª) e não altera a cláusula quinta-A: o início da obrigatoriedade dos procedimentos do Ajuste 49/2025 permanece em 1º de janeiro de 2027, salvo alteração expressa posterior.
Fontes: Ajuste SINIEF 27/2026, cl. 1ª e 2ª [PRIMÁRIA]. · Ajuste SINIEF 34/2026, cl. 2ª [PRIMÁRIA].
117. Referenciamento: nota e item não são intercambiáveis
Dois mecanismos, em níveis diferentes do XML. NFref/refNFe, no Grupo BA, referencia a nota inteira. DFeReferenciado (VC01), no Grupo VC, referencia um item: chaveAcesso (VC02, 44 posições) e nItem (VC03, até 3), correspondente ao atributo nItem do elemento det do documento original.
RV
Msg
Comando
VC02-05
1010
Informar os dois níveis ao mesmo tempo → rejeição
VC02-07
1042
Em finNFe=5, referenciamento por item é proibido — única exceção: NC 06
VC02-10
1038
DFeReferenciado/chaveAcesso obrigatório em ND 03, ND 04 e NC 06
VC03-10
1039
Em ND 03, o nItem não pode ser informado
VC03-20
1048
Informado o item, nItem é obrigatório — salvo em ND 03
VC02-30
1130
Um único documento referenciado. Exceções: ND 03, ND 07 e finNFe=4
VC02-20
1072
Mesma chave + mesmo item repetidos → rejeição. Sem nItem, considera-se só a chave
VC02-04
708
NFC-e não referencia outro documento

O par que sintetiza tudo: a ND tipo 03 referencia várias notas, uma por item da ND, sem nItem — porque cada item da ND corresponde a um documento inteiro. A NC tipo 06 referencia uma nota, com nItem — porque cada item da NC corresponde a um item recusado.
Fontes: NT 2025.002 v1.52, Grupo BA, Grupo VC e RV citadas [PRIMÁRIA].
118. CST 811 e o indicador que comanda o grupo de ajuste
A Tabela de CST de 22/06/2026 tem 18 CST e 8 indicadores — ind_gIBSCBS, ind_gIBSCBSMono, ind_gRed, ind_gDif, ind_gTransfCred, ind_gCredPresIBSZFM, ind_gAjusteCompet, ind_RedutorBC — com legenda literal: "0 = Não é permitido; 1 = Exige". Não há valor intermediário.
CST
Descrição
Indicador em 1
Grupo comandado
800
Transferência de crédito
ind_gTransfCred
gTransfCred (UB106)
810
Ajuste de IBS na ZFM
ind_gCredPresIBSZFM
gCredPresIBSZFM (UB131)
811
Ajustes
ind_gAjusteCompet
gAjusteCompet (UB112)

Varredura completa da coluna ind_gAjusteCompet nas 18 linhas: o valor 1 ocorre uma única vez — no CST 811. Nos 17 demais o valor é 0, o que significa vedação. Cuidado: o CST 222 também tem um indicador em 1 — mas é o ind_RedutorBC, não o de ajuste de competência. Esse indicador permanece PENDENTE DE VALIDAÇÃO: a NT 2025.002 v1.52 não traz grupo, campo nem regra correspondente a ele.
Fontes: Tabela CST 22/06/2026, com legenda [PRIMÁRIA]; NT 2025.002 v1.52 (ausência verificada) [PRIMÁRIA].
119. Os cClassTrib de ajuste e a dupla validação cruzada
Sete códigos concentram as notas de ajuste. Todos com dIniVig 2026-01-01 e todos "Sem alíquota".
cClassTrib
Nome
CST
Dispositivo indicado na tabela
410030
Estorno de crédito por perecimento, deterioração, roubo, furto ou extravio
410
LC art. 47, § 6º [TABELA OFICIAL]
800001
Fusão, cisão ou incorporação
800
LC art. 55 [TABELA OFICIAL]
800002
Transferência de crédito do associado, inclusive cooperativas singulares
800
LC art. 272 [TABELA OFICIAL]
810001
Crédito presumido de IBS sobre fornecimentos a partir da ZFM
810
LC art. 450, § 1º [TABELA OFICIAL]
811001
Anulação de Crédito por Saídas Imunes/Isentas
811
LC art. 51 [TABELA OFICIAL]
811002
Débitos de notas fiscais não processadas na apuração
811
LC art. 45 [TABELA OFICIAL]
811003
Desenquadramento do Simples Nacional
811
LC art. 41 [TABELA OFICIAL]

Validação cruzada em três regras: UB14-60 (1202) parte do cClassTrib e verifica a finalidade e o tipo; UB14-70 (1200) parte do tpNFDebito; UB14-80 (1201) parte do tpNFCredito. "Não limitar" é a expressão mais mal interpretada da tabela. Ela não significa "qualquer código serve". Significa que a compatibilidade não é verificada por essa regra — o código continua submetido à validação ordinária do item. Para os tipos ND 04 e NC 01, a Cartilha orienta aplicar a mesma classificação tributária e a mesma alíquota efetiva do fornecimento original [ORIENTATIVO].
Fontes: Tabela cClassTrib 22/06/2026 [PRIMÁRIA]; NT 2025.002 v1.52, RV UB14-60/70/80 [PRIMÁRIA]; Cartilha Vol. 1, itens 2.4 e 3.1 [ORIENTATIVO].
120. gAjusteCompet (UB112): estrutura e condição de uso
Posição: UB112, grupo condicional, filho de UB14k, ocorrência 1-1. Três campos:
ID
Campo
Tipo
Tam.
Observação de leiaute
UB113
competApur
C
7
Ano e mês, formato AAAA-MM. "Informar período atual ou retroativo."
UB114
vIBS
N
13v2
Valor do IBS
UB115
vCBS
N
13v2
Valor da CBS

Observação literal do próprio UB112: "a obrigatoriedade ou vedação do preenchimento deste grupo está condicionada ao indicador ind_gAjusteCompet da tabela de CST do IBS e da CBS".
RV
Msg
Comando
UB112-10 (55/65)
1169
CST com indicador 0 e grupo informado → rejeição
UB112-20 (55)
1170
CST com indicador 1 e grupo ausente → rejeição
UB112-30 (55)
1171
Informado o grupo, vIBS ou vCBS maior que zero

Atenção ao "ou" da UB112-30: basta que um dos dois seja positivo. Critério documental que define o grupo: o gAjusteCompet é próprio das notas de débito destinadas a ajustes "que não requeiram a indicação de nenhuma operação específica ocorrida no período" [ORIENTATIVO — Cartilha Vol. 1, item 1.8]. É exatamente isso que o separa dos demais instrumentos: ele não aponta para uma operação, aponta para um período. Frase de fronteira: O tratamento do valor informado no período de competência é matéria do M6.
Fontes: NT 2025.002 v1.52, campos UB112-UB115 e RV UB112-10/20/30 [PRIMÁRIA]; Cartilha Vol. 1, item 1.8 [ORIENTATIVO].
121. competApur: a assimetria que ainda não foi fechada
Dois campos com o mesmo nome e a mesma observação de leiaute — "Informar período atual ou retroativo" — recebem tratamento de validação diferente:
Campo
ID
RV existente
gCredPresIBSZFM/competApur
UB132
UB132-10 (msg 1160) — rejeita ano/mês superior ao atual
gAjusteCompet/competApur
UB113
nenhuma

A varredura das RV da NT v1.52 encontra as três regras da família UB112 e nenhuma da família UB113. PENDENTE DE VALIDAÇÃO. O que se pode afirmar: a observação de leiaute orienta período atual ou retroativo. O que não se pode afirmar: que o autorizador rejeitará uma competência futura em gAjusteCompet. Orientação: seguir a observação de leiaute e não depender da malha de rejeição para detectar o erro — neste campo ela pode não existir. Segunda pendência do mesmo campo: a Cartilha condiciona as ND tipos 02 e 03 ao "período de ajustes definido em regulamento", sem indicar esse período. PENDENTE DE VALIDAÇÃO.
Fontes: NT 2025.002 v1.52, campos UB113 e UB132, RV UB132-10 [PRIMÁRIA]; Cartilha Vol. 1, itens 2.2 e 2.3 [ORIENTATIVO].
122. gEstornoCred e gTransfCred: qual tabela comanda cada grupo
Grupo
ID
Campos
Comandado por
Tabela de origem
gTransfCred
UB106
vIBS (UB107), vCBS (UB108)
ind_gTransfCred
CST
gAjusteCompet
UB112', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-121-apostila-03', 'CT-121', 'texto', 'Apostila — Correções, ajustes e eventos fiscais (parte 3/4)', 'competApur, vIBS, vCBS
ind_gAjusteCompet
CST
gEstornoCred
UB116
vIBSEstCred (UB117), vCBSEstCred (UB118)
ind_gEstornoCred
cClassTrib

A diferença da terceira linha é substantiva e é fonte frequente de erro: o estorno de crédito não é comandado pelo CST, é comandado pelo cClassTrib. Na tabela de 22/06/2026, o cClassTrib 410030 tem ind_gEstornoCred = 1.
Regras: UB106-30 (1133) — gTransfCred exige finNFe=6; UB106-31 (1168) — só com ND 05 ou 01; UB106-40 (1129) — valor > 0. UB116-10 (1172), UB116-20 (1173) e UB116-30 (1174) — vedação, obrigatoriedade e valor > 0 do estorno, as três com o tpNFDebito=07 operando como caminho paralelo ao indicador: a UB116-20 obriga o grupo "se o indicador for 1 ou se tpNFDebito=07", e as outras duas excepcionam expressamente esse tipo. É a única hipótese do leiaute em que o preenchimento de um grupo é obrigado por um tipo de nota e não pelo indicador de tabela.
Fontes: NT 2025.002 v1.52, campos UB106-UB118 e RV citadas [PRIMÁRIA]; Tabela cClassTrib 22/06/2026 [PRIMÁRIA].
123. NFS-e hoje: o que está disponível é cancelamento e substituição
⚠ ADVERTÊNCIA DO BLOCO NFS-e (slides 123 a 125)
As notas de ajuste da NFS-e — finNFSe 1 e 2, tpNFSeDebito, tpNFSeCredito, gIBSCBSAjuste — constam do leiaute publicado, mas suas regras de negócio estão com o marcador EXXXX em lugar do código definitivo e nenhuma fonte deste curso publica cronograma de implantação.
PENDENTE DE IMPLEMENTAÇÃO TÉCNICA.
O que se ensina nestes três slides é estrutura publicada, não fluxo operacional em produção.
O que está disponível hoje — substituição. Grupo subst com chSubstda (chave da nota substituída), cMotivo e xMotivo (opcional). O envio de nova DPS com chSubstda produz, segundo o P&R [ORIENTATIVO], duas ações simultâneas: cancelamento da original e geração da substituta vinculada, com "Cancelamento por Substituição" como efeito automático. cMotivo — seis valores, nenhum outro aceito: 01 Desenquadramento do SN · 02 Enquadramento no SN · 03 Inclusão Retroativa de Imunidade/Isenção · 04 Exclusão Retroativa de Imunidade/Isenção · 05 Rejeição pelo tomador/intermediário responsável · 99 Outros. Duas travas de naturezas distintas [PRIMÁRIA]: E0056 — pode bloquear a substituição de nota emitida sem tomador identificado; é parametrizável pelo município. E0058 — proíbe a substituição que altere a identificação do tomador; não é parametrizável. Não afirmar: que a correção de valor da NFS-e "se faz por substituição" em qualquer hipótese. O que se afirma é mais estreito e é o que as fontes sustentam: hoje, a estrutura de nota de crédito de redução de valor não está implantada na NFS-e, e os instrumentos disponíveis são cancelamento e substituição, ambos sujeitos a parametrização municipal e às travas E0056/E0058.
Fontes: Anexo VI v1.04.00, grupo subst, regras E0056 e E0058 [PRIMÁRIA]; P&R NFS-e v1.00, assuntos 10.1, 10.4 e 10.5 [ORIENTATIVO].
124. NFS-e: estrutura prevista e os domínios que não espelham a NF-e
A advertência do slide anterior continua valendo aqui.

NF-e (NT 2025.002 v1.52)
NFS-e (Anexo VI v1.04.00 — estrutura publicada)
Campo de finalidade
finNFe
finNFSe
"Regular"
1 = NF-e normal
0 = NFS-e regular
"Crédito"
5
1
"Débito"
6
2
Tipos de débito
8 (01 a 08)
6 (01 a 06)
Tipos de crédito
6 (01 a 06)
2 (01 e 05)
Status operacional
Campos publicados e validados
Regras com EXXXX, sem cronograma

Os códigos não coincidem e os domínios não coincidem. Na NFS-e não há tpNFSeDebito 07 nem 08. E tpNFSeCredito admite apenas 01 (Multa e juros) e 05 (Transferência de crédito na sucessão) — não há equivalente aos tipos de crédito 02, 03, 04 e 06 da NF-e. Confirmação cruzada [PRIMÁRIA] — tabela cClassTrib 22/06/2026, coluna indNFSe: 800001, 800002, 811001, 811002 e 811003 têm indNFSe = 1; 410030 e 810001 têm indNFSe = 0. Formulação segura a adotar em sala: "Na estrutura publicada da NFS-e não existe nota de crédito de redução de valor. Enquanto a implantação estiver pendente, os instrumentos disponíveis são cancelamento e substituição." — e não "corrigir valor na NFS-e é substituir".
Fontes: Anexo VI v1.04.00, campos finNFSe, tpNFSeDebito, tpNFSeCredito [PRIMÁRIA]; NT 2025.002 v1.52, campos B25/B25.1/B25.2 [PRIMÁRIA]; Tabela cClassTrib 22/06/2026, coluna indNFSe [PRIMÁRIA].
125. gIBSCBSAjuste: leiaute reduzido, implantação pendente
(advertência do slide 123 no topo) O grupo gIBSCBSAjuste, em NFSe/infNFSe/DPS/infDPS/IBSCBS/valores/trib/, tem vIBS e vCBS obrigatórios e condição de uso literal: "Grupo deve (e só pode) ser informado quando: tpNFSeDebito = 01, 02, 03 ou 05 ou tpNFSeCredito = 05".
Regime
Tipos
Comportamento do leiaute publicado
Ajuste puro de saldo
ND 01, 02, 03, 05 + NC 05
gIBSCBSAjuste obrigatório. Bloco de serviço vedado: serv, cServ, cTribNac, cNBS, xDescServ, locPrest, cLocalidadeIncid, pRedutor, valores, alíquotas e totais por ente. O valor é declarado
Ajuste com operação
ND 04, 06 + NC 01
gIBSCBSAjuste vedado. Bloco de serviço obrigatório

A prova está na própria estrutura das regras, publicadas em pares repetidos ao longo da aba — "para tpNFSeDebito = 01, 02, 03 ou 05, este campo não deve ser informado" / "este campo deve ser informado obrigatoriamente quando finNFSe = 0 ou quando tpNFSeDebito = 04 ou 06 ou tpNFSeCredito = 01".
Quatro limitações a declarar em sala, expressamente:
Não se afirma que gIBSCBSAjuste já está sendo validado — as regras que o governam trazem EXXXX.
Não se afirma que a Calculadora já processa essas estruturas. O que o Anexo VI registra é o desenho previsto: para ND 01/02/03/05 e NC 05, os totais "não serão retornados pela Calculadora, mas definidos pelo valor informado em gIBSCBSAjuste"; para ND 04/06 e NC 01, "serão iguais ao valor retornado pela Calculadora". Desenho publicado ≠ comportamento em produção.
Não se afirma que os tipos de ND/NC da NFS-e já podem ser usados em produção.
Não há cronograma de implantação publicado em nenhuma fonte deste curso.
Fontes: Anexo VI v1.04.00, abas LEIAUTE DPS_NFS-e - RT, RN DPS_NFS-e e NFS-e_AJUSTE_LEIAUTE [PRIMÁRIA].
126. tpAjusteBC: ajustar a base não é emitir nota de ajuste
tpAjusteBC está em .../valores/vAjusteBC/documentos/docAjusteBC/ e opera dentro da nota regular, reduzindo a base. Nada tem a ver com finNFSe 1 ou 2 — está em produção, ao contrário do bloco anterior.
tpAjusteBC
BC do ISSQN
BC do IBS/CBS
Receita Bruta SN
Referência indicada na planilha
2, 5, 6, 7, 8, 99
Sim
Não
Não
—
9 Profissional parceiro
Sim
Não
Sim
—
101 Intermediação de imóveis
Sim
Sim
Sim
LC art. 255, § 3º [TABELA OFICIAL]
102, 103, 104, 199
Sim
Sim
Sim
LC art. 12, § 2º, IV [TABELA OFICIAL]
105 Glosa de Serviços de Saúde
Não
Sim
Sim
LC art. 130, p. único [TABELA OFICIAL]

O tipo 105 é o único que ajusta a base do IBS/CBS sem ajustar a do ISSQN. Campo correspondente: vCalcAjusteBCIBSCBS, com a regra E1533 exigindo o preenchimento quando houver documento com tipo 101, 102, 103, 104, 105 ou 199, e a E1531 vedando-o para os tipos 2, 5, 6, 7, 8, 9 e 99. PENDENTE DE VALIDAÇÃO: os tipos 1, 3 e 4 constam do domínio do leiaute mas não têm linha na planilha de repercussão nem figuram nas regras E1531/E1533. Observação da própria planilha: a repercussão na base do ISSQN depende de o município autorizar a dedução via parametrização no Painel Administrativo Municipal.
Fontes: Anexo VI v1.04.00, abas AJUSTE_BC_REPERCUSSÃO e RN DPS_NFS-e, regras E1531/E1533/E1535 [PRIMÁRIA].
127. Eventos: autor, documento vinculado e status
A NT 2025.002 v1.52, cap. 8.1, cria quinze eventos para o IBS e a CBS, autorizados na SVRS, mais o evento genérico de cancelamento.
Código
Evento
Autor declarado
112130
Perecimento, perda, roubo ou furto durante transporte contratado pelo fornecedor
Emitente
112140
Fornecimento não realizado com pagamento antecipado
Emitente
211124
Perecimento, perda, roubo ou furto durante transporte contratado pelo adquirente
Destinatário
211128
Aceite de débito na apuração por emissão de nota de crédito
Destinatário da NF-e
212110 / 212120
Manifestação sobre pedido de transferência de crédito na sucessão (IBS / CBS)
Sucessora
412120 / 412130
Manifestação do Fisco sobre o mesmo pedido (IBS / CBS)
Fisco
110001
Cancelamento de Evento
O mesmo autor do evento cancelado

O evento 211128, documentalmente:
Qual nota o admite — a NT o nomeia "Aceite de débito na apuração por emissão de nota de crédito" e o vincula ao modelo 55. A NT não enumera os tipos de NC que o exigem. A Cartilha Vol. 1, item 4.5, indica como exemplo de hipótese de uso a NC tipo 04 — Redução de valores [ORIENTATIVO].
Autor — o destinatário da NF-e, com tpAutor = 2 (Empresa destinatária).
Documento referenciado — a NF-e à qual o evento é vinculado, pela chNFe da parte geral.
Conteúdo — um único campo de conteúdo: indAceitacao, valores 0 = não aceite; 1 = aceite. Descrição literal do campo: "Indicador de concordância com o valor da nota de crédito".
Status técnico — leiaute publicado, schema e211128_v1.00.xsd; campo e evento constam da lista do cap. 8.1.
Hipótese de não exigência, se confirmada — a Cartilha registra que o evento "não será exigido quando houver desfazimento de operações antes do fornecimento, ou seja, antes do efetivo recebimento, pelo destinatário, do item fornecido" [ORIENTATIVO] — não há RV na NT que confirme esse recorte.
Não se afirma "sem aceite, não há crédito" como regra universal. A NT não traz essa formulação, e o evento não está enumerado por tipo de NC.
Duas observações operacionais da própria NT: o lote admite até 20 eventos, mas a orientação expressa é não compor lote para os eventos da reforma; e a RV P23-10 veda o uso do 110001 para cancelar eventos dos tipos 110001, 110111, 110112 e outros. Onde está o procedimento — dependência declarada pela própria NT. O item 8.2 da NT 2025.002 v1.52 diz literalmente que a parte geral do Web Service de Registro de Evento "se mantém a mesma para envio de todos os eventos e está especificada na seção 5.8 do Manual de Orientação do Contribuinte (MOC) e na seção Web Service – NFeRecepcaoEvento – Parte Geral do MOC Online". Em cada evento, a NT remete a mensagem de retorno ao item 5.8.2 do MOC e as regras de validação gerais ao item 5.8.4 do MOC. A NT publica as partes específicas e as regras de negócio próprias — não o procedimento geral de envio. Manual em vigor no Portal Nacional: MOC versão 7.0 — NF-e e NFC-e. Parte geral: MOC 7.0, seções 5.8 a 5.8.6 — não detalhada neste curso. Essas seções trazem a interface geral, os detalhes por evento, a mensagem de retorno e as validações genéricas; este curso não descreve esse procedimento de transmissão, e conhecê-lo não transforma registro de evento em crédito nem em processamento na apuração. PENDENTE DE VALIDAÇÃO: o evento "Destinação de item para consumo pessoal" (Cartilha 4.1) não consta da lista do cap. 8.1. Frase de fronteira: O efeito do aceite na apropriação e na conta-corrente será tratado no M6.
Fontes: NT 2025.002 v1.52, itens 8.1, 8.2, 8.5, 8.13, 8.17 e RV P23-10 [PRIMÁRIA]; Cartilha Vol. 1, itens 4.1 a 4.5 [ORIENTATIVO].
128. EXERCÍCIO EM DUPLAS: matriz de decisão rápida
Dinâmica: em duplas. Para cada caso, quatro marcações, sem redação:

1. Instrumento
2. Nota inteira ou item
3. Grupo ou evento principal
4. Uma regra decisiva
Caso 1
☐ ND ☐ NC ☐ Subst. ☐ Evento
☐ Nota ☐ Item ☐ N/A
_______
_______
Caso 2
☐ ND ☐ NC ☐ Subst. ☐ Evento
☐ Nota ☐ Item ☐ N/A
_______
_______
Caso 3
☐ ND ☐ NC ☐ Subst. ☐ Evento
☐ Nota ☐ Item ☐ N/A
_______
_______
Caso 4
☐ ND ☐ NC ☐ Subst. ☐ Evento
☐ Nota ☐ Item ☐ N/A
_______
_______
Caso 5
☐ ND ☐ NC ☐ Subst. ☐ Evento
☐ Nota ☐ Item ☐ N/A
_______
_______
Caso 6
☐ estrutura prevista ☐ operacional hoje
☐ Nota ☐ Item ☐ N/A
_______
_______

Os seis fatos:
1. NF-e de venda autorizada, mercadoria transportada; o destinatário recusa integralmente a entrega e o bem retorna. 2. Mesma NF-e, cinco itens: o destinatário contribuinte do ICMS recebe três e recusa dois. 3. Encerrado o período, o contribuinte identifica quatro NF-e de fornecimento próprias não processadas. 4. Bens em estoque, adquiridos de terceiros, são objeto de furto. 5. NFS-e autorizada há três dias, dentro do prazo, com classificação tributária incorreta; o tomador ainda não se manifestou. 6. Prestador de serviço recebe juros de mora do cliente. Pergunta dupla: (a) qual é a estrutura prevista no leiaute da NFS-e? (b) o fluxo pode ser ensinado hoje como operacional?
Nenhum caso admite CC-e como resposta — nenhum deles cabe nas hipóteses da cláusula décima quarta-A do Ajuste SINIEF 07/2005, conferida no slide 108. A recusa parcial com destinatário contribuinte é a hipótese da ND tipo 09, prevista pelo Ajuste SINIEF nº 34/2026. A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente.
Fontes: casos construídos sobre Ajuste SINIEF 49/2025, NT 2025.002 v1.52 e Anexo VI v1.04.00. · Ajuste SINIEF 34/2026, cl. 1ª [PRIMÁRIA].
Espaço para a sua resposta







129. GABARITO
CORREÇÃO ORAL — só a regra decisiva:
Caso
Instrumento
Nota/Item
Grupo ou evento
Regra decisiva
1
NC 03
Nota (refNFe)
—
VC02-07 — em finNFe=5, item é proibido
2
ND 09 — NF-e de saída do destinatário contribuinte
Nota (refNFe)
itens recusados em prod
Aj. SINIEF 34/2026 · finNFe=6 · sem regra de validação publicada
3
ND 03
Item, sem nItem
gAjusteCompet
VC03-10 — nItem vedado na ND 03
4
ND 07
Nota (aquisição + serviços)
gEstornoCred
UB112-10 — gAjusteCompet VEDADO (CST 410)
5
Substituição
N/A
subst (chSubstda+cMotivo)
E0058 não incide — não há troca de tomador
6
Estrutura prevista ≠ operacional
N/A
gIBSCBSAjuste vedado no tipo 04
Regras com EXXXX, sem cronograma

TEXTO COMPLETO PARA ESTUDO POSTERIOR:
Caso 1 — Recusa total. NC, finNFe=5, tpNFCredito=03, tpNF=0 Entrada (B25.2-40, msg 1152). Emitida pelo remetente da saída original (Aj. 49/25, cl. 5ª, caput, redação do Aj. 8/26). cClassTrib "Não limitar" (UB14-80). refNFe, nível de nota (cl. 5ª, V, "a") — item é vedado (VC02-07, msg 1042). Emitente da referenciada = emitente desta (B25-50). natOp "Retorno por Recusa ou não localização". Grupo dest: o destinatário da saída original (cl. 5ª, VII). ⚠ Pendência P8: a Cartilha, item 3.2, orienta o próprio emitente como destinatário — prevalece o Ajuste, por ser norma.
Caso 2 — Recusa parcial, destinatário contribuinte do ICMS. Pelo Ajuste SINIEF nº 34/2026 (cl. 5ª, II, "b"), quem emite é o próprio destinatário: NF-e de saída, finNFe = 6, tpNFDebito = 09, natOp "Retorno por Recusa Parcial", grupo prod com as informações dos itens não entregues, refNFe com a chave de acesso da NF-e de saída original e destaque do ICMS quando houver. Par de contraste com o caso 1: mudam o emitente e o instrumento — NC 03 pelo remetente, ND 09 pelo destinatário —, mas o vínculo é o mesmo, no nível da nota.
A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente. Não se atribuem ao tipo 09 CST, cClassTrib, grupo de IBS/CBS, regra de validação, CFOP ou efeito na apuração: as fontes disponíveis não os confirmam e este material não os completa por analogia.
A hipótese da recusa parcial com destinatário não contribuinte — NC tipo 06 emitida pelo remetente, com DFeReferenciado por item — permanece desenvolvida nos tópicos 113 a 115 e não é cobrada neste exercício.
Divergência normativa e técnica: o Ajuste SINIEF nº 34/2026 aponta refNFe e identificação dos itens recusados em prod; as regras de validação vigentes da NT 2025.002-RTC v1.52 ainda exigem DFeReferenciado na NC tipo 06. A emissão dependerá da atualização e compatibilização da documentação técnica.
Caso 3 — NF não processadas. ND, finNFe=6, tpNFDebito=03, tpNF=1 Saída (B25-120). CST 811, cClassTrib 811002 (UB14-70). gAjusteCompet obrigatório (UB112-20, msg 1170), com competApur do período e vIBS ou vCBS > 0 (UB112-30). Emitente e destinatário: o próprio contribuinte, mesmo CNPJ base. Quatro itens, um por documento faltante. DFeReferenciado obrigatório em cada item (VC02-10), sem nItem (VC03-10, msg 1039), e quatro chaves distintas permitidas (exceção 1 da VC02-30).
Caso 4 — Furto em estoque. ND, finNFe=6, tpNFDebito=07. CST 410, cClassTrib 410030 (UB14-70). gEstornoCred obrigatório (UB116-20). gAjusteCompet VEDADO — CST 410 tem ind_gAjusteCompet = 0; informá-lo gera a rejeição 1169 (UB112-10). Armadilha central: o tipo 07 é ajuste de saldo, mas não é ajuste de competência. Aj. 49/25, cl. 3ª: CFOP 5.927, natOp "Baixa de Estoque", destinatário = o próprio emitente (VII), justificativa em infAdFisco (VI), destaque do ICMS quando houver (V, redação do Aj. 20/26 [CONSOLIDADO]), estorno do ICMS creditado (§ 2º). O ICMS aqui é permitido — exceção 1 da B25-80. Referenciar a aquisição e os serviços vinculados (Cartilha 2.7 [ORIENTATIVO]).
Caso 5 — NFS-e com tributação errada. Substituição, não nota de crédito — tpNFSeCredito só admite 01 e 05, e a estrutura de redução de valor não está implantada. Nova DPS com chSubstda + cMotivo. Motivo 99 — Outros, salvo se o erro for de enquadramento no SN (01/02) ou de imunidade/isenção (03/04). Como não há alteração da identificação do tomador, E0058 não incide. Verificar a parametrização municipal de E0056 e o prazo municipal de cancelamento. Recomendação operacional [ORIENTATIVO]: agir antes da manifestação do tomador, porque o P&R registra que a confirmação — inclusive a tácita, quando parametrizada — pode bloquear a substituição.
Caso 6 — Juros de mora em serviço: estrutura prevista × situação operacional.
(a) Estrutura prevista no leiaute [PRIMÁRIA — Anexo VI v1.04.00]: NFS-e de débito, finNFSe=2 (não 6 — os códigos não espelham a NF-e), tpNFSeDebito=04. gIBSCBSAjuste é vedado neste tipo — o grupo só cabe em ND 01/02/03/05 e NC 05. O bloco serv/cServ/cTribNac/xDescServ e o bloco valores são obrigatórios; no desenho publicado, os totais correspondem ao valor retornado pela Calculadora. (b) Situação operacional: as regras de negócio dessa família estão publicadas com EXXXX e não há cronograma de implantação em nenhuma fonte deste curso. Não é possível ensinar esse fluxo como plenamente operacional. Nenhuma alternativa operacional atual para juros de mora em serviço está confirmada em documentação oficial entre as fontes lidas — PENDENTE DE IMPLEMENTAÇÃO TÉCNICA. (c) Contraste tecnicamente sustentado — o mesmo fato em fornecimento de bens: finNFe=6, tpNFDebito=04, cClassTrib "Não limitar" (UB14-70), DFeReferenciado obrigatório (VC02-10, msg 1038) com nItem (VC03-20). Este é o único dos dois caminhos com regra de validação de código definitivo. A comparação é o objetivo do caso: a mesma causa, com maturidade técnica diferente em cada documento.', NULL, NULL, NULL, NULL, NULL, 3, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-121-apostila-04', 'CT-121', 'texto', 'Apostila — Correções, ajustes e eventos fiscais (parte 4/4)', 'Fontes: as indicadas em cada caso. Caso 2: Ajuste SINIEF 34/2026, cl. 1ª [PRIMÁRIA].
Anotações da correção', NULL, NULL, NULL, NULL, NULL, 4, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-122-apostila-01', 'CT-122', 'texto', 'Apostila — Créditos e apuração assistida (parte 1/3)', 'MÓDULO 6 — CRÉDITOS E APURAÇÃO ASSISTIDA
divisória no slide 130 · conteúdo nos slides 131 a 148
131. Apuração assistida: documentos alimentam o cálculo, contribuinte revisa e ajusta
Diferentemente do modelo da EFD ICMS/IPI, os débitos e créditos apresentados no Sistema de Apuração Assistida não são apurados em arquivos de declaração transmitidos pelo contribuinte. São extraídos de forma automática a partir dos documentos fiscais eletrônicos emitidos ou recebidos.
Três consequências diretas, na formulação da própria Cartilha:
Erro de preenchimento vira erro de apuração. "Eventuais erros de preenchimento ou de enquadramento tributário poderão repercutir de forma direta e automática nos débitos, créditos e no saldo de IBS apresentado pelo sistema."
O cálculo é preliminar. O saldo é "preliminarmente realizado pela administração tributária e disponibilizado ao contribuinte para revisão e ajustes" — assistida não significa definitiva, e a fidedignidade permanece condicionada à correta emissão.
Não há classificação pelo adquirente. "Inexiste a atribuição, pelo adquirente, de códigos CST ou cClassTrib para fins de apuração do IBS" — essas classificações integram exclusivamente a lógica de emissão, na perspectiva do emitente.
Como enunciar o item 3 com segurança. A Cartilha descreve o funcionamento do sistema: o reconhecimento do crédito "não decorre de uma opção classificatória realizada na escrituração de um documento fiscal de aquisição pelo destinatário, mas da aplicação automática de regras pelo Sistema de Apuração Assistida do IBS, que interpreta os dados dos documentos fiscais eletrônicos, à luz das disposições legais e das especificações técnicas vigentes". Essa é uma descrição de processamento em material orientativo, não uma definição jurídica do direito ao crédito. O regime jurídico está na LC 214/2025, conferida em fonte primária: o art. 45 determina que o contribuinte deverá apurar o saldo em cada período, com ajustes positivos ou negativos (§ 1º), e a apuração implica confissão de dívida e constitui o crédito tributário (§ 4º); o art. 46 prevê que o Comitê Gestor e a RFB poderão apresentar a apuração assistida, que, confirmada ou ajustada pelo contribuinte, implica confissão de dívida (§ 3º), e cuja ausência de manifestação no prazo faz presumir correto o saldo (§ 4º). Apuração assistida centraliza a origem documental; não elimina o dever de apurar, de revisar nem de se manifestar. O que se ensina aqui é como o sistema trata a informação, não o regime jurídico do crédito.
Um quarto ponto estrutural: a separação por estabelecimento deixa de existir. Todos os débitos e créditos dos estabelecimentos de uma mesma pessoa jurídica são consolidados em uma única apuração, concentrada no CNPJ da matriz, e o recolhimento se faz por guia única centralizada na matriz. A repartição entre entes é feita pelo sistema de distribuição, com base nas informações dos documentos. O MOC v1.10 confirma que as informações são organizadas por operação e que cada operação possui ciclo próprio, com lançamentos e movimentações financeiras preservados ao longo do processamento. A fundamentação jurídica permanece na LC 214/2025; o manual é documentação técnica.
Fontes: LC 214/2025, art. 45, caput e § 4º, e art. 46, caput e §§ 3º e 4º [PRIMÁRIA] — dever de apurar do contribuinte, apresentação da apuração assistida e efeitos da confirmação ou da ausência de manifestação; art. 44, quanto à remissão dos prazos ao regulamento [PRIMÁRIA]; Cartilha Vol. 2, itens 1.1, 1.2, 1.3 e 1.6 [ORIENTATIVO]. MOC da API de Integração com a Apuração Assistida do IBS v1.10, set/2026 [TÉCNICA].
132. Seis conceitos que não podem ser confundidos
Conceito
Definição operacional
Onde o contribuinte vê
1. Registro do débito
O IBS destacado pelo contribuinte no documento fiscal de fornecimento e em suas complementares, quando processado pelo sistema
Demonstrativo, coluna Fornecimento; conta-corrente, ocorrência "Fornecimento"
2. Extinção do débito
A ocorrência de uma das modalidades do art. 27. Débito em aberto = ainda não extinto por nenhuma delas. Débito extinto = objeto de alguma delas
Demonstrativo, Em aberto / Extinto
3. Valor calculado no documento → crédito potencial
O valor de IBS informado ou calculado no documento de aquisição. Enquanto o gatilho correspondente não ocorre, o sistema o exibe como valor potencial identificado, ainda não apropriado
Aquisições, coluna A apropriar
4. Apropriação do crédito
O momento em que o sistema passa a tratar o valor como crédito do adquirente. Está associado à extinção do débito do fornecedor, ressalvadas as exceções legais
Aquisições, coluna Apropriado
5. Utilização do crédito
O crédito apropriado efetivamente vinculado à extinção de um débito do contribuinte
Utilizado × Não utilizado
6. Estorno, cancelamento ou ajuste
Ocorrências que reduzem ou revertem lançamentos já registrados na operação
Conta-corrente, ocorrências de estorno e o saldo da operação

A distinção que mais gera erro em sala — quatro estados, não dois:
(a) valor calculado ou informado no documento → (b) crédito potencial, exibido como "a apropriar" → (c) crédito efetivamente apropriado, após o gatilho correspondente → (d) crédito utilizado ou não utilizado. O mesmo número percorre os quatro estados e aparece em colunas diferentes em cada um. A regra geral está no art. 47 da LC 214/2025, conferido em fonte primária: a apropriação depende da extinção do débito da operação em que o contribuinte é adquirente e da comprovação por documento fiscal eletrônico idôneo (§ 1º, II), excetuadas as aquisições de uso ou consumo pessoal (art. 57) e as demais hipóteses previstas na própria Lei Complementar — entre elas os combustíveis do regime específico (§§ 4º e 5º) e a hipótese condicionada do art. 48, que só opera se não houver sido implementada nenhuma das modalidades de split payment ou de recolhimento pelo adquirente. O pressuposto do art. 48 não se presume: verifica-se na operação concreta. Este quadro descreve em que coluna o sistema exibe o valor em cada estado; não converte autorização da nota em crédito automático.
Fontes: Cartilha Vol. 2, itens 1.3, 3.2 e 3.5 [ORIENTATIVO].
133. Débito, extinção e crédito: três momentos, duas apurações
        ┌──────── APURAÇÃO DO FORNECEDOR ────────┐   ┌──── APURAÇÃO DO ADQUIRENTE ────┐
 
 T1     ⏱ EMISSÃO E PROCESSAMENTO DO DOCUMENTO
        Débito registrado ................... R$ 1.000  →  A APROPRIAR
                                                            (valor potencial identificado
                                                             pelo sistema, ainda não apropriado)
 
 T2     ⏱ EXTINÇÃO DO DÉBITO  (art. 27)
        I  compensação com créditos
        II pagamento pelo contribuinte
        III split payment
        IV recolhimento pelo adquirente
        V  pagamento por responsável
        Débito ................ EXTINTO      ──┐
                                               └──►  ⏱ T3  APROPRIAÇÃO DO CRÉDITO
                                                         Crédito APROPRIADO
                                                            ├─ NÃO UTILIZADO (disponível)
                                                            └─ UTILIZADO (extinguiu débito)
 
   T2 ocorre na apuração do FORNECEDOR e desencadeia, quando aplicável,
   T3 na apuração do ADQUIRENTE.

Os quatro pontos que o esquema fixa:
T1 — emissão e processamento do documento. Registra o débito na apuração do fornecedor e faz o sistema exibir, na apuração do adquirente, um valor potencial na coluna "a apropriar".
T2 — extinção do débito na apuração do fornecedor. É o gatilho descrito pela Cartilha: "o marco temporal para o reconhecimento do crédito não decorre de um evento operacional do adquirente, mas de um evento apuratório ocorrido no âmbito do fornecedor".
T3 — apropriação do crédito na apuração do adquirente. T1, T2 e T3 não são necessariamente simultâneos. T3 não depende de entrada física: diferentemente do ICMS, no IBS o momento "não guarda relação com a movimentação física do bem", nem com a escrituração do Registro de Entradas.
As exceções existem e foram conferidas. A Cartilha ressalva "salvo nas hipóteses em que a Lei Complementar nº 214/2025 prevê exceção expressa", e os dispositivos foram lidos: art. 47, caput — exceção das aquisições de uso ou consumo pessoal (art. 57) e das demais hipóteses previstas na própria LC; art. 47, §§ 4º e 5º — combustíveis do regime específico, com dispensa da comprovação de extinção; art. 48 — dispensa condicionada a que não tenha sido implementada nenhuma das modalidades de split payment (arts. 31 e 32) ou de recolhimento pelo adquirente (art. 36), exigindo, nessa hipótese, o destaque dos valores corretos. A sequência T1 → T2 → T3 é a regra geral; nessas hipóteses ela não se aplica do mesmo modo, e o pressuposto do art. 48 precisa ser verificado na operação concreta.
Fontes: Cartilha Vol. 2, itens 1.3 e 1.5 [ORIENTATIVO]; LC 214/2025, art. 27 [PRIMÁRIA].
134. Art. 27: as cinco modalidades de extinção
Transcrição literal do caput e dos incisos, conferida em fonte primária:
"Art. 27. Os débitos do IBS e da CBS decorrentes da incidência sobre operações com bens ou com serviços serão extintos mediante as seguintes modalidades: I – compensação com créditos, respectivamente, de IBS e de CBS apropriados pelo contribuinte, nos termos dos arts. 47 a 56 e das demais disposições desta Lei Complementar; II – pagamento pelo contribuinte; III – recolhimento na liquidação financeira da operação (split payment), nos termos dos arts. 31 a 35 desta Lei Complementar; IV – recolhimento pelo adquirente, nos termos do art. 36 desta Lei Complementar; ou V – pagamento por aquele a quem esta Lei Complementar atribuir responsabilidade."
Inciso
Modalidade
Como o sistema a nomeia
Estágio nas fontes lidas
I
Compensação com créditos
"Extinção por compensação com créditos"
Processada
II
Pagamento pelo contribuinte
"Pagamento por período de apuração"; guia consolidada emitida no menu Débitos em aberto
Processada — exibição no gráfico ainda pendente
III
Split payment
"Extinção por split payment (art. 27, III)"
Processada mediante simulação no Piloto
IV
Recolhimento pelo adquirente (RAD)
"Extinção por RAD (art. 27, IV)"
Processada mediante simulação no Piloto
V
Pagamento por responsável
—
"Ainda não é processado na etapa descrita pela Cartilha IBS vol. 2 v1.00"

Advertência exigida: os arts. 31 a 36, que disciplinam o split payment e o recolhimento pelo adquirente, não foram lidos — estão fora do trecho recuperável. Este módulo descreve como essas modalidades aparecem na apuração, não o seu regime jurídico. E não se afirma que o split payment esteja plenamente automatizado: nas fontes lidas ele opera, no Piloto, por simulação, na modalidade on-line, apenas sobre o saldo devedor do documento.
Fontes: LC 214/2025, art. 27, caput e incisos I a V [PRIMÁRIA]; Cartilha Vol. 2, itens 3.2, 3.3, 3.4.3 e 3.5.1 [ORIENTATIVO].
135. Art. 27, parágrafo único: a cada modalidade, uma forma de imputação
Transcrição literal, conferida em fonte primária:
"Parágrafo único. A extinção de débitos de que trata o caput deste artigo: I – nas hipóteses dos incisos I e II do caput deste artigo, será imputada aos valores dos débitos não extintos do IBS e da CBS incidentes sobre as operações ocorridas no período de apuração na ordem cronológica do documento fiscal, segundo critérios estabelecidos no regulamento; II – nas hipóteses dos incisos III e IV do caput deste artigo, será vinculada à respectiva operação; e III – na hipótese do inciso V do caput deste artigo, será vinculada à operação específica a que se refere ou, caso não se refira a uma operação específica, será imputada na forma do inciso I deste parágrafo."
A leitura que organiza tudo — duas lógicas, não uma:

Imputação cronológica (§ único, I)
Vinculação à operação (§ único, II)
Modalidades
I compensação e II pagamento pelo contribuinte
III split e IV RAD
Alvo
Os débitos não extintos do período, em ordem cronológica do documento
A operação específica que originou o recolhimento
Efeito prático
O valor "escorre" pelos débitos abertos
O valor fica preso àquele documento

O inciso V é híbrido: vincula-se à operação quando houver uma; não havendo, cai na regra cronológica do inciso I. Limite de escopo: o próprio inciso I remete a "critérios estabelecidos no regulamento". Os dois regulamentos foram consultados neste ponto — Resolução CGIBS nº 6/2026, art. 26, §§ 1º e 2º, e Decreto nº 12.955/2026, art. 26, §§ 1º e 2º —, e é neles que estão os critérios detalhados de imputação. Este curso não desenvolve os critérios regulamentares detalhados de imputação além dos dispositivos expressamente indicados. Neste ponto, apresenta-se apenas o critério legal da ordem cronológica do documento fiscal, permanecendo os demais critérios fora do escopo.
Fontes: LC 214/2025, art. 27, parágrafo único, incisos I a III [PRIMÁRIA]; Resolução CGIBS nº 6/2026 e Decreto nº 12.955/2026, art. 26, §§ 1º e 2º, quanto à remissão ao regulamento — dispositivos conferidos, critérios não desenvolvidos neste curso [PRIMÁRIA]
136. Conta-corrente por operação: para que serve e a que se vincula
O que muda: no ICMS, confrontam-se somatórios — total de débitos contra total de créditos do período. No IBS, "cada crédito apropriado é utilizado para compensação do débito de uma nota fiscal específica de fornecimento (ou de outro tipo de débito), de acordo com sua cronologia". Esse controle documento a documento é feito em um conta-corrente (CC) para cada operação.
Finalidade declarada — o que o CC permite consultar:
se o débito de fornecimento foi total ou parcialmente extinto;
a(s) modalidade(s) de extinção, inclusive quando um mesmo débito for extinto por diferentes modalidades;
a origem dos créditos utilizados na compensação;
o saldo da operação após o processamento de devoluções e cancelamentos.
Vínculo com o documento e seus itens: o CC "é uma consolidação de todos os documentos fiscais atrelados a uma mesma operação, incluindo fornecimentos, complementos, devoluções, cancelamentos, ajustes". Uma nota de devolução correta não gera CC próprio: ela aparece como ocorrência dentro do CC da nota de fornecimento.
A consequência que fecha o arco com os módulos anteriores: nas hipóteses em que o leiaute ou a regra do documento exige referenciamento, o vínculo correto permite que o sistema associe o documento posterior à operação original. A ausência ou o preenchimento incorreto poderá impedir sua repercussão na apuração. A Cartilha ilustra exatamente assim: se, ao emitir uma nota de entrada de devolução, o contribuinte informa finalidade "normal" ou deixa de referenciar a nota objeto da devolução, "essa emissão poderá não surtir efeitos de apropriação de crédito na apuração assistida". O como e o quando referenciar foram vistos nos Módulos 3 e 5; não são retomados aqui.
Estrutura técnica publicada em setembro de 2026. O MOC da API de Integração com a Apuração Assistida do IBS v1.10 passou a publicar a estrutura do conta-corrente por operação, que reúne: chave do documento que inaugurou o conta-corrente; CNPJ raiz do fornecedor; CNPJ raiz do adquirente, quando existente; lançamentos da operação; débito em aberto; débito extinto; crédito a apropriar; crédito não utilizado; crédito utilizado; recurso financeiro a transferir; e recurso financeiro disponível para transferência. Trata-se de estrutura publicada para homologação, com produção futura — a publicação do leiaute não comprova disponibilidade geral em produção.
Fontes: Cartilha Vol. 2, item 1.4 e item 3.4.1 [ORIENTATIVO]. MOC API da Apuração Assistida do IBS v1.10, itens 2.1 a 2.7 e Anexos I e II [TÉCNICA].
137. O extrato do conta-corrente: as ocorrências e o que cada uma significa
Ocorrências que podem constar da coluna Descrição, com o tipo de lançamento:
Ocorrência
Lançamento
Significado
Fornecimento
Débito
O IBS destacado na nota de fornecimento
Nota Fiscal Complementar
Débito
O IBS da complementar que referencia a chave do CC consultado
Pagamento por período de apuração
Crédito
Parcela extinta por pagamento do contribuinte (art. 27, II)
Split provisionado esperando extinção de débitos
Crédito
Registro provisório da recepção de um split vinculado à operação
Estorno de split provisionado
Débito
Registro diário, antes das compensações
Extinção por split payment (art. 27, III)
Crédito
Vinculação definitiva do split ao débito
RAD provisionado esperando extinção de débitos
Crédito
O equivalente provisório do recolhimento pelo adquirente
Estorno de RAD provisionado
Débito
O equivalente diário do estorno acima
Extinção por RAD (art. 27, IV)
Crédito
Vinculação definitiva do RAD ao débito
Extinção por compensação com créditos
Crédito
Vinculação entre créditos apropriados e o débito do documento, total ou parcialmente
Transferência para Fornecedor por excesso
Débito
Valor de split processado que excedeu a parcela em aberto e é transferido para conta bancária

A chave de leitura do par provisionado/estorno — quatro afirmações, e só estas:
O provisionamento é registro provisório — a Cartilha o define literalmente como "registro provisório que indica a recepção pelo sistema de um split [ou RAD] vinculado à operação".
O estorno neutraliza ou reverte aquele lançamento provisório, dentro do processamento diário descrito, cujo objetivo declarado é "priorizar a utilização dos créditos para a extinção dos débitos do contribuinte".
Provisionamento e estorno não equivalem, isoladamente, à extinção definitiva.
A extinção definitiva só deve ser reconhecida quando aparecer a ocorrência correspondente no conta-corrente: "Extinção por split payment (art. 27, III)" ou "Extinção por RAD (art. 27, IV)".
Pendências do slide: o provisionamento de split e de RAD "ainda não refletem imediatamente na apuração do adquirente" nesta etapa do Piloto; a transferência por excesso ainda não é exibida. O MOC v1.10 publicou a estrutura técnica correspondente — estrutura publicada para homologação, com produção futura.
Fontes: Cartilha Vol. 2, item 3.4.1, tabela de ocorrências do CC [ORIENTATIVO]. MOC API v1.10, set/2026 [TÉCNICA].
138. Pagamento parcial: um débito, várias modalidades
Exemplo reproduzido da Cartilha — RAD parcial seguido de pagamento do contribuinte:
Data
Descrição
Débito
Crédito
Saldo
C/D
06/01/2026
Fornecimento
800,00

800,00
D
07/01/2026
Extinção por compensação com créditos

150,00
650,00
D
10/01/2026
RAD provisionado esperando extinção

380,00
270,00
D
10/01/2026
Estorno de RAD provisionado
380,00

650,00
D
10/01/2026
Extinção por RAD (art. 27, IV)

380,00
270,00
D
27/02/2026
Pagamento por período de apuração

270,00
0,00


Quatro leituras:
Um mesmo débito foi extinto por três modalidades diferentes — compensação, RAD e pagamento. É exatamente o que o CC se propõe a evidenciar.
O parcial é a regra, não a exceção. Entre 07/01 e 27/02 o débito esteve parcialmente extinto; nesse intervalo, a parcela correspondente à parte ainda aberta permanecia, na apuração do adquirente, como valor potencial em "a apropriar".', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-122-apostila-02', 'CT-122', 'texto', 'Apostila — Créditos e apuração assistida (parte 2/3)', 'Neste extrato, o par provisionado/estorno foi seguido da ocorrência definitiva. Em 10/01 constam as três linhas: RAD provisionado, estorno do provisionado e, logo depois, "Extinção por RAD (art. 27, IV)". É essa terceira linha — e apenas ela — que autoriza afirmar que houve extinção. Um extrato em que constem apenas as duas primeiras não permite concluir nada sobre o destino daquele valor.
A data do pagamento final é 27/02 — mês seguinte ao do fornecimento. Registro do débito, extinção e apropriação ocupam competências diferentes.
Fontes: Cartilha Vol. 2, item 3.4.1, segundo exemplo de sequência [ORIENTATIVO].
139. A linha do tempo da apuração assistida
Quatro etiquetas que o sistema exibe ao lado do mês e ano da competência:
Etiqueta
Quando
O que ocorre
EM APURAÇÃO
Durante o mês de referência
Recepção contínua dos documentos; impacto diário no saldo
ENTREGA DA APURAÇÃO ASSISTIDA
Do 1º dia do mês seguinte até a apresentação
Do 1º ao 5º dia: recepção residual de documentos do mês anterior — cadência descrita pela Cartilha Vol. 2 v1.00. A apresentação pelo Fisco tem prazo de regulamento (quadro abaixo)
REALIZAR AJUSTES
Da apresentação da apuração assistida até o vencimento
Prazo de regulamento para os ajustes positivos e negativos
VENCIMENTO
Último dia útil do mês seguinte
Entrega da apuração, ajustes tempestivos e pagamento do saldo

Processamento diário declarado — ao final de cada dia o sistema realiza, de forma automatizada: ordenação cronológica dos documentos; compensação dos débitos com os créditos apropriados (art. 27, I); vinculação dos recolhimentos às operações (incisos II a V); propagação dos efeitos das extinções ao longo da cadeia, para reconhecimento do momento da apropriação; e apuração dos valores a transferir ao fornecedor, "a serem efetivados em até 3 (três) dias úteis". O MOC v1.10 estabelece que, após o encerramento de cada dia, a Apuração Assistida executa o Processamento Diário. Concluído esse processamento, é gerado o Arquivo Diferencial, também denominado Delta. A Cartilha Vol. 2 descreveu, na etapa do Projeto Piloto retratada em janeiro de 2026, uma cadência de quatro horas; o MOC oficial v1.10 passou a descrever o processamento destinado à integração como diário. A cadência do Piloto não deve ser projetada como regra definitiva de produção.
O calendário legal — conferido nos dois regulamentos
Os regulamentos distinguem a apresentação pelo Fisco da conclusão pelo contribuinte:
Ato
Prazo
Dispositivo
Apresentação da apuração assistida pelo Fisco
Até o dia 20 do mês seguinte, para os obrigados à entrega da DeRE; até o dia 15, para os demais sujeitos passivos
Res. CGIBS nº 6/2026, art. 46, caput, I e II · Decreto nº 12.955/2026, art. 46, caput, I e II
Apuração realizada e entregue pelo contribuinte, inclusive com os ajustes
Último dia útil do mês seguinte ao do período de apuração
Art. 44, § 6º de ambos
Ajustes positivos e negativos na apuração assistida
Último dia útil do mês seguinte
Art. 46, § 3º de ambos
Pagamento do saldo a recolher
Último dia útil do mês seguinte, aferido pelo calendário do domicílio da matriz, com feriados nacionais, estaduais e municipais
Art. 45, caput e parágrafo único, de ambos

Esse calendário não elimina a dispensa de recolhimento condicionada de 2026 nem comprova o funcionamento atual do Piloto.
O que continua sendo descrição da Cartilha, e não dos regulamentos: a janela residual do 1º ao 5º dia e a cadência de propagação observada no Projeto Piloto. Os regulamentos não fixam esses pontos, e destes artigos gerais não se extrai prazo próprio para cada ND ou NC.
Três limites que permanecem:
Ajustes são possíveis "a qualquer tempo", observado o prazo decadencial; a etiqueta marca apenas o prazo tempestivo. A repercussão dos ajustes "será demonstrada em versão futura do sistema".
Os arquivos da apuração, no MOC v1.10: o Arquivo Diferencial (Delta) é gerado automaticamente depois do Processamento Diário e reúne os lançamentos e as movimentações financeiras daquele processamento; o Arquivo Manual é solicitado pelo contribuinte para um período informado, integralmente compreendido em uma única competência. Os arquivos podem ser consultados e baixados pelo Portal do Contribuinte ou consumidos pelas APIs, conforme a etapa de implantação. O arquivo consolidado final da competência, mencionado na Cartilha Vol. 2, segue com leiaute "a ser divulgado oportunamente": o MOC v1.10 publicou os arquivos Delta e Manual, mas não comprova a disponibilização daquele arquivo consolidado. Não se afirma que o ambiente de produção da API já esteja implantado — o cronograma do próprio MOC informa homologação da Etapa 1 em 28/09/2026 e implementação em produção futura.
Apresentada a apuração assistida, ela é de uso obrigatório, e a apuração do art. 44 só se faz por ajustes sobre ela (art. 46, § 2º); na ausência de manifestação até o prazo do § 3º, presume-se correto o saldo e o crédito tributário se considera constituído (art. 46, § 7º).
Fontes: Resolução CGIBS nº 6/2026, art. 44, § 6º, art. 45 e art. 46, caput e §§ 2º, 3º e 7º (pp. 31 a 33 do PDF oficial) e Decreto nº 12.955/2026, mesmos dispositivos, ambos conferidos em fonte primária em 16/09/2026 [PRIMÁRIA]; LC 214/2025, arts. 44 a 46 [PRIMÁRIA]; Cartilha Vol. 2 v1.00, itens 1.5 e 2.4, quanto à cadência e às etiquetas do sistema [ORIENTATIVO]. MOC API da Apuração Assistida do IBS v1.10, set/2026 [TÉCNICA].
140. O demonstrativo: quatro totalizadores que precisam ser lidos juntos
Na Visão Geral do Demonstrativo de Apuração, quatro totalizadores, com as definições da Cartilha:
Totalizador
Definição
Débito em aberto
IBS incidente em fornecimentos e outras operações que geram IBS devido (saídas de devolução, estornos de crédito etc.) e que ainda não foram objeto de nenhuma das modalidades do art. 27
Débito extinto
Os mesmos valores, quando objeto de alguma das modalidades do art. 27
Crédito utilizado
Créditos devidamente apropriados e já utilizados para extinguir débitos, pela modalidade do art. 27, I
Crédito não utilizado
Créditos devidamente apropriados, disponíveis para compensação ou, observados os requisitos legais, passíveis de pedido de ressarcimento

Na aba Pagamentos, recolhimentos e créditos, as colunas são Split, RAD, Por aquisição (créditos do IBS das aquisições, exceto presumidos), Presumido e Recolhimento pelo contribuinte. Na aba Débitos detalhados, as colunas são Fornecimento (documentos próprios e suas complementares) e Devolução. Duas advertências de leitura: "Recolhimento pelo contribuinte" ainda não é exibido no gráfico na etapa descrita pela Cartilha Vol. 2 v1.00; e a barra Devolução não exibirá dados naquela etapa. Um demonstrativo com essas barras vazias não indica erro.
Fontes: Cartilha Vol. 2, item 3.2 [ORIENTATIVO].
141. "A apropriar": o status que separa valor potencial de disponibilidade
Quatro status que o sistema aplica a créditos e pagamentos, nas definições da Cartilha:
Status
Definição da Cartilha
A apropriar
IBS incidente nas aquisições cuja extinção do correspondente débito na apuração da outra parte ainda não ocorreu. Não se aplica a pagamentos nem a créditos presumidos
Utilizados
Créditos e pagamentos já utilizados para extinção de débitos do contribuinte
Não utilizados
Créditos já apropriados e pagamentos que ainda não foram utilizados
Transferidos por excesso
Aplicável exclusivamente a pagamentos vinculados a operação específica (art. 27, parágrafo único, II) — valores de split e RAD devolvidos ao fornecedor por transferência bancária

Como enunciar "a apropriar" em sala: é o valor potencial identificado pelo sistema, ainda não apropriado.
O recorte jurídico, conferido em fonte primária. O art. 47 permite apropriar créditos quando ocorrer a extinção dos débitos das operações em que o contribuinte seja adquirente, excetuadas as de uso ou consumo pessoal (art. 57) e as demais hipóteses previstas na própria Lei Complementar, e condiciona a apropriação à comprovação por documento fiscal eletrônico idôneo (§ 1º, II). Exceções expressas: nas aquisições de combustíveis do regime específico, fica dispensada a comprovação de extinção (§ 4º), e os créditos equivalem aos valores registrados em documento idôneo (§ 5º). O art. 48 dispensa o requisito de extinção exclusivamente se não houver sido implementada nenhuma das modalidades de split payment (arts. 31 e 32) ou de recolhimento pelo adquirente (art. 36), e, nessa hipótese, condiciona a apropriação ao destaque dos valores corretos (parágrafo único). Essa dispensa não se aplica indistintamente na operação atual sem verificar esse pressuposto. Créditos presumidos têm regras próprias.
As três afirmações que este slide impede:
❌ "Todo documento autorizado produz imediatamente crédito apropriável." — Não. Enquanto o débito do fornecedor não for extinto, o valor permanece em a apropriar.
❌ "Crédito não utilizado é crédito indisponível." — Não. É crédito já apropriado e disponível; apenas não foi consumido.
❌ "Todo crédito depende de um evento de aceite." — Não. O status a apropriar depende da extinção do débito, não de evento. Eventos específicos existem para hipóteses específicas, tratadas adiante. Esta é a regra geral do art. 47, e ela não é absoluta: nos combustíveis do regime específico a comprovação de extinção é dispensada (§§ 4º e 5º) e, na hipótese condicionada do art. 48, o requisito de extinção cai se não houver sido implementada nenhuma modalidade de split payment ou de recolhimento pelo adquirente — pressuposto que se verifica, não se presume.
Duas observações de estágio: créditos presumidos não recebem o status "a apropriar" — sua lógica de apropriação é outra, tratada no slide 143. E "Transferidos por excesso" não está funcional na etapa descrita pela Cartilha Vol. 2 v1.00. O MOC v1.10 publicou a estrutura técnica correspondente, para homologação, com produção futura.
Fontes: LC 214/2025, art. 47, caput, § 1º, II, e §§ 4º e 5º, e art. 48, caput e parágrafo único [PRIMÁRIA] — regra geral da apropriação, comprovação por documento idôneo, combustíveis do regime específico e dispensa condicionada; art. 27, parágrafo único, II [PRIMÁRIA], quanto aos transferidos por excesso; Cartilha Vol. 2, itens 3.2 e 3.5 [ORIENTATIVO]. MOC API v1.10, set/2026 [TÉCNICA].
142. Do lado da aquisição: o extrato de utilização do crédito
A consulta Aquisições lista as notas emitidas por terceiros que indicam o contribuinte como adquirente, agrupadas por fornecedor, com filtro por competência, CNPJ do fornecedor ou chave de acesso.
Coluna
O que soma
A apropriar
Valores de IBS do documento que ainda não foram extintos na apuração do fornecedor e que, portanto, não tiveram os créditos apropriados pelo adquirente
Apropriado → Utilizado
Valores já vinculados à extinção de algum débito
Apropriado → Não utilizado
Valores cujo crédito já foi apropriado e estão disponíveis para compensação

Abrindo os detalhes, o contribuinte acessa o Extrato de Utilização do Crédito Apropriado, que lista as notas fiscais do próprio contribuinte cujos débitos foram extintos por compensação com o crédito daquela aquisição. É a rastreabilidade na direção inversa: do crédito de entrada para os débitos que ele pagou. Simetria a fixar: o conta-corrente olha de um débito para tudo que o extinguiu; o extrato de utilização olha de um crédito para tudo que ele extinguiu. São as duas faces do mesmo controle documento a documento.
Fontes: Cartilha Vol. 2, itens 3.5 e 3.5.1 [ORIENTATIVO].
143. Crédito presumido: a tabela define a rota da apropriação
O crédito presumido não segue a regra geral do slide 133. Ele tem lógica própria, e a tabela cCredPres determina, código a código, por qual via ele é apropriado. Duas colunas decidem:
Rota
Colunas da tabela
Códigos (de 13)
Só pelo documento fiscal
Apropria via NF? = 1 · Apropria via evento? = 0
4, 5, 6, 7, 10, 11, 13
Só por evento
Apropria via NF? = 0 · Apropria via evento? = 1
2, 8, 9, 12
Por qualquer das duas
ambas = 1
1, 3

Terceira coluna decisiva — ind_DeduzCredPres = 1, presente nos códigos 4, 7 e 11: nesses casos, conforme a Cartilha Vol. 1, item 1.10, o crédito presumido é deduzido na própria nota fiscal, e não vai para a fila de compensação de débitos. No demonstrativo, o presumido aparece em coluna própria — "Presumido" — separada de "Por aquisição", que é definida como os créditos das aquisições "exceto créditos presumidos". E, como visto no slide 141, o presumido não recebe o status "a apropriar". Por que isso basta para a apuração: o aluno não precisa decorar percentuais nem artigos. Precisa saber responder a três perguntas diante de um código: entra pelo documento ou por evento? é deduzido na própria nota? aparece em que coluna do demonstrativo? Limite de fonte: a coluna "LC 214/2025" da tabela reproduz o texto dos arts. 168 a 467; esses artigos não foram lidos em fonte primária — [TABELA OFICIAL]. As vigências constantes da tabela (CBS a partir de 2027; IBS a partir de 2027 ou 2029, conforme o código) são dado cadastral e não são desenvolvidas aqui.
Fontes: Tabela cCredPres 22/06/2026, colunas Apropria via NF?, Apropria via evento?, ind_DeduzCredPres [PRIMÁRIA]; Portal da Conformidade Fácil, fichas de detalhe [ORIENTATIVO]; Cartilha Vol. 1, item 1.10 [ORIENTATIVO].
144. Crédito presumido em condição suspensiva
O leiaute prevê, ao lado de vCredPres, um campo distinto: vCredPresCondSus — "Valor do Crédito Presumido em Condição Suspensiva" —, presente tanto no ramo do IBS (UB126) quanto no da CBS (UB130), e totalizado em W49 e W56b. Observação literal do leiaute: "Preencher apenas para cCredPres com indicação de Condição Suspensiva".
As duas regras de validação delimitam a hipótese com precisão, e revelam uma assimetria:
Regra
Tributo
Rejeita se
UB126-10 (msg 1056)
IBS
Ano de emissão < 2033; ou cCredPres ≠ 4
UB130-10 (msg 1060)
CBS
Ano de emissão < 2027; ou cCredPres ≠ 4

Ou seja: um único código — o cCredPres 4, aquisição de bens móveis usados de pessoa física não contribuinte para revenda — e duas datas diferentes para o mesmo campo, conforme o tributo. Ligação com o evento 112110. O evento "Informação de efetivo pagamento integral para liberar crédito presumido do adquirente" tem autor emitente da NF-e, campo único indQuitacao com valor obrigatoriamente "1", e função declarada de liberar o crédito presumido do adquirente. É a arquitetura típica de uma condição: o crédito existe no documento, mas seu reconhecimento pleno depende de um fato posterior informado por evento. Limite honesto: a NT define o campo, as regras e o evento. Ela não enuncia o regime jurídico da condição suspensiva, e os artigos correspondentes da LC 214/2025 não foram lidos. O que se ensina aqui é a estrutura; o regime permanece PENDENTE.
Fontes: NT 2025.002 v1.52, campos UB126, UB130, W49, W56b e RV UB126-10, UB130-10 [PRIMÁRIA]; item 8.3, evento 112110 [PRIMÁRIA].
145. Os eventos de crédito: quem é o autor e o que o evento informa
Código
Evento
Autor conforme a NT
Função na apuração
112110
Informação de efetivo pagamento integral para liberar crédito presumido do adquirente
Emitente da NF-e
O fornecedor informa a quitação integral da operação (indQuitacao = 1), a fim de liberar o crédito presumido do adquirente
211110
Solicitação de Apropriação de crédito presumido
Emitente ou destinatário
Gerado pelo destinatário quanto às aquisições de terceiros; ou pelo emitente, quando a informação não tiver sido incluída na NF-e ou necessitar correção
211130
Imobilização de Item
Destinatário (adquirente)
Informa que o bem foi integrado ao ativo imobilizado, para identificação do prazo-limite para apreciação de pedidos de ressarcimento do respectivo crédito
211140
Solicitação de Apropriação de Crédito de Combustível
Destinatário — adquirente de combustível da própria cadeia produtiva
Solicita a apropriação do crédito referente à parcela consumida em sua atividade
211150
Solicitação de Apropriação de Crédito para bens e serviços que dependem de atividade do adquirente
Destinatário (adquirente)
Solicita a apropriação de crédito de bens e serviços que dependam da sua atividade

O padrão que organiza os cinco — três grupos, não dois:
Informação prestada pelo fornecedor: o 112110. A NT o vincula ao emitente da NF-e.
Eventos do destinatário/adquirente: o 211130, o 211140 e o 211150. Existem porque a informação necessária não está no documento do fornecedor — depende de um fato do adquirente: imobilizar, consumir, destinar à atividade.
Evento de autoria alternativa: o 211110 pode ser utilizado pelo emitente ou pelo destinatário, conforme a hipótese prevista na NT.
Em nenhum caso se afirma que esses eventos "destravam" crédito. O que eles fazem, nas hipóteses correspondentes, é fornecer a informação ou a solicitação necessária ao tratamento do crédito.
Retomada pontual do 211128 (leiaute já visto no M5): o evento de aceite existe porque, em determinadas hipóteses de nota de crédito, a apropriação pelo emitente tem contrapartida na apuração da outra parte. O indAceitacao registra concordância ou não. Não é regra universal: a NT não enumera os tipos de nota de crédito que o exigem, e ele não se confunde com o status "a apropriar", que depende de extinção de débito, não de aceite.
Dependência de procedimento, igual à de todos os eventos da NT: o envio destes cinco segue a parte geral da seção 5.8 do MOC, a mensagem de retorno do item 5.8.2 e as regras gerais do item 5.8.4, por remissão expressa dos itens 8.2 e 8.3 a 8.8 da própria NT. Essa parte geral está nas seções 5.8 a 5.8.6 do MOC 7.0 e não é detalhada neste curso — e dominá-la não transforma o registro do evento em crédito nem em processamento na apuração. Pendência decisiva que atravessa o slide inteiro: conforme o item 2.3.3 da Cartilha Vol. 2 v1.00, de janeiro de 2026, os Eventos de NF-e não são processados na apuração assistida na etapa ali descrita. A estrutura existe e é validada no autorizador. Essa fonte comprova a etapa que descreve e não basta, sozinha, para afirmar o estado operacional atual — para orientação sobre o sistema hoje, conferir documentação operacional vigente antes de afirmar disponibilidade ou ausência.
Fontes: NT 2025.002 v1.52, itens 8.3, 8.4, 8.5, 8.6, 8.7, 8.8 [PRIMÁRIA]; Cartilha Vol. 2, item 2.3.3 [ORIENTATIVO].
146. A fronteira de maturidade: o que não é processado na etapa descrita pela Cartilha
A Cartilha Vol. 2 é explícita: não localizar estas informações no sistema não representa falha de funcionamento.
Não processados na apuração assistida na etapa descrita pela Cartilha Vol. 2 v1.00, item 2.3.3:
NF-e com finNFe = 1 ou 2 e tpNF = 0 Entrada — inclui as notas de entrada de importação;
NF-e com finNFe = 3 (ajuste), 4 (devolução), 5 (nota de crédito) e 6 (nota de débito);
NF-e com adquirente estrangeiro;
NF-e em que o grupo IBSCBS (UB12) não tenha sido informado;
Eventos de NF-e.', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-122-apostila-03', 'CT-122', 'texto', 'Apostila — Créditos e apuração assistida (parte 3/3)', 'Limites declarados na Cartilha de janeiro de 2026: pagamento do art. 27, V não processado; provisionamento de split e RAD sem reflexo imediato na apuração do adquirente; "Transferidos por excesso" e "Splits e RAD Transferidos" não funcionais naquela etapa; recolhimento pelo contribuinte não exibido no gráfico; barra de devolução sem dados; consulta de notas de devolução em fase futura; simulação de split apenas on-line e não aplicável a complementares; repercussão dos ajustes em versão futura. Essas são limitações da etapa do Projeto Piloto retratada naquela versão — não um retrato da situação atual.
Evolução publicada em setembro de 2026. O MOC v1.10 passou a: publicar a estrutura técnica dos Arquivos Delta e Manual; publicar a estrutura do conta-corrente fiscal por operação; prever campos de recursos financeiros, créditos e débitos; trazer cenários técnicos com transferência por excesso, split, RAD, cancelamento, devolução, apropriação e utilização de crédito; prever homologação da Etapa 1 em 28/09/2026; e manter a implantação em produção como futura. Consequentemente, não se afirma que essas funcionalidades continuem indisponíveis hoje apenas com base na Cartilha de janeiro, nem que estejam disponíveis em produção apenas porque aparecem nos cenários ou no leiaute do MOC: a expressão aplicável é estrutura publicada para homologação, com produção futura.
A advertência sobre a obrigatoriedade — apresentada como tal:
Segundo a advertência da Cartilha Vol. 2, item 2.3.3: ainda que as informações listadas não sejam processadas nessa etapa do Piloto "e a aplicação de penalidades tenha sido temporariamente afastada pelo Ato Conjunto RFB/CGIBS nº 1/2025, a obrigatoriedade legal de emissão permanece vigente". A mesma passagem acrescenta que é importante que as empresas continuem priorizando a adequação de seus sistemas, "de modo que quando estes passem a ser processados no Sistema de Apuração Assistida do IBS, os resultados possam ser efetivos em razão da existência de uma massa de testes".
O Ato Conjunto, agora conferido em fonte oficial — e o que ele diz com precisão. O Ato Conjunto RFB/CGIBS nº 1, de 22 de dezembro de 2025 (DOU de 23/12/2025, seção 1, p. 222; retificado em 24/12/2025) foi lido integralmente. Três leituras que o slide deve fazer:
O dever de emitir não foi afastado, e está no próprio Ato. Art. 2º, caput: "O sujeito passivo do IBS ou da CBS, ao realizar operações com bens ou serviços, inclusive as de importação e exportação, deverá emitir documento fiscal eletrônico." A advertência da Cartilha coincide com o texto normativo.
O que foi afastado é mais estreito do que "penalidades". Art. 3º, I, na redação retificada em 24/12/2025: "não haverá aplicação de penalidades pela falta de registro dos campos do IBS e da CBS nos documentos fiscais a que se refere o art. 2º, §§ 1º e 2º". Não é afastamento geral de penalidades — é afastamento da penalidade pela falta de registro daqueles campos.
O afastamento tem termo, e o termo não é "o ano de 2026". O caput do art. 3º fixa: "Até o primeiro dia do quarto mês subsequente ao da publicação da parte comum dos regulamentos do IBS e da CBS". A data resultante depende da publicação da parte comum e não é calculada aqui.
Redação de referência para a tela — usar literalmente: "O Ato estabeleceu afastamento temporário e específico da penalidade pela falta de registro dos campos de IBS e CBS, com termo definido no art. 3º. A data final desse período não foi conferida nesta versão; este trecho não deve ser utilizado como garantia de afastamento vigente." O afastamento não se estende a outras penalidades, e permanecem distintos quatro planos que não se confundem: emitir o documento, preencher os campos de IBS e CBS, a dispensa de recolhimento do art. 348, § 1º, e o processamento na apuração assistida.
Completam o Ato: art. 3º, II — no mesmo período, "será considerado atendido o requisito para a dispensa do recolhimento do IBS e da CBS, previsto no art. 348, § 1º, da Lei Complementar nº 214, de 2025"; parágrafo único — "a apuração do IBS e da CBS no ano de 2026 será realizada em caráter meramente informativo, sem efeitos tributários, desde que cumpridas as obrigações acessórias previstas na legislação"; e art. 4º — o Ato "não prejudica a exigência dos documentos fiscais relativos aos demais tributos vigentes". O art. 2º, §§ 1º e 2º, é que lista os doze documentos recepcionados e os quatro instituídos pelos regulamentos. [PRIMÁRIA]
A frase que fecha o módulo: Emitir corretamente hoje é a condição para apurar corretamente amanhã. O documento é a fonte; a apuração é a consequência. Nota de escopo declarada em sala: o recorte operacional exposto aqui é o do IBS — é o que as fontes deste curso descrevem. Elas não descrevem a apuração assistida da CBS, e isso é limitação do escopo deste curso, não afirmação de que o sistema não exista ou não esteja disponível: existe material histórico de CBS fora do material do curso, que descreve simulações e não comprova o estado operacional atual. Nenhuma conclusão do curso extrapola as fontes do IBS para a CBS, e nem menus, nem cadência, nem funcionamento são transplantados de um sistema para o outro.
Fontes: Cartilha Vol. 2, itens 2.3.3, 2.4, 3.2, 3.4, 3.4.1, 3.4.3, 3.6 e notas de rodapé [ORIENTATIVO]; Ato Conjunto RFB/CGIBS nº 1, de 22/12/2025, arts. 2º a 5º, com a retificação de 24/12/2025 — texto oficial, conferido em 16/09/2026 [PRIMÁRIA]. MOC API da Apuração Assistida do IBS v1.10, set/2026 [TÉCNICA].
147. EXERCÍCIO: plenária dirigida sobre a prévia da apuração
Dinâmica: plenária dirigida. A instrutora projeta a prévia, lê os três casos e conduz a discussão em voz alta. Para cada caso, a turma responde a três perguntas: (1) o que está faltando ou pendente? (2) qual o efeito na apuração? (3) qual a providência documental?
Simulação didática construída sobre a Cartilha IBS vol. 2 v1.00. As premissas são hipotéticas; não representam confirmação do ambiente de produção nem do funcionamento atual de split payment e RAD. O que se treina aqui é a leitura do extrato, não um roteiro de menus — e nada disso é motivo para deixar de emitir documento obrigatório. A estrutura do conta-corrente foi posteriormente formalizada pelo MOC v1.10. Os exemplos não comprovam disponibilidade geral em produção.
Prévia projetada — competência 01/2026, contribuinte ALFA LTDA (matriz):

Documento
Valor IBS
Situação exibida
Caso A
Aquisição — NF-e do fornecedor BETA
R$ 2.400,00
Coluna A APROPRIAR: R$ 2.400,00 · APROPRIADO: R$ 0,00
Caso B
Fornecimento próprio — NF-e nº 4471
R$ 1.000,00
EXTINTO: R$ 400,00 · EM ABERTO: R$ 600,00. No conta-corrente constam: "Extinção por compensação com créditos R$ 400,00", "Split provisionado esperando extinção" e "Estorno de split provisionado"
Caso C
Fornecimento próprio — NF-e nº 4502, autorizada em 29/01/2026
R$ 850,00
Não aparece em nenhuma consulta da prévia

Premissas do caso A, dadas no enunciado — sem elas a resposta seria outra:
Premissa
Enunciado
Documento
A NF-e do fornecedor BETA é idônea e está regularmente autorizada
Natureza da aquisição
Insumo da atividade de ALFA — não é aquisição de uso ou consumo pessoal (art. 57)
Regime
Operação do regime regular; não é combustível do regime específico (art. 47, §§ 4º e 5º) e não há outra exceção da LC aplicável ao caso
Split payment e recolhimento pelo adquirente
Implementados na operação — logo, não incide a dispensa condicionada do art. 48
Situação do fornecedor
O débito de BETA não foi extinto na apuração dele

Regras da plenária:
Ninguém responde "emitir documento" antes de responder o que está faltando.
Toda resposta deve distinguir dois planos: o instrumento documental previsto e o que a Cartilha Vol. 2 v1.00 descreve como processado. Um instrumento existir e estar validado no autorizador não significa que sua repercussão na apuração já ocorra.
Fontes: casos construídos sobre a Cartilha Vol. 2, itens 2.4, 3.2, 3.4.1 e 3.5 [ORIENTATIVO]; premissas do caso A na LC 214/2025, arts. 47 e 48, e no art. 57 [PRIMÁRIA].
Espaço para a sua resposta







148. GABARITO DA PLENÁRIA
A correção lê o extrato da mesma simulação didática, construída sobre a Cartilha IBS vol. 2 v1.00. Ela não é roteiro atual de menus e não autoriza deixar de emitir documento obrigatório.
CASO A — Aquisição integralmente "a apropriar".
Os fatos do caso, todos postos no enunciado: a aquisição está documentada em NF-e idônea, a operação não é de uso ou consumo pessoal (art. 57), é do regime regular e não é de combustível do regime específico (art. 47, §§ 4º e 5º), não há outra exceção da LC aplicável, o split payment e o recolhimento pelo adquirente estão implementados — o que afasta a dispensa condicionada do art. 48 — e o débito de BETA ainda não foi extinto na apuração dele. O que está faltando do lado de ALFA: nada a emitir. O que falta é a extinção do débito na apuração do fornecedor — pressuposto do art. 47. Se algum desses fatos não estiver confirmado, a resposta correta é diagnóstico a verificar, não causa demonstrada apenas pelo status exibido. Efeito: os R$ 2.400,00 são, neste momento, valor potencial identificado pelo sistema, ainda não apropriado — logo, não compensam débito algum. Providência documental: nenhuma. A providência é de consulta e acompanhamento, não de emissão. ⚠ Erro que o caso previne: emitir qualquer documento para "trazer" o valor. Não existe documento do adquirente que antecipe a apropriação — e o recolhimento pelo adquirente do art. 36 é modalidade de extinção, não emissão de um documento que automaticamente traga crédito. Quem emite algo aqui cria um problema, não resolve um.
CASO B — Débito parcialmente extinto, com split provisionado e estornado.
O que está faltando: R$ 600,00 do débito seguem em aberto.
Efeito — e o que o extrato permite afirmar:
Os R$ 400,00 já extintos vieram de compensação com créditos (art. 27, I), ocorrência que consta expressamente do conta-corrente.
As duas ocorrências seguintes — "Split provisionado" e "Estorno de split provisionado" — não indicam falha. O provisionamento é registro provisório; o estorno neutraliza ou reverte esse lançamento provisório dentro do processamento diário, cujo objetivo declarado é priorizar a extinção pelos créditos do próprio contribuinte.
Provisionamento e estorno, isoladamente, não equivalem à extinção definitiva. Como não consta do extrato a ocorrência "Extinção por split payment (art. 27, III)", não se afirma aqui qual será o destino daquele valor de split.
Enquanto o demonstrativo indicar R$ 600,00 em aberto, essa parcela permanece não extinta.
Providência documental: acompanhar o conta-corrente e verificar se aparece a ocorrência de extinção definitiva. Persistindo saldo em aberto ao fim do período, o caminho é o pagamento pelo contribuinte (art. 27, II) — guia consolidada emitida no menu Débitos em aberto, que reúne todos os débitos abertos da competência. ⚠ Erro que o caso previne: ler o estorno do provisionado como perda do split — ou, no sentido oposto, presumir que o split já extinguiu algo sem que a ocorrência correspondente tenha aparecido no extrato.
CASO C — Nota de fornecimento ausente da prévia.
A resposta tem três planos, que precisam ser mantidos separados.
Plano 1 — diagnóstico da ausência. Antes de qualquer emissão, verificar três hipóteses, nesta ordem:
Tempo de processamento. A Cartilha Vol. 2 descreveu, no Projeto Piloto de janeiro de 2026, uma cadência de quatro horas; o MOC v1.10 descreve o Processamento Diário para a integração. Uma nota autorizada em 29/01 pode não ter sido processada no momento da consulta.
Período de recepção. Do 1º ao 5º dia do mês seguinte, o sistema ainda aguarda documentos do mês anterior. Antes disso, a prévia não é definitiva.
Filtro da consulta. A funcionalidade Fornecimentos exibe exclusivamente notas próprias com finNFe = 1 e tpNF = 1 (Saída). Uma nota com outra finalidade não aparece ali por desenho, e as de devolução terão menu próprio em fase futura.
Plano 2 — instrumento documental previsto. Somente após a consolidação e uma vez confirmado que a NF-e regular não foi processada, avalia-se o instrumento previsto para essa situação: a nota de débito do tipo 03 — Débitos de notas fiscais não processadas na apuração, com CST 811, cClassTrib 811002, gAjusteCompet e referenciamento da chave do documento faltante — conforme estudado no Módulo 5. Esse instrumento tem estrutura documental publicada e validada no autorizador.
Plano 3 — o que a fonte descreve. Conforme o item 2.3.3 da Cartilha Vol. 2 v1.00, de janeiro de 2026, NF-e com finNFe = 6 não são processadas na apuração assistida na etapa ali descrita — a fonte comprova essa etapa e não basta, sozinha, para afirmar o estado operacional atual. Portanto: não se pode prometer que a emissão dessa ND corrigirá imediatamente a prévia atual. A providência documental está definida; sua repercussão operacional no Piloto permanece pendente.
⚠ Erro que o caso previne: confundir os três planos — tratar um atraso de processamento como documento faltante, ou tratar a existência do instrumento como garantia de efeito imediato na prévia.
Fontes: Cartilha Vol. 2, itens 1.5, 2.3.3, 2.4, 3.3, 3.4 e 3.4.1 [ORIENTATIVO]; LC 214/2025, art. 27, I e II [PRIMÁRIA].
Anotações da correção', NULL, NULL, NULL, NULL, NULL, 3, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-123-apostila-01', 'CT-123', 'texto', 'Apostila — Cadastros, ERP, EFD e controles (parte 1/2)', 'MÓDULO 7 — CADASTROS, ERP, EFD, CRUZAMENTOS E RISCOS
divisória no slide 149 · conteúdo nos slides 150 a 162
150. O que muda de mãos agora: da norma para a implantação
Até aqui o curso respondeu o que a norma exige e como o documento se estrutura. Deste ponto em diante a pergunta muda: o que precisa estar pronto, dentro da empresa, para que o documento saia certo na primeira tentativa.
Três deslocamentos que organizam os próximos doze slides:
De
Para
Campo do leiaute
Cadastro que alimenta o campo
Regra de validação
Parametrização que impede o erro antes do envio
Rejeição recebida
Teste em homologação que a antecipou

A fronteira deste módulo, dita em voz alta: nada aqui reexplica CST, cClassTrib, alíquota, grupo XML, NFS-e, nota de débito, nota de crédito, evento ou conta-corrente. Tudo isso é insumo, já estudado. Aqui se trata de cadastro, parametrização, teste, cruzamento, risco e controle — e do que a EFD ICMS/IPI faz e não faz. Nota de escopo: o plano de ação final, a síntese do curso e o encerramento pertencem ao Módulo 8. O checklist do slide 162 é ferramenta de implantação, não fechamento.
Fontes: estrutura do próprio curso.
151. MAPA DE CADASTROS: nenhum campo funciona sozinho
   ┌── CADASTRO DE ITENS ─────────────────┐     ┌── CADASTRO DE PARTES ────────────┐
   │                                      │     │                                  │
   │  PRODUTOS ──── NCM                   │     │  CLIENTES      FORNECEDORES      │
   │     │                                │     │     │               │            │
   │     │          (não há NCM            │     │     ├── CNPJ/CPF ───┤            │
   │     │           para serviços)        │     │     ├── REGIME TRIBUTÁRIO        │
   │     │                                │     │     ├── CONDIÇÃO DE CONTRIBUINTE │
   │  SERVIÇOS ──── NBS                   │     │     ├── ENDEREÇO / MUNICÍPIO     │
   │     │      └── ITEM DA LISTA (LC 116)│     │     └── CADASTRO MUNICIPAL       │
   │     │                                │     │                                  │
   └─────┼──────────────────────────────── ┘     └──────┬───────────────────────────┘
         │                                              │
         ▼                                              ▼
   ┌── TRATAMENTO TRIBUTÁRIO DO ITEM ─┐        ┌── LOCAL DA OPERAÇÃO ──────────┐
   │  CST ──► cClassTrib              │        │  município · local de entrega │
   │  cCredPres (quando aplicável)    │        │  ou disponibilização          │
   │  redução · diferimento ·         │        │  destino da operação          │
   │  imunidade · alíquota zero       │        │  cIndOp / indicador da operação│
   └───────────────┬──────────────────┘        └───────────────┬───────────────┘
                   │                                           │
                   └──────────────┬────────────────────────────┘
                                  ▼
                   ╔══════════════════════════════════╗
                   ║   REGRAS FISCAIS DO ERP          ║
                   ║   (combinam item + partes +      ║
                   ║    local + natureza + finalidade)║
                   ╚══════════════════┬═══════════════╝
                                      ▼
                   ╔══════════════════════════════════╗
                   ║   DOCUMENTO FISCAL RESULTANTE    ║
                   ║   NF-e · NFC-e · NFS-e           ║
                   ╚══════════════════════════════════╝

As três leituras do mapa:
Há dois troncos, não um. O tratamento tributário do item e o local da operação nascem de cadastros diferentes e só se encontram na regra fiscal. Empresa que revisa só o cadastro de produtos corrigiu metade do problema.
A seta CST → cClassTrib é de dependência, não de equivalência. O segundo é escolhido dentro do universo permitido pelo primeiro.
O documento é o último elo. Erro que aparece na rejeição do documento nasceu, quase sempre, três caixas acima.
Confirmação em fonte para dois nós do mapa: o Guia Prático, registro 0200, reúne no mesmo cadastro de item o COD_NCM (campo 08) e o COD_LST — "Código do serviço conforme lista do Anexo I da Lei Complementar Federal nº 116/03" (campo 11) —, e registra na observação 3: "Não existe COD-NCM para serviços."
Fontes: Guia Prático EFD-ICMS/IPI v3.2.4, registro 0200, campos 08 e 11 e observação 3 [TÉCNICA]; estrutura de cadastros consolidada dos Módulos 2 a 5.
152. Cadastro de produtos e serviços: o que revisar, campo a campo
O que revisar
Pergunta de conferência
Sinal de alerta
Descrição
Identifica precisamente o item?
Descrições genéricas ou diferentes para o mesmo item
Natureza do item
Mercadoria, insumo, uso e consumo, ativo, serviço?
Item de ativo cadastrado como revenda
NCM
Classificação das mercadorias e demais bens abrangidos pela nomenclatura — está cadastrada e vigente?
NCM herdada de cadastro antigo, sem revisão
NBS
Classificação de serviços, intangíveis e outras operações abrangidas, quando aplicável — está cadastrada?
NBS ausente em item que a exige no modelo documental utilizado
Item da lista da LC 116/2003
Classificação própria dos serviços sujeitos ao ISSQN durante a convivência dos sistemas — está cadastrado?
Item da lista e NBS cadastrados sem conferência da correlação aplicável
Unidade de medida
É a de controle de estoque?
Divergência entre unidade de venda e de estoque
Origem
Nacional, importado, com conteúdo de importação?
Origem herdada de cadastro antigo
Utilização documental
Este item sai em NF-e, NFC-e ou NFS-e?
Item admitido no cadastro, mas não no modelo em que é usado
CST e cClassTrib
O par é compatível? O cClassTrib é admitido naquele modelo?
Código correto na tabela, inadmitido no documento
Tratamento específico
Redução, diferimento, imunidade, alíquota zero, crédito presumido — com fundamento cadastrado?
Benefício ligado "porque sempre foi assim"
cCredPres
Quando aplicável, a rota de apropriação está cadastrada?
Código sem definição de por onde entra

As três classificações e a relação entre elas. NCM, NBS e item da lista da LC 116/2003 são classificações relacionadas, mas não intercambiáveis: cada uma tem finalidade, âmbito e critério próprios, e nenhuma substitui a outra. Não se afirma aqui que todo item da lista possua necessariamente uma única NBS correspondente — a correlação existe onde publicada e deve ser conferida caso a caso, no cadastro e antes da emissão, não presumida.
A advertência central do slide, mantida: NCM e NBS, isoladamente, não determinam todo o tratamento tributário. Dois itens com a mesma classificação podem receber tratamentos diferentes conforme a operação, o destinatário, o local e a finalidade do documento. Quem parametriza o ERP "por NCM" transfere para a tabela de classificação uma decisão que ela não toma.
A distinção que o cadastro precisa preservar: classificação do item (o que a coisa é) × regra da operação (o que acontece com ela naquele negócio). São camadas separadas — e é o slide seguinte que as junta. Confirmação em fonte: o registro 0200 do Guia Prático separa exatamente esses planos — TIPO_ITEM (natureza, 12 valores de 00 a 99), UNID_INV ("unidade de medida utilizada na quantificação de estoques"), COD_NCM (campo 08) e COD_LST — "Código do serviço conforme lista do Anexo I da Lei Complementar Federal nº 116/03" (campo 11) — e veda "descrições diferentes para o mesmo item ou descrições genéricas". A observação 3 do mesmo registro registra: "Não existe COD-NCM para serviços."
Fontes: Guia Prático v3.2.4, registro 0200, campos 02, 03, 06, 07, 08, 11 e observações [TÉCNICA]; tabelas CST/cClassTrib/cCredPres 22/06/2026, quanto à existência dos indicadores de admissão por modelo [TÉCNICA].
153. Clientes, fornecedores e local: só os dados que mudam o documento
Dado cadastral
O que ele decide no documento
Se estiver errado
CNPJ / CPF
Identificação da parte e recuperação automática de dados
Pode impedir a autorização ou vincular a operação à parte errada
Regime tributário
Tratamento aplicável e grupos que se abrem
Pode levar a grupo indevido ou ausente
Condição de contribuinte
Se a operação é entre contribuintes ou a consumidor final
Muda a lógica da operação e o indicador correspondente
Endereço e município
Determinação documental do local da operação
Pode direcionar o produto da arrecadação a ente diverso
Identificação do estabelecimento
Qual filial figura como parte
Operação atribuída ao estabelecimento errado
Destino da operação
Para onde o bem ou serviço vai
Incoerência entre destinatário e destino
Local de entrega ou disponibilização
Quando difere do endereço do destinatário
Local de incidência determinado por dado desatualizado
Cadastro municipal, quando aplicável
Chaves e validações do ambiente municipal
Pode bloquear ou condicionar a emissão

A regra de higiene cadastral deste slide: a revisão do cadastro de partes é o principal controle preventivo para que esses dados cheguem corretos à emissão. Dependendo do sistema, pedidos, contratos ou registros operacionais também podem alimentar o documento e precisam ser conciliados com o cadastro mestre. Corrigir antes da emissão é sempre mais barato; depois, o caminho é mais caro — e, para parte da informação, vedado.
Três verificações que valem por uma auditoria:
Endereço do destinatário × local de entrega — cadastrados como campos distintos, ou o segundo está sendo herdado do primeiro por omissão?
Filiais — cada estabelecimento tem cadastro próprio, ou compartilham um registro "da empresa"?
Regime tributário e condição de contribuinte — são atualizados quando a parte muda de regime, ou congelaram na data do cadastramento?
Fronteira declarada: as regras de determinação do local de incidência e o comportamento dos códigos de localidade foram tratados no Módulo 4 e não são retomados. Aqui interessa apenas se o dado que alimenta essas regras está correto e atualizado.
Fontes: campos de identificação de partes e local nos leiautes já lidos — NT 2025.002 v1.52 e Anexo VI v1.04.00 [TÉCNICA]; Cartilha Vol. 2, item 1.6, quanto à consequência da informação incorreta de destino [ORIENTATIVO].
154. MATRIZ: dados de entrada → regra fiscal → campos do documento
   DADOS DE ENTRADA (9 variáveis)          REGRA FISCAL            CAMPOS DO DOCUMENTO
   ─────────────────────────────           ────────────            ───────────────────
   1. item (produto ou serviço)     ┐
   2. natureza da operação          │
   3. emitente                      │      ┌──────────────┐        ► modelo do documento
   4. destinatário / adquirente     ├─────►│  COMBINAÇÃO  │──────► ► CST e cClassTrib
   5. local da operação             │      │  ÚNICA       │        ► grupos abertos/vedados
   6. finalidade do documento       │      └──────────────┘        ► tratamento aplicado
   7. regime tributário             │                              ► partes e local
   8. benefício / tratamento        │                              ► vínculos e referências
   9. documento fiscal utilizado    ┘                              ► totais

A demonstração que fecha o argumento — o mesmo item, quatro resultados:
Cenário
Item
Muda o quê
Resultado documental
A
Produto X
operação normal, contribuinte, dentro do município
Documento e tratamento padrão
B
Produto X
destinatário com tratamento específico
Muda o cClassTrib; podem abrir grupos distintos
C
Produto X
local de entrega em outro município
Pode alterar os dados de local e a destinação, conforme a regra aplicável à operação
D
Produto X
finalidade do documento é de ajuste
Muda o modelo mental inteiro: outra finalidade, outros grupos obrigatórios e vedados

A conclusão operacional, em uma frase: uma regra fiscal parametrizada apenas pelo item é insuficiente para distinguir três dos quatro cenários apresentados. O que está em causa é a insuficiência da chave de parametrização, não a afirmação de que toda regra por item produza resultado errado em qualquer situação. O ERP precisa de uma chave composta, não de uma coluna no cadastro do produto. Nenhum cálculo é refeito aqui — base, alíquota, redução e totalização foram tratados no Módulo 2 e no Módulo 3.
Fontes: estrutura de decisão consolidada dos Módulos 2 a 5; tabelas CST e cClassTrib 22/06/2026, quanto à dependência entre código e modelo documental [TÉCNICA].
155. Parametrização do ERP: as dez capacidades exigidas
Dez capacidades. As sete primeiras são de emissão; as três últimas são de governança — e são as que costumam faltar.
#
Capacidade
Como verificar se existe
1
Selecionar o documento fiscal correto para a operação
Simular operações de fronteira e ver qual modelo o sistema propõe
2
Determinar CST e cClassTrib a partir da chave composta do slide 154
Alterar uma variável de entrada por vez e observar se o par muda
3
Abrir somente os grupos permitidos ou exigidos
Tentar gerar um grupo vedado e verificar se o sistema impede
4
Aplicar alíquotas, reduções e tratamentos conforme cadastrado
Conferir se a origem do percentual é rastreável até um cadastro
5
Preencher informações de local e partes a partir do cadastro correto
Testar destinatário com local de entrega diverso
6
Gerar totais coerentes com os itens
Alterar um item e verificar a repropagação
7
Manter vínculos e referenciamentos quando exigidos
Emitir documento posterior e conferir a referência gerada
8
Separar regras de produção e de homologação
Existem dois conjuntos de parâmetros, ou um só com uma chave de ambiente?
9
Registrar versões de tabelas e regras
O sistema sabe dizer qual versão da tabela de classificação está ativa e desde quando?
10
Impedir que alteração cadastral sem aprovação chegue à produção
Existe trilha de aprovação, ou o cadastro é alterável por qualquer usuário?

Por que as três últimas decidem o resultado. Sem a 8, um teste em homologação não prova nada sobre produção. Sem a 9, ninguém consegue explicar por que um documento autorizado em março é rejeitado em setembro com os mesmos dados. Sem a 10, toda a revisão cadastral dos slides anteriores pode ser desfeita por uma alteração de rotina. Limite expresso: este slide descreve o que o sistema precisa fazer, não como configurá-lo. Nenhum ERP específico é tratado, e nenhuma orientação de programação é dada.
Fontes: requisitos derivados das regras de validação e da estrutura de indicadores já lidas na NT 2025.002 v1.52, no Anexo VI v1.04.00 e nas tabelas 22/06/2026 [TÉCNICA]; itens 8, 9 e 10 — inferência de controle interno.
156. Homologação × produção: cinco estados, não dois
Estado
O que significa
Como identificar na documentação
1. Campo publicado
O campo consta do leiaute
Aparece na tabela de campos, com ID
2. Regra aplicada em homologação
A RV é aplicada no ambiente de teste
A NT indica implantação em homologação
3. Regra aplicada em produção
A RV rejeita de fato
A NT indica implantação em produção
4. Implementação futura
A regra existe no texto e não está ativa em nenhum ambiente
Marcadores literais: "Implementação futura para produção", "Implementação futura para homologação"
5. Estrutura publicada sem operação confirmada
O leiaute existe; a operação não está confirmada
Regras com marcador EXXXX, ausência de cronograma

QUADRO CONCEITUAL — por que cinco estados e não dois:
#
O que a documentação demonstra
1
Um campo pode existir no leiaute e ainda causar erro de schema em determinado ambiente
2
Um preenchimento pode ser facultativo ou já validado em homologação antes de sê-lo em produção
3
Obrigação normativa, regra de validação e disponibilidade operacional não são necessariamente coincidentes — um campo pode ser obrigatório pela legislação sem ser exigido por regra de validação, e pode ser aceito sem produzir o efeito pretendido

Exemplo sintético, sem detalhamento: uma mesma NT pode prever momentos distintos para teste e produção — é o caso da NT 2026.007 v1.10 da NF-e, que separa as duas implantações.
Nota técnica de rodapé, para o instrutor: conferir e atualizar as datas de implantação vigentes na NT aplicável antes de cada turma; elas não devem ser memorizadas pelo aluno nem levadas ao título do slide.
FLUXO OBRIGATÓRIO DE IMPLANTAÇÃO:
CONFIGURAÇÃO ─► HOMOLOGAÇÃO ─► VALIDAÇÃO ─► APROVAÇÃO ─► PRODUÇÃO ─► MONITORAMENTO
     │               │              │             │            │              │
  parametriza    emite os      confere o      registra     libera com    acompanha
  a partir do    12 casos      resultado      quem         versão        rejeições e
  cadastro       do slide      contra o       aprovou      registrada    divergências
  revisado       150           esperado       e quando                   ─────┐
                                                                              │
                        ◄─────────────── retorno a CONFIGURAÇÃO ──────────────┘

Fontes: NT 2025.002 v1.52, marcadores de implementação futura, exceções de regra por ambiente e orientações de implantação [TÉCNICA]; NT 2026.007 v1.10 da NF-e, previsão de momentos distintos para teste e produção [TÉCNICA].
157. ROTEIRO DE TESTES EM HOMOLOGAÇÃO: 12 casos
#
Operação
Documento esperado
Ponto principal a conferir
Resultado esperado
Evidência a guardar
1
Venda tributada padrão, dentro do município
NF-e
Par CST × cClassTrib; grupos abertos; totais × itens
Autorização; totais coerentes com o somatório dos itens
XML autorizado + protocolo + tela do cadastro do item
2
Venda com redução de alíquota
NF-e
Grupo de redução aberto; percentual efetivo coerente com o cadastrado
Autorização; percentual rastreável até o cadastro
XML + print do parâmetro de redução
3
Operação com alíquota zero ou imunidade
NF-e
cClassTrib compatível; grupos que não podem ser abertos
Autorização sem grupos indevidos
XML + fundamento cadastrado do tratamento
4
Operação com diferimento
NF-e
Grupo de diferimento exigido pelo CST
Autorização com o grupo presente
XML + parâmetro de origem
5
Operação com crédito presumido
NF-e
Código de crédito presumido e rota de apropriação cadastrada
Autorização; comportamento conforme a rota
XML + ficha do código na tabela vigente
6
Venda a consumidor final presencial
NFC-e
Códigos admitidos no modelo 65; vedações próprias do modelo
Autorização; nenhum código inadmitido
XML + comprovante
7
Prestação de serviço padrão
NFS-e / DPS
Classificação do serviço; dados de local; correlação entre códigos
Nota gerada conforme o leiaute vigente
DPS enviada + NFS-e gerada + DANFSe
8
Operação com local de incidência diferente do endereço do destinatário
NF-e ou NFS-e
Dados de local vindos do cadastro correto, não herdados
Local determinado pelo dado correto
XML + cadastro da parte + cadastro do local de entrega
9
Nota complementar de valor
NF-e
Finalidade; referenciamento ao documento original
Autorização com vínculo íntegro
XML da original + XML da complementar
10
Documento de ajuste cuja estrutura esteja publicada e validada no autorizador
Conforme o caso
Finalidade, grupos obrigatórios e referenciamento
Autorização com vínculo íntegro
Ambos os XML + registro do vínculo
11
Rejeição provocada intencionalmente — grupo vedado informado
NF-e', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-123-apostila-02', 'CT-123', 'texto', 'Apostila — Cadastros, ERP, EFD e controles (parte 2/2)', 'Se o ERP impede antes do envio; se não impedir, qual rejeição retorna
Rejeição esperada, com número e mensagem registrados
Print do bloqueio do ERP ou retorno da rejeição
12
Funcionalidade publicada e ainda não implantada
—
Estrutura existe; operação não confirmada
Não há resultado aprovável
Registro da pendência, com identificação da fonte e do marcador

Três regras de execução do roteiro:
O caso 11 é obrigatório e é o mais valioso. Testar apenas o que deve dar certo não prova que o sistema barra o que deve dar errado. Registrar o número da rejeição transforma o teste em documentação.
O caso 12 nunca é "aprovado". Ele é registrado como pendente. Marcar como aprovado uma funcionalidade não implantada é criar uma falsa segurança que só aparece na produção.
Sem evidência, não houve teste. A última coluna é o que sobrevive à troca de equipe, à auditoria e à próxima versão da tabela.
Como usar: uma linha por caso, uma pasta por caso, data e responsável em cada uma. O roteiro é reexecutado a cada mudança de versão de tabela técnica ou de nota técnica — e é isso que o liga ao item 9 do slide 155.
Fontes: cenários construídos sobre as estruturas já estudadas nos Módulos 2 a 5 [TÉCNICA]; caso 12 fundamentado nos marcadores de pendência registrados nos módulos anteriores.
158. A EFD ICMS/IPI e os novos tributos: seis regras de convivência
📌 Guia Prático da EFD-ICMS/IPI, versão 3.2.4, Capítulo I, Seção 10 — Informações sobre a Reforma Tributária sobre o Consumo
"A EFD ICMS / IPI não se presta à apuração dos novos tributos, CBS, IBS e IS. Entretanto, devem ser considerados na escrituração do valor total do documento fiscal. Por exemplo, Campo 12 (VL_DOC) do registro C100 (exceto para o exercício 2026). No entanto, não devem ser incluídos no valor da operação dos registros analíticos os valores relativos a CBS, IBS ou IS incidentes na operação. Por exemplo: campo 05 (VL_OPR) do registro C190. Esta orientação se aplica a todos os modelos de documentos fiscais escriturados na EFD ICMS / IPI."
O que essa passagem sustenta — e só isso: a EFD continua atendendo suas finalidades próprias; ela não será usada para apurar IBS, CBS e IS; os valores desses tributos entram no valor total do documento e ficam fora do valor da operação dos registros analíticos; e a orientação vale para todos os modelos. Coexistência não é substituição. Documento fiscal eletrônico e escrituração são camadas diferentes: o primeiro registra a operação; a segunda registra o que a legislação daquele tributo manda registrar.
A distinção que não pode ser perdida: "não apurar IBS, CBS e IS" não significa dispensa de escrituração dos documentos nem extinção da EFD. São proposições diferentes, e apenas a primeira está na fonte.
SEIS REGRAS DE CONVIVÊNCIA
#
Regra
1
Emitir corretamente os campos dos novos tributos, ainda que a validação de um ambiente não os exija
2
Continuar cumprindo as obrigações dos tributos atuais. A EFD ICMS/IPI permanece aplicável aos contribuintes e operações alcançados por sua legislação própria; as fontes deste curso não indicam sua extinção ou dispensa geral
3
Não usar a EFD ICMS/IPI para apurar IBS, CBS ou IS — ela própria declara que não se presta a isso
4
Manter coerência entre XML, cadastro, ERP e escrituração — quatro representações do mesmo fato que precisam contar a mesma história
5
Separar regra já operacional de implementação futura, na parametrização e no registro de testes
6
Conservar evidências dos testes e das versões de parametrização — sem elas, nenhuma das cinco anteriores é demonstrável

Limite obrigatório: não há, entre as fontes deste curso, norma que institua uma obrigação acessória substituta integral para IBS, CBS e IS. Este módulo não descreve, não supõe e não antecipa nenhuma. PENDENTE DE REGULAMENTAÇÃO (M7-P1).
Fontes: Guia Prático EFD-ICMS/IPI v3.2.4, Cap. I, Seção 10 — transcrição literal [TÉCNICA].
159. QUADRO DOCUMENTO × EFD × TRIBUTOS
Informação
Documento fiscal eletrônico
EFD ICMS/IPI
Apuração assistida do IBS
CBS
Status da definição
Emissão do documento
É o próprio instrumento
Escritura o documento, nos termos da sua legislação
Recebe o documento como fonte
—
Definido
Destaque de ICMS e IPI
Campos próprios
Escritura e apura
Não se aplica
—
Definido
Destaque de IBS, CBS e IS
Campos próprios
Não apura — "não se presta à apuração dos novos tributos"
É a fonte da apuração
—
Definido quanto à EFD
Valor total do documento
Total do documento
Entra no VL_DOC (C100), "exceto para o exercício 2026"
—
—
Definido, com exceção expressa
Valor da operação — registros analíticos
—
Não devem ser incluídos os valores de CBS, IBS e IS — VL_OPR (C190)
—
—
Definido
Documento exclusivo dos novos tributos
Emitido normalmente
"Não devem ser escriturados", quando não versem sobre operações alcançadas por ICMS ou IPI
Fonte
—
Definido
Documento do Ajuste SINIEF 49/25 com ICMS ou IPI
Emitido normalmente
"Devem ser regularmente escriturados", mesmo sem destaque de ICMS ou IPI. Durante 2026, com COD_SIT "08"
Fonte
—
Definido
Apuração de IBS
Não apura
Não apura
Apura (sistema do IBS)
—
Em implantação — Piloto
Apuração de CBS
Não apura
Não apura
—
Nenhuma fonte deste curso descreve a apuração assistida da CBS — limitação do escopo do curso, não afirmação de inexistência do sistema
Fora do escopo do curso
Eventos
Estrutura publicada e validada no autorizador
Não é objeto da EFD
Efeito ainda não processado nesta etapa
—
PENDENTE
Correções
Instrumentos definidos
Repercutem conforme a legislação de ICMS/IPI
Parte dos documentos ainda não é processada nesta etapa
—
PENDENTE
Obrigação acessória de escrituração de IBS/CBS/IS
—
Declara não se prestar
—
—
PENDENTE DE REGULAMENTAÇÃO

Três afirmações que o quadro impede:
❌ "A EFD está dispensada." → Não há dispensa geral nas fontes analisadas. ❌ "A EFD será extinta." → Nada nas fontes analisadas permite afirmar sua extinção. ❌ "Basta emitir o documento; a escrituração some." → A emissão do documento não elimina, por si só, as obrigações de escrituração aplicáveis ao contribuinte.
A frase que permanece em destaque no slide, literal: "A EFD ICMS/IPI não se presta à apuração dos novos tributos, CBS, IBS e IS." — e que não se confunde com dispensa de escrituração dos documentos nem com extinção da EFD.
Fontes: Guia Prático v3.2.4, Seção 10, registro C100 (orientação, campo 12 e COD_SIT "08") e registro C190 (campo 05) [TÉCNICA]; Cartilha Vol. 2, item 2.3.3 [ORIENTATIVO]; Ajuste SINIEF 49/2025 [PRIMÁRIA].
160. Cruzamentos eletrônicos e conciliação entre áreas
A. CRUZAMENTOS — em três graus de sustentação
Grau
Cruzamento
Base
① Já demonstrado pelas fontes
Documento fiscal × prévia da apuração assistida — a Cartilha Vol. 2 descreve as consultas de fornecimentos e aquisições e o extrato por operação
[ORIENTATIVO] — Cartilha Vol. 2
① Já demonstrado pelas fontes
Documento original × documento corretivo — o vínculo por referenciamento consolida os documentos de uma mesma operação
[ORIENTATIVO] — Cartilha Vol. 2, item 1.4
② Tecnicamente possível
Itens × totais; CST × cClassTrib; código × modelo documental; emitente × adquirente; município e local da operação — todos verificáveis porque há regra de validação publicada sobre cada um
[TÉCNICA] — RV já lidas
③ Inferência de controle interno
XML autorizado × cadastro do produto ou serviço; NCM ou NBS × tratamento aplicado; ERP × faturamento × fiscal × financeiro × contábil
Boa prática — não decorre de fonte publicada

Limite declarado: nenhuma malha fiscal, rotina de fiscalização ou cruzamento automático específico para IBS e CBS foi publicado entre as fontes deste curso. Os cruzamentos do grau ③ são controles que a empresa institui, não obrigações que alguém impôs.
B. CONCILIAÇÃO ENTRE ÁREAS — o percurso de um documento
COMERCIAL ─► CADASTRO ─► FATURAMENTO ─► FISCAL ─► FINANCEIRO ─► CONTÁBIL
   pedido    classificação   emissão    autorização  recebimento/  contabilização
                                                      pagamento
                              │             │              │            │
                              └─────────────┴──────────────┴────────────┘
                                            │
                                    documento corretivo,
                                       quando houver
                                            │
                                            ▼
                                        APURAÇÃO
                                            │
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
              TECNOLOGIA — sustenta todas as etapas    ACOMPANHAMENTO DE
              (parametrização, versões, ambientes)     REJEIÇÕES E DIVERGÊNCIAS
                                                       (retroalimenta o CADASTRO)

Os três pontos de ruptura mais comuns: entre comercial e cadastro (vende-se o que não está classificado); entre fiscal e financeiro (o documento corretivo não chega a quem cobra ou paga); e entre acompanhamento de rejeições e cadastro (a rejeição é resolvida no documento, mas a causa fica no cadastro e volta na semana seguinte). A seta de retorno é a parte do fluxo que mais falta nas empresas. A mecânica interna da apuração foi tratada no Módulo 6 e não é retomada.
Fontes: Cartilha Vol. 2, itens 1.4, 3.4 e 3.5, quanto aos confrontos já exibidos pelo sistema [ORIENTATIVO]; regras de validação já lidas, quanto aos cruzamentos tecnicamente verificáveis [TÉCNICA]; grau ③ — inferência de controle interno.
161. TABELA DE RISCOS E CONTROLES
Risco
Causa
Consequência documental
Possível repercussão fiscal
Controle preventivo
Evidência do controle
1. NCM ou NBS incorreta
Cadastro desatualizado; item criado às pressas
Classificação do item inconsistente com a operação
Pode levar a tratamento tributário indevido
Revisão periódica do cadastro de itens com responsável nomeado
Ata de revisão + relação de itens alterados
2. CST incompatível com cClassTrib
Parametrização por item, sem chave composta
Sujeito à rejeição por incompatibilidade
Pode impedir a emissão
Validador interno que testa o par antes do envio
Log do validador + XML de teste
3. Código não admitido no modelo documental
Uso de código correto na tabela, mas vedado naquele modelo
Sujeito à rejeição
Pode impedir a emissão
Conferência dos indicadores de admissão por modelo na tabela vigente
Print da linha da tabela + caso de teste
4. Benefício aplicado sem fundamento
Tratamento herdado de cadastro antigo
Documento com tratamento não sustentado
Pode gerar exigência do tributo não destacado
Todo benefício vinculado a fundamento cadastrado e datado
Ficha do benefício com fundamento e vigência
5. Município ou local incorreto
Endereço desatualizado; local de entrega herdado por omissão
Local da operação determinado por dado errado
Pode resultar na distribuição a ente diverso do credor, com sujeição às penalidades previstas na legislação aplicável
Conferência de endereço e local de entrega como campos distintos
Relatório de divergências de cadastro de partes
6. Grupo obrigatório ausente
Indicador da tabela não observado
Sujeito à rejeição por falta do grupo
Pode impedir a emissão
Regra do ERP que abre o grupo a partir do indicador
Caso de teste nº 4 do roteiro
7. Grupo vedado informado
Grupo aberto por padrão do sistema
Sujeito à rejeição por informação indevida
Pode impedir a emissão
Bloqueio no ERP + caso de rejeição provocada
Caso de teste nº 11 do roteiro
8. Divergência entre item e total
Alteração de item sem repropagação
Sujeito à rejeição por total divergente
Pode impedir a emissão
Recálculo obrigatório do total ao alterar qualquer item
Caso de teste nº 1 + log de recálculo
9. Regra futura ativada em produção
Parametrização feita a partir do leiaute, sem checar o estado
Documento com estrutura não operacional
Pode impedir a autorização; pode gerar retrabalho
Classificação de cada regra nos cinco estados do slide 156
Inventário de regras com estado e data
10. Documento corretivo sem vínculo
Finalidade ou referenciamento incorreto
Documento não associado à operação original
Pode impedir a repercussão do documento na apuração
Conferência obrigatória do vínculo antes do envio
XML do original + do corretivo, arquivados juntos
11. Cadastro alterado sem homologação
Ausência de trilha de aprovação
Alteração chega à produção sem teste
Pode gerar erro em série, não em um documento só
Capacidade nº 10 do slide 155
Registro de aprovação com autor e data
12. Versão desatualizada de tabela técnica
Tabela carregada uma vez e nunca revista
Uso de código extinto ou fora de vigência
Sujeito à rejeição; pode gerar tratamento indevido
Controle de versão das tabelas com data de carga
Registro de versão ativa + histórico de cargas

Linguagem do quadro — declarada em sala: as consequências usam "pode gerar", "pode impedir" e "sujeito à rejeição", porque é até onde as fontes vão. Nenhuma penalidade específica é criada, quantificada ou atribuída neste módulo. A única menção a penalidades reproduz a advertência já vista: o preenchimento incorreto das informações de destino sujeita o contribuinte às penalidades previstas na legislação aplicável — nos termos em que a Cartilha Vol. 2 o registra.
Fontes: regras de validação e indicadores das tabelas já lidos [TÉCNICA]; Cartilha Vol. 2, item 1.6, quanto à distribuição a ente diverso [ORIENTATIVO]; controles 11 e 12 — inferência de controle interno.
162. CHECKLIST DE IMPLANTAÇÃO
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHECKLIST DE IMPLANTAÇÃO — DOCUMENTOS FISCAIS NA REFORMA TRIBUTÁRIA       │
│  Empresa: ______________________  Período: ______  Responsável: __________ │
├───┬─────────────────────────────────────────┬──────────┬────────┬──────────┤
│ ☐ │ ITEM                                    │ RESPONS. │  DATA  │ EVIDÊNCIA│
├───┼─────────────────────────────────────────┼──────────┼────────┼──────────┤
│ ☐ │  1. Responsáveis definidos por frente   │          │        │          │
│ ☐ │  2. Cadastros inventariados             │          │        │          │
│ ☐ │  3. Produtos e serviços classificados   │          │        │          │
│ ☐ │  4. Clientes e fornecedores revisados   │          │        │          │
│ ☐ │  5. Regras fiscais documentadas         │          │        │          │
│ ☐ │  6. Versões das tabelas controladas     │          │        │          │
│ ☐ │  7. ERP parametrizado                   │          │        │          │
│ ☐ │  8. Cenários testados em homologação    │          │        │          │
│ ☐ │     (12 casos do roteiro)               │          │        │          │
│ ☐ │  9. Rejeições registradas               │          │        │          │
│ ☐ │ 10. Aprovações documentadas             │          │        │          │
│ ☐ │ 11. Produção monitorada                 │          │        │          │
│ ☐ │ 12. Pendências técnicas separadas       │          │        │          │
│ ☐ │ 13. Conciliações periódicas definidas   │          │        │          │
└───┴─────────────────────────────────────────┴──────────┴────────┴──────────┘

Como ler o checklist: os itens 1 a 6 são de preparação — sem eles, parametrizar é chutar. Os itens 7 a 10 são de execução e prova. Os itens 11 a 13 são de permanência — são o que impede que a implantação se desfaça na próxima versão de tabela. O item 12 é o que diferencia este checklist de uma lista genérica: pendências técnicas não se marcam como concluídas. Elas ficam em lista própria, com a fonte e o marcador que as sustentam, e são revisitadas a cada nova publicação. Nota de fronteira: este é um checklist de implantação, não o plano de ação final do curso. A síntese, o plano de adequação completo e o encerramento pertencem ao Módulo 8.
Fontes: consolidação aplicada dos slides 150 a 161.', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-124-apostila-01', 'CT-124', 'texto', 'Apostila — Caso integrado: implantação nos documentos fiscais (parte 1/2)', 'MÓDULO 8 — CASO INTEGRADO E ENCERRAMENTO
divisória no slide 163 · conteúdo nos slides 164 a 174
164. A empresa e o problema que vamos acompanhar

MERIDIANO DISTRIBUIÇÃO E SERVIÇOS LTDA
Atividades
Comércio de equipamentos · Prestação de serviço de instalação e manutenção técnica
Documentos emitidos
NF-e para a mercadoria · NFS-e para o serviço
Regime
Regime normal
Perfil dos clientes
Pessoas jurídicas contribuintes, do regime regular
Sistemas
ERP único, com módulo fiscal integrado · Emissor de NFS-e
Áreas envolvidas
Comercial · Cadastro · Faturamento · Fiscal · Financeiro · Contábil · TI
Situação inicial
Cadastros migrados do sistema anterior, sem revisão completa. Parametrização fiscal feita a partir do cadastro do produto

A OPERAÇÃO QUE VAMOS SEGUIR
O comercial fecha com o cliente HORIZONTE S.A. um negócio único, com duas partes: venda de 10 equipamentos e serviço de instalação dos equipamentos entregues. A entrega física deve ocorrer no centro de distribuição do cliente — que fica em município diferente do endereço da sede que consta no cadastro.
O PROBLEMA QUE SERÁ ACOMPANHADO
Três fatos, que só aparecem depois:
#
Fato
Natureza do fato
Quando aparece
1
O cadastro do cliente tem apenas o endereço da sede; o centro de distribuição nunca foi cadastrado como local de entrega
Cadastral
Só é percebido na conferência posterior
2
O cliente recebe 8 equipamentos e recusa 2, por avaria constatada na entrega
Operacional
Depois da autorização do documento
3
O pagamento do preço é parcial, e o serviço é prestado e faturado depois da entrega das mercadorias
Comercial e financeiro
Ao longo do período

Advertência de leitura do caso: o fato 3 é um pagamento do preço, de natureza comercial e financeira. Ele não é, por si só, informação sobre extinção de débito tributário — distinção que será trabalhada nos slides 167, 169 e 170.
Fontes: caso fictício construído sobre as estruturas já estudadas nos Módulos 1 a 7.
165. LINHA DO TEMPO DO CASO
  ETAPA 1        ETAPA 2        ETAPA 3        ETAPA 4        ETAPA 5
 ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
 │CADASTRO│───►│FECHA-  │───►│EMISSÃO │───►│AUTORI- │───►│ENTREGA │
 │do item │    │MENTO da│    │do docu-│    │ZAÇÃO   │    │ou pres-│
 │e do    │    │operação│    │mento   │    │        │    │tação   │
 │serviço │    │        │    │        │    │        │    │        │
 └────────┘    └────────┘    └────────┘    └────────┘    └───┬────┘
  CADASTRO      COMERCIAL     FATURAMENTO    FISCAL       LOGÍSTICA
                                                              │
        ┌─────────────────────────────────────────────────────┘
        ▼
  ETAPA 6        ETAPA 7        ETAPA 8        ETAPA 9       ETAPA 10
 ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
 │PAGA-   │───►│IDENTI- │───►│INSTRU- │───►│PROCES- │───►│CONCI-  │
 │MENTO   │    │FICAÇÃO │    │MENTO   │    │SAMENTO │    │LIAÇÃO  │
 │do preço│    │da di-  │    │correti-│    │na apu- │    │FINAL   │
 │(parcial)│   │vergência│   │vo      │    │ração   │    │        │
 └────────┘    └────────┘    └────────┘    └────────┘    └────────┘
 FINANCEIRO      FISCAL        FISCAL        FISCAL      TODAS AS ÁREAS
 
 ◄── decisões iniciais ──►◄── efeitos e novas decisões ──►
        Etapas 1 a 3                 Etapas 5 a 10

A leitura que organiza o módulo inteiro: as decisões que determinam o ponto de partida estão concentradas nas etapas 1 a 3 — cadastro, fechamento e emissão. As etapas posteriores revelam os efeitos das decisões iniciais e também podem exigir novas decisões diante de fatos supervenientes. O próprio caso da MERIDIANO tem um fato superveniente — a recusa parcial — que obriga a uma nova decisão documental na etapa 8. Duas etapas de atenção especial no caso: a etapa 1, onde nasce a divergência de local, e a etapa 9, onde a fonte impõe um limite ao que se pode prometer.
Fontes: sequência construída sobre os Módulos 1 a 7; nenhuma data é utilizada.
166. Primeiro ponto de decisão: cadastro e escolha documental

Equipamentos
Serviço de instalação
Informação recebida do comercial
Quantidade, preço, cliente, "entregar no CD"
Instalação dos equipamentos entregues
Cadastro utilizado
Cadastro do produto — classificação do item migrada do sistema anterior
Cadastro do serviço — classificação conferida na revisão
Regra fiscal acionada
Regra parametrizada a partir do cadastro do produto
Regra parametrizada com a chave composta
Dado de local
O cadastro do cliente tem apenas o endereço da sede; o "entregar no CD" ficou no pedido, não no cadastro
Local da prestação conferido antes da emissão
Documento escolhido
NF-e
NFS-e

A inconsistência e sua origem. O "entregar no CD" existia — no pedido comercial. Não existia no cadastro mestre do cliente. Como a regra fiscal lê o cadastro, o documento saiu com o dado da sede. A informação estava na empresa; não estava no lugar de onde o sistema a lê.
Os três controles que teriam evitado, todos já vistos no Módulo 7:
Controle
Onde estava previsto
Por que falhou aqui
Endereço do destinatário e local de entrega como campos distintos no cadastro de partes
Verificação de auditoria nº 1
O segundo campo não era alimentado
Conciliação entre pedido e cadastro mestre antes da emissão
Regra de higiene cadastral
Não havia rotina de conciliação
Regra fiscal com chave composta, não parametrizada apenas pelo item
Matriz de regra fiscal
A parametrização lia o cadastro do produto

Nota de escopo: os códigos de classificação usados pela MERIDIANO são dado do caso, não conteúdo novo. Nenhuma tabela é reapresentada.
Fontes: estrutura de cadastro e parametrização do Módulo 7 [TÉCNICA]; escolha documental consolidada dos Módulos 1, 3 e 4 [TÉCNICA].
167. Segundo ponto de decisão: execução, entrega e pagamento

O que foi documentado
O que efetivamente ocorreu
Diferença
Quantidade
10 equipamentos
8 recebidos · 2 recusados por avaria
Diferença real de quantidade
Local
Dado de local da sede do cliente
Entrega no centro de distribuição, em outro município
Divergência de dado de local
Serviço
Ainda não documentado na emissão da NF-e
Prestado depois, sobre os 8 equipamentos instalados
Documento próprio, em momento próprio
Pagamento do preço
Valor integral da operação
Pagamento parcial do preço, correspondente ao que foi aceito
Recebimento parcial, em momento diverso

As três leituras do confronto:
Documentar e executar são momentos distintos. A NF-e retratou a operação contratada; a execução trouxe uma quantidade diferente. Nada disso é anormal — é a razão de existirem instrumentos posteriores.
A divergência de local exige análise própria. O documento foi autorizado com o dado de local da sede. A possível repercussão desse preenchimento precisa ser analisada conforme a regra aplicável e o processamento correspondente.
O pagamento parcial não é exceção — e é onde mora a confusão mais frequente, tratada na caixa abaixo.
⚠ PAGAMENTO DO PREÇO ≠ EXTINÇÃO DO DÉBITO TRIBUTÁRIO
O pagamento parcial do preço não demonstra, isoladamente, extinção proporcional do débito tributário. É preciso verificar se houve alguma das modalidades do art. 27 e qual ocorrência aparece na apuração.
São dois planos distintos: o comercial e financeiro, em que o cliente paga parte do preço; e o tributário, em que o débito só se considera extinto quando ocorre uma das modalidades previstas e o sistema registra a ocorrência correspondente. Um não determina o outro.
Fronteira declarada: este slide não reabre a discussão sobre momento do fornecimento, entrega ou disponibilização, nem sobre as modalidades de extinção em si. Esses conceitos foram consolidados nos Módulos 1 e 6 e aqui apenas se aplicam.
Fontes: conceitos consolidados dos Módulos 1 e 6; LC 214/2025, art. 27 [PRIMÁRIA], quanto à existência das modalidades de extinção; estrutura do caso.
168. Terceiro ponto de decisão: qual instrumento, e o que a fonte não permite prometer
DIVERGÊNCIA 1 — RECUSA PARCIAL DE 2 EQUIPAMENTOS
Pergunta
Resposta no caso
Ainda cabe cancelamento?
Não. Houve transporte e entrega efetiva de parte da operação
Cabe substituição?
Não se aplica — não é documento de serviço
É necessário documento posterior?
Sim. Sendo a HORIZONTE contribuinte, o Ajuste SINIEF nº 34/2026 atribui a emissão ao próprio destinatário: NF-e de saída, finNFe = 6, tpNFDebito = 09, natOp "Retorno por Recusa Parcial", com os itens recusados no grupo prod. Hipótese normativa publicada — implementação técnica pendente.
Existe evento aplicável?
Há eventos na estrutura publicada, mas nenhum é oferecido aqui como solução operacional — seu efeito na apuração não é processado na etapa descrita pela Cartilha Vol. 2 v1.00
Qual vínculo precisa ser preservado?
O referenciamento no nível da nota, em refNFe, com a chave da NF-e de saída original, identificando no grupo prod os itens não entregues (Aj. SINIEF 34/2026)

DIVERGÊNCIA 2 — DADO DE LOCAL INCORRETO
Pergunta
Resposta no caso
Cabe cancelamento ou substituição?
Não. A operação foi executada e parte dela foi aceita
O que se pode afirmar sobre os efeitos?
Que o documento foi autorizado com o dado de local da sede. O preenchimento pode repercutir na determinação documental do destino e exige análise e acompanhamento. Não se afirma qual efeito jurídico ou de distribuição já se produziu
Existe instrumento confirmado para reverter eventual destinação já processada?
Não foi identificado, entre as fontes deste curso, instrumento confirmado para essa reversão
O que então?
Corrigir o cadastro para as operações futuras · registrar o achado, com data, causa e responsável · acompanhar o documento e a apuração

Três exclusões expressas nesta divergência: não se oferece a CC-e como solução porque o caso não cabe nas hipóteses da cláusula décima quarta-A do Ajuste SINIEF 07/2005 — o erro é de dado cadastral que determina o destino da operação, e a divergência de quantidade já tem instrumento próprio; não se afirma penalidade; e não se afirma efeito definitivo que as fontes não confirmem.
O QUE NÃO PODE SER PROMETIDO — e por quê
Documentos com finalidade de crédito ou débito não são processados na apuração assistida na etapa descrita pela Cartilha Vol. 2 v1.00. O instrumento corretivo aplicável a esta recusa parcial é a ND tipo 09, prevista pelo Ajuste SINIEF nº 34/2026 e de emissão do próprio destinatário contribuinte. Por dupla razão, portanto, não se pode afirmar que sua emissão produzirá efeito imediato na apuração do período. A providência documental está definida; a repercussão operacional permanece pendente.
A ND tipo 09 existe juridicamente e foi prevista pelo Ajuste SINIEF nº 34/2026. Na data de atualização deste material, sua implementação técnica ainda depende da inclusão do código no domínio publicado do leiaute e da correspondente adequação das regras de validação da NF-e. Hipótese normativa publicada — implementação técnica pendente.
Nenhuma matriz de notas de débito ou crédito é reapresentada: o instrumento é identificado, não reensinado.
Fontes: Ajuste SINIEF 49/2025 com as alterações do Ajuste 8/2026 [PRIMÁRIA]; NT 2025.002 v1.52, quanto ao nível de referenciamento [TÉCNICA]; Cartilha Vol. 2, item 2.3.3 [ORIENTATIVO]; matriz de riscos do Módulo 7. · Ajuste SINIEF 34/2026, cl. 1ª e 2ª [PRIMÁRIA].
169. Quarto ponto de decisão: como o caso aparece na apuração
NA APURAÇÃO DA MERIDIANO (fornecedora)
Elemento
Situação no caso
Débito registrado
O valor destacado na NF-e de venda, uma vez processada
Parcela extinta
Somente o valor que o sistema apresentar como objeto de modalidade de extinção prevista no art. 27. O pagamento comercial parcial, desacompanhado dessa informação, não permite determinar o valor tributariamente extinto. → Com os dados fornecidos no caso, este campo não é numericamente determinável
Parcela em aberto
Valor que permanecer sem modalidade de extinção registrada no sistema → igualmente não determinável com os dados do caso
Documento corretivo
Emitido e validado no autorizador — não processado na apuração na etapa descrita pela Cartilha Vol. 2 v1.00
Providência
Consultar o conta-corrente da operação para identificar qual modalidade foi registrada e sobre que valor. Sem essa consulta, a apuração do caso não se fecha

NA APURAÇÃO DA HORIZONTE (adquirente)
Estado do valor
Situação no caso
Valor calculado no documento
O montante destacado na NF-e
Valor potencial — "a apropriar"
Enquanto o débito da MERIDIANO não for extinto, o valor é exibido como potencial, ainda não apropriado
Crédito apropriado
Surge quando ocorre o gatilho correspondente, ligado à extinção do débito do fornecedor
Crédito utilizado / não utilizado
Só faz sentido depois da apropriação

As duas afirmações que este slide impede — ditas em voz alta:
A autorização do documento não produz, por si só, crédito apropriável para o adquirente.
O recebimento parcial do preço não determina, por si só, a parcela tributariamente extinta. Quem preenche esse número a partir do extrato bancário está inferindo, não apurando.
O serviço, em paralelo. A NFS-e do serviço de instalação é documentada em seu próprio modelo e em seu próprio momento. Nenhuma nota de ajuste de NFS-e é utilizada neste caso — essa estrutura permanece com regras sem código definitivo e sem cronograma publicado. Fronteira declarada: a mecânica de extinção, imputação, propagação e conta-corrente foi tratada no Módulo 6 e não é reapresentada. Aqui há apenas o reflexo do caso.
Fontes: Cartilha Vol. 2, itens 1.3, 3.2, 3.4 e 3.5 [ORIENTATIVO]; LC 214/2025, art. 27 [PRIMÁRIA]; Anexo VI v1.04.00, quanto ao estágio das notas de ajuste da NFS-e [TÉCNICA].
170. Conciliação final do caso: quem faz o quê e o que fica guardado
Camada
O que consta no caso
O que precisa ser acompanhado
Responsável
Evidência a guardar
XML
NF-e de venda autorizada · documento corretivo autorizado, com vínculo por item · NFS-e do serviço
Integridade do vínculo entre o corretivo e o original
Fiscal
Os três XML e seus protocolos, arquivados juntos
ERP
Pedido com o local de entrega · cadastro do cliente sem esse local
Correção do cadastro mestre e da regra que o lê
Cadastro + TI
Registro da alteração, com autor, data e aprovação
Financeiro — recebimento do preço
Recebimento parcial do preço, correspondente ao que foi aceito · serviço recebido em momento próprio
Conciliação entre o valor recebido e o documento vigente após a correção
Financeiro
Conciliação assinada entre título e documento
Apuração — extinção do débito
Débito da venda registrado · modalidade e valor de extinção a identificar no conta-corrente · valor do corretivo ainda não processado
Qual modalidade do art. 27 foi registrada e sobre que valor
Fiscal
Extrato da operação, datado, a cada conferência
Conciliação entre os dois planos
O recebimento do preço e a extinção do débito são informações distintas e podem não coincidir
Confronto recebimento financeiro × modalidade de extinção × conta-corrente, com a divergência explicada
Fiscal + Financeiro
Papel de trabalho do confronto, com a explicação da diferença
Achado de controle
Dado de local incorreto, sem instrumento confirmado de reversão
Registro do achado e prevenção para as próximas operações
Fiscal + Cadastro
Registro do achado, com data, causa e providência

As três providências que não podem ficar sem dono:
A correção do cadastro — porque, sem ela, a mesma divergência retorna na próxima venda para o mesmo cliente.
O acompanhamento do documento corretivo — porque emitir não é o fim do processo enquanto o processamento na apuração permanecer pendente.
O confronto entre recebimento e extinção — porque não se pode afirmar que a parcela recebida corresponda necessariamente à parcela tributariamente extinta. Enquanto ninguém fizer esse confronto, a empresa tem dois números que parecem o mesmo e não são.
Fronteira declarada: o fluxo completo entre as áreas foi apresentado no Módulo 7 e não é repetido. Esta tabela é a sua aplicação a um caso.
Fontes: aplicação da estrutura de conciliação do Módulo 7; estados da apuração do Módulo 6 [ORIENTATIVO]; LC 214/2025, art. 27 [PRIMÁRIA].
171. CALENDÁRIO DE ADEQUAÇÃO POR PERFIL DE CLIENTE
Perfil
Prioridade de cadastro
Documento principal
Teste prioritário
Dependência técnica
Ponto de atenção
Status
Comércio
Itens de revenda e clientes com local de entrega diverso
NF-e · NFC-e
Venda tributada padrão e operação com local diverso
Tabelas de classificação vigentes
Parametrização feita apenas pelo item
🔴 AGIR AGORA
Indústria
Itens por natureza (insumo, produto, ativo) e tratamentos específicos
NF-e
Redução, diferimento e crédito presumido
Tabelas vigentes e rota de apropriação cadastrada
Benefício herdado sem fundamento
🔴 AGIR AGORA
Prestador de serviços
Classificação do serviço e conferência da correlação aplicável
NFS-e
Prestação padrão e local de incidência
Anexos técnicos da NFS-e vigentes
Correlação presumida em vez de conferida
🟡 TESTAR
Operações mistas
Os dois troncos de cadastro, com regras separadas por modelo
NF-e e NFS-e
Um caso de cada modelo, na mesma carteira
Admissão de códigos por modelo
Código correto na tabela, inadmitido no modelo
🔴 AGIR AGORA
Simples Nacional / MEI
Cadastro básico e identificação do regime
Conforme a atividade
Emissão regular, no que já estiver operacional
Parte publicada, parte não. Já publicados: obrigatoriedade do Emissor Nacional da NFS-e para ME e EPP optantes a partir de 01/11/2026 (Res. CGSN 191/2026); IBS e CBS no Simples a partir de 01/01/2027 (Res. CGSN 190/2026); opção pelo regime regular para 2027 (Res. CGSN 194/2026); início da obrigatoriedade dos documentos fiscais para optantes em 01/01/2027 (Ato Conjunto nº 4/2026, art. 1º, § 1º). Não publicada: a orientação de preenchimento dos campos de IBS e CBS para CRT 1, 2 e 4, que a NT 2025.002 v1.52 remete a nota técnica futura
Não parametrizar o que não foi publicado — e não tratar como não publicado o que já foi
🔵 ACOMPANHAR PUBLICAÇÃO (campos por CRT) + 🔴 AGIR AGORA (datas já fixadas)
Benefícios, créditos presumidos ou regimes específicos
Fundamento, vigência e rota de apropriação de cada tratamento
Conforme a atividade
Cenário com o tratamento específico aplicado
Tabelas vigentes; parte das estruturas pendente
Ativar em produção estrutura publicada e não implantada
🟡 TESTAR + ⚪ AGUARDAR IMPLEMENTAÇÃO, conforme o item

Legenda dos quatro status: 🔴 agir agora — o caminho está definido e nada impede a ação · 🟡 testar — a estrutura está disponível e precisa de homologação antes da produção · 🔵 acompanhar publicação — a orientação específica ainda não foi publicada · ⚪ aguardar implementação — a estrutura existe, a operação não está confirmada.
Duas regras de uso da matriz:
O perfil Simples Nacional e MEI não é preenchido com tratamento presumido — nem é tratado como um vazio normativo. O que ainda não foi publicado é a orientação de preenchimento dos campos de IBS e CBS para CRT 1, 2 e 4; essa parte é acompanhar, não parametrizar. As datas e obrigações já fixadas em resolução do CGSN e no Ato Conjunto nº 4/2026 estão publicadas e entram no cronograma de trabalho normalmente.', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
--> statement-breakpoint
INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at) VALUES ('mat-ct-124-apostila-02', 'CT-124', 'texto', 'Apostila — Caso integrado: implantação nos documentos fiscais (parte 2/2)', 'Um mesmo cliente pode ocupar duas linhas. Uma empresa de operações mistas com benefício cadastrado é atendida pela quarta e pela sexta linha — e o cronograma de trabalho é o da linha mais exigente.
Sobre os prazos de escolha e de cancelamento do modelo de recolhimento do IBS e da CBS para 2027 (Resolução CGSN nº 194/2026), ver a atualização operacional no tópico 91.
Fontes: consolidação dos Módulos 2 a 7; NT 2025.002 v1.52, quanto à pendência de publicação para CRT 1, 2 e 4 [TÉCNICA]; Resoluções CGSN nº 190/2026, nº 191/2026 e nº 194/2026 e Ato Conjunto RFB/CGIBS nº 4/2026, art. 1º, § 1º [PRIMÁRIA]; pendências já registradas nos módulos anteriores.
172. SÍNTESE: as sete perguntas de controle
   ┌─────────────────────────────────────────────────────────────┐
   │  1  QUAL OPERAÇÃO ESTÁ SENDO DOCUMENTADA?                   │
   │     ─────────────────────────────────────────────────────── │
   │  2  QUAL DOCUMENTO É ADEQUADO?                              │
   │     ─────────────────────────────────────────────────────── │
   │  3  COMO O ITEM OU SERVIÇO ESTÁ CLASSIFICADO?               │
   │     ─────────────────────────────────────────────────────── │
   │  4  QUAIS GRUPOS O DOCUMENTO EXIGE OU PROÍBE?               │
   │     ─────────────────────────────────────────────────────── │
   │  5  HOUVE FATO POSTERIOR QUE EXIGE CORREÇÃO OU EVENTO?      │
   │     ─────────────────────────────────────────────────────── │
   │  6  COMO O DOCUMENTO APARECE NA APURAÇÃO?                   │
   │     ─────────────────────────────────────────────────────── │
   │  7  O CADASTRO, O ERP E AS ÁREAS CONTAM A MESMA HISTÓRIA?   │
   └─────────────────────────────────────────────────────────────┘
 
    1 e 2 ─► ANTES        3 e 4 ─► DURANTE       5, 6 e 7 ─► DEPOIS
    definem o caminho     definem o conteúdo     definem a consistência

Como as sete perguntas se usam: em ordem, e sem pular. As perguntas 1 e 2 decidem o caminho — errar aqui compromete as decisões e verificações seguintes. As perguntas 3 e 4 decidem o conteúdo do documento. As perguntas 5, 6 e 7 verificam a consistência depois que o documento existe — e a pergunta 5 é a que reconhece que fatos supervenientes podem exigir novas decisões, como ocorreu no caso da MERIDIANO. A sétima é a que fecha o curso, porque é a única que não se responde olhando para um documento. Ela se responde olhando para a empresa.
Fontes: consolidação do curso; nenhuma fonte nova.
173. EXERCÍCIO INTEGRADO: seis afirmações
Dinâmica: em duplas. Para cada afirmação, marcar V ou F e escrever, em uma linha, a regra, a fonte ou o limite técnico que justifica a resposta.
#
Afirmação
V ou F
Justificativa (uma linha)
1
Como o equipamento vendido pela MERIDIANO tem classificação de item cadastrada e vigente, o tratamento tributário aplicável à operação está integralmente determinado.
☐ V ☐ F
__________
2
A escolha entre NF-e e NFS-e para as duas partes do negócio decorre da natureza de cada operação, e não do sistema que a empresa prefere utilizar.
☐ V ☐ F
__________
3
Na recusa parcial dos dois equipamentos, o instrumento cabe à MERIDIANO, que emite nota de crédito tipo 06 com referenciamento no nível do item.
☐ V ☐ F
__________
4
Como a NF-e de venda foi autorizada, a HORIZONTE já pode apropriar o crédito correspondente.
☐ V ☐ F
__________
5
Por não se prestar à apuração de IBS, CBS e IS, a EFD ICMS/IPI está dispensada para a MERIDIANO.
☐ V ☐ F
__________
6
A existência da hipótese normativa da ND tipo 09 significa que o código já está implementado no leiaute e que seu efeito será automaticamente processado na apuração.
☐ V ☐ F
__________

Regras do exercício: nenhuma resposta depende de data. Nenhuma resposta usa a Carta de Correção eletrônica. Toda justificativa deve caber em uma linha.
Fontes: afirmações construídas exclusivamente sobre conteúdo dos Módulos 1 a 7. Afirmações 3 e 6 atualizadas pelo Ajuste SINIEF 34/2026.
Espaço para a sua resposta







174. GABARITO E ENCERRAMENTO
#
Tema
Resp.
Regra decisiva
Onde foi ensinada
Erro prático que evita
1
Cadastro e classificação
F
A classificação do item não determina sozinha o tratamento; este depende da combinação item + natureza + partes + local + finalidade + regime
M7 — matriz de regra fiscal; ficha de cadastro
Parametrizar o ERP "pela classificação do produto"
2
Escolha do documento
V
O modelo documental decorre da natureza da operação; cada modelo tem estrutura própria e admite um conjunto próprio de códigos
M1, M3 e M4
Forçar a operação no documento que o sistema já emite
3
Correção
F
Sendo o destinatário contribuinte, o Ajuste SINIEF nº 34/2026 atribui a ele a emissão da ND tipo 09, com refNFe no nível da nota — e não a NC 06 pelo remetente, que só cabe quando o destinatário não é contribuinte
M5
Manter a NC 06 do remetente quando o destinatário é contribuinte, ou usar o referenciamento da recusa total na parcial
4
Apuração
F
A autorização não produz crédito apropriável. O valor é exibido como potencial, ainda não apropriado; em regra (art. 47), a apropriação depende da extinção do débito do fornecedor e de documento idôneo — ressalvadas as exceções dos §§ 4º e 5º do art. 47 e a hipótese condicionada do art. 48
M6
Contar com um crédito que ainda não existe como apropriado
5
EFD
F
A EFD não se presta à apuração dos novos tributos — e isso não é dispensa. Ela permanece aplicável aos contribuintes e operações alcançados por sua legislação própria; as fontes do curso não indicam extinção ou dispensa geral
M7 — Guia Prático v3.2.4, Seção 10
Interromper obrigações vigentes por leitura equivocada de uma frase
6
Homologação e implantação
F
Previsão normativa não é implementação técnica: o código 09 ainda não consta do domínio publicado do leiaute nem das regras de validação da NF-e
M5 e M7
Prometer ao cliente um efeito que a fonte não sustenta

O padrão do gabarito, em uma frase: cinco das seis afirmações são falsas pelo mesmo motivo — cada uma toma uma etapa da jornada pela jornada inteira. Classificação não é tratamento. Autorização não é apropriação. Estrutura publicada não é operação. Não apurar não é dispensa. E pagamento do preço não é extinção de débito. E previsão normativa não é implementação técnica.
ENCERRAMENTO
O documento fiscal deixou de ser o fim do processo e passou a ser a origem dele.
O que a empresa emitir alimentará a apuração quando for processado; por isso, cadastro, documento, pagamento, correção e acompanhamento precisam contar a mesma história.
As sete perguntas do slide anterior são o que resta quando o curso terminar.
Fontes: as indicadas por afirmação, todas de módulos anteriores. Afirmações 3 e 6: Ajuste SINIEF 34/2026 [PRIMÁRIA].
Anotações da correção




REFERÊNCIAS
Relação das fontes utilizadas no curso, na forma em que foram consultadas. O grau de consulta de cada uma está indicado slide a slide pelos marcadores.
Normas e atos
Lei Complementar nº 214, de 16 de janeiro de 2025 — arts. 3º, 10, 12, 27 e 348 [PRIMÁRIA, nos dispositivos indicados]
Lei Complementar nº 227, de 2026 — acréscimo dos §§ 3º e 4º ao art. 348 da LC 214/2025
Ato Conjunto RFB/CGIBS nº 1, de 22/12/2025 — obrigações acessórias de 2026, com a retificação de 24/12/2025 [PRIMÁRIA]
Ato Conjunto RFB/CGIBS nº 4, de 30/07/2026 — datas de início da obrigatoriedade, art. 1º, incisos I a XVIII e §§ 1º a 6º [PRIMÁRIA]
Ato Técnico Conjunto RFB/CGIBS nº 1, de 2026 — documentação técnica dos documentos fiscais
Resolução CGIBS nº 6/2026, art. 465 · Decreto nº 12.955/2026, art. 464 — condição de 2026
Resoluções CGSN nº 186/2026, nº 189/2026 (revogada), nº 190/2026, nº 191/2026 e nº 194/2026 [PRIMÁRIA]
Ato Técnico Conjunto RFB/SUFIS/CGIBS/Diretoria-Executiva nº 6/2026 — documentação técnica da DeRE versão 1.3.0 [PRIMÁRIA]
Ato Técnico Conjunto RFB/SUFIS/CGIBS/Diretoria-Executiva nº 8, de 29/09/2026 (DOU de 01/10/2026) — aprova a NT 2025.002-RTC v1.52, a NT 2026.002 v1.11, a NT 2026.007 v1.10, a NT 2026.008 v1.00, a NT 2026.010 v1.00 e o IT 2025.002 v1.70 [PRIMÁRIA]
Ajuste SINIEF nº 7, de 30/09/2005 — cláusulas décima segunda, décima segunda-A, décima terceira, décima quarta-A e décima quinta-A [PRIMÁRIA]
Ajustes SINIEF 13/2024, 49/2025, 8/2026, 13/2025 e 27/2026 — textos consolidados [CONSOLIDADO]
Documentação técnica — NF-e e NFC-e
NT 2025.002-RTC v1.52, de setembro de 2026 — NF-e e NFC-e na Reforma Tributária: correção da RV VC02-50 e nova data de implantação da VC02-14 em produção [PRIMÁRIA]
NT 2026.002 v.1.11 — NF-e, de 01/10/2026 — emissão offline, autorização com alerta e DANFE Simplificado Tipo 2; altera para 14/12/2026 a implantação em produção das RV I08-180, BA02-35 e VC02-40 [PRIMÁRIA]
NT 2026.009 v.1.00 — NF-e, de 09/09/2026 — alteração da regra de validação I08-140, quanto aos CFOP 1.949 e 2.949 [PRIMÁRIA]
NT 2026.007 v1.10 — NF-e, de 01/10/2026 — emissão por contribuinte exclusivo do IBS/CBS, sem Inscrição Estadual, e validações na LCC-RFB e no CCC [PRIMÁRIA]
NT 2026.008 v1.00 — NF-e, de 01/10/2026 — Valor Líquido do Produto: campos vUnComLiq, vProdLiq, vProdLiqTot e vICMSPrevisto; composição do vProd com IBS e CBS [PRIMÁRIA]
NT 2026.010 v1.00 — NF-e, de 01/10/2026 — DANFE Reforma Tributária: leiaute de impressão do DANFE modelo 55, com implantação em produção em 01/12/2026 [PRIMÁRIA]
Informe Técnico 2023.002 v.2.10 — Tabela de CFOP, com a coluna indExcIBSCBS [PRIMÁRIA]
IT 2025.002 v1.70 — Tabelas de classificação do IBS e da CBS · IT 2026.002 v1.00 — alíquotas da CBS
Tabelas CST, cClassTrib e cCredPres — versão vigente: IT 2025.002 v1.70, de 01/10/2026 (aba "cClass 2026-09-01"); contagens do curso conferidas também na v1.60, de 22/06/2026
Portal Nacional da NF-e — aviso de 05/10/2026, "Comunica alteração de data de homologação e produção de Notas Técnicas publicadas": NT 2025.002 v1.52, NT 2026.007 v1.10 e NT 2026.008 v1.00 postergadas para 26/10/2026 em homologação e 16/11/2026 em produção [PRIMÁRIA]
Manual de Orientação do Contribuinte — MOC versão 7.0 (NF-e e NFC-e) — consultado nas seções 5.8 a 5.8.6
Manual de Orientação ao Contribuinte da API de Integração com a Apuração Assistida do IBS, versão 1.10, de setembro de 2026 — primeira versão oficial, que sucede a minuta disponibilizada no Projeto Piloto em julho de 2026 [TÉCNICA]
Documentação técnica — NFS-e
Anexo VI v1.04.00 · Anexo VII v1.02.00 · Anexo VIII v1.01.00 — NFS-e
Nota Técnica SE/CGNFS-e nº 006, versão 1.00, de 22/01/2026 — leiaute e documentação técnica da NFS-e Via [PRIMÁRIA]
Nota Técnica SE/CGNFS-e nº 007 — evoluções da plataforma e dos emissores públicos nacionais [TÉCNICA]
Nota Técnica SE/CGNFS-e nº 008, versão 1.02, de 14/07/2026 — especificações técnicas do DANFSe [PRIMÁRIA]
Nota Técnica SE/CGNFS-e nº 009, versão 1.0 — evoluções do leiaute da DPS e da NFS-e [PRIMÁRIA]
Atenção às duas Notas Técnicas de número 009: a NT 2026.009 v.1.00 é da NF-e e trata da regra I08-140; a Nota Técnica SE/CGNFS-e nº 009, versão 1.0, é da NFS-e e trata das evoluções do leiaute da DPS e da NFS-e. São documentos distintos, de portais distintos.
Material orientativo
Cartilha de Apuração do IBS, volumes 1 e 2 — volume 2, versão 1.00, de janeiro de 2026: material orientativo que retrata a etapa do Projeto Piloto daquela data [ORIENTATIVO]
Perguntas e Respostas da NFS-e v1.00 [ORIENTATIVO]
Guia Prático da EFD-ICMS/IPI v3.2.4 — registros 0200, C100 e C190
Orientação CGNFS-e sobre prazos para destaque de IBS e CBS nas notas fiscais de serviço
Ministério da Fazenda, comunicado de 1º/09/2026 — prazo de opção pelo Simples Nacional e escolha do modelo de recolhimento do IBS e da CBS para 2027 [ORIENTATIVO]
CGIBS, comunicado de 30/09/2026 — prazos de opção e de cancelamento do regime regular do IBS e da CBS para 2027 [ORIENTATIVO]
Consulta às fontes
Fontes oficiais consultadas em 17/09/2026, nos Portais Nacionais da NF-e e da NFS-e, na base de normas da Receita Federal, no Ministério da Fazenda, no CGIBS, no CONFAZ e no Planalto.

ENCERRAMENTO
O documento fiscal deixou de ser o fim do processo e passou a ser a origem dele.
O que a empresa emitir alimentará a apuração quando for processado; por isso, cadastro, documento, pagamento, correção e acompanhamento precisam contar a mesma história. As sete perguntas de controle são o roteiro que fica quando o curso termina.


Débora Maiara Rediess
Contadora, consultora fiscal e tributária · Nota Fácil Assessoria
Instagram: @notafacilassessoria', NULL, NULL, NULL, NULL, NULL, 2, '2026-10-20T00:00:00.000Z') ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position;
