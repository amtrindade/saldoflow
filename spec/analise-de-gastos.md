# Especificacao: Analise de gastos e receitas

**Status:** Rascunho para avaliacao; sem implementacao  
**Fase:** Especificacao, dentro da PoC de visualizacao  
**Data:** 2026-10-06

## 1. Objetivo

Permitir que a pessoa usuaria analise as despesas do periodo separando compras no cartao de debitos diretos em conta e consulte as receitas que compoem as entradas do mesmo periodo. A analise deve preservar os filtros temporais e as regras atuais de conciliacao, sem contabilizar o pagamento da fatura como uma segunda despesa.

## 2. Contexto atual

- A PoC importa extratos OFX e mantem os lancamentos em memoria no navegador, sem servidor ou banco de dados.
- A visao mensal e o padrao; tambem estao previstos os filtros diario e por intervalo personalizado.
- Os indicadores de receita, despesa, saldo e taxa de poupanca sao calculados para o periodo selecionado.
- Compras no cartao sao despesas na data da compra. O pagamento da fatura e tratado como transferencia/liquidacao, nao como uma despesa adicional.
- Transferencias nao afetam os indicadores de receita e despesa; estornos e devolucoes reduzem as despesas liquidas.

## 3. Escopo

### Incluido

- Filtrar as despesas do periodo por todas as origens, somente cartao ou somente debito direto em conta.
- Filtrar os lancamentos de despesa por categoria e consultar todos os lancamentos da categoria selecionada.
- Apresentar a data de realizacao em coluna propria nas listas de receitas e despesas.
- Atualizar os indicadores e visualizacoes de despesas de acordo com a origem selecionada.
- Consultar os lancamentos de receita do periodo e entender quais entradas compoem a receita total.
- Preservar a combinacao dos filtros de origem e periodo sem alterar as regras de conciliacao.

### Fora do escopo desta entrega

- Persistencia, backend ou sincronizacao entre sessoes.
- Importacao de novos formatos, incluindo CSV, TXT ou PDF.
- Edicao de lancamentos, alteracao manual de classificacao ou categorizacao automatica nova.
- Novas regras de conciliacao ou de identificacao de transacoes.
- Filtro adicional das receitas por categoria ou origem; nesta entrega, a visao apresenta todas as receitas do periodo.

## 4. Jornadas e criterios de aceitacao

### 4.1 Filtrar despesas pela origem (Prioridade P1)

Como pessoa usuaria do SaldoFlow, quero filtrar as despesas do periodo entre compras no cartao e debitos diretos em conta, para entender de onde vem meus gastos sem misturar o pagamento da fatura com as compras.

**Valor:** distinguir os gastos do cartao dos debitos diretos permite interpretar a composicao das despesas e comparar as origens.

**Teste independente:** carregar despesas de cartao, debitos diretos, receitas e uma liquidacao de fatura; selecionar cada origem e conferir os lancamentos e totais apresentados.

**Cenarios:**

1. **Dado** um periodo com despesas de cartao e debitos diretos em conta, **quando** a pessoa seleciona “Todas”, **entao** a analise apresenta ambas as origens e o total das despesas validas do periodo.
2. **Dado** que “Todas” esta selecionado, **quando** a pessoa seleciona “Cartao”, **entao** a analise de despesas apresenta somente compras no cartao e atualiza os indicadores e visualizacoes de despesas correspondentes.
3. **Dado** que “Todas” esta selecionado, **quando** a pessoa seleciona “Debito em conta”, **entao** a analise apresenta somente os debitos diretos e atualiza os indicadores e visualizacoes de despesas correspondentes.
4. **Dado** um debito de pagamento da fatura na conta e a liquidacao correspondente no extrato do cartao, **quando** qualquer origem de despesa e analisada, **entao** o pagamento da fatura nao aparece como uma segunda despesa.
5. **Dado** um filtro temporal ativo, **quando** a pessoa altera a origem da despesa, **entao** o periodo selecionado permanece inalterado.
6. **Dado** um periodo com mais de seis despesas de uma categoria, **quando** a pessoa seleciona essa categoria na secao de despesas, **entao** todos os lancamentos da categoria sao listados, respeitando os filtros ativos de periodo e origem.

### 4.2 Consultar receitas e entender as entradas (Prioridade P1)

Como pessoa usuaria, quero consultar todas as receitas do periodo e seus lancamentos individuais, para entender quais entradas compoem a receita total.

**Valor:** a leitura das entradas completa a analise do fluxo financeiro e permite interpretar receita, saldo e taxa de poupanca junto as despesas.

**Teste independente:** carregar receitas de diferentes datas e descricoes junto a despesas; selecionar um periodo e conferir a lista de receitas e sua soma.

**Cenarios:**

1. **Dado** um periodo com receitas e despesas, **quando** a pessoa consulta as entradas, **entao** sao apresentados todos os lancamentos classificados como receita dentro do periodo, sem incluir despesas ou transferencias.
2. **Dado** que a lista de entradas esta visivel, **quando** a pessoa a consulta, **entao** cada lancamento permite identificar ao menos a data, a descricao e o valor da entrada.
3. **Dado** um filtro temporal ativo, **quando** a pessoa altera o periodo, **entao** a lista e o total das receitas refletem somente as entradas do novo periodo.
4. **Dado** um periodo sem receitas, **quando** a pessoa consulta as entradas, **entao** o sistema informa que nao ha receitas no periodo e apresenta o total como zero, sem exibir lancamentos de despesas.

