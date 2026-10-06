import type { Transaction, TransactionSource } from './types'

export type PeriodMode = 'day' | 'month' | 'custom'
export type SourceFilter = 'all' | TransactionSource

export interface PeriodSelection {
  mode: PeriodMode
  day: string
  month: string
  start: string
  end: string
}

export interface DailyPoint {
  date: string
  income: number
  expenses: number
  accountExpenses: number
  cardExpenses: number
}

export interface CategoryTotal {
  category: string
  amountCents: number
}

export function filterTransactions(transactions: Transaction[], period: PeriodSelection, source: SourceFilter): Transaction[] {
  return transactions.filter((transaction) => {
    if (source !== 'all' && transaction.source !== source) return false
    if (period.mode === 'day') return transaction.date === period.day
    if (period.mode === 'month') return transaction.date.startsWith(period.month)
    return transaction.date >= period.start && transaction.date <= period.end
  })
}

export function summarizeTransactions(transactions: Transaction[]) {
  const incomeCents = transactions.filter((transaction) => transaction.kind === 'income')
    .reduce((total, transaction) => total + transaction.amountCents, 0)
  const expenseCents = transactions.filter((transaction) => transaction.kind === 'expense')
    .reduce((total, transaction) => total + Math.abs(transaction.amountCents), 0)
  const refundCents = transactions.filter((transaction) => transaction.kind === 'refund')
    .reduce((total, transaction) => total + Math.abs(transaction.amountCents), 0)
  const netExpenseCents = Math.max(0, expenseCents - refundCents)
  return {
    incomeCents,
    expenseCents: netExpenseCents,
    balanceCents: incomeCents - netExpenseCents,
    savingsRate: incomeCents > 0 ? ((incomeCents - netExpenseCents) / incomeCents) * 100 : 0,
  }
}

export function buildDailySeries(transactions: Transaction[]): DailyPoint[] {
  const days = new Map<string, DailyPoint>()
  for (const transaction of transactions) {
    if (transaction.kind === 'transfer' || transaction.kind === 'refund') continue
    const point = days.get(transaction.date) ?? { date: transaction.date, income: 0, expenses: 0, accountExpenses: 0, cardExpenses: 0 }
    if (transaction.kind === 'income') point.income += transaction.amountCents / 100
    if (transaction.kind === 'expense') {
      const amount = Math.abs(transaction.amountCents) / 100
      point.expenses += amount
      if (transaction.source === 'account') point.accountExpenses += amount
      if (transaction.source === 'credit-card') point.cardExpenses += amount
    }
    days.set(transaction.date, point)
  }
  return [...days.values()].sort((left, right) => left.date.localeCompare(right.date))
}

export function buildCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const categories = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.kind === 'expense') {
      categories.set(transaction.category, (categories.get(transaction.category) ?? 0) + Math.abs(transaction.amountCents))
    }
    if (transaction.kind === 'refund') {
      categories.set(transaction.category, (categories.get(transaction.category) ?? 0) - Math.abs(transaction.amountCents))
    }
  }
  return [...categories.entries()]
    .map(([category, amountCents]) => ({ category, amountCents }))
    .filter((entry) => entry.amountCents > 0)
    .sort((left, right) => right.amountCents - left.amountCents)
}

export function topExpenses(transactions: Transaction[], limit = 6): Transaction[] {
  return transactions.filter((transaction) => transaction.kind === 'expense')
    .sort((left, right) => Math.abs(right.amountCents) - Math.abs(left.amountCents))
    .slice(0, limit)
}