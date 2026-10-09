import { parseStrict } from 'ofx-js'
import type { StatementCoverage, Transaction, TransactionKind, TransactionSource } from './types'

interface OfxRecord {
  TRNTYPE?: string
  DTPOSTED?: string
  TRNAMT?: string
  FITID?: string
  NAME?: string
  MEMO?: string
}

interface OfxStatement {
  BANKTRANLIST?: { DTSTART?: string; DTEND?: string; STMTTRN?: OfxRecord | OfxRecord[] }
}

interface OfxRoot {
  OFX?: {
    BANKMSGSRSV1?: { STMTTRNRS?: { STMTRS?: OfxStatement } }
    CREDITCARDMSGSRSV1?: { CCSTMTTRNRS?: { CCSTMTRS?: OfxStatement } }
  }
}

export interface ParsedOfxFile {
  source: TransactionSource
  transactions: Transaction[]
  coverage?: StatementCoverage
}

const categoryColors: Record<string, string> = {
  Alimentação: '#df765d',
  Moradia: '#4e7f71',
  Transporte: '#d2a64d',
  Saúde: '#648ba0',
  Serviços: '#889b5b',
  Lazer: '#b47e9c',
  Outros: '#75818a',
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

function getCategory(description: string): string {
  const text = normalizeText(description)
  if (/mercado|supermerc|zaffari|carrefour|basso|minimercado/.test(text)) return 'Alimentação'
  if (/restaurante|cafe|bar |ginkgo|ifd|ifood|parma|churrascaria/.test(text)) return 'Alimentação'
  if (/aluguel|guarida|imobili|ceee|energia|supergas|telefon|internet|agua/.test(text)) return 'Moradia'
  if (/uber|posto|combust|estacion|99app|transporte/.test(text)) return 'Transporte'
  if (/farm|clinica|hospital|medic|saude/.test(text)) return 'Saúde'
  if (/netflix|spotify|github|google|seguro|youtube|assinatura/.test(text)) return 'Serviços'
  if (/cinema|parque|academia|esporte|viagem/.test(text)) return 'Lazer'
  return 'Outros'
}

function transactionKind(source: TransactionSource, amountCents: number, description: string): TransactionKind {
  const text = normalizeText(description)
  const isCardPayment = /(pagto|pagamento|payment).*(cartao|fatura|conta)|pgto.*debito.*conta/.test(text)
  if (isCardPayment) return 'transfer'
  if (source === 'account' && /pagto cartao|pagamento cartao|fatura do cartao/.test(text)) return 'transfer'
  if (/estorno|reembolso|devolucao|pix rejeitado|pix nao efetuado/.test(text)) return 'refund'
  if (source === 'credit-card' && amountCents > 0) return 'refund'
  return amountCents < 0 ? 'expense' : 'income'
}

function dateFromOfx(value: string | undefined): string | undefined {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined
}

function mapRecord(record: OfxRecord, source: TransactionSource): Transaction | undefined {
  const date = dateFromOfx(record.DTPOSTED)
  const amount = Number(record.TRNAMT)
  const name = record.NAME?.trim() ?? ''
  const memo = record.MEMO?.trim() ?? ''
  const description = [name, memo].filter(Boolean).join(' · ')
  if (!date || !Number.isFinite(amount) || amount === 0 || !description) return undefined
  if (/^saldo (anterior|final)|^s\s*a\s*l\s*d\s*o\b/i.test(name)) return undefined

  const amountCents = Math.round(amount * 100)
  const kind = transactionKind(source, amountCents, description)
  const fitId = record.FITID?.trim() || undefined
  const id = fitId
    ? `${source}:${fitId}`
    : `${source}:${date}:${amountCents}:${normalizeText(description)}:${kind}`

  return { id, fitId, date, description, category: getCategory(description), source, kind, amountCents }
}

function asRecords(value: OfxRecord | OfxRecord[] | undefined): OfxRecord[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function parseOfxText(text: string): ParsedOfxFile {
  const root = (parseStrict(text) as unknown as OfxRoot).OFX
  const bankStatement = root?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS
  const cardStatement = root?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS
  if (Boolean(bankStatement) === Boolean(cardStatement)) {
    throw new Error('O arquivo não contém uma estrutura OFX de conta ou cartão reconhecida.')
  }

  const source: TransactionSource = cardStatement ? 'credit-card' : 'account'
  const statement = cardStatement ?? bankStatement
  const records = asRecords(statement?.BANKTRANLIST?.STMTTRN)
  const transactions = records
    .map((record) => mapRecord(record, source))
    .filter((transaction): transaction is Transaction => transaction !== undefined)
  if (transactions.length === 0) throw new Error('Nenhuma transação válida foi encontrada no arquivo OFX.')
  const start = dateFromOfx(statement?.BANKTRANLIST?.DTSTART)
  const end = dateFromOfx(statement?.BANKTRANLIST?.DTEND)
  const coverage = start && end && start <= end ? { source, start, end } : undefined
  return { source, transactions, coverage }
}

export function decodeOfxBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const header = new TextDecoder('ascii').decode(bytes.slice(0, 2048))
  const charset = header.match(/^CHARSET:\s*([^\r\n]+)/im)?.[1]?.trim().toUpperCase()
  const encoding = header.match(/^ENCODING:\s*([^\r\n]+)/im)?.[1]?.trim().toUpperCase()
  const label = charset && charset !== 'NONE'
    ? charset === '1252' ? 'windows-1252' : charset
    : encoding === 'UTF-8' ? 'utf-8' : 'windows-1252'
  return new TextDecoder(label).decode(bytes)
}

export function mergeTransactions(...groups: Transaction[][]): Transaction[] {
  const unique = new Map<string, Transaction>()
  for (const transaction of groups.flat()) unique.set(transaction.id, transaction)
  return [...unique.values()].sort((left, right) => right.date.localeCompare(left.date))
}

export function categoryColor(category: string): string {
  return categoryColors[category] ?? categoryColors.Outros
}