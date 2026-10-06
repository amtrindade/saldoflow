import type { Transaction } from './types'

function dateForDay(day: number): string {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const date = new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastDay))
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function item(day: number, description: string, category: string, source: Transaction['source'], kind: Transaction['kind'], amountCents: number): Transaction {
  return { id: `demo-${day}-${description}`, date: dateForDay(day), description, category, source, kind, amountCents }
}

export const demoTransactions: Transaction[] = [
  item(1, 'Salário', 'Renda', 'account', 'income', 1422900),
  item(2, 'Aluguel residencial', 'Moradia', 'account', 'expense', -162279),
  item(2, 'Mercado Central', 'Alimentação', 'credit-card', 'expense', -38450),
  item(3, 'Café da Praça', 'Alimentação', 'account', 'expense', -4270),
  item(3, 'Conta de energia', 'Moradia', 'account', 'expense', -25302),
  item(4, 'Farmácia Vida', 'Saúde', 'credit-card', 'expense', -12680),
  item(4, 'Pix recebido', 'Renda', 'account', 'income', 42000),
  item(5, 'Posto Avenida', 'Transporte', 'account', 'expense', -21890),
  item(5, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -15600),
  item(6, 'Supermercado Horizonte', 'Alimentação', 'credit-card', 'expense', -29630),
  item(7, 'Internet fibra', 'Moradia', 'account', 'expense', -11990),
  item(8, 'Cinema', 'Lazer', 'credit-card', 'expense', -9200),
  item(9, 'Streaming', 'Serviços', 'credit-card', 'expense', -5590),
  item(10, 'Mercado Central', 'Alimentação', 'account', 'expense', -32870),
  item(12, 'Consulta clínica', 'Saúde', 'account', 'expense', -28000),
  item(13, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -23400),
  item(15, 'Transporte por aplicativo', 'Transporte', 'credit-card', 'expense', -4680),
  item(17, 'Supermercado Horizonte', 'Alimentação', 'credit-card', 'expense', -64720),
  item(19, 'Seguro residencial', 'Moradia', 'account', 'expense', -14550),
  item(21, 'Livraria do Centro', 'Lazer', 'credit-card', 'expense', -12800),
  item(23, 'Posto Avenida', 'Transporte', 'account', 'expense', -27300),
  item(25, 'Restaurante Quintal', 'Alimentação', 'credit-card', 'expense', -31800),
  item(27, 'Mercado Central', 'Alimentação', 'credit-card', 'expense', -42440),
  item(28, 'Pagamento da fatura', 'Transferência', 'account', 'transfer', -1018330),
]