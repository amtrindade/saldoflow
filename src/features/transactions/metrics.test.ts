import { describe, expect, it } from 'vitest'
import {
  buildCategoryMonthlySeries,
  buildHistoricalSeries,
  buildRecurringCandidates,
  buildSpendingNeedTotals,
  expenseCategories,
  filterExpensesByCategory,
  filterTransactions,
  getRecentMonthKeys,
  topExpenses,
  summarizeTransactions,
} from './metrics'
import type { PeriodSelection } from './metrics'
import type { Transaction } from './types'

const period: PeriodSelection = {
  mode: 'month',
  day: '2026-09-15',
  month: '2026-09',
  start: '2026-09-01',
  end: '2026-09-30',
}

const transactions: Transaction[] = [
  { id: 'income', date: '2026-09-01', description: 'Salário', category: 'Renda', source: 'account', kind: 'income', amountCents: 200_000 },
  { id: 'account-expense', date: '2026-09-02', description: 'Aluguel', category: 'Moradia', source: 'account', kind: 'expense', amountCents: -80_000 },
  { id: 'account-refund', date: '2026-09-03', description: 'Devolução', category: 'Moradia', source: 'account', kind: 'refund', amountCents: -10_000 },
  { id: 'card-expense', date: '2026-09-04', description: 'Mercado', category: 'Alimentação', source: 'credit-card', kind: 'expense', amountCents: -30_000 },
  { id: 'invoice-transfer', date: '2026-09-05', description: 'Pagamento da fatura', category: 'Transferência', source: 'account', kind: 'transfer', amountCents: -30_000 },
  { id: 'out-of-period', date: '2026-10-01', description: 'Outra receita', category: 'Renda', source: 'account', kind: 'income', amountCents: 50_000 },
]

describe('filterTransactions', () => {
  it('filtra despesas por origem, preserva todas as receitas e respeita o período', () => {
    const visible = filterTransactions(transactions, period, 'account')

    expect(visible.map((transaction) => transaction.id)).toEqual([
      'income',
      'account-expense',
      'account-refund',
      'invoice-transfer',
    ])
  })

  it('mantém todas as origens de despesa quando o filtro está em todas', () => {
    const visible = filterTransactions(transactions, period, 'all')

    expect(visible.map((transaction) => transaction.id)).toEqual([
      'income',
      'account-expense',
      'account-refund',
      'card-expense',
      'invoice-transfer',
    ])
  })

  it('filtra despesas do cartão e preserva receitas e liquidações fora dos totais', () => {
    const visible = filterTransactions(transactions, period, 'credit-card')

    expect(visible.map((transaction) => transaction.id)).toEqual([
      'income',
      'card-expense',
      'invoice-transfer',
    ])
    expect(summarizeTransactions(visible).incomeCents).toBe(200_000)
  })

  it('mantém as receitas do período mesmo quando a origem selecionada não tem despesas', () => {
    const visible = filterTransactions([transactions[0]], period, 'credit-card')

    expect(visible).toEqual([transactions[0]])
  })

  it.each([
    {
      periodName: 'dia',
      selection: { ...period, mode: 'day' as const, day: '2026-09-02' },
      expectedIds: ['account-expense'],
    },
    {
      periodName: 'intervalo personalizado',
      selection: { ...period, mode: 'custom' as const, start: '2026-09-02', end: '2026-09-03' },
      expectedIds: ['account-expense', 'account-refund'],
    },
  ])('combina o filtro de origem com o período $periodName', ({ selection, expectedIds }) => {
    const visible = filterTransactions(transactions, selection, 'account')

    expect(visible.map((transaction) => transaction.id)).toEqual(expectedIds)
  })
})

