# Especificacao: Persistencia de importacoes OFX com Supabase

**Status:** Rascunho para avaliacao; nenhuma decisao de produto aprovada  
**Fase:** Especificacao, sem implementacao  
**Data da pesquisa:** 2026-10-06

## 1. Objetivo

Definir o escopo e avaliar a viabilidade de persistir as transacoes extraidas dos arquivos OFX em uma base Supabase, mantendo o processamento do arquivo no navegador e permitindo que os dados sobrevivam a recargas e novas sessoes.

Esta especificacao tambem identifica dependencias de seguranca e decisoes que precisam ser aprovadas antes da implementacao.

## 2. Contexto atual

- A aplicacao e React com Vite e processa OFX SGML no navegador.
- `parseOfxText` normaliza cada lancamento para data, descricao, categoria, origem, tipo, valor em centavos e `FITID` quando disponivel.
- A identificacao local usa `FITID` ou uma combinacao deterministica de origem, data, valor, descricao normalizada e tipo.
- A uniao de lancamentos remove IDs repetidos, mas os dados permanecem apenas na memoria da sessao.
- Nao ha autenticacao, servidor de aplicacao ou banco de dados atualmente.
- As regras existentes excluem pagamentos de fatura das despesas, preservam estornos e nao contam transferencias como receita/despesa.

## 3. Decisao arquitetural em avaliacao

**Recomendacao:** Supabase e viavel para esta etapa. O cliente oficial pode ser usado por uma aplicacao React no navegador e o Postgres oferece persistencia relacional. Os arquivos continuam sendo decodificados e interpretados localmente; a aplicacao envia somente metadados da importacao e transacoes normalizadas.

**Pre-requisito de seguranca:** implementar autenticacao e politicas RLS antes de permitir que dados financeiros reais sejam gravados ou consultados pela aplicacao publicada. E possivel preparar e testar o esquema isoladamente antes disso, mas nao se deve expor tabelas privadas a clientes anonimos. A chave publica do cliente nao substitui RLS; chaves secretas nunca devem ir para o browser.

Uma API/backend proprio nao parece necessario para o primeiro ciclo, desde que o acesso seja limitado por usuario via Supabase Auth + RLS, as credenciais administrativas fiquem fora do cliente e as regras de importacao sejam validadas no banco.

## 4. Escopo

### Incluido

- Persistir lancamentos normalizados de OFX de conta corrente e cartao.
- Persistir o historico minimo de cada importacao, permitindo identificar quando e quantos lancamentos foram processados.
- Evitar duplicacao ao importar o mesmo arquivo novamente ou importar transacoes sobrepostas.
- Restaurar do banco as transacoes do usuario para alimentar o dashboard e seus filtros atuais.
- Preservar as regras de classificacao de despesa, receita, estorno e transferencia.
- Garantir isolamento dos dados por usuario autenticado.

### Fora do escopo desta entrega

- Importadores de CSV, TXT ou PDF.
- Armazenar o arquivo OFX original no Supabase Storage. A recomendacao inicial e nao reter o arquivo; guardar apenas metadados e lancamentos normalizados.
- Multiusuario compartilhado, contas familiares, conciliacao automatica entre transacoes ou categorizacao por aprendizado de maquina.
- Migrar dados demonstrativos ou dados da sessao atual: hoje eles nao constituem uma base persistida do usuario.

## 5. Cenarios de usuario

### Cenario 1: primeira importacao (P1)

**Dado** que a pessoa esta autenticada e escolhe um OFX valido  
**Quando** a aplicacao termina a leitura e a importacao e confirmada  
**Entao** os lancamentos normalizados ficam persistidos e aparecem no dashboard apos atualizar a pagina.

### Cenario 2: arquivo repetido ou sobreposto (P1)

**Dado** que ja existem lancamentos importados para aquela pessoa  
**Quando** ela importa novamente o mesmo arquivo ou um periodo parcialmente coincidente  
**Entao** nenhum lancamento e duplicado e o resultado informa quantos foram novos e quantos ja existiam.

### Cenario 3: isolamento entre usuarios (P1)

**Dado** que dois usuarios autenticados possuem dados no mesmo projeto  
**Quando** cada um consulta, grava, altera ou remove dados  
**Entao** cada usuario so pode acessar os proprios registros.

