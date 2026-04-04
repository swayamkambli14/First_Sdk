import { useState } from 'react';
import { DEMO_POINTS_HISTORY } from '../../lib/mockData';

type Filter = 'all' | 'earn' | 'spend';

export default function PointsHistoryTable() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = DEMO_POINTS_HISTORY.filter((r) =>
    filter === 'all' ? true : r.type === filter
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Points History</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
            Demo Data
          </span>
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {(['all', 'earn', 'spend'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-mono capitalize transition-colors min-h-[32px] ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Date</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Event</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.date}</td>
                  <td className="px-4 py-3 font-['DM_Sans'] text-sm text-gray-300">{row.event}</td>
                  <td className={`px-4 py-3 text-right font-['Space_Mono'] text-sm font-bold ${
                    row.amount > 0 ? 'text-amber-400' : row.amount < 0 ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {row.amount > 0 ? '+' : ''}{row.amount !== 0 ? row.amount : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-['Space_Mono'] text-sm text-white">
                    {row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