describe('summarizeTransactions', () => {
  it('recalcula despesas líquidas e mantém a receita ao receber a seleção de origem', () => {
    const visible = filterTransactions(transactions, period, 'account')

    expect(summarizeTransactions(visible)).toMatchObject({
      incomeCents: 200_000,
      expenseCents: 70_000,
      balanceCents: 130_000,
    })
  })

  describe('análises adicionais do dashboard', () => {
    const history: Transaction[] = [
      { id: 'salary-jan', date: '2026-01-01', description: 'Salário', category: 'Renda', source: 'account', kind: 'income', amountCents: 300_000 },
      { id: 'rent-jan', date: '2026-01-02', description: 'Aluguel residencial', category: 'Moradia', source: 'account', kind: 'expense', amountCents: -100_000 },
      { id: 'netflix-jan', date: '2026-01-10', description: 'Netflix', category: 'Serviços', source: 'credit-card', kind: 'expense', amountCents: -5_500 },
      { id: 'refund-jan', date: '2026-01-12', description: 'Reembolso Netflix', category: 'Serviços', source: 'credit-card', kind: 'refund', amountCents: -500 },
      { id: 'transfer-jan', date: '2026-01-15', description: 'Pagamento da fatura', category: 'Transferência', source: 'account', kind: 'transfer', amountCents: -105_500 },
      { id: 'salary-feb', date: '2026-02-01', description: 'Salário', category: 'Renda', source: 'account', kind: 'income', amountCents: 300_000 },
      { id: 'rent-feb', date: '2026-02-02', description: 'Aluguel residencial', category: 'Moradia', source: 'account', kind: 'expense', amountCents: -100_000 },
      { id: 'netflix-feb', date: '2026-02-10', description: 'Netflix', category: 'Serviços', source: 'credit-card', kind: 'expense', amountCents: -5_500 },
      { id: 'large-expense', date: '2026-02-15', description: 'Notebook', category: 'Outros', source: 'credit-card', kind: 'expense', amountCents: -150_000 },
      { id: 'variable-jan', date: '2026-01-05', description: 'Conta variável', category: 'Outros', source: 'account', kind: 'expense', amountCents: -10_000 },
      { id: 'variable-feb', date: '2026-02-05', description: 'Conta variável', category: 'Outros', source: 'account', kind: 'expense', amountCents: -50_000 },
    ]
    const coverage = (['account', 'credit-card'] as const).flatMap((source) => [
      { source, start: '2026-01-01', end: '2026-01-31' },
      { source, start: '2026-02-01', end: '2026-02-28' },
    ])

    it('ranks only individual expenses, in descending amount order, and caps the result at ten', () => {
      const manyExpenses = Array.from({ length: 12 }, (_, index) => ({
        ...history[1],
        id: `expense-${index}`,
        amountCents: -(index + 1) * 1_000,
      }))

      expect(topExpenses([...manyExpenses, history[4], history[3]])).toHaveLength(10)
      expect(topExpenses([...manyExpenses, history[4], history[3]])[0].amountCents).toBe(-12_000)
      expect(topExpenses([...manyExpenses, history[4], history[3]])[9].amountCents).toBe(-3_000)
    })

    it('classifies only clear descriptions and keeps ambiguous spending visible as unclassified', () => {
      const totals = buildSpendingNeedTotals(history)

      expect(totals).toEqual([
        { need: 'essential', amountCents: 200_000 },
        { need: 'discretionary', amountCents: 10_500 },
        { need: 'unclassified', amountCents: 210_000 },
      ])
    })

    it('detects monthly candidates without including transfers or treating them as confirmed subscriptions', () => {
      const candidates = buildRecurringCandidates(history)

      expect(candidates).toHaveLength(2)
      expect(candidates.find((candidate) => candidate.description === 'Netflix')).toMatchObject({
        description: 'Netflix',
        occurrences: 2,
        averageMonthlyCents: 5_500,
        estimatedAnnualCents: 66_000,
      })
      expect(candidates.some((candidate) => candidate.description === 'Pagamento da fatura')).toBe(false)
      expect(candidates.some((candidate) => candidate.description === 'Conta variável')).toBe(false)
    })

    it('generates calendar month keys for the requested recent window', () => {
      expect(getRecentMonthKeys(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01'])
    })

    it('marks uncovered months as unknown and covered inactive months as zero', () => {
      const partialCoverage = coverage.filter(({ start }) => start.startsWith('2026-01'))
      const series = buildHistoricalSeries(history, partialCoverage, 2, 'all', new Date(2026, 1, 15))

      expect(series.map((point) => [point.month, point.covered, point.netCents, point.cumulativeCents])).toEqual([
        ['2026-01', true, 185_000, 185_000],
        ['2026-02', false, null, null],
      ])
    })

    it('compares category totals per month, using null for uncovered and zero for covered months without spending', () => {
      const series = buildCategoryMonthlySeries(history, coverage, 'Alimentação', 2, 'all', new Date(2026, 1, 15))

      expect(series.map((point) => [point.month, point.covered, point.amountCents])).toEqual([
        ['2026-01', true, 0],
        ['2026-02', true, 0],
      ])
    })
  })

  describe('filtro de despesas por categoria', () => {
    it('lista as categorias presentes nas despesas sem incluir receitas, transferências ou estornos', () => {
      expect(expenseCategories(transactions)).toEqual(['Alimentação', 'Moradia'])
    })

    it('lista todas as despesas da categoria selecionada, sem limite de quantidade', () => {
      const manyExpenses: Transaction[] = Array.from({ length: 9 }, (_, index) => ({
        id: `food-${index}`,
        date: `2026-09-${String(index + 1).padStart(2, '0')}`,
        description: `Compra ${index + 1}`,
        category: 'Alimentação',
        source: index % 2 === 0 ? 'account' : 'credit-card',
        kind: 'expense',
        amountCents: -(10_000 + index),
      }))

      const selected = filterExpensesByCategory(manyExpenses, 'Alimentação')

      expect(selected).toHaveLength(9)
      expect(selected.every((transaction) => transaction.category === 'Alimentação' && transaction.kind === 'expense')).toBe(true)
    })

    it('lista todas as categorias por valor quando nenhuma categoria específica está selecionada', () => {
      expect(filterExpensesByCategory(transactions, 'all').map((transaction) => transaction.id)).toEqual([
        'account-expense',
        'card-expense',
      ])
    })
  })
})
