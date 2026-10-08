// Apolo (DEC-014): motor de avaliação determinístico do Atlas — sem IA
// externa, hardcoded. Este módulo é a fundação (APO-01): tipos, ciclo de vida,
// registro de geradores de molde e acesso a dados. A seleção de tema por
// aluno, a montagem de questionários e a emissão de nota (DEC-016) entram em
// cards futuros da escada do Apolo.
export * from './types.js';
export * from './generators.js';
export * from './store.js';
