
"use client"
import type { PortfolioRow, PortfolioSummary } from "@/types"
import { formatPrice } from "@/lib/utils/format"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface Props { portfolio: PortfolioRow[]; summary: PortfolioSummary }

export function PortfolioDashboard({ portfolio, summary }: Props) {
  const pnlPositive = summary.unrealisedPnl >= 0

  if (!portfolio.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">💹</div>
        <h3 className="text-lg font-bold mb-2" style={{ color:"var(--text)" }}>No collection data yet</h3>
        <p className="text-sm" style={{ color:"var(--muted)" }}>Add items to your collection to see portfolio performance here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total Value",   value:formatPrice(summary.totalCurrentValue), color:"var(--green)" },
          { label:"Cost Basis",    value:formatPrice(summary.totalCostBasis),    color:"var(--text)"  },
          { label:"Unrealised P&L",value:`${pnlPositive?"+":""}${formatPrice(summary.unrealisedPnl)}`, color:pnlPositive?"var(--green)":"var(--red)" },
          { label:"ROI",           value:`${pnlPositive?"+":""}${summary.roiPct.toFixed(1)}%`, color:pnlPositive?"var(--green)":"var(--red)" },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="text-2xl font-black" style={{ color:s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color:"var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        {summary.categoryBreakdown.length > 0 && (
          <div className="card p-6">
            <h3 className="section-title">By Category</h3>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={summary.categoryBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                      {summary.categoryBreakdown.map((entry, i) => (
                        <Cell key={`cell-${i}`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v:number) => formatPrice(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {summary.categoryBreakdown.map(cat => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:cat.color }} />
                      <span style={{ color:"var(--text)" }}>{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color:"var(--text)" }}>{formatPrice(cat.value)}</div>
                      <div className={`text-xs ${cat.pnl>=0?"text-gain":"text-loss"}`}>
                        {cat.pnl>=0?"+":""}{formatPrice(cat.pnl)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Holdings table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor:"var(--border)" }}>
            <h3 className="section-title mb-0">All Holdings</h3>
          </div>
          <div className="divide-y overflow-y-auto max-h-80" style={{ borderColor:"var(--border)" }}>
            {portfolio.map(row => {
              const pnl = row.unrealised_pnl ?? 0
              return (
                <div key={`${row.user_id}-${row.product_id}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{row.product_name}</div>
                    <div className="text-xs" style={{ color:"var(--muted)" }}>{row.category_name} · Qty {row.quantity_owned}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color:"var(--text)" }}>{formatPrice(row.current_value_total)}</div>
                    <div className={`text-xs ${pnl>=0?"text-gain":"text-loss"}`}>
                      {pnl>=0?"+":""}{formatPrice(pnl)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
