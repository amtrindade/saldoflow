import { describe, expect, it } from 'vitest'
import { expenseCategories, filterExpensesByCategory, filterTransactions, summarizeTransactions } from './metrics'
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
