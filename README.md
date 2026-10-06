# SaldoFlow: PoC de finanças pessoais

Aplicação local para importar extratos de conta corrente e cartão de crédito, conciliar lançamentos e validar painéis de receitas, despesas e fluxo de caixa. Nesta fase, os dados ficam em memória no navegador; não há servidor nem banco de dados.

## Objetivo

A PoC permite explorar os principais indicadores e gráficos financeiros, conferir a regra de pagamento de fatura sem duplicar despesas e validar a leitura dos arquivos OFX de exemplo.

## Como executar

Requisitos: Node.js 20.19+ ou 22.12+ e npm.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

## Comandos disponíveis

```sh
npm test       # executa os testes de importação e conciliação
npm run lint   # analisa o código com ESLint
npm run build  # verifica os tipos e gera a versão de produção
npm run preview # inicia uma prévia da versão de produção
```

## Como usar

Ao abrir, o painel exibe dados demonstrativos para permitir a validação visual. Selecione **Importar OFX** para escolher um ou mais extratos. A primeira importação substitui os dados demonstrativos; as próximas são combinadas com os lançamentos já importados.

Os arquivos são processados no navegador e não são enviados a um servidor. Os dados permanecem apenas durante a sessão: ao recarregar a página, os dados demonstrativos voltam a ser exibidos.

## Importação nesta PoC

O formato escolhido para conta corrente e cartão é OFX. O leitor reconhece OFX SGML 1.02 e identifica a origem pela estrutura do arquivo. A codificação é obtida do cabeçalho; os exemplos incluem UTF-8 e ASCII/Windows-1252.

Os importadores de CSV da conta e TXT do cartão estão fora do escopo inicial.

## Regras de negócio

- A visão padrão é mensal; também é possível filtrar por dia ou por intervalo personalizado.
- Receita, despesa, saldo e taxa de poupança são recalculados para o período e a origem selecionados.
- Compras do cartão são despesas na data da compra. O débito da fatura na conta e o pagamento correspondente no OFX do cartão são tratados como transferência/liquidação e não geram uma segunda despesa.
- O `FITID` é preservado e usado para identificar transações quando disponível. Sem identificador confiável, a deduplicação considera origem, data, valor, descrição normalizada e tipo.
- Estornos e devoluções reduzem as despesas líquidas. Transferências não afetam os indicadores de receita e despesa.
- A categorização inicial é heurística e baseada na descrição, podendo exigir revisão.

## Tecnologias

- TypeScript, React e Vite
- HTML semântico e CSS responsivo
- Recharts para gráficos e Lucide para ícones
- `ofx-js` para leitura de OFX SGML
- Vitest para testes automatizados

## Organização do código

- `src/features/transactions`: modelo, importação OFX, categorização e métricas
- `src/features/dashboard`: componentes do painel e visualizações
- `extratos/`: arquivos de exemplo utilizados como dados de teste
