# Especificacao: Viabilidade dos dashboards de oportunidades e tendencias

**Status:** Em implementacao inicial na branch `feature/spec005-dashboards`
**Fase:** PoC de visualizacao
**Data:** 2026-10-09

## 1. Objetivo

Avaliar e especificar a inclusao de dois dashboards analiticos no SaldoFlow:

1. **Oportunidades de Economia & Gargalos**, para destacar despesas relevantes, separar gastos essenciais dos discricionarios em uma distribuicao visual (treemap ou dispersao) e identificar possiveis recorrencias.
2. **Evolucao Temporal e Tendencias**, para acompanhar o fluxo acumulado e comparar despesas por categoria ao longo de varios meses.

Esta SPEC define o comportamento esperado e os criterios para validar a viabilidade com os lancamentos OFX ja importados. A implementacao inicial dos dashboards foi iniciada; persistencia, backend e novos formatos de importacao continuam fora do escopo.

## Scope Baseline

- **Metodo de descoberta:** revisao do README, da SPEC de analise de gastos existente e das definicoes atuais de transacao, metricas e componentes do dashboard.
- **Total de itens descobertos:** 5 visoes solicitadas.
- **Itens no escopo desta avaliacao:** 5 — ranking das maiores despesas, distribuicao por essencialidade, monitor de recorrencias, evolucao do fluxo acumulado e comparativo mensal por categoria.
- **Justificativa:** as cinco visoes foram explicitamente solicitadas; cada uma foi avaliada quanto a dados disponiveis e dependencias. A avaliacao nao inclui implementar as visoes.

## 2. Parecer preliminar de viabilidade

**Conclusao: viavel para uma validacao incremental na PoC, com ressalvas de qualidade e cobertura dos dados.**

| Visao solicitada | Viabilidade preliminar | Dependencias e limitacoes |
| --- | --- | --- |
| Ranking das 10 maiores despesas | Alta | Os lancamentos ja possuem data, descricao, categoria, origem, tipo e valor. E necessario definir o tratamento de estornos e limitar a lista as despesas liquidas validas do periodo. |
| Essenciais vs. discricionarios (treemap/dispersao) | Parcial | A classificacao atual por categoria/descricao nao informa se um gasto e essencial. E necessario validar uma taxonomia inicial e manter uma opcao “Nao classificado”; nao presumir que a categoria, sozinha, representa a intencao da pessoa. O treemap e a opcao inicial mais direta para comparar participacoes; dispersao depende de eixos adicionais com significado validado. |
| Monitor de assinaturas e recorrencias | Parcial | A recorrencia pode ser estimada por descricao, valor e datas repetidas, mas os dados atuais nao confirmam contratos ou periodicidade. Os resultados devem ser apresentados como candidatos, com evidencias, e nao como assinaturas confirmadas; o custo anual agregado tambem sera estimado. |
| Evolucao do saldo acumulado | Parcial | E possivel somar receitas menos despesas ao longo do historico importado. Sem saldo inicial ou saldo de abertura, isso representa fluxo liquido acumulado no intervalo, nao o saldo real da conta nem a reserva total. |
| Comparativo mensal por categoria | Alta, condicionada ao historico | E possivel agregar despesas por categoria e mes se os extratos importados cobrirem os meses comparados. A PoC mantem os dados somente na sessao e nao pode comparar periodos que nao foram carregados. |

### Recomendacao

Validar primeiro o ranking e o comparativo mensal com dados importados, mantendo as regras existentes de conciliacao. Em seguida, fazer uma avaliacao exploratoria da taxonomia essencial/discricionario e da deteccao de recorrencias; ambas devem expor classificacoes incertas para revisao. O grafico acumulado deve ser nomeado como fluxo liquido acumulado enquanto nao houver saldo inicial confiavel.

## 3. Contexto atual

- A aplicacao e uma PoC local que processa extratos OFX no navegador e mantem as transacoes em memoria durante a sessao.
- Cada transacao normalizada contem data, descricao, categoria, origem (conta ou cartao), tipo e valor em centavos; `FITID` pode estar disponivel.
- O painel existente calcula receita, despesa liquida, saldo do periodo e taxa de poupanca, e oferece visoes de despesas por categoria, fluxo diario, origem dos gastos e listas de transacoes.
- Os filtros temporais atuais sao diario, mensal e intervalo personalizado; o padrao e mensal.
- O pagamento da fatura e tratado como transferencia/liquidacao, nao como uma segunda despesa. Estornos e devolucoes reduzem as despesas liquidas; transferencias nao compoem receita ou despesa.
- A categorizacao atual e heuristica. Nao ha atributo explicito de essencialidade, confirmacao de recorrencia, saldo inicial ou persistencia entre sessoes.

