import type { StatementCoverage, Transaction, TransactionSource } from './types'

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

export type SpendingNeed = 'essential' | 'discretionary' | 'unclassified'

export interface SpendingNeedTotal {
  need: SpendingNeed
  amountCents: number
}

export interface RecurringCandidate {
  key: string
  description: string
  source: TransactionSource
  occurrences: number
  firstDate: string
  lastDate: string
  averageMonthlyCents: number
  estimatedAnnualCents: number
}

export interface HistoricalPoint {
  month: string
  covered: boolean
  incomeCents: number | null
  expenseCents: number | null
  netCents: number | null
  cumulativeCents: number | null
}

export interface CategoryMonthlyPoint {
  month: string
  covered: boolean
  amountCents: number | null
}

export function filterTransactions(transactions: Transaction[], period: PeriodSelection, source: SourceFilter): Transaction[] {
  return transactions.filter((transaction) => {
    if (source !== 'all' && (transaction.kind === 'expense' || transaction.kind === 'refund') && transaction.source !== source) return false
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

export function expenseCategories(transactions: Transaction[]): string[] {
  return [...new Set(transactions
    .filter((transaction) => transaction.kind === 'expense')
    .map((transaction) => transaction.category))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
}

export function filterExpensesByCategory(transactions: Transaction[], category: string): Transaction[] {
  return transactions
    .filter((transaction) => transaction.kind === 'expense' && (category === 'all' || transaction.category === category))
    .sort((left, right) => Math.abs(right.amountCents) - Math.abs(left.amountCents))
}

export function topExpenses(transactions: Transaction[], limit = 10): Transaction[] {
  return transactions
    .filter((transaction) => transaction.kind === 'expense' && transaction.amountCents !== 0)
    .sort((left, right) =>
      Math.abs(right.amountCents) - Math.abs(left.amountCents)
      || right.date.localeCompare(left.date)
      || left.id.localeCompare(right.id),
    )
    .slice(0, Math.max(0, limit))
}

function normalizedDescription(value: string): string {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function classifySpendingNeed(transaction: Transaction): SpendingNeed {
  const description = normalizedDescription(transaction.description)
  if (/aluguel|condominio|conta de luz|conta de energia|energia eletrica|agua|gas encanado|internet residencial|supermercado|mercado central|feira/.test(description)) {
    return 'essential'
  }
  if (/restaurante|cafe|cinema|streaming|netflix|spotify|disney|youtube|livraria|academia|compra por impulso|compra impulsiva/.test(description)) {
    return 'discretionary'
  }
  return 'unclassified'
}

export function buildSpendingNeedTotals(transactions: Transaction[]): SpendingNeedTotal[] {
  const totals: Record<SpendingNeed, number> = { essential: 0, discretionary: 0, unclassified: 0 }
  for (const transaction of transactions) {
    if (transaction.kind === 'expense') {
      totals[classifySpendingNeed(transaction)] += Math.abs(transaction.amountCents)
    } else if (transaction.kind === 'refund') {
      totals[classifySpendingNeed(transaction)] -= Math.abs(transaction.amountCents)
    }
  }
  return (Object.entries(totals) as [SpendingNeed, number][])
    .map(([need, amountCents]) => ({ need, amountCents: Math.max(0, amountCents) }))
    .filter(({ amountCents }) => amountCents > 0)
}

function daysBetween(left: string, right: string): number {
  const leftTime = Date.parse(`${left}T00:00:00Z`)
  const rightTime = Date.parse(`${right}T00:00:00Z`)
  return Math.round((rightTime - leftTime) / 86_400_000)
}

export function buildRecurringCandidates(transactions: Transaction[]): RecurringCandidate[] {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense' || transaction.amountCents === 0) continue
    const descriptionKey = normalizedDescription(transaction.description)
    if (!descriptionKey) continue
    const key = `${transaction.source}:${descriptionKey}`
    groups.set(key, [...(groups.get(key) ?? []), transaction])
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const ordered = [...items].sort((left, right) => left.date.localeCompare(right.date))
      const gaps = ordered.slice(1).map((item, index) => daysBetween(ordered[index].date, item.date))
      const monthlyGaps = gaps.filter((gap) => gap >= 25 && gap <= 35)
      if (ordered.length < 2 || monthlyGaps.length !== gaps.length || gaps.length === 0) return undefined
      const amounts = ordered.map((item) => Math.abs(item.amountCents))
      const averageMonthlyCents = Math.round(amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length)
      if (Math.max(...amounts) - Math.min(...amounts) > averageMonthlyCents * 0.2) return undefined
      return {
        key,
        description: ordered[0].description,
        source: ordered[0].source,
        occurrences: ordered.length,
        firstDate: ordered[0].date,
        lastDate: ordered.at(-1)!.date,
        averageMonthlyCents,
        estimatedAnnualCents: averageMonthlyCents * 12,
      }
    })
    .filter((candidate): candidate is RecurringCandidate => candidate !== undefined)
    .sort((left, right) => right.estimatedAnnualCents - left.estimatedAnnualCents)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getRecentMonthKeys(count: number, referenceDate = new Date()): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - count + index + 1, 1)
    return monthKey(date)
  })
}

