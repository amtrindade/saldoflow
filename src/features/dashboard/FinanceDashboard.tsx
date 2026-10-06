import { useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, ChartNoAxesCombined, CreditCard, LayoutDashboard, Landmark, Upload, WalletCards } from 'lucide-react'
import { decodeOfxBuffer, mergeTransactions, parseOfxText } from '../transactions/ofx'
import { demoTransactions } from '../transactions/demo'
import { filterTransactions, summarizeTransactions } from '../transactions/metrics'
import type { PeriodMode, PeriodSelection, SourceFilter } from '../transactions/metrics'
import type { Transaction } from '../transactions/types'
import { CashFlowChart, CategoryChart, ChannelChart, ExpensesTable, IncomeTable } from './DashboardCharts'
import './FinanceDashboard.css'

function currentDate(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function initialPeriod(): PeriodSelection {
  const today = currentDate()
  const month = today.slice(0, 7)
  return { mode: 'month', day: today, month, start: `${month}-01`, end: today }
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions)
  const [isDemo, setIsDemo] = useState(true)
  const [period, setPeriod] = useState<PeriodSelection>(initialPeriod)
  const [source, setSource] = useState<SourceFilter>('all')
  const [importStatus, setImportStatus] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const visibleTransactions = filterTransactions(transactions, period, source)
  const summary = summarizeTransactions(visibleTransactions)

  async function importFiles(files: FileList | null) {
    if (!files?.length) return
    setIsImporting(true)
    setImportStatus('')
    try {
      const groups = await Promise.all(Array.from(files).map(async (file) => {
        const text = decodeOfxBuffer(await file.arrayBuffer())
        return parseOfxText(text).transactions
      }))
      const incoming = mergeTransactions(...groups)
      const combined = isDemo ? incoming : mergeTransactions(transactions, incoming)
      const latestMonth = combined[0]?.date.slice(0, 7)
      setTransactions(combined)
      setIsDemo(false)
      setSource('all')
      if (latestMonth) setPeriod((current) => ({ ...current, mode: 'month', month: latestMonth }))
      setImportStatus(`${incoming.length} lançamentos lidos de ${files.length} arquivo${files.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Não foi possível ler os arquivos selecionados.')
    } finally {
      setIsImporting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function updateRange(field: 'start' | 'end', value: string) {
    setPeriod((current) => ({ ...current, [field]: value }))
  }

  function changeMode(mode: PeriodMode) {
    setPeriod((current) => ({ ...current, mode }))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="SaldoFlow, visão geral"><span className="brand-mark"><WalletCards size={20} strokeWidth={1.8} /></span><span>SaldoFlow<span className="brand-period">.</span></span></a>
        <div className="sidebar-label">ESPAÇO PESSOAL</div>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className="nav-link active" href="#overview"><LayoutDashboard size={17} />Visão geral</a>
          <a className="nav-link" href="#analysis"><ChartNoAxesCombined size={17} />Análises</a>
          <a className="nav-link" href="#transactions"><ArrowDownToLine size={17} />Despesas</a>
          <a className="nav-link" href="#incomes"><ArrowDownToLine size={17} />Receitas</a>
        </nav>
        <div className="sidebar-bottom"><span className="local-indicator" />Arquivos processados localmente</div>
      </aside>

      <main className="main-content" id="overview">
        <header className="page-header">
          <div className="header-title"><a className="mobile-menu" href="#overview" aria-label="Ir para a visão geral"><WalletCards size={18} /></a><div><p className="eyebrow">PAINEL FINANCEIRO</p><h1>Visão geral</h1></div></div>
          <div className="header-actions">
            {isDemo && <span className="demo-badge"><span />Demonstração</span>}
            <input ref={inputRef} className="visually-hidden" type="file" accept=".ofx,application/x-ofx" aria-label="Selecionar extratos OFX" multiple onChange={(event) => void importFiles(event.currentTarget.files)} />
            <button className="import-button" type="button" onClick={() => inputRef.current?.click()} disabled={isImporting}><Upload size={16} />{isImporting ? 'Importando...' : 'Importar OFX'}</button>
          </div>
        </header>

        <section className="toolbar" aria-label="Filtros do painel">
          <div className="period-tools">
            <div className="segmented-control" role="group" aria-label="Período">
              <button type="button" aria-pressed={period.mode === 'day'} className={period.mode === 'day' ? 'selected' : ''} onClick={() => changeMode('day')}>Dia</button>
              <button type="button" aria-pressed={period.mode === 'month'} className={period.mode === 'month' ? 'selected' : ''} onClick={() => changeMode('month')}>Mês</button>
              <button type="button" aria-pressed={period.mode === 'custom'} className={period.mode === 'custom' ? 'selected' : ''} onClick={() => changeMode('custom')}>Personalizado</button>
            </div>
            {period.mode === 'month' && <label className="date-field"><span className="visually-hidden">Mês do painel</span><input type="month" value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: event.target.value }))} /></label>}
            {period.mode === 'day' && <label className="date-field"><span className="visually-hidden">Dia do painel</span><input type="date" value={period.day} onChange={(event) => setPeriod((current) => ({ ...current, day: event.target.value }))} /></label>}
            {period.mode === 'custom' && <div className="range-fields"><label><span className="visually-hidden">Data inicial</span><input type="date" value={period.start} onChange={(event) => updateRange('start', event.target.value)} /></label><span>até</span><label><span className="visually-hidden">Data final</span><input type="date" value={period.end} onChange={(event) => updateRange('end', event.target.value)} /></label></div>}
          </div>
          <div className="source-switch" role="group" aria-label="Filtrar despesas por origem">
            <button type="button" aria-pressed={source === 'all'} className={source === 'all' ? 'selected' : ''} onClick={() => setSource('all')}>Todas</button>
            <button type="button" aria-pressed={source === 'account'} className={source === 'account' ? 'selected' : ''} onClick={() => setSource('account')}><Landmark size={14} />Débito em conta</button>
            <button type="button" aria-pressed={source === 'credit-card'} className={source === 'credit-card' ? 'selected' : ''} onClick={() => setSource('credit-card')}><CreditCard size={14} />Cartão</button>
          </div>
        </section>

        {importStatus && <p className={`import-status ${importStatus.includes('lidos') ? 'success' : 'error'}`} role="status">{importStatus}</p>}

        <section className="kpi-grid" aria-label="Indicadores do período">
          <article className="kpi-card income-kpi"><div className="kpi-heading"><span>Receita total</span><span className="kpi-icon"><ArrowDownToLine size={17} /></span></div><strong>{formatCurrency(summary.incomeCents)}</strong><span className="kpi-note">Entradas no período</span></article>
          <article className="kpi-card expense-kpi"><div className="kpi-heading"><span>Despesa total</span><span className="kpi-icon"><ArrowUpRight size={17} /></span></div><strong>{formatCurrency(summary.expenseCents)}</strong><span className="kpi-note">{expenseSourceNote(source)}</span></article>
          <article className="kpi-card balance-kpi"><div className="kpi-heading"><span>Saldo do período</span><span className="kpi-icon"><WalletCards size={17} /></span></div><strong>{formatCurrency(summary.balanceCents)}</strong><span className="kpi-note">Receitas menos despesas</span></article>
          <article className="kpi-card savings-kpi"><div className="kpi-heading"><span>Taxa de poupança</span><span className="kpi-icon"><ChartNoAxesCombined size={17} /></span></div><strong>{summary.savingsRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><span className="kpi-note">Do total de receitas</span></article>
        </section>

        <section className="charts-grid" id="analysis" aria-label="Análises do período">
          <CashFlowChart transactions={visibleTransactions} /><CategoryChart transactions={visibleTransactions} />
        </section>
        <ChannelChart transactions={visibleTransactions} />
        <IncomeTable transactions={visibleTransactions} />
        <ExpensesTable transactions={visibleTransactions} />
        <footer className="page-footer">Importação local · OFX 1.02 · Pagamentos de fatura não entram como despesa</footer>
      </main>
    </div>
  )
}

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountCents / 100)
}

function expenseSourceNote(source: SourceFilter): string {
  if (source === 'account') return 'Débitos diretos em conta'
  if (source === 'credit-card') return 'Compras no cartão'
  return 'Cartão e débitos em conta'
}