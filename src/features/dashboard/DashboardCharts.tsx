import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CreditCard, Landmark } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { categoryColor } from '../transactions/ofx'
import { buildCategoryTotals, buildDailySeries, expenseCategories, filterExpensesByCategory } from '../transactions/metrics'
import type { Transaction } from '../transactions/types'

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

function ChartEmpty() { return <div className="chart-empty"><ArrowUpRight size={19} /><span>Sem lançamentos neste período</span></div> }
function shortDescription(description: string) { return description.split(' · ').at(-1) ?? description }
function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function shortCurrency(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : `${Math.round(value)}` }
function formatDate(value: string) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}` }

const tooltipStyle = { border: '1px solid #dfe8e3', borderRadius: 6, fontSize: 12, boxShadow: '0 8px 24px rgba(27, 48, 40, 0.08)' }