
"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface P { price: number; recorded_at: string; retailer?: { name?: string } }
export function PriceHistoryChart({ data }: { data: P[] }) {
  const chartData = data.map(d => ({
    date:  new Date(d.recorded_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}),
    price: d.price,
  }))
  return (
    <section>
      <h2 className="section-title">Price History (30 days)</h2>
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top:4, right:4, bottom:0, left:0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize:11, fill:"var(--dim)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:"var(--dim)" }} axisLine={false} tickLine={false} width={48} tickFormatter={v=>`£${v}`} />
            <Tooltip contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }}
              labelStyle={{ color:"var(--text)", fontWeight:700 }} formatter={(v:number) => [`£${v.toFixed(2)}`,"Price"]} />
            <Line type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r:4, fill:"#7c3aed" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
