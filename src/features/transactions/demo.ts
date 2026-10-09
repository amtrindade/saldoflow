import type { StatementCoverage, Transaction } from './types'

function monthStart(monthOffset: number): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
}

function dateForDay(monthOffset: number, day: number): string {
  const month = monthStart(monthOffset)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const date = new Date(month.getFullYear(), month.getMonth(), Math.min(day, lastDay))
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function item(
  monthOffset: number,
  day: number,
  description: string,
  category: string,
  source: Transaction['source'],
  kind: Transaction['kind'],
  amountCents: number,
): Transaction {
  const date = dateForDay(monthOffset, day)
  const key = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\W+/g, '-')
  return { id: `demo-${date}-${key}`, date, description, category, source, kind, amountCents }
}

function makeDemoMonth(monthOffset: number): Transaction[] {
  const variation = (monthOffset % 3) * 1_200
  return [
    item(monthOffset, 1, 'Salário', 'Renda', 'account', 'income', 1_422_900),
    item(monthOffset, 2, 'Aluguel residencial', 'Moradia', 'account', 'expense', -162_279),
    item(monthOffset, 2, 'Mercado Central', 'Alimentação', 'credit-card', 'expense', -38_450 - variation),
    item(monthOffset, 3, 'Café da Praça', 'Alimentação', 'account', 'expense', -4_270),
    item(monthOffset, 3, 'Conta de energia', 'Moradia', 'account', 'expense', -25_302),
    item(monthOffset, 4, 'Farmácia Vida', 'Saúde', 'credit-card', 'expense', -12_680),
    item(monthOffset, 4, 'Pix recebido', 'Renda', 'account', 'income', 42_000),
    item(monthOffset, 5, 'Posto Avenida', 'Transporte', 'account', 'expense', -21_890),
    item(monthOffset, 5, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -15_600 - variation),
    item(monthOffset, 6, 'Supermercado Horizonte', 'Alimentação', 'credit-card', 'expense', -29_630),
    item(monthOffset, 7, 'Internet fibra', 'Moradia', 'account', 'expense', -11_990),
    item(monthOffset, 8, 'Cinema', 'Lazer', 'credit-card', 'expense', -9_200),
    item(monthOffset, 9, 'Streaming', 'Serviços', 'credit-card', 'expense', -5_590),
    item(monthOffset, 10, 'Mercado Central', 'Alimentação', 'account', 'expense', -32_870),
    item(monthOffset, 12, 'Consulta clínica', 'Saúde', 'account', 'expense', -28_000),
    item(monthOffset, 13, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -23_400),
    item(monthOffset, 15, 'Transporte por aplicativo', 'Transporte', 'credit-card', 'expense', -4_680),
    item(monthOffset, 17, 'Supermercado Horizonte', 'Alimentação', 'credit-card', 'expense', -64_720),
    item(monthOffset, 19, 'Seguro residencial', 'Moradia', 'account', 'expense', -14_550),
    item(monthOffset, 21, 'Livraria do Centro', 'Lazer', 'credit-card', 'expense', -12_800),
    item(monthOffset, 23, 'Posto Avenida', 'Transporte', 'account', 'expense', -27_300),
    item(monthOffset, 25, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -31_800),
    item(monthOffset, 27, 'Mercado Central', 'Alimentação', 'credit-card', 'expense', -42_440),
    item(monthOffset, 28, 'Pagamento da fatura', 'Transferência', 'account', 'transfer', -1_018_330),
    ...(monthOffset % 4 === 0
      ? [item(monthOffset, 16, 'Notebook', 'Outros', 'credit-card', 'expense', -245_000)]
      : []),
  ]
}

function coverageForMonth(monthOffset: number, source: StatementCoverage['source']): StatementCoverage {
  const startDate = monthStart(monthOffset)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
  const format = (date: Date) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  return { source, start: format(startDate), end: format(endDate) }
}

export const demoTransactions: Transaction[] = Array.from({ length: 12 }, (_, index) => makeDemoMonth(11 - index)).flat()

export const demoCoverage: StatementCoverage[] = Array.from({ length: 12 }, (_, index) => {
  const monthOffset = 11 - index
  return [coverageForMonth(monthOffset, 'account'), coverageForMonth(monthOffset, 'credit-card')]
}).flat()
