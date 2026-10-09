# Checklist de qualidade — Viabilidade dos dashboards de oportunidades e tendencias

## Cobertura dos requisitos

- [x] Todos os requisitos usam IDs `REQ-XXX`, unicos e sequenciais.
- [x] O ranking das 10 maiores despesas esta especificado, incluindo elegibilidade, ordenacao e ausencia de resultados.
- [x] A separacao entre essenciais, discricionarias e nao classificadas esta especificada sem presumir intencao.
- [x] O monitor de recorrencias distingue candidatos heurísticos de assinaturas confirmadas e rotula custos anualizados como estimativas.
- [x] A evolucao acumulada distingue fluxo liquido de saldo bancario/reserva real quando nao ha saldo inicial.
- [x] O comparativo mensal por categoria especifica cobertura completa, ausencia de movimentacao e falta de dados.
- [x] Filtros e regras existentes de conciliacao, estorno, transferencia e pagamento de fatura estao preservados.

## Testabilidade

- [x] Cada requisito funcional descreve um comportamento verificavel.
- [x] As jornadas possuem cenarios de aceitacao no formato Dado/Quando/Entao.
- [x] Os criterios de sucesso incluem verificacao quantitativa e teste de compreensao por pessoas usuarias.
- [x] Os casos de borda para dados ausentes, incompletos ou ambíguos estao descritos.

## Completude e viabilidade

- [x] Objetivo, parecer preliminar, contexto, escopo e recomendacao estao definidos.
- [x] Dependencias de dados e limitacoes atuais estao documentadas por visualizacao.
- [x] Premissas e decisoes que precisam de aprovacao antes da implementacao estao identificadas.
- [x] Nenhuma implementacao, persistencia ou novo importador e assumido como parte desta SPEC.