### Cenario 4: falha durante a persistencia (P1)

**Dado** um arquivo validado e uma indisponibilidade ou rejeicao do banco  
**Quando** a gravacao nao puder ser concluida  
**Entao** a aplicacao informa que a importacao nao foi confirmada e nao deixa um lote parcialmente persistido.

## 6. Requisitos funcionais

- **REQ-001:** Somente uma sessao autenticada pode ler, inserir, alterar ou apagar importacoes e transacoes privadas.
- **REQ-002:** Cada importacao deve registrar usuario proprietario, origem (conta ou cartao), nome original do arquivo quando disponivel, data/hora de importacao, quantidade de registros processados e resultado da operacao. O conteudo binario do arquivo nao deve ser retido no escopo inicial.
- **REQ-003:** Cada transacao persistida deve preservar data, descricao, categoria, origem, tipo, valor em centavos e `FITID` quando fornecido.
- **REQ-004:** A identificacao persistente deve ser deterministica. Deve preferir o `FITID` quando confiavel e usar a combinacao atualmente adotada pelo parser quando nao houver identificador confiavel.
- **REQ-005:** Uma restricao de unicidade no banco deve impedir duplicacao concorrente ou acidental por usuario e origem, sem depender apenas de uma verificacao previa no cliente.
- **REQ-006:** A operacao de gravacao do lote e de seus lancamentos deve ser atomica: uma falha nao pode deixar um historico de importacao confirmado sem os respectivos lancamentos, nem lancamentos sem lote associado.
- **REQ-007:** Ao abrir ou atualizar a aplicacao, o dashboard deve carregar as transacoes persistidas do usuario e continuar a aplicar os filtros diario, mensal e personalizado.
- **REQ-008:** Transferencias, pagamentos de fatura e estornos devem manter o efeito atual nas metricas e nao podem ser reinterpretados como despesas duplicadas pela persistencia.
- **REQ-009:** O resultado da importacao deve distinguir itens novos, ja existentes e rejeitados, sem revelar dados de outro usuario.
- **REQ-010:** O usuario deve poder remover uma importacao e os lancamentos pertencentes exclusivamente a ela, com comportamento consistente e explicito.

## 7. Modelo conceitual proposto

Este modelo e uma proposta para validacao, nao um esquema SQL aprovado.

### Importacao

- Identificador UUID.
- Proprietario, relacionado ao usuario autenticado.
- Origem OFX: conta ou cartao.
- Nome de arquivo opcional; nunca incluir o conteudo bruto.
- Momento da importacao, intervalo de datas detectado, contagens e estado.
- Hash do arquivo opcional para diagnostico/identificacao de reenvio; nao substitui a deduplicacao por transacao.

### Transacao

- Identificador UUID e referencia a importacao.
- Proprietario para politicas RLS simples e verificaveis.
- Data, descricao, categoria, origem, tipo, valor inteiro em centavos e `FITID` opcional.
- Chave de deduplicacao persistente, com restricao unica no escopo do proprietario.

### Decisao de granularidade pendente

O parser atual distingue conta corrente de cartao, mas ainda nao preserva identificadores de contas/cartoes OFX. Deve-se decidir se a primeira versao atende somente uma conta e um cartao por usuario, ou se ja precisa suportar varias fontes da mesma origem. Se multiplas fontes forem requisito, o modelo e a chave unica precisam incluir um identificador estavel da conta/cartao; os arquivos de exemplo e o parser devem ser avaliados para confirmar quais identificadores estao disponiveis.

## 8. Viabilidade e complexidade