## 4. Escopo

### Incluido nesta avaliacao

- Ranking das 10 maiores despesas individuais validas do periodo.
- Distribuicao visual (treemap ou dispersao) de despesas em essenciais, discricionarias e nao classificadas.
- Identificacao de candidatos a cobrancas recorrentes, com estimativas anualizadas individuais e agregadas.
- Evolucao do fluxo liquido acumulado no historico disponivel.
- Comparacao mensal das despesas de uma categoria selecionada.
- Validacao de cobertura temporal, qualidade das classificacoes e comportamento com dados incompletos.
- Preservacao dos filtros temporais e das regras atuais de despesas, estornos, transferencias e pagamentos de fatura.

### Fora do escopo

- Saldo bancario real, patrimonio ou reserva total sem um saldo de abertura validado.
- Confirmacao automatica de contratos, cancelamento de assinaturas, previsao de cobrancas futuras ou recomendacoes financeiras personalizadas.
- Classificacao automatica definitiva de essencialidade, aprendizado de maquina ou alteracao manual permanente de categorias.
- Importacao de CSV, TXT, PDF ou outros formatos; backend, banco de dados, sincronizacao e persistencia entre sessoes.
- Metas orcamentarias, alertas, notificacoes ou acoes para reduzir/cancelar gastos.

## 5. Escenarios de usuario e testes

### 5.1 Identificar os maiores gastos (Prioridade P1)

Como pessoa usuaria, quero ver as 10 maiores despesas individuais do periodo para localizar rapidamente os lancamentos que mais pesam no meu orcamento.

**Por que esta prioridade:** e uma leitura direta dos dados existentes, com baixa dependencia de novas classificacoes, e permite validar valor rapidamente.

**Teste independente:** importar ou carregar transacoes de varios tipos e origens em um periodo; conferir o ranking contra uma ordenacao independente das despesas elegiveis.

**Cenarios de aceitacao:**

1. **Dado** um periodo com mais de 10 despesas validas, **quando** a pessoa consulta o ranking, **entao** sao exibidas exatamente as 10 maiores em ordem decrescente de valor absoluto, com data, descricao, categoria, origem e valor.
2. **Dado** um periodo com 10 ou menos despesas validas, **quando** a pessoa consulta o ranking, **entao** sao exibidas todas as despesas validas existentes.
3. **Dado** que o periodo inclui pagamentos de fatura, transferencias e estornos, **quando** o ranking e calculado, **entao** pagamentos de fatura e transferencias nao aparecem como despesas individuais e os totais agregados continuam seguindo o tratamento liquido vigente para estornos.
4. **Dado** que nao ha despesas validas no periodo, **quando** a pessoa consulta o ranking, **entao** e exibido um estado vazio informativo.

### 5.2 Entender a composicao essencial e discricionaria (Prioridade P2)

Como pessoa usuaria, quero distinguir gastos essenciais, discricionarios e ainda nao classificados, para identificar areas que merecem revisao sem tratar uma inferencia como fato.

**Por que esta prioridade:** a visao pode orientar decisoes, mas depende de uma taxonomia que ainda nao existe e cuja qualidade precisa ser validada.

**Teste independente:** usar categorias e descricoes variadas, verificar os totais por grupo e confirmar que itens sem classificacao nao sao atribuidos silenciosamente a um grupo.

**Cenarios de aceitacao:**

1. **Dado** que as despesas do periodo possuem classificacao de essencialidade validada, **quando** a pessoa consulta a distribuicao, **entao** totais e proporcoes de essenciais e discricionarias correspondem as despesas liquidas elegiveis.
2. **Dado** um lancamento sem classificacao de essencialidade confiavel, **quando** a distribuicao e exibida, **entao** o lancamento fica no grupo “Nao classificado” e nao e omitido dos totais.
3. **Dado** que a pessoa consulta um grupo da distribuicao, **quando** seleciona esse grupo, **entao** pode identificar os lancamentos que compoem o total apresentado.

