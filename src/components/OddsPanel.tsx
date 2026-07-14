import { ExtendedMatchPrediction } from "@/lib/predictions";

interface OddsPanelProps {
    prediction: ExtendedMatchPrediction;
    homeTeam: string;
    awayTeam: string;
}

function MarketRow({ label, prob, odd }: { label: string; prob: number; odd: number }) {
    const getProbColor = (p: number) => {
        if (p >= 55) return "text-green-600 dark:text-green-400";
        if (p >= 45) return "text-amber-600 dark:text-amber-400";
        return "text-red-500 dark:text-red-400";
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate">{label}</span>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className={`font-bold tabular-nums ${getProbColor(prob)}`}>
                        {prob}%
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                        {odd}
                    </span>
                </div>
            </div>
            <div className="w-full h-1.5 mt-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.min(prob, 100)}%` }}
                />
            </div>
        </div>
    );
}

function MarketSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {children}
            </div>
        </div>
    );
}

export default function OddsPanel({ prediction, homeTeam, awayTeam }: OddsPanelProps) {
    const { moneyline, btts, goalLines, corners, homeExpectedGoals, awayExpectedGoals } = prediction;

    const favorite = (() => {
        const { homeWin, draw, awayWin } = moneyline;
        if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return homeTeam;
        if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return awayTeam;
        return "Empate";
    })();

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm space-y-5 sm:space-y-6 sm:h-auto">
            {/* Header resumido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800 sm:h-auto">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-200">{homeTeam}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{homeExpectedGoals}</span>
                        <span className="text-neutral-400">xG</span>
                    </span>
                    <span className="text-neutral-300">vs</span>
                    <span className="flex items-center gap-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-200">{awayTeam}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{awayExpectedGoals}</span>
                        <span className="text-neutral-400">xG</span>
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-neutral-500">
                        <span className="font-medium">Córners</span>
                        <span className="text-indigo-600 font-bold">{corners.expectedTotal}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                        ⭐ {favorite}
                    </span>
                </div>
            </div>

            <MarketSection title="Resultado">
                <MarketRow label={homeTeam} prob={moneyline.homeWin.prob} odd={moneyline.homeWin.odd} />
                <MarketRow label="Empate" prob={moneyline.draw.prob} odd={moneyline.draw.odd} />
                <MarketRow label={awayTeam} prob={moneyline.awayWin.prob} odd={moneyline.awayWin.odd} />
            </MarketSection>

            <MarketSection title="Ambos anotan">
                <MarketRow label="Sí" prob={btts.yes.prob} odd={btts.yes.odd} />
                <MarketRow label="No" prob={btts.no.prob} odd={btts.no.odd} />
            </MarketSection>

            <MarketSection title="Total de goles">
                {goalLines.map((gl) => (
                    <div key={gl.line} className="space-y-1 col-span-1">
                        <div className="text-xs text-neutral-400 font-medium text-center">Línea {gl.line}</div>
                        <MarketRow label="Over" prob={gl.overProb} odd={gl.overOdd} />
                        <MarketRow label="Under" prob={gl.underProb} odd={gl.underOdd} />
                    </div>
                ))}
            </MarketSection>

            <MarketSection title="Corners">
                {corners.lines.map((cl) => (
                    <div key={cl.line} className="space-y-1 col-span-1">
                        <div className="text-xs text-neutral-400 font-medium text-center">Línea {cl.line}</div>
                        <MarketRow label="Over" prob={cl.overProb} odd={cl.overOdd} />
                        <MarketRow label="Under" prob={cl.underProb} odd={cl.underOdd} />
                    </div>
                ))}
            </MarketSection>

            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-2">
                Cuotas calculadas con modelo de Poisson, sin margen de casa de apuestas. Es un modelo
                estadístico, no una garantía de resultado.
            </p>
        </div>
    );
}