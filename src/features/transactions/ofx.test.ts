import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decodeOfxBuffer, mergeTransactions, parseOfxText } from './ofx'

function readOfx(path: string): string {
  const buffer = readFileSync(new URL(path, import.meta.url))
  const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  return decodeOfxBuffer(data)
}

const accountOfx = readOfx('../../../extratos/extrato_092026.ofx')
const cardOfx = readOfx('../../../extratos/OUROCARD_VISA_INFINITE-Set_26.ofx')

describe('importação OFX', () => {
  it('reconhece e normaliza transações da conta corrente', () => {
    const parsed = parseOfxText(accountOfx)
    expect(parsed.source).toBe('account')
    expect(parsed.transactions.length).toBeGreaterThan(30)
    expect(parsed.transactions.some((transaction) => transaction.kind === 'transfer')).toBe(true)
    expect(parsed.transactions.every((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(transaction.date))).toBe(true)
    expect(parsed.coverage).toMatchObject({ source: 'account', start: '2026-09-30', end: '2026-10-06' })
  })

  it('reconhece compras, estornos e pagamento no OFX do cartão', () => {
    const parsed = parseOfxText(cardOfx)
    expect(parsed.source).toBe('credit-card')
    expect(parsed.transactions.some((transaction) => transaction.kind === 'expense')).toBe(true)
    expect(parsed.transactions.some((transaction) => transaction.kind === 'refund')).toBe(true)
    expect(parsed.transactions.some((transaction) => transaction.kind === 'transfer')).toBe(true)
    expect(parsed.transactions.some((transaction) => transaction.fitId)).toBe(true)
    expect(parsed.coverage).toMatchObject({ source: 'credit-card', start: '2025-11-03', end: '2026-08-30' })
  })

  it('remove duplicatas pelo identificador da transação', () => {
    const transaction = parseOfxText(cardOfx).transactions[0]
    expect(mergeTransactions([transaction], [transaction])).toHaveLength(1)
  })

  it('classifica os pagamentos da fatura como transferência, não como despesa', () => {
    const transactions = [
      ...parseOfxText(accountOfx).transactions,
      ...parseOfxText(cardOfx).transactions,
    ]
    const invoicePayments = transactions.filter((transaction) =>
      transaction.kind === 'transfer' && /pagto|pgto/i.test(transaction.description),
    )

    expect(invoicePayments).toHaveLength(2)
    for (const payment of invoicePayments) expect(payment.kind).not.toBe('expense')
  })
})