### 5.3 Revisar candidatos a cobrancas recorrentes (Prioridade P2)

Como pessoa usuaria, quero encontrar cobrancas que parecem se repetir e ver uma estimativa anual, para decidir quais compromissos merecem revisao.

**Por que esta prioridade:** a estimativa tem potencial para revelar gastos pouco percebidos, mas descricao e repeticao nao provam que exista uma assinatura ativa.

**Teste independente:** comparar candidatos gerados a partir de transacoes com padroes conhecidos de repeticao, cobrancas avulsas semelhantes e pagamentos de fatura.

**Cenarios de aceitacao:**

1. **Dado** um historico com cobrancas de descricao e periodicidade semelhantes, **quando** a pessoa consulta o monitor, **entao** os candidatos mostram descricao agrupada, ocorrencias, datas observadas, valores e criterio/evidencia da recorrencia.
2. **Dado** um candidato com valor mensal estimavel, **quando** o custo anual e apresentado, **entao** a estimativa corresponde ao valor mensal observado multiplicado por 12 e e identificada como estimativa, nao como gasto confirmado para o ano.
3. **Dado** mais de um candidato com periodicidade estimavel, **quando** o monitor e apresentado, **entao** exibe tambem o custo anual agregado estimado, calculado pela soma das estimativas individuais.
4. **Dado** uma cobranca isolada ou um padrao insuficiente para inferir periodicidade, **quando** o monitor e calculado, **entao** a transacao nao e apresentada como assinatura confirmada.
5. **Dado** pagamentos de fatura ou liquidacoes, **quando** os candidatos sao identificados, **entao** esses lancamentos nao sao tratados como assinaturas nem duplicam compras do cartao.

### 5.4 Acompanhar a evolucao temporal do fluxo liquido (Prioridade P1)

Como pessoa usuaria, quero acompanhar o fluxo liquido acumulado nos ultimos meses, para entender se as entradas superam as saidas ao longo do intervalo analisado.

**Por que esta prioridade:** revela tendencias que uma fotografia mensal nao mostra, reutilizando receitas e despesas historicas ja importadas.

**Teste independente:** fornecer entradas e saidas em diferentes datas, recalcular manualmente os valores acumulados e conferir os pontos do grafico para cada janela temporal.

**Cenarios de aceitacao:**

1. **Dado** um historico que cobre a janela selecionada, **quando** a pessoa escolhe “Ultimos 3”, “Ultimos 6” ou “Ultimos 12 meses”, **entao** o grafico apresenta a soma acumulada de receitas menos despesas validas na granularidade temporal exibida.
2. **Dado** um intervalo sem lancamentos entre dois periodos com atividade, **quando** o fluxo acumulado e exibido, **entao** o valor acumulado permanece constante nesse intervalo, sem ser reiniciado.
3. **Dado** que nao existe saldo inicial validado, **quando** a pessoa consulta a evolucao, **entao** o titulo e os rotulos identificam o resultado como fluxo liquido acumulado no intervalo, sem afirma-lo como saldo bancario ou reserva total.
4. **Dado** que o historico importado cobre apenas parte da janela selecionada, **quando** a pessoa escolhe essa janela, **entao** a cobertura disponivel e informada e os periodos sem dados nao sao apresentados como saldo zero confirmado.

### 5.5 Comparar uma categoria entre meses (Prioridade P2)

Como pessoa usuaria, quero comparar o gasto de uma categoria mes a mes, para avaliar a evolucao dos meus habitos e de eventuais metas pessoais.

**Por que esta prioridade:** complementa a leitura de fluxo total e permite localizar tendencias especificas, desde que os extratos contenham meses comparaveis.

**Teste independente:** carregar despesas de varias categorias em meses diferentes e comparar os valores mensais agregados com uma apuracao manual.

**Cenarios de aceitacao:**

1. **Dado** que existem despesas da categoria selecionada em varios meses da janela, **quando** a pessoa abre a comparacao, **entao** cada mes e apresentado como uma serie distinta e com valores correspondentes as despesas liquidas da categoria.
2. **Dado** que a categoria nao possui lancamentos em um mes cuja cobertura foi importada, **quando** o comparativo e exibido, **entao** esse mes aparece com valor zero.
3. **Dado** que a cobertura de um mes nao foi importada, **quando** o comparativo e exibido, **entao** o mes e identificado como sem dados, e nao como gasto zero.
4. **Dado** uma despesa reembolsada ou estornada, **quando** o total mensal e calculado, **entao** o valor reduz a despesa liquida da categoria conforme as regras vigentes.

