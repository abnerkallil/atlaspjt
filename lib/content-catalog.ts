export type ContentReference = {
  id: string;
  subject: 'Contabilidade Geral' | 'Contabilidade Tributária';
  unit: string;
  title: string;
  keywords: string;
};

export const OFFICIAL_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1KXcEaj9rMI46KyZdaW1Ph2kFnOI3RLPRXHRLiGqKbSA/edit';

export const CONTENT_CATALOG_SNAPSHOT_DATE = '2026-09-06';

// Snapshot read from the official Atlas workbook. It is classification input only;
// progress, penalties and studied states remain owned by the spreadsheet.
export const contentCatalog: ContentReference[] = [
  {
    id: 'CG-001',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Conceitos iniciais da contabilidade',
    keywords:
      'Objeto, finalidade, campo de aplicação, usuários e informação contábil',
  },
  {
    id: 'CG-002',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Patrimônio',
    keywords: 'Bens, direitos, obrigações e representação patrimonial',
  },
  {
    id: 'CG-003',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Patrimônio Líquido e equação patrimonial',
    keywords: 'Capital, reservas, resultados e Ativo = Passivo + PL',
  },
  {
    id: 'CG-004',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Situações patrimoniais',
    keywords:
      'Situação líquida positiva, nula, negativa e passivo a descoberto',
  },
  {
    id: 'CG-005',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Atos e fatos administrativos',
    keywords: 'Atos; fatos permutativos, modificativos e mistos',
  },
  {
    id: 'CG-006',
    subject: 'Contabilidade Geral',
    unit: 'Fundamentos',
    title: 'Variações patrimoniais',
    keywords: 'Variações qualitativas e quantitativas; resultado e patrimônio',
  },
  {
    id: 'CG-007',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Conceito, função e estrutura das contas',
    keywords: 'Título, objeto, débito, crédito, saldo e função',
  },
  {
    id: 'CG-008',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Contas patrimoniais',
    keywords: 'Ativo, passivo e patrimônio líquido; natureza dos saldos',
  },
  {
    id: 'CG-009',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Contas de resultado',
    keywords: 'Receitas, custos e despesas; encerramento dos saldos',
  },
  {
    id: 'CG-010',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Teoria Personalista',
    keywords: 'Agentes consignatários, correspondentes e proprietários',
  },
  {
    id: 'CG-011',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Teoria Materialista',
    keywords: 'Contas integrais e diferenciais',
  },
  {
    id: 'CG-012',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Teoria Patrimonialista',
    keywords: 'Contas patrimoniais e contas de resultado',
  },
  {
    id: 'CG-013',
    subject: 'Contabilidade Geral',
    unit: 'Contas',
    title: 'Plano e manual de contas',
    keywords: 'Estrutura, codificação, níveis e adaptação ao negócio',
  },
  {
    id: 'CG-014',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Natureza devedora e credora',
    keywords: 'Aumentos, diminuições e saldos por grupo',
  },
  {
    id: 'CG-015',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Método das partidas dobradas',
    keywords: 'Origem, aplicação e igualdade entre débitos e créditos',
  },
  {
    id: 'CG-016',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Lançamentos contábeis',
    keywords: 'Elementos, fórmulas, histórico e análise do fato',
  },
  {
    id: 'CG-017',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Livros Diário e Razão',
    keywords: 'Escrituração cronológica, sistemática e razonetes',
  },
  {
    id: 'CG-018',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Escrituração contábil',
    keywords: 'Formalidades, documentação, método e encadeamento',
  },
  {
    id: 'CG-019',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Balancete de verificação',
    keywords: 'Saldos, movimentação, conferência e limitações',
  },
  {
    id: 'CG-020',
    subject: 'Contabilidade Geral',
    unit: 'Mecânica contábil',
    title: 'Erros e correções de escrituração',
    keywords: 'Estorno, transferência, complementação e ressalva',
  },
  {
    id: 'CG-021',
    subject: 'Contabilidade Geral',
    unit: 'Reconhecimento',
    title: 'Regime de caixa e de competência',
    keywords: 'Fato gerador, recebimento, pagamento e período contábil',
  },
  {
    id: 'CG-022',
    subject: 'Contabilidade Geral',
    unit: 'Reconhecimento',
    title: 'Receitas, custos e despesas',
    keywords: 'Reconhecimento, classificação e impacto no resultado',
  },
  {
    id: 'CG-023',
    subject: 'Contabilidade Geral',
    unit: 'Reconhecimento',
    title: 'Apuração do Resultado do Exercício',
    keywords: 'Encerramento das contas de resultado e transferência ao PL',
  },
  {
    id: 'CG-024',
    subject: 'Contabilidade Geral',
    unit: 'Reconhecimento',
    title: 'Ajustes por competência',
    keywords: 'Antecipações, apropriações, receitas a apropriar e estimativas',
  },
  {
    id: 'CG-025',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Caixa, bancos e conciliação',
    keywords: 'Disponibilidades, transferências, tarifas e divergências',
  },
  {
    id: 'CG-026',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Clientes e contas a receber',
    keywords: 'Vendas a prazo, recebimentos, descontos e perdas',
  },
  {
    id: 'CG-027',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Compras, vendas e estoques',
    keywords: 'Entradas, saídas, devoluções e abatimentos',
  },
  {
    id: 'CG-028',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Custo das Mercadorias Vendidas',
    keywords: 'Inventário periódico e permanente; EI + C - EF',
  },
  {
    id: 'CG-029',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Tributos nas compras e vendas',
    keywords: 'Tributos recuperáveis, incidentes sobre vendas e apresentação',
  },
  {
    id: 'CG-030',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Folha de pagamento',
    keywords: 'Salários, encargos, retenções, provisões e pagamento',
  },
  {
    id: 'CG-031',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Imobilizado, intangível e depreciação',
    keywords: 'Reconhecimento, custo, vida útil, amortização e baixa',
  },
  {
    id: 'CG-032',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Empréstimos, financiamentos e juros',
    keywords: 'Principal, encargos, prazos e apropriação',
  },
  {
    id: 'CG-033',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Provisões e contingências — introdução',
    keywords: 'Obrigação presente, estimativa, reconhecimento e divulgação',
  },
  {
    id: 'CG-034',
    subject: 'Contabilidade Geral',
    unit: 'Operações usuais',
    title: 'Operações com Patrimônio Líquido',
    keywords: 'Capital, integralização, reservas, dividendos e resultados',
  },
  {
    id: 'CG-035',
    subject: 'Contabilidade Geral',
    unit: 'Fechamento',
    title: 'Rotina de fechamento contábil',
    keywords: 'Conciliações, ajustes, reclassificações e encerramento',
  },
  {
    id: 'CG-036',
    subject: 'Contabilidade Geral',
    unit: 'Demonstrações',
    title: 'Balanço Patrimonial',
    keywords: 'Estrutura, circulante, não circulante e apresentação',
  },
  {
    id: 'CG-037',
    subject: 'Contabilidade Geral',
    unit: 'Demonstrações',
    title: 'Demonstração do Resultado do Exercício',
    keywords: 'Estrutura, receitas, custos, despesas e resultado líquido',
  },
  {
    id: 'CG-038',
    subject: 'Contabilidade Geral',
    unit: 'Demonstrações',
    title: 'DLPA, DMPL e DFC — fundamentos',
    keywords: 'Movimentação do PL e introdução aos fluxos de caixa',
  },
  {
    id: 'CG-039',
    subject: 'Contabilidade Geral',
    unit: 'Demonstrações',
    title: 'Notas explicativas e políticas contábeis',
    keywords: 'Contexto, políticas, estimativas e informações complementares',
  },
  {
    id: 'CG-040',
    subject: 'Contabilidade Geral',
    unit: 'Integração prática',
    title: 'Ciclo contábil completo',
    keywords:
      'Documentos, lançamentos, Razão, balancete, ajustes, fechamento e demonstrações',
  },
  {
    id: 'CT-001',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Atividade financeira do Estado',
    keywords:
      'Finalidades do Estado; receitas, despesas, orçamento e arrecadação',
  },
  {
    id: 'CT-002',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Sistema Tributário Nacional',
    keywords:
      'Constituição, CTN, legislação complementar, ordinária e normas infralegais',
  },
  {
    id: 'CT-003',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Competência tributária e repartição',
    keywords:
      'União, Estados, Distrito Federal e Municípios; competência, capacidade ativa e repartição de receitas',
  },
  {
    id: 'CT-004',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Espécies tributárias',
    keywords:
      'Impostos, taxas, contribuição de melhoria, empréstimos compulsórios e contribuições especiais',
  },
  {
    id: 'CT-005',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Princípios e limitações ao poder de tributar',
    keywords:
      'Legalidade, anterioridade, noventena, isonomia, capacidade contributiva, não confisco e imunidades',
  },
  {
    id: 'CT-006',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Obrigação tributária',
    keywords:
      'Obrigação principal e acessória; conversão por descumprimento; prestações positivas e negativas',
  },
  {
    id: 'CT-007',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Hipótese de incidência e fato gerador',
    keywords:
      'Aspectos material, temporal, espacial, pessoal e quantitativo; incidência, não incidência e isenção',
  },
  {
    id: 'CT-008',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Sujeitos da relação tributária',
    keywords:
      'Sujeito ativo, contribuinte, responsável, substituto e terceiros',
  },
  {
    id: 'CT-009',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Crédito tributário e lançamento',
    keywords:
      'Constituição do crédito; lançamento de ofício, por declaração e por homologação',
  },
  {
    id: 'CT-010',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Suspensão, extinção e exclusão do crédito',
    keywords:
      'Moratória, depósito, recursos, parcelamento, pagamento, compensação, decadência, prescrição, isenção e anistia',
  },
  {
    id: 'CT-011',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Responsabilidade, solidariedade e sucessão',
    keywords:
      'Responsabilidade de terceiros, infrações, sucessores e grupos econômicos',
  },
  {
    id: 'CT-012',
    subject: 'Contabilidade Tributária',
    unit: 'Fundamentos',
    title: 'Interpretação, vigência e aplicação da legislação',
    keywords:
      'Integração, analogia, equidade, atos normativos, consulta e efeitos no tempo',
  },
  {
    id: 'CT-013',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Tributos a recuperar e a recolher',
    keywords:
      'Natureza das contas; ativo fiscal; passivo tributário; compensações e saldos',
  },
  {
    id: 'CT-014',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Reconhecimento por competência',
    keywords:
      'Fato gerador, competência contábil, apuração e pagamento em períodos distintos',
  },
  {
    id: 'CT-015',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Tributos sobre compras, vendas e resultado',
    keywords:
      'Recuperáveis, não recuperáveis, deduções da receita, custo e tributos sobre lucro',
  },
  {
    id: 'CT-016',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Conciliação contábil-fiscal',
    keywords:
      'Razão, apurações, guias, declarações, saldos e diferenças temporais/permanentes',
  },
  {
    id: 'CT-017',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Provisões, contingências e riscos fiscais',
    keywords:
      'Obrigação presente, probabilidade, mensuração, depósitos e divulgação',
  },
  {
    id: 'CT-018',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Tributos sobre o lucro — CPC 32',
    keywords:
      'Tributo corrente e diferido; diferenças temporárias; ativos e passivos fiscais diferidos',
  },
  {
    id: 'CT-019',
    subject: 'Contabilidade Tributária',
    unit: 'Contabilização',
    title: 'Fechamento tributário integrado',
    keywords:
      'Calendário, responsáveis, conferências, provisões, pagamentos e evidências',
  },
  {
    id: 'CT-020',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'CNPJ, CNAE e estabelecimentos',
    keywords:
      'Matriz, filiais, natureza jurídica, atividades principal/secundárias e impactos tributários',
  },
  {
    id: 'CT-021',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'Inscrições e domicílios fiscais',
    keywords:
      'Inscrição estadual, municipal, regimes estaduais e municipais, DTE e e-CAC',
  },
  {
    id: 'CT-022',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'Certificado digital, procurações e acessos',
    keywords:
      'ICP-Brasil, perfis, procuração eletrônica, segregação de funções e segurança',
  },
  {
    id: 'CT-023',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'Ecossistema de documentos fiscais eletrônicos',
    keywords: 'NF-e, NFC-e, CT-e, MDF-e, NFS-e e eventos',
  },
  {
    id: 'CT-024',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'NF-e e NFC-e',
    keywords:
      'Emissão, autorização, XML, DANFE, destinatário, contingência e guarda',
  },
  {
    id: 'CT-025',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'CT-e e MDF-e',
    keywords:
      'Prestação de transporte, tomador, documentos vinculados e encerramento',
  },
  {
    id: 'CT-026',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'NFS-e e padrões municipais/nacional',
    keywords:
      'Emissão, competência, código de serviço, retenção, cancelamento e município',
  },
  {
    id: 'CT-027',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'CFOP e natureza da operação',
    keywords:
      'Entradas, saídas, operações internas, interestaduais, exterior, devoluções e remessas',
  },
  {
    id: 'CT-028',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'NCM, CST, CSOSN, CEST e benefícios',
    keywords:
      'Classificação fiscal, origem, situação tributária, substituição e códigos de benefício',
  },
  {
    id: 'CT-029',
    subject: 'Contabilidade Tributária',
    unit: 'Cadastros e documentos',
    title: 'Eventos, correções e guarda documental',
    keywords:
      'Cancelamento, inutilização, carta de correção, manifestação, ciência, prazos e trilha de auditoria',
  },
  {
    id: 'CT-030',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Estrutura, opção e vedações',
    keywords:
      'LC 123; conceito de ME/EPP; opção, sublimites, vedações, exclusão e efeitos',
  },
  {
    id: 'CT-031',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'MEI e SIMEI',
    keywords:
      'Ocupações, limites, DAS-MEI, empregado, desenquadramento e DASN-SIMEI',
  },
  {
    id: 'CT-032',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Receita bruta, competência/caixa e RBT12',
    keywords:
      'Receitas incluídas, segregação, devoluções, cancelamentos, mercado interno/externo e acumulados',
  },
  {
    id: 'CT-033',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Anexos, faixas e alíquota efetiva',
    keywords: 'Anexos I a V; alíquota nominal, parcela a deduzir e partilha',
  },
  {
    id: 'CT-034',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Fator R',
    keywords:
      'Folha e encargos; receita; janela de 12 meses; início de atividade; efeitos entre anexos III e V',
  },
  {
    id: 'CT-035',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Segregação de receitas no PGDAS-D',
    keywords:
      'Comércio, indústria, serviços; monofásico, ST, antecipação, exportação, retenção e receitas sujeitas a regras próprias',
  },
  {
    id: 'CT-036',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'PGDAS-D, DAS e retificações',
    keywords:
      'Declaração mensal, apuração, transmissão, geração do DAS, retificação e efeitos',
  },
  {
    id: 'CT-037',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'DEFIS e obrigações complementares',
    keywords:
      'Informações econômicas e fiscais, estoques, ganhos, sócios, prazos e retificação',
  },
  {
    id: 'CT-038',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Restituição, compensação, parcelamento e regularização',
    keywords: 'Pagamentos indevidos, débitos, cobrança, exclusão e certidões',
  },
  {
    id: 'CT-039',
    subject: 'Contabilidade Tributária',
    unit: 'Simples Nacional',
    title: 'Caso completo do Simples Nacional',
    keywords:
      'Cadastro, documentos, segregação, Fator R, PGDAS-D, DAS, contabilização e DEFIS',
  },
  {
    id: 'CT-040',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'Elegibilidade, opção e período de apuração',
    keywords:
      'Limites, atividades impedidas, opção pelo pagamento e apuração trimestral',
  },
  {
    id: 'CT-041',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'Receita bruta e percentuais de presunção',
    keywords:
      'Percentuais por atividade, múltiplas atividades, devoluções e descontos',
  },
  {
    id: 'CT-042',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'Outras receitas e acréscimos à base',
    keywords:
      'Ganhos de capital, receitas financeiras e demais valores tributáveis',
  },
  {
    id: 'CT-043',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'IRPJ e adicional',
    keywords: 'Base, alíquota, adicional, deduções, retenções e pagamento',
  },
  {
    id: 'CT-044',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'CSLL',
    keywords: 'Base presumida por atividade, alíquota, retenções e pagamento',
  },
  {
    id: 'CT-045',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Presumido',
    title: 'PIS/Cofins cumulativos e fechamento',
    keywords:
      'Regime cumulativo, receitas, exceções, escriturações e conciliação trimestral',
  },
  {
    id: 'CT-046',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Obrigatoriedade, opção e modalidades',
    keywords:
      'Hipóteses legais; trimestral; anual com estimativas; vantagens e riscos',
  },
  {
    id: 'CT-047',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Lucro líquido e ponte fiscal',
    keywords:
      'Resultado contábil antes do IRPJ/CSLL; adições, exclusões e compensações',
  },
  {
    id: 'CT-048',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Despesas dedutíveis e indedutíveis',
    keywords: 'Necessidade, usualidade, documentação, limites e vedações',
  },
  {
    id: 'CT-049',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'e-Lalur e e-Lacs',
    keywords:
      'Parte A, Parte B, controles, bases de IRPJ e CSLL e rastreabilidade',
  },
  {
    id: 'CT-050',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Prejuízo fiscal e base negativa',
    keywords: 'Compensação, limites, segregações e controles históricos',
  },
  {
    id: 'CT-051',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Estimativas mensais e balanços de suspensão/redução',
    keywords:
      'Base estimada, receita bruta, balancetes, comparação e recolhimentos',
  },
  {
    id: 'CT-052',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Incentivos, subvenções e tratamentos especiais',
    keywords:
      'Benefícios, requisitos, controles, mudanças legislativas e documentação',
  },
  {
    id: 'CT-053',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Juros, partes relacionadas e ajustes avançados',
    keywords:
      'Juros, capitalização, partes relacionadas, preços de transferência e limites aplicáveis',
  },
  {
    id: 'CT-054',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'Tributo corrente e diferido aplicado',
    keywords: 'Diferenças temporárias, taxa efetiva, realização e divulgação',
  },
  {
    id: 'CT-055',
    subject: 'Contabilidade Tributária',
    unit: 'Lucro Real',
    title: 'ECF e fechamento anual',
    keywords:
      'Recuperação da ECD, blocos, e-Lalur/e-Lacs, validações e entrega',
  },
  {
    id: 'CT-056',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Incidência, contribuintes e base de cálculo',
    keywords:
      'Receita, faturamento, exclusões, ajustes, regimes e tratamentos diferenciados',
  },
  {
    id: 'CT-057',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Regime cumulativo',
    keywords: 'Alíquotas, base, receitas e exceções',
  },
  {
    id: 'CT-058',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Regime não cumulativo',
    keywords:
      'Débitos, créditos permitidos, conceito de insumo, rateios e estornos',
  },
  {
    id: 'CT-059',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Monofásico, substituição, alíquota zero, isenção e suspensão',
    keywords:
      'Cadeias especiais, classificação de produto e segregação de receitas',
  },
  {
    id: 'CT-060',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Importação e exportação',
    keywords:
      'PIS/Cofins-Importação, créditos, receitas de exportação e documentação',
  },
  {
    id: 'CT-061',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'EFD-Contribuições',
    keywords:
      'Blocos, documentos, apuração, créditos, receitas especiais, validações e retificações',
  },
  {
    id: 'CT-062',
    subject: 'Contabilidade Tributária',
    unit: 'PIS e Cofins',
    title: 'Caso completo e conciliação',
    keywords:
      'Documentos, classificação, apuração, contabilização, EFD e pagamento',
  },
  {
    id: 'CT-063',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Fundamentos e legislação estadual',
    keywords:
      'Competência, incidência, contribuinte, estabelecimento, regulamento estadual e convênios',
  },
  {
    id: 'CT-064',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Fato gerador, local, base e contribuinte',
    keywords:
      'Circulação, prestações, importação, base, descontos, frete e responsabilidades',
  },
  {
    id: 'CT-065',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Alíquotas internas e interestaduais',
    keywords: 'Origem/destino, resoluções, importados e consumidor final',
  },
  {
    id: 'CT-066',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Não cumulatividade e créditos',
    keywords:
      'Crédito físico/financeiro conforme regra, documentação, vedação, estorno e manutenção',
  },
  {
    id: 'CT-067',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'DIFAL e FCP',
    keywords:
      'Consumidor final contribuinte/não contribuinte, partilha, base e fundos estaduais',
  },
  {
    id: 'CT-068',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Substituição tributária e antecipação',
    keywords:
      'Substituto/substituído, CEST, MVA, pauta, base, ressarcimento e complemento',
  },
  {
    id: 'CT-069',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Benefícios e regimes especiais',
    keywords:
      'Isenção, redução de base, crédito presumido, diferimento, suspensão e obrigações',
  },
  {
    id: 'CT-070',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'CIAP, ativo imobilizado e uso/consumo',
    keywords: 'Crédito parcelado, controles, transferências e estornos',
  },
  {
    id: 'CT-071',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'Importação, exportação e operações especiais',
    keywords:
      'Desembaraço, exportações, remessas, transferências, industrialização e triangulares',
  },
  {
    id: 'CT-072',
    subject: 'Contabilidade Tributária',
    unit: 'ICMS',
    title: 'EFD ICMS/IPI e fechamento estadual',
    keywords:
      'Blocos, registros, apuração, inventário, CIAP, validações, GIA/declaratórias locais e pagamento',
  },
  {
    id: 'CT-073',
    subject: 'Contabilidade Tributária',
    unit: 'IPI',
    title: 'Incidência e conceito de industrialização',
    keywords:
      'Contribuintes, estabelecimentos equiparados, modalidades e exclusões',
  },
  {
    id: 'CT-074',
    subject: 'Contabilidade Tributária',
    unit: 'IPI',
    title: 'TIPI, NCM e enquadramento',
    keywords: 'Classificação, alíquotas, essencialidade e reflexos documentais',
  },
  {
    id: 'CT-075',
    subject: 'Contabilidade Tributária',
    unit: 'IPI',
    title: 'Base de cálculo e apuração',
    keywords: 'Valor tributável, alíquotas, débitos, créditos e períodos',
  },
  {
    id: 'CT-076',
    subject: 'Contabilidade Tributária',
    unit: 'IPI',
    title: 'Suspensão, isenção, imunidade e regimes',
    keywords: 'Exportação, insumos, benefícios e condições documentais',
  },
  {
    id: 'CT-077',
    subject: 'Contabilidade Tributária',
    unit: 'IPI',
    title: 'Escrituração e EFD ICMS/IPI',
    keywords: 'Documentos, registros, apuração, controles e validações',
  },
  {
    id: 'CT-078',
    subject: 'Contabilidade Tributária',
    unit: 'ISS',
    title: 'LC 116 e lista de serviços',
    keywords:
      'Competência municipal, enquadramento do serviço, itens e conflitos com ICMS',
  },
  {
    id: 'CT-079',
    subject: 'Contabilidade Tributária',
    unit: 'ISS',
    title: 'Local da incidência e exportação de serviços',
    keywords:
      'Regra geral, exceções, estabelecimento prestador, resultado no exterior e conflitos',
  },
  {
    id: 'CT-080',
    subject: 'Contabilidade Tributária',
    unit: 'ISS',
    title: 'Base, alíquotas e deduções',
    keywords:
      'Preço do serviço, alíquotas, deduções, sociedades e regimes locais',
  },
  {
    id: 'CT-081',
    subject: 'Contabilidade Tributária',
    unit: 'ISS',
    title: 'Retenção e responsabilidade',
    keywords:
      'Tomador, prestador, cadastro, retenção, Simples e obrigações de terceiros',
  },
  {
    id: 'CT-082',
    subject: 'Contabilidade Tributária',
    unit: 'ISS',
    title: 'NFS-e e fechamento municipal',
    keywords:
      'Emissão, serviços tomados/prestados, declarações, guias, cancelamento e conciliação',
  },
  {
    id: 'CT-083',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'Contribuições previdenciárias da folha',
    keywords:
      'Segurados, patronal, RAT/GILRAT, terceiros, pró-labore, autônomos e bases',
  },
  {
    id: 'CT-084',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'eSocial e fechamento da folha',
    keywords:
      'Eventos periódicos/não periódicos, bases, totalizadores, fechamento e retificação',
  },
  {
    id: 'CT-085',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'CPRB e regimes previdenciários sobre receita',
    keywords: 'Atividades, receita, exclusões, opção e convivência com folha',
  },
  {
    id: 'CT-086',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'Retenção previdenciária em serviços',
    keywords:
      'Cessão de mão de obra, empreitada, bases, alíquotas, deduções e compensação',
  },
  {
    id: 'CT-087',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'IRRF sobre pagamentos',
    keywords:
      'Trabalho e sem vínculo, serviços, aluguéis, aplicações e códigos de receita',
  },
  {
    id: 'CT-088',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'Retenções de PIS, Cofins e CSLL',
    keywords:
      'Serviços sujeitos, dispensa, base, vencimentos e responsabilidade',
  },
  {
    id: 'CT-089',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'Retenção de ISS',
    keywords:
      'Regras municipais, local, responsabilidade, cadastro e documentos',
  },
  {
    id: 'CT-090',
    subject: 'Contabilidade Tributária',
    unit: 'Folha e retenções',
    title: 'EFD-Reinf, DCTFWeb e MIT',
    keywords:
      'Eventos, fechamentos, integração com eSocial, confissão, créditos, DARF e retificações',
  },
  {
    id: 'CT-091',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'ECD',
    keywords:
      'Obrigatoriedade, livros digitais, plano referencial, validação, assinatura e substituição',
  },
  {
    id: 'CT-092',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'ECF',
    keywords:
      'Obrigatoriedade, blocos, recuperação da ECD, apuração de IRPJ/CSLL e e-Lalur/e-Lacs',
  },
  {
    id: 'CT-093',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'EFD-Contribuições',
    keywords: 'Obrigatoriedade, documentos, apuração, créditos e validações',
  },
  {
    id: 'CT-094',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'EFD ICMS/IPI',
    keywords:
      'Obrigatoriedade, blocos, inventário, apurações, CIAP e registros estaduais',
  },
  {
    id: 'CT-095',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'eSocial, EFD-Reinf e DCTFWeb',
    keywords:
      'Integrações, totalizadores, MIT, débitos, créditos, pagamentos e retificações',
  },
  {
    id: 'CT-096',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'PER/DCOMP Web',
    keywords:
      'Restituição, ressarcimento, reembolso, compensação, créditos e acompanhamento',
  },
  {
    id: 'CT-097',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'Obrigações estaduais e municipais',
    keywords:
      'GIA e equivalentes, declarações de serviços, cadastros, guias e particularidades locais',
  },
  {
    id: 'CT-098',
    subject: 'Contabilidade Tributária',
    unit: 'Obrigações e SPED',
    title: 'Cruzamentos e malhas fiscais',
    keywords:
      'NF-e, SPED, declarações, pagamentos, contabilidade, bancos e cadastros',
  },
  {
    id: 'CT-099',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Fundamentos da Reforma do Consumo',
    keywords:
      'EC 132/2023, LC 214/2025, modelo IVA dual e cronograma normativo',
  },
  {
    id: 'CT-100',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'CBS',
    keywords:
      'Incidência federal, contribuintes, base, créditos, regimes e obrigações',
  },
  {
    id: 'CT-101',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'IBS',
    keywords:
      'Competência compartilhada, destino, Comitê Gestor, base, créditos e distribuição',
  },
  {
    id: 'CT-102',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Imposto Seletivo',
    keywords:
      'Incidência, produtos/serviços alcançados, base, finalidade extrafiscal e vigência',
  },
  {
    id: 'CT-103',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Não cumulatividade, créditos e destino',
    keywords:
      'Crédito financeiro, estornos, ressarcimento, destino e neutralidade',
  },
  {
    id: 'CT-104',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Regimes diferenciados, específicos e favorecidos',
    keywords:
      'Reduções, alíquota zero, regimes setoriais, Zona Franca e tratamentos previstos',
  },
  {
    id: 'CT-105',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Simples Nacional na transição',
    keywords:
      'DAS, opção pelo regime regular de IBS/CBS, créditos e decisão econômica',
  },
  {
    id: 'CT-106',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Documentos, split payment e cashback',
    keywords:
      'Novos campos, recolhimento, devoluções, integração financeira e controles',
  },
  {
    id: 'CT-107',
    subject: 'Contabilidade Tributária',
    unit: 'Reforma tributária',
    title: 'Transição 2026–2033 e convivência de sistemas',
    keywords:
      'Testes, fases, redução/extinção de tributos, alíquotas de referência e impactos nos contratos',
  },
  {
    id: 'CT-108',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Calendário e fechamento fiscal integrado',
    keywords:
      'Obrigações por regime/jurisdição, responsáveis, dependências, evidências e contingência',
  },
  {
    id: 'CT-109',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Cadastro e motor tributário',
    keywords:
      'Produtos, serviços, clientes, fornecedores, NCM, CFOP, CST, regras e versionamento',
  },
  {
    id: 'CT-110',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Revisão e auditoria tributária',
    keywords:
      'Testes substantivos, amostragem, reconciliações, documentação e materialidade',
  },
  {
    id: 'CT-111',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Passivo, certidões e processo tributário',
    keywords:
      'Conta-corrente fiscal, intimações, autos, defesa administrativa, garantias e certidões',
  },
  {
    id: 'CT-112',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Planejamento tributário lícito',
    keywords:
      'Elisão, evasão, simulação, substância, propósito negocial, cenários e documentação',
  },
  {
    id: 'CT-113',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Módulos setoriais e regimes especiais',
    keywords:
      'Comércio exterior, indústria, serviços, construção, imobiliário/RET, agronegócio, terceiro setor e setor financeiro',
  },
  {
    id: 'CT-114',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Tributação internacional',
    keywords:
      'Residência, fonte, tratados, preços de transferência, controladas no exterior e serviços transfronteiriços',
  },
  {
    id: 'CT-115',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Tax technology e dados fiscais',
    keywords:
      'ERP, parametrização, XML, APIs, validações, automação, SQL/BI, segurança e trilha de auditoria',
  },
  {
    id: 'CT-116',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Capstone multirregime',
    keywords:
      'Empresa simulada em Simples, Presumido e Real; documentos, apurações, obrigações, contabilização e decisão',
  },
  {
    id: 'CT-117',
    subject: 'Contabilidade Tributária',
    unit: 'Governança e domínio',
    title: 'Avaliação de domínio em Contabilidade Tributária',
    keywords:
      'Prova teórica, casos, escrituração, apurações, SPED, reforma, defesa oral e auditoria de consistência',
  },
];

