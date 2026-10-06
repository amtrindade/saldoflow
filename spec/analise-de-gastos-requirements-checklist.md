# Checklist de qualidade — Análise de gastos

## Cobertura dos requisitos

- [x] Todos os requisitos usam IDs `REQ-XXX`.
- [x] IDs são únicos e sequenciais.
- [x] Despesas por cartão e débito em conta estão contempladas.
- [x] Consulta de receitas e detalhamento das entradas estão contemplados.
- [x] Filtro de despesas por categoria lista todos os lançamentos correspondentes.
- [x] Data de realização aparece em coluna própria nas listas de receitas e despesas.
- [x] Regras existentes de período, transferências, fatura e estornos foram preservadas.

## Testabilidade

- [x] Cada requisito funcional descreve um comportamento verificável.
- [x] As jornadas têm cenários de aceitação no formato Dado/Quando/Então.
- [x] Estados sem resultados estão especificados.

## Completude

- [x] Escopo, jornadas priorizadas e critérios de sucesso estão definidos.
- [x] As jornadas podem ser testadas independentemente.
- [x] Critérios de sucesso são mensuráveis e focados no resultado da pessoa usuária.
- [x] Premissas relevantes estão documentadas.

## Alinhamento à PoC

- [x] A especificação limita-se à análise dos dados já importados em memória.
- [x] Não adiciona backend, persistência ou formatos de importação.