### Casos de borda

- Despesas de mesmo valor devem manter ordem estavel e continuar identificaveis por data/descricao/origem.
- Transacoes sem categoria devem continuar elegiveis para ranking e totais, aparecendo como “Sem categoria” quando necessario.
- Valores devolvidos/estornados nao devem produzir despesa negativa no ranking; aplicar o tratamento liquido vigente e excluir totais nao positivos.
- Variacoes pequenas de descricao, valores parcelados ou datas irregulares podem gerar falsos negativos ou positivos no monitor de recorrencias; expor incerteza e evidencia.
- Um historico parcial ou com meses faltantes deve ser distinguido de um mes importado sem movimentacao.
- Um periodo sem receita deve resultar em fluxo acumulado calculavel a partir das despesas, sem divisao por zero.
- Datas de compra no cartao, liquidacoes de fatura e transacoes de conta devem respeitar a data e classificacao ja normalizadas pelo importador.

## 6. Requisitos funcionais

- **REQ-001**: O sistema MUST oferecer um ranking das maiores despesas individuais do periodo, limitado a 10 itens quando houver mais de 10 despesas elegiveis.
- **REQ-002**: Cada item do ranking MUST apresentar data, descricao, categoria, origem e valor, e o ranking MUST ordenar do maior para o menor valor de despesa.
- **REQ-003**: O ranking MUST respeitar os filtros temporais ativos e excluir transferencias e liquidacoes de fatura, preservando o tratamento de estornos e devolucoes vigente.
- **REQ-004**: A distribuicao por essencialidade MUST distinguir ao menos “Essencial”, “Discricionario” e “Nao classificado”.
- **REQ-005**: O sistema MUST incluir despesas sem classificacao de essencialidade na distribuicao como “Nao classificado”, sem atribuir automaticamente uma intencao nao confirmada.
- **REQ-006**: A distribuicao de essencialidade MUST permitir identificar os lancamentos que compoem cada total apresentado.
- **REQ-007**: O monitor MUST apresentar cobrancas repetidas como candidatos a recorrencia, informando as ocorrencias e evidencias temporais/de valor usadas na identificacao.
- **REQ-008**: O custo anualizado de uma recorrencia MUST ser rotulado como estimativa e MUST identificar o valor e a periodicidade observados que a originaram.
- **REQ-009**: O monitor MUST apresentar o custo anual estimado de cada candidato e o total anualizado estimado de todos os candidatos elegiveis; calculos com periodicidade ou valor insuficientes MUST ser identificados como indisponiveis, nao como zero.
- **REQ-010**: O monitor MUST NOT afirmar que uma cobranca e assinatura confirmada sem confirmacao explicita; pagamentos de fatura, transferencias e liquidacoes MUST ser excluidos da deteccao.
- **REQ-011**: Os filtros temporais MUST incluir janelas de “Ultimos 3 meses”, “Ultimos 6 meses” e “Ultimos 12 meses”, mantendo disponiveis os modos atuais diario, mensal e personalizado.
- **REQ-012**: O grafico de evolucao MUST calcular o fluxo liquido acumulado como receitas menos despesas elegiveis, respeitando estornos, transferencias e liquidacoes de fatura.
- **REQ-013**: Na ausencia de saldo inicial validado, os rotulos da evolucao MUST descrever fluxo liquido acumulado no intervalo e MUST NOT afirmar que representam saldo bancario ou reserva total.
- **REQ-014**: As visoes historicas MUST informar a cobertura temporal dos dados importados e distinguir um periodo coberto sem movimentacao de um periodo sem dados importados.
- **REQ-015**: O comparativo de categorias MUST permitir selecionar uma categoria e apresentar seus totais liquidos por mes na janela historica selecionada.
- **REQ-016**: Todas as novas visoes MUST preservar a regra de que compras no cartao sao despesas na data da compra e o pagamento da fatura nao gera uma segunda despesa.
- **REQ-017**: Quando nao houver dados suficientes para uma visao, o sistema MUST apresentar um estado vazio ou de cobertura insuficiente que explique a limitacao sem inventar valores.

## 7. Entidades principais

