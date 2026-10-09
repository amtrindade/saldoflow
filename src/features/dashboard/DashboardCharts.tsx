import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CreditCard, Landmark } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis } from 'recharts'
import { categoryColor } from '../transactions/ofx'
import {
  buildCategoryMonthlySeries,
  buildCategoryTotals,
  buildHistoricalSeries,
  buildRecurringCandidates,
  buildSpendingNeedTotals,
  buildDailySeries,
  classifySpendingNeed,
  expenseCategories,
  filterExpensesByCategory,
  filterTransactions,
  getRecentMonthKeys,
  topExpenses,
} from '../transactions/metrics'
import type { SourceFilter, SpendingNeed } from '../transactions/metrics'
import type { StatementCoverage, Transaction } from '../transactions/types'

interface ChartProps { transactions: Transaction[] }

export function CashFlowChart({ transactions }: ChartProps) {
  const data = buildDailySeries(transactions)
  return (
    <section className="panel chart-panel" aria-labelledby="flow-title">
      <div className="panel-heading">
        <div><p className="eyebrow">MOVIMENTO NO PERÍODO</p><h2 id="flow-title">Entradas e despesas</h2></div>
        <div className="chart-legend"><span className="legend-income" /> Entradas <span className="legend-expense" /> Despesas</div>
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="#e8eeeb" strokeDasharray="3 5" />
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(8, 10)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 11 }} dy={8} />
            <YAxis tickFormatter={shortCurrency} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 11 }} width={38} />
            <Tooltip formatter={(value) => currency(Number(value))} labelFormatter={(label) => `Dia ${String(label).slice(8, 10)}`} contentStyle={tooltipStyle} />
            <Bar dataKey="income" name="Entradas" fill="#3f8e73" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expenses" name="Despesas" fill="#df765d" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      ) : <ChartEmpty />}
    </section>
  )
}

export function CategoryChart({ transactions }: ChartProps) {
  const data = buildCategoryTotals(transactions).map((item) => ({ ...item, value: item.amountCents / 100 }))
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <section className="panel category-panel" id="categories" aria-labelledby="category-title">
      <div className="panel-heading"><div><p className="eyebrow">PARA ONDE VAI</p><h2 id="category-title">Despesas por categoria</h2></div></div>
      {data.length ? <>
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={204}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="category" innerRadius={61} outerRadius={89} paddingAngle={3} stroke="none">
                {data.map((item) => <Cell key={item.category} fill={categoryColor(item.category)} />)}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value))} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center"><span>Total líquido</span><strong>{currency(total)}</strong></div>
        </div>
        <ul className="category-legend">
          {data.slice(0, 5).map((item) => <li key={item.category}><span className="category-dot" style={{ backgroundColor: categoryColor(item.category) }} /><span>{item.category}</span><strong>{currency(item.value)}</strong></li>)}
        </ul>
      </> : <ChartEmpty />}
    </section>
  )
}

export function ChannelChart({ transactions }: ChartProps) {
  const data = buildDailySeries(transactions).filter((point) => point.accountExpenses || point.cardExpenses)
  return (
    <section className="panel channel-panel" aria-labelledby="channel-title">
      <div className="panel-heading"><div><p className="eyebrow">MEIO DE PAGAMENTO</p><h2 id="channel-title">Cartão e conta</h2></div></div>
      {data.length ? <>
        <div className="chart-legend channel-legend"><span className="legend-account" /> Conta <span className="legend-card" /> Cartão</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8eeeb" strokeDasharray="3 5" />
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(8, 10)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 11 }} dy={8} />
            <YAxis tickFormatter={shortCurrency} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 11 }} width={38} />
            <Tooltip formatter={(value) => currency(Number(value))} labelFormatter={(label) => `Dia ${String(label).slice(8, 10)}`} contentStyle={tooltipStyle} />
            <Bar dataKey="accountExpenses" name="Conta" stackId="expenses" fill="#4e7f71" maxBarSize={28} />
            <Bar dataKey="cardExpenses" name="Cartão" stackId="expenses" fill="#d2a64d" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </> : <ChartEmpty />}
    </section>
  )
}