const STOP_WORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'entre',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'sem',
  'sobre',
  'um',
  'uma',
  'uns',
  'umas',
]);

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function terms(value: string) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
  );
}

export type ContentSuggestion = ContentReference & {
  score: number;
  reason: string;
};

export function suggestContentLinks(
  title: string,
  body: string,
): ContentSuggestion[] {
  const source = normalize(`${title} ${body}`);
  if (source.length < 3) return [];
  const sourceTerms = terms(source);

  return contentCatalog
    .map((reference) => {
      const titleTerms = terms(reference.title);
      const keywordTerms = terms(reference.keywords);
      let titleHits = 0;
      let keywordHits = 0;
      for (const term of titleTerms) if (sourceTerms.has(term)) titleHits += 1;
      for (const term of keywordTerms)
        if (sourceTerms.has(term)) keywordHits += 1;

      const exactTitle = source.includes(normalize(reference.title));
      const exactId = source.includes(reference.id.toLocaleLowerCase('pt-BR'));
      const score =
        (exactId ? 30 : 0) +
        (exactTitle ? 12 : 0) +
        titleHits * 4 +
        keywordHits;
      const reason = exactId
        ? 'ID citado no texto'
        : exactTitle
          ? 'Título do conteúdo identificado'
          : `${titleHits + keywordHits} termo${titleHits + keywordHits === 1 ? '' : 's'} em comum`;
      return { ...reference, score, reason };
    })
    .filter((reference) => reference.score >= 4)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 5);
}

export function searchContentCatalog(query: string) {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return [];
  return contentCatalog
    .filter((reference) =>
      normalize(
        `${reference.id} ${reference.title} ${reference.unit} ${reference.keywords}`,
      ).includes(normalizedQuery),
    )
    .slice(0, 8);
}
