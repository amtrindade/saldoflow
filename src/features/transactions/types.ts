export type TransactionSource = 'account' | 'credit-card'
export type TransactionKind = 'income' | 'expense' | 'transfer' | 'refund'

export interface Transaction {
  id: string
  fitId?: string
  date: string
  description: string
  category: string
  source: TransactionSource
  kind: TransactionKind
  amountCents: number
}