- **Transacao financeira**: lancamento importado com data, descricao, categoria, origem, tipo, valor e identificador quando disponivel.
- **Classificacao de essencialidade**: classificacao de despesa como essencial, discricionaria ou nao classificada; requer criterio validado antes de ser tratada como confiavel.
- **Candidato a recorrencia**: agrupamento inferido de cobrancas, com ocorrencias, datas, valores, periodicidade estimada e evidencia/certeza.
- **Janela historica**: intervalo de 3, 6 ou 12 meses selecionado para analise, junto da indicacao de cobertura importada.
- **Ponto de fluxo acumulado**: valor liquido acumulado em uma data ou mes, calculado a partir das transacoes elegiveis no intervalo.
- **Total mensal por categoria**: soma liquida de despesas de uma categoria em um mes coberto pelos dados importados.

## 8. Premissas e decisoes pendentes

- “Ultimos 3/6/12 meses” significa uma janela de meses-calendario que inclui o mes atual, ainda que incompleto. Confirmar a convencao antes de implementar.
- A pessoa usuaria valida a taxonomia inicial de essencialidade e as regras de classificacao antes de usar a distribuicao para decisao financeira.
- A deteccao de recorrencias e heuristica exploratoria; correspondencia de descricao ou periodicidade nao prova um contrato recorrente.
- O fluxo acumulado comeca em zero no inicio do intervalo analisado quando nao ha saldo inicial. Nao e uma medida patrimonial.
- As analises dependem dos meses cobertos pelos OFX carregados na sessao atual. Dados ausentes nao podem ser presumidos como zero.
- A classificacao inicial de essencialidade e a deteccao de recorrencias sao indicativas; a pessoa usuaria deve validar essas regras antes de tomar decisoes financeiras com base nelas.
- Na primeira implementacao, a essencialidade e inferida apenas de termos explicitos na descricao; mercado/supermercado, aluguel, contas de energia/agua/gas e internet residencial sao classificados como essenciais. Restaurantes, cafes, cinema, streaming, academia e livraria sao classificados como discricionarios. Todo o restante permanece nao classificado.
- Um candidato a recorrencia mensal requer ao menos duas despesas da mesma origem e descricao normalizada, intervalo de 25 a 35 dias entre cobrancas e variacao maxima de 20% entre o menor e o maior valor observado. A estimativa anual multiplica a media mensal observada por 12; sao criterios heurísticos, nao confirmacao de contrato.
- “Ultimos 3/6/12 meses” usa meses-calendario incluindo o mes atual, que pode estar incompleto. Meses sem cobertura completa explicitada pelos extratos nao sao interpretados como zero confirmado.

## 9. Criterios de sucesso e viabilidade

- **SC-001**: Para qualquer periodo de teste com pelo menos 10 despesas elegiveis, os 10 itens do ranking correspondem aos maiores valores apurados independentemente e aparecem em ordem decrescente, sem pagamentos de fatura ou transferencias.
- **SC-002**: Em um conjunto de teste rotulado, 100% das despesas sem classificacao de essencialidade ficam visiveis como “Nao classificado”; nenhuma e descartada do total.
- **SC-003**: Na avaliacao de recorrencias, cada candidato apresentado exibe ao menos duas ocorrencias observadas e os dados suficientes para a pessoa revisar a inferencia antes de trata-la como assinatura.
- **SC-004**: Para os meses cobertos, os valores de fluxo acumulado e comparativo por categoria coincidem com a apuracao independente, incluindo estornos e excluindo liquidacoes e transferencias.
- **SC-005**: Nos testes com meses faltantes, nenhum periodo sem cobertura e exibido como zero confirmado.
- **SC-006**: Em um teste de usabilidade com 5 pessoas, pelo menos 4 conseguem localizar o maior gasto, identificar um candidato a recorrencia e explicar corretamente que o fluxo acumulado nao e o saldo bancario real, sem ajuda.
- **SC-007**: A avaliacao de viabilidade registra a cobertura temporal dos dados de exemplo, falsos positivos e falsos negativos da classificacao de essencialidade e da deteccao de recorrencias antes de recomendar a implementacao dessas duas visoes.
- **SC-008**: O custo anualizado agregado apresentado e igual a soma das estimativas individuais elegiveis, e candidatos sem periodicidade ou valor suficientes nao contribuem como zero silencioso.