| Area | Avaliacao | Motivo |
| --- | --- | --- |
| Conexao React/Vite ao Supabase | Baixa | O quickstart oficial documenta `supabase-js`, variaveis de ambiente Vite e consultas ao Data API. |
| Persistencia relacional | Baixa a media | As entidades e tipos da PoC sao pequenos; exige esquema versionado, restricoes, indices e configuracao por ambiente. |
| Autenticacao e RLS | Media | E indispensavel para dados privados. Requer fluxo de sessao, politicas por tabela, grants adequados e testes de acesso permitido/negado. |
| Importacao sem duplicidade | Media | A regra existente pode ser reaproveitada, mas a unicidade deve ser garantida no Postgres, inclusive sob importacoes concorrentes. |
| Atomicidade de lote | Media | A gravacao de historico e lancamentos precisa ocorrer na mesma transacao; avaliar funcao RPC de confirmacao do lote ou abordagem equivalente. |
| Adaptacao do dashboard | Baixa a media | A origem em memoria precisa ser substituida por carregamento persistido, com estados de carregamento, vazio, erro e sessao expirada. |
| Armazenamento do OFX original | Fora do escopo | Nao e necessario para a PoC e aumenta retencao, risco e obrigacoes de exclusao. |

**Conclusao:** complexidade global moderada e apropriada para evolucao incremental. O maior risco esta em isolamento, atomicidade e identidade das fontes, nao no volume esperado de transacoes pessoais.

## 9. Requisitos nao funcionais e seguranca

- **REQ-011:** Todas as tabelas acessiveis pela API devem ter RLS habilitada; grants e politicas devem limitar cada operacao ao proprietario autenticado.
- **REQ-012:** A chave de publicacao pode estar no cliente somente com RLS devidamente configurada. Chaves secretas/administrativas nao podem ser incorporadas ao bundle ou ao repositorio.
- **REQ-013:** Migracoes de esquema, grants e politicas devem ser versionadas no repositorio e repetiveis entre ambientes.
- **REQ-014:** Testes de seguranca devem provar que o dono pode acessar os proprios dados e que outro usuario nao pode ler, criar, alterar nem apagar dados alheios.
- **REQ-015:** Erros exibidos ao usuario devem ser acionaveis e nao devem conter segredos, tokens ou dados financeiros de terceiros.
- **REQ-016:** A app deve manter o dashboard em estado consistente se a rede estiver indisponivel; nunca indicar sucesso de importacao sem confirmacao da persistencia.

## 10. Criterios de sucesso

- A pessoa autenticada conclui uma importacao valida e consegue ver os mesmos lancamentos depois de recarregar a pagina.
- Reimportar o mesmo OFX nao altera a quantidade de transacoes persistidas nem duplica valores nas metricas.
- Duas sessoes de usuarios diferentes nao conseguem observar ou modificar dados uma da outra; testes automatizados verificam os quatro tipos de operacao.
- Uma falha de gravacao nao deixa lote parcial confirmado.
- As metricas atuais de receita, despesa, saldo, poupanca, categorias e pagamentos de fatura permanecem consistentes antes e depois da persistencia.
- A importacao e o dashboard continuam funcionando sem armazenar o arquivo OFX bruto.

## 11. Sequencia recomendada de implementacao

1. Aprovar a especificacao de autenticacao e escolher o fluxo inicial.
2. Implementar Auth, configuracao de sessao e protecao das rotas/acoes que usam dados privados.
3. Definir entidades, chaves de deduplicacao, politica de exclusao e migracoes.
4. Criar tabelas, grants, RLS e testes negativos/positivos por usuario.
5. Persistir lote e transacoes de forma atomica; conectar o carregamento do dashboard.
6. Validar reimportacao, falhas, sessao expirada e preservacao das metricas com OFX de amostra.

## 12. Decisoes necessarias antes do plano de implementacao

- Um usuario apenas ou cadastro aberto a multiplos usuarios?
- Uma conta e um cartao por usuario, ou varias fontes desde a primeira versao?
- O arquivo bruto nunca sera guardado, ou existe necessidade de auditoria/reprocessamento?
- Remover uma importacao apaga transacoes exclusivas, ou deve ser possivel reter transacoes compartilhadas por imports sobrepostos?
- Qual ambiente Supabase e estrategia de migracoes serao usados (local, staging e producao)?

## 13. Fontes consultadas

- Supabase, [React quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs): cliente no browser, variaveis Vite e integracao com Data API.
- Supabase, [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants, politicas por usuario, `auth.uid()`, recomendacao de testar politicas e nao expor chave secreta.
- Supabase, [Cascade Deletes](https://supabase.com/docs/guides/database/postgres/cascade-deletes): opcoes de comportamento ao remover entidades relacionadas.
