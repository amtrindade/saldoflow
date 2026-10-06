# AGENT.md - Gerenciador de Finanças Pessoais

## 1. Visão Geral do Projeto
O sistema é um gerenciador financeiro pessoal focado em importação de extratos (conta corrente e cartão de crédito), categorização automática/manual de lançamentos e visualização de dados via dashboards interativos para tomada de decisão sobre economia e controle de gastos.

---

## 2. Fase Atual: PoC de Visualização (Fase 1)
> **Escopo da Fase Actual:**
> - Prototipagem e validação dos **dashboards e gráficos** mais úteis para análise financeira.
> - Leitura de arquivos de amostra em memória/em mock (sem foco imediato em persistência/banco de dados).
> - Validação das regras de desduplicação e conciliação visualmente.

### 2.1 Stack e Importação da PoC
- **Linguagem:** TypeScript.
- **Interface:** React com Vite, HTML semântico e CSS.
- **Gráficos:** Recharts.
- **Execução:** aplicação no navegador; importar os arquivos localmente e processar os dados em memória, sem backend ou banco de dados nesta fase.
- **Formato de importação da PoC:** OFX para os extratos de conta corrente e cartão de crédito.
- Os arquivos de amostra usam OFX SGML 1.02. O parser deve suportar esse formato, sem assumir que o conteúdo é XML convencional, e identificar conta/cartão pela estrutura OFX.
- Os OFX de amostra têm codificações distintas (UTF-8 para conta corrente e ASCII para cartão). A leitura deve decodificar o conteúdo corretamente antes do parsing.
- CSV da conta e TXT do cartão são formatos alternativos e ficam fora do escopo inicial da PoC. Não implementar esses importadores sem necessidade confirmada.
- Preservar o `FITID` quando fornecido e aplicar a regra de desduplicação da seção 3.1 quando não houver identificador confiável.

---

## 3. Regras de Negócio Fundamentais

### 3.1. Conciliação e Evitação de Duplicidade
1. **Pagamento de Fatura vs. Gastos do Cartão:**
   - O pagamento da fatura do cartão feito via débito na conta corrente **não deve ser contabilizado como despesa dupla**.
   - O valor debitado na conta referente à fatura deve ser tratado como uma **transferência interna/liquidação de passivo**.
   - As despesas reais são os itens individuais importados do extrato do cartão de crédito.
2. **Desduplicação de Transações:**
   - Regra de identificação única para lançamentos baseada no hash ou combinação de: `data + valor + descrição normalizada + tipo (crédito/débito)`.

### 3.2. Filtros Temporais
O sistema deve permitir filtrar todas as visões por:
- **Diário**
- **Mensal** (Visão padrão)
- **Personalizado** (Intervalo livre entre Data Inicial e Data Final)

---

## 4. Requisitos de Visualização e Dashboards (PoC)

### 4.1. Métricas Principais (KPIs / Cards Topo)
- **Receita Total** no período
- **Despesa Total** no período
- **Saldo do Período** (Receitas − Despesas)
- **Taxa de Poupança / Economia** (`(Receita - Despesa) / Receita * 100`)

### 4.2. Visões de Gráficos Sugeridas para Validação
1. **Distribuição de Despesas por Categoria (Gráfico de Rosca / Donut):**
   - Identificação rápida dos maiores gargalos de orçamento (ex.: Alimentação, Moradia, Transporte).
2. **Evolução Temporal de Fluxo de Caixa (Gráfico de Linha / Barras Agrupadas):**
   - Comparativo dia a dia ou mês a mês de **Entradas vs. Saídas**.
3. **Detalhamento de Gastos no Cartão vs. Débito Direto (Gráfico de Barras Empilhadas):**
   - Para entender a proporção de uso do cartão em relação ao dinheiro/débito em conta.
4. **Top N Maiores Despesas do Período (Tabela / Lista de Alerta):**
   - Destaque para transações fora da curva ou de alto valor.

---

## 5. Próximos Passos (Fases Futuras)
- **Fase 2:** Definição da estratégia e esquema de armazenamento dos dados (DB relacional vs. arquivos locais/SQLite).
- **Fase 3:** Motor de importação e parsing dinâmico de arquivos (OFX, CSV, PDF).
- **Fase 4:** Regras e machine learning / heurísticas para auto-categorização de lançamentos.