function monthBounds(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function isMonthCovered(month: string, coverage: StatementCoverage[], source: SourceFilter): boolean {
  const { start, end } = monthBounds(month)
  const requiredSources: TransactionSource[] = source === 'all'
    ? ['account', 'credit-card']
    : source === 'account'
      ? ['account']
      : ['account', 'credit-card']
  return requiredSources.every((requiredSource) =>
    coverage.some((period) => period.source === requiredSource && period.start <= start && period.end >= end),
  )
}

function transactionsForMonth(transactions: Transaction[], month: string, source: SourceFilter): Transaction[] {
  return transactions.filter((transaction) => {
    if (!transaction.date.startsWith(month)) return false
    if (transaction.kind === 'income') return true
    return source === 'all' || transaction.source === source
  })
}

export function buildHistoricalSeries(
  transactions: Transaction[],
  coverage: StatementCoverage[],
  count: number,
  source: SourceFilter,
  referenceDate = new Date(),
): HistoricalPoint[] {
  let cumulativeCents: number | null = 0
  return getRecentMonthKeys(count, referenceDate).map((month) => {
    const covered = isMonthCovered(month, coverage, source)
    if (!covered) {
      cumulativeCents = null
      return { month, covered, incomeCents: null, expenseCents: null, netCents: null, cumulativeCents: null }
    }
    const summary = summarizeTransactions(transactionsForMonth(transactions, month, source))
    if (cumulativeCents !== null) cumulativeCents += summary.balanceCents
    return {
      month,
      covered,
      incomeCents: summary.incomeCents,
      expenseCents: summary.expenseCents,
      netCents: summary.balanceCents,
      cumulativeCents,
    }
  })
}

export function buildCategoryMonthlySeries(
  transactions: Transaction[],
  coverage: StatementCoverage[],
  category: string,
  count: number,
  source: SourceFilter,
  referenceDate = new Date(),
): CategoryMonthlyPoint[] {
  return getRecentMonthKeys(count, referenceDate).map((month) => {
    const covered = isMonthCovered(month, coverage, source)
    if (!covered) return { month, covered, amountCents: null }
    const monthTransactions = transactionsForMonth(transactions, month, source)
    const amountCents = monthTransactions
      .filter((transaction) => transaction.category === category && (transaction.kind === 'expense' || transaction.kind === 'refund'))
      .reduce((total, transaction) => total + (transaction.kind === 'refund' ? -Math.abs(transaction.amountCents) : Math.abs(transaction.amountCents)), 0)
    return { month, covered, amountCents: Math.max(0, amountCents) }
  })
}