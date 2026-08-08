// components/ParlayCard.tsx
import { Parlay } from '@/types/engineTypes';

export function ParlayCard({ parlay }: { parlay: Parlay }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    🎯 Parlay {parlay.id}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${parlay.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    parlay.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    Riesgo {parlay.riskLevel}
                </span>
            </div>

            <div className="mt-2 space-y-1">
                {parlay.picks.map((pick, idx) => (
                    <div key={idx} className="text-xs flex justify-between items-center border-b border-gray-100 dark:border-neutral-800 pb-1">
                        <span>
                            <span className="font-medium">{pick.homeTeam} vs {pick.awayTeam}</span>
                            <span className="text-gray-500 ml-1">· {pick.market}</span>
                            <span className="font-bold ml-1">{pick.selection}</span>
                        </span>
                        <span className="text-gray-500">{pick.odd.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Cuota total: {parlay.totalOdd.toFixed(2)}
                </span>
                <span className="text-gray-500">
                    EV: {(parlay.totalEV * 100).toFixed(1)}%
                </span>
                <span className="text-gray-500">
                    Acierto: {(parlay.estimatedWinRate * 100).toFixed(1)}%
                </span>
            </div>

            <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                {parlay.reasoning}
            </div>
        </div>
    );
}