export function ExpensesTable({ transactions }: ChartProps) {
  const [category, setCategory] = useState('all')
  const categories = expenseCategories(transactions)
  const rows = filterExpensesByCategory(transactions, category)

  return (
    <section className="panel expenses-panel" id="transactions" aria-labelledby="expenses-title">
      <div className="panel-heading expenses-heading">
        <div><p className="eyebrow">LANÇAMENTOS DO PERÍODO</p><h2 id="expenses-title">Despesas</h2></div>
        <div className="expense-heading-actions">
          <label className="category-filter">
            <span>Categoria</span>
            <select aria-label="Filtrar despesas por categoria" value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
              <option value="all">Todas as categorias</option>
              {category !== 'all' && !categories.includes(category) && <option value={category}>{category}</option>}
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <span className="table-count">{rows.length} lançamentos</span>
        </div>
      </div>
      {rows.length ? <div className="table-scroll">
        <table>
          <thead><tr><th>Descrição</th><th>Data de realização</th><th>Origem</th><th className="amount-cell">Valor</th></tr></thead>
          <tbody>{rows.map((transaction) => <tr key={transaction.id}>
            <td><strong>{shortDescription(transaction.description)}</strong><span className="table-subtitle">{transaction.category}</span></td>
            <td>{formatDate(transaction.date)}</td>
            <td><span className={`source-badge ${transaction.source}`}>{transaction.source === 'account' ? <Landmark size={13} /> : <CreditCard size={13} />}{transaction.source === 'account' ? 'Conta' : 'Cartão'}</span></td>
            <td className="amount-cell expense-amount"><ArrowDownRight size={15} />{currency(Math.abs(transaction.amountCents) / 100)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <div className="chart-empty"><ArrowUpRight size={19} /><span>{category === 'all' ? 'Sem lançamentos neste período' : `Sem despesas na categoria ${category}`}</span></div>}
    </section>
  )
}

export function IncomeTable({ transactions }: ChartProps) {
  const rows = transactions
    .filter((transaction) => transaction.kind === 'income')
    .sort((left, right) => right.date.localeCompare(left.date) || left.description.localeCompare(right.description))
  const totalCents = rows.reduce((total, transaction) => total + transaction.amountCents, 0)

  return (
    <section className="panel income-panel" id="incomes" aria-labelledby="income-title">
      <div className="panel-heading">
        <div><p className="eyebrow">ENTRADAS NO PERÍODO</p><h2 id="income-title">Receitas</h2></div>
        <div className="income-summary"><span className="table-count">{rows.length} lançamentos</span><strong>{currency(totalCents / 100)}</strong></div>
      </div>
      {rows.length ? <div className="table-scroll income-table-scroll">
        <table>
          <thead><tr><th>Descrição</th><th>Data de realização</th><th>Origem</th><th className="amount-cell">Valor</th></tr></thead>
          <tbody>{rows.map((transaction) => (
            <tr key={transaction.id}>
              <td><strong>{shortDescription(transaction.description)}</strong><span className="table-subtitle">{transaction.category}</span></td>
              <td>{formatDate(transaction.date)}</td>
              <td><span className={`source-badge ${transaction.source}`}>{transaction.source === 'account' ? <Landmark size={13} /> : <CreditCard size={13} />}{transaction.source === 'account' ? 'Conta' : 'Cartão'}</span></td>
              <td className="amount-cell income-amount"><ArrowUpRight size={15} />{currency(transaction.amountCents / 100)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div> : <div className="chart-empty"><ArrowUpRight size={19} /><span>Sem receitas neste período</span></div>}
    </section>
  )
}

interface OpportunityAnalyticsProps extends ChartProps {
  allTransactions: Transaction[]
  coverage: StatementCoverage[]
  source: SourceFilter
}

export function OpportunityAnalytics({ transactions, allTransactions, coverage, source }: OpportunityAnalyticsProps) {
  const [monthCount, setMonthCount] = useState(12)
  const [needFilter, setNeedFilter] = useState('all')
  const [category, setCategory] = useState('Alimentação')
  const monthKeys = getRecentMonthKeys(monthCount)
  const firstMonth = monthKeys[0] ?? ''
  const lastMonth = monthKeys.at(-1) ?? ''
  const lastMonthDate = new Date(`${lastMonth}-01T00:00:00`)
  const lastDay = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate()
  const start = `${firstMonth}-01`
  const end = `${lastMonth}-${String(lastDay).padStart(2, '0')}`
  const historicalTransactions = filterTransactions(allTransactions, {
    mode: 'custom',
    day: '',
    month: '',
    start,
    end,
  }, source)
  const historical = buildHistoricalSeries(allTransactions, coverage, monthCount, source).map((point) => ({
    ...point,
    cumulative: point.cumulativeCents === null ? null : point.cumulativeCents / 100,
  }))
  const categories = expenseCategories(historicalTransactions)
  const selectedCategory = categories.includes(category) ? category : categories[0] ?? ''
  const categorySeries = selectedCategory
    ? buildCategoryMonthlySeries(allTransactions, coverage, selectedCategory, monthCount, source).map((point) => ({
      ...point,
      amount: point.amountCents === null ? null : point.amountCents / 100,
    }))
    : []
  const needTotals = buildSpendingNeedTotals(transactions)
  const needsByKey = new Map(needTotals.map((entry) => [entry.need, entry.amountCents]))
  const needOptions: { need: SpendingNeed; label: string; color: string }[] = [
    { need: 'essential', label: 'Essenciais', color: '#4e7f71' },
    { need: 'discretionary', label: 'Discricionários', color: '#d2a64d' },
    { need: 'unclassified', label: 'Não classificados', color: '#aab4ad' },
  ]
  const treemapData = [
    { name: 'Essenciais', need: 'essential', amountCents: needsByKey.get('essential') ?? 0, fill: '#4e7f71' },
    { name: 'Discricionários', need: 'discretionary', amountCents: needsByKey.get('discretionary') ?? 0, fill: '#d2a64d' },
    { name: 'Não classificados', need: 'unclassified', amountCents: needsByKey.get('unclassified') ?? 0, fill: '#aab4ad' },
  ].filter((entry) => entry.amountCents > 0)
  const needTransactions = transactions
    .filter((transaction) => transaction.kind === 'expense' || transaction.kind === 'refund')
    .filter((transaction) => needFilter === 'all' || classifySpendingNeed(transaction) === needFilter)
    .sort((left, right) => Math.abs(right.amountCents) - Math.abs(left.amountCents))
  const recurring = buildRecurringCandidates(historicalTransactions)
  const estimatedAnnualTotal = recurring.reduce((total, candidate) => total + candidate.estimatedAnnualCents, 0)
  const hasUncoveredMonths = historical.some((point) => !point.covered)
  const top = topExpenses(transactions)

  return (
    <section className="opportunity-section" aria-label="Oportunidades de economia e tendências">
      <div className="analytics-heading">
        <div><p className="eyebrow">INTELIGÊNCIA FINANCEIRA</p><h2>Oportunidades de economia &amp; gargalos</h2></div>
      </div>
      <div className="analytics-grid">
        <section className="panel analytics-panel top-expenses-panel" aria-labelledby="top-expenses-title">
          <div className="panel-heading"><div><p className="eyebrow">MAIORES VALORES INDIVIDUAIS</p><h2 id="top-expenses-title">Top 10 maiores gastos</h2></div><span className="table-count">Período selecionado</span></div>
          {top.length ? <div className="table-scroll">
            <table>
              <thead><tr><th>#</th><th>Despesa</th><th>Data</th><th className="amount-cell">Valor</th></tr></thead>
              <tbody>{top.map((transaction, index) => <tr key={transaction.id}>
                <td>{index + 1}</td>
                <td><strong>{shortDescription(transaction.description)}</strong><span className="table-subtitle">{transaction.category} · {transaction.source === 'account' ? 'Conta' : 'Cartão'}</span></td>
                <td>{formatDate(transaction.date)}</td>
                <td className="amount-cell expense-amount">{currency(Math.abs(transaction.amountCents) / 100)}</td>
              </tr>)}</tbody>
            </table>
          </div> : <ChartEmpty />}
        </section>

        <section className="panel analytics-panel need-panel" aria-labelledby="need-title">
          <div className="panel-heading"><div><p className="eyebrow">COMPOSIÇÃO DAS DESPESAS</p><h2 id="need-title">Essenciais x discricionários</h2></div></div>
          <p className="analytics-note">Classificação indicativa por descrição; itens ambíguos ficam não classificados.</p>
          {treemapData.length ? <ResponsiveContainer width="100%" height={170}>
            <Treemap data={treemapData} dataKey="amountCents" nameKey="name" stroke="#fff" fill="#4e7f71" aspectRatio={4 / 3}>
              {treemapData.map((entry) => <Cell key={entry.need} fill={entry.fill} />)}
              <Tooltip formatter={(value) => currency(Number(value) / 100)} />
            </Treemap>
          </ResponsiveContainer> : <ChartEmpty />}
          <ul className="need-legend">
            {needOptions.map(({ need, label, color }) => <li key={need}><span className="category-dot" style={{ backgroundColor: color }} /><span>{label}</span><strong>{currency((needsByKey.get(need) ?? 0) / 100)}</strong></li>)}
          </ul>
          <label className="category-filter need-filter"><span>Detalhar</span><select aria-label="Filtrar lançamentos por classificação de essencialidade" value={needFilter} onChange={(event) => setNeedFilter(event.currentTarget.value)}>
            <option value="all">Todos os grupos</option><option value="essential">Essenciais</option><option value="discretionary">Discricionários</option><option value="unclassified">Não classificados</option>
          </select></label>
          <div className="need-transactions" aria-live="polite">
            {needTransactions.length ? needTransactions.map((transaction) => <div className="need-transaction" key={transaction.id}>
              <span><strong>{shortDescription(transaction.description)}</strong><small>{formatDate(transaction.date)} · {transaction.category}</small></span>
              <strong className={transaction.kind === 'refund' ? 'income-amount' : 'expense-amount'}>{transaction.kind === 'refund' ? '−' : ''}{currency(Math.abs(transaction.amountCents) / 100)}</strong>
            </div>) : <p className="analytics-note">Sem lançamentos neste grupo no período.</p>}
          </div>
        </section>

        <section className="panel analytics-panel recurring-panel" aria-labelledby="recurring-title">
          <div className="panel-heading"><div><p className="eyebrow">PADRÕES OBSERVADOS</p><h2 id="recurring-title">Monitor de recorrências</h2></div><span className="table-count">Estimativa anual: {currency(estimatedAnnualTotal / 100)}</span></div>
          <p className="analytics-note">Candidatos mensais inferidos por descrição, origem, intervalo e valores semelhantes. Não são assinaturas confirmadas.</p>
          {recurring.length ? <div className="table-scroll">
            <table>
              <thead><tr><th>Cobrança candidata</th><th>Ocorrências</th><th>Período observado</th><th className="amount-cell">Média mensal</th><th className="amount-cell">Estimativa anual</th></tr></thead>
              <tbody>{recurring.map((candidate) => <tr key={candidate.key}>
                <td><strong>{shortDescription(candidate.description)}</strong><span className="table-subtitle">{candidate.source === 'account' ? 'Conta' : 'Cartão'} · intervalo mensal estimado</span></td>
                <td>{candidate.occurrences}</td>
                <td>{formatDate(candidate.firstDate)} – {formatDate(candidate.lastDate)}</td>
                <td className="amount-cell">{currency(candidate.averageMonthlyCents / 100)}</td>
                <td className="amount-cell">{currency(candidate.estimatedAnnualCents / 100)}</td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="chart-empty compact-empty">Ainda não há cobranças mensais repetidas suficientes no histórico selecionado.</div>}
        </section>
      </div>

      <div className="analytics-heading history-heading">
        <div><p className="eyebrow">ANÁLISE HISTÓRICA</p><h2>Evolução temporal e tendências</h2></div>
        <label className="category-filter history-range"><span>Janela histórica</span><select aria-label="Janela histórica" value={monthCount} onChange={(event) => setMonthCount(Number(event.currentTarget.value))}>
          <option value={3}>Últimos 3 meses</option><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option>
        </select></label>
      </div>
      <div className="analytics-grid history-grid">
        <section className="panel analytics-panel history-panel" aria-labelledby="cumulative-title">
          <div className="panel-heading"><div><p className="eyebrow">FLUXO LÍQUIDO NO INTERVALO</p><h2 id="cumulative-title">Evolução acumulada</h2></div></div>
          <p className="analytics-note">Receitas menos despesas acumuladas; não representa o saldo bancário ou a reserva total.</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historical} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#e8eeeb" strokeDasharray="3 5" />
              <XAxis dataKey="month" tickFormatter={(value: string) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 10 }} />
              <YAxis tickFormatter={(value: number) => shortCurrency(value)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 10 }} width={48} />
              <Tooltip formatter={(value) => value === null ? 'Sem cobertura' : currency(Number(value))} labelFormatter={(label) => `Mês ${label}`} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cumulative" name="Fluxo líquido acumulado" stroke="#3f8e73" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          {hasUncoveredMonths && <p className="coverage-note" role="status">Há meses sem cobertura explícita de extrato. Valores desconhecidos não são tratados como zero.</p>}
        </section>
        <section className="panel analytics-panel history-panel" aria-labelledby="category-trend-title">
          <div className="panel-heading"><div><p className="eyebrow">DESPESAS POR MÊS</p><h2 id="category-trend-title">Comparativo por categoria</h2></div>
            <label className="category-filter"><span>Categoria</span><select aria-label="Categoria do comparativo mensal" value={selectedCategory} onChange={(event) => setCategory(event.currentTarget.value)} disabled={!categories.length}>
              {categories.length ? categories.map((option) => <option key={option} value={option}>{option}</option>) : <option value="">Sem categorias</option>}
            </select></label>
          </div>
          {categorySeries.length ? <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categorySeries} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#e8eeeb" strokeDasharray="3 5" />
              <XAxis dataKey="month" tickFormatter={(value: string) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 10 }} />
              <YAxis tickFormatter={(value: number) => shortCurrency(value)} tickLine={false} axisLine={false} tick={{ fill: '#78857f', fontSize: 10 }} width={48} />
              <Tooltip formatter={(value) => value === null ? 'Sem cobertura' : currency(Number(value))} labelFormatter={(label) => `Mês ${label}`} contentStyle={tooltipStyle} />
              <Bar dataKey="amount" name={selectedCategory} fill="#d2a64d" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
          {hasUncoveredMonths && <p className="coverage-note" role="status">Meses sem cobertura aparecem como dados desconhecidos, não como gasto zero.</p>}
        </section>
      </div>
    </section>
  )
}

function ChartEmpty() { return <div className="chart-empty"><ArrowUpRight size={19} /><span>Sem lançamentos neste período</span></div> }
function shortDescription(description: string) { return description.split(' · ').at(-1) ?? description }
function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function shortCurrency(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : `${Math.round(value)}` }
function formatDate(value: string) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}` }

const tooltipStyle = { border: '1px solid #dfe8e3', borderRadius: 6, fontSize: 12, boxShadow: '0 8px 24px rgba(27, 48, 40, 0.08)' }