## 5. Requisitos funcionais

- **REQ-001**: A analise de despesas MUST oferecer as opcoes “Todas”, “Cartao” e “Debito em conta”, iniciando em “Todas”.
- **REQ-002**: Ao selecionar uma origem, o sistema MUST limitar a essa origem os lancamentos de despesa exibidos e recalcular os valores e visualizacoes de despesas correspondentes.
- **REQ-003**: A selecao da origem MUST poder ser combinada com os filtros temporais existentes — diario, mensal e intervalo personalizado — sem alterar o periodo escolhido.
- **REQ-004**: “Cartao” MUST incluir os gastos individuais de compras no cartao; “Debito em conta” MUST incluir despesas debitadas diretamente da conta, sem incluir pagamento de fatura como despesa.
- **REQ-005**: O filtro de origem das despesas MUST NOT remover receitas da visao de receitas nem modificar seus valores.
- **REQ-006**: O sistema MUST permitir consultar todos os lancamentos classificados como receita no periodo selecionado, em uma visao que nao inclua despesas nem transferencias.
- **REQ-007**: Cada receita apresentada MUST informar data, descricao e valor; quando houver categoria ou origem disponivel, o sistema MUST apresenta-la como contexto adicional.
- **REQ-008**: O total das receitas exibido MUST corresponder a soma dos lancamentos de receita apresentados para o periodo selecionado.
- **REQ-009**: Quando nao houver despesas ou receitas que atendam aos filtros, o sistema MUST apresentar um estado vazio apropriado e o total correspondente igual a zero.
- **REQ-010**: A aplicacao MUST preservar as regras vigentes de identificacao/deduplicacao, tratamento de estornos e exclusao de transferencias e liquidacoes de fatura dos totais de receita e despesa.
- **REQ-011**: A secao de despesas MUST oferecer um filtro de categoria com opcao para todas as categorias; ao selecionar uma categoria, MUST listar todos os lancamentos de despesa correspondentes no periodo e origem ativos, sem limite de quantidade.
- **REQ-012**: As listas de receitas e despesas MUST apresentar a data de realizacao em uma coluna propria, separada da descricao do lancamento.

## 6. Casos de borda

- O periodo nao contem transacoes ou contem despesas, mas nenhuma receita: apresentar estado vazio especifico para a visao consultada e valores zerados.
- Uma transacao esta classificada como transferencia ou liquidacao de fatura: nao trata-la como receita nem como despesa.
- O conjunto contem estornos ou devolucoes: preservar a regra vigente de reducao das despesas liquidas e nao apresentar esses valores como receitas.
- Um lancamento nao possui categoria reconhecida: inclui-lo na origem e no total pertinentes; nao omiti-lo por falta de categoria.
- Ao mudar o filtro de origem das despesas, nao alterar nem ocultar as receitas do periodo.

## 7. Entidades-chave

- **Lancamento financeiro**: movimentacao importada com data, descricao, valor, classificacao (receita, despesa ou transferencia), origem e, quando disponiveis, categoria e identificador.
- **Origem da despesa**: compra no cartao de credito ou debito direto em conta; liquidacao de fatura e transferencia, nao uma terceira origem de despesa.
- **Periodo de analise**: intervalo temporal selecionado que delimita os lancamentos considerados nas visoes e indicadores.
- **Analise de receitas**: conjunto das receitas do periodo, seus atributos legiveis e o total correspondente.

## 8. Criterios de sucesso

- **SC-001**: Em todos os casos de teste com dados conhecidos, cada uma das tres opcoes de origem apresenta exatamente os lancamentos e o total esperado, sem duplicar pagamentos de fatura.
- **SC-002**: A pessoa usuaria consegue mudar entre “Todas”, “Cartao” e “Debito em conta” em no maximo duas acoes, preservando o periodo ativo.
- **SC-003**: Em todos os casos de teste, a soma das entradas listadas e igual ao total de receitas mostrado para o mesmo periodo.
- **SC-004**: Em um teste com pelo menos cinco pessoas usuarias, ao menos quatro identificam corretamente as receitas que compoem o total — data, descricao e valor — sem consultar os extratos novamente.
- **SC-005**: Com ate 5.000 lancamentos carregados, a atualizacao da analise apos mudar um filtro termina em ate 1 segundo em um ambiente de uso representativo da PoC.
- **SC-006**: Para qualquer categoria selecionada, todos os lancamentos de despesa dessa categoria que atendam aos filtros ativos sao apresentados, inclusive quando houver mais de seis resultados.
- **SC-007**: Em ambas as listas, a data de realizacao aparece sob seu proprio cabecalho de coluna e e legivel para cada lancamento.

## 9. Premissas

- Os filtros temporais existentes continuam a delimitar todas as visoes; a visao mensal permanece como padrao.
- O filtro de origem e aplicado a analise de despesas. A visao de receitas inclui todas as receitas do periodo, sem filtro adicional por tipo de entrada nesta entrega.
- A classificacao de origem e de receita/despesa usa as informacoes ja disponiveis nos lancamentos importados e nas regras atuais da PoC.
- Os dados permanecem em memoria no navegador; esta funcionalidade nao introduz armazenamento persistente.
