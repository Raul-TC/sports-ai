// components/OddsPanel.tsx
import { ExtendedMatchPrediction } from "@/lib/predictions";
import { MatchResult } from "@/utils/extractMatchResult";
import { Trophy, Calendar, Clock, TrendingUp, TrendingDown, Minus, Check, X } from "lucide-react";

interface OddsPanelProps {
    prediction: ExtendedMatchPrediction;
    homeTeam: string;
    awayTeam: string;
    results?: MatchResult;
    competitionName?: string;
}

// ---------- Subcomponentes ----------

function MarketRow({ label, prob, odd, isCorrect }: { label: string; prob: number; odd: number; isCorrect?: boolean }) {
    const getProbColor = (p: number) => {
        if (p >= 55) return "text-green-600 dark:text-green-400";
        if (p >= 45) return "text-amber-600 dark:text-amber-400";
        return "text-red-500 dark:text-red-400";
    };

    return (
        <div className="w-full relative">
            <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate flex items-center gap-1">
                    {label}
                    {isCorrect !== undefined && (
                        <span className="ml-1">
                            {isCorrect ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <X className="w-3 h-3 text-red-500" />
                            )}
                        </span>
                    )}
                </span>
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
                    className={`h-full rounded-full transition-all duration-300 ${isCorrect === undefined
                        ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                        : isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                    style={{ width: `${Math.min(prob, 100)}%` }}
                />
            </div>
            {isCorrect !== undefined && (
                <div className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-neutral-700 dark:bg-neutral-600 rounded-full px-1.5 py-0.5">
                    {isCorrect ? "✅" : "❌"}
                </div>
            )}
        </div>
    );
}

function MarketSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {children}
            </div>
        </div>
    );
}

function SummaryBadge({ label, value, color = "blue" }: { label: string; value: string | number; color?: "blue" | "green" | "amber" | "red" }) {
    const colorClasses = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
            {label}: {value}
        </span>
    );
}

// ---------- Componente principal ----------

export default function OddsPanel({ prediction, homeTeam, awayTeam, results, competitionName }: OddsPanelProps) {
    const { moneyline, btts, goalLines, corners, homeExpectedGoals, awayExpectedGoals, doubleChance, drawNoBet } = prediction;

    // Resumen de favorito
    const favorite = (() => {
        const { homeWin, draw, awayWin } = moneyline;
        if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return { team: homeTeam, prob: homeWin.prob };
        if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return { team: awayTeam, prob: awayWin.prob };
        return { team: "Empate", prob: moneyline.draw.prob };
    })();

    // Resumen de Over/Under más probable (línea 2.5)
    const goalLine25 = goalLines.find(gl => gl.line === 2.5);
    const overUnderPrediction = goalLine25 ? (goalLine25.overProb > goalLine25.underProb ? "Over 2.5" : "Under 2.5") : "N/A";

    // BTTS
    const bttsPrediction = btts.yes.prob > btts.no.prob ? "Sí" : "No";

    // EV (simplificado: si hay cuota y probabilidad, EV = prob * odd - 1)
    const calculateEV = (prob: number, odd: number) => {
        if (prob === 0 || odd === 0) return null;
        return (prob / 100) * odd - 1;
    };

    // Resultados reales (si existen)
    const hasResult = results !== undefined;
    const homeGoals = results?.homeScore ?? 0;
    const awayGoals = results?.awayScore ?? 0;
    const totalGoals = homeGoals + awayGoals;
    const bttsReal = homeGoals > 0 && awayGoals > 0;

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm space-y-5">
            {/* ===== ENCABEZADO ===== */}
            <div className="flex flex-col gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {competitionName && (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> {competitionName}
                        </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <SummaryBadge label="Favorito" value={favorite.team} color="blue" />
                        <SummaryBadge label="Goles esperados" value={(homeExpectedGoals + awayExpectedGoals).toFixed(2)} color="green" />
                        <SummaryBadge label="Córners esperados" value={corners.expectedTotal} color="amber" />
                        <SummaryBadge label="BTTS" value={bttsPrediction} color={bttsPrediction === "Sí" ? "green" : "red"} />
                        <SummaryBadge label="Over/Under" value={overUnderPrediction} color="blue" />
                    </div>
                </div>
                {hasResult && (
                    <div className="flex flex-wrap items-center gap-3 text-sm bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700">
                        <span className="font-medium text-neutral-700 dark:text-neutral-200">Resultado real:</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {homeTeam} {homeGoals} - {awayGoals} {awayTeam}
                        </span>
                        <span className="text-xs text-neutral-400">
                            Total: {totalGoals} goles · {bttsReal ? "BTTS ✅" : "BTTS ❌"}
                        </span>
                        <span className="text-xs text-neutral-400">
                            Córners: {results.homeCorners + results.awayCorners}
                        </span>
                    </div>
                )}
            </div>

            {/* ===== RESULTADO (1X2) ===== */}
            <MarketSection title="Resultado">
                <MarketRow
                    label={homeTeam}
                    prob={moneyline.homeWin.prob}
                    odd={moneyline.homeWin.odd}
                    isCorrect={hasResult ? results?.winner === "home" : undefined}
                />
                <MarketRow
                    label="Empate"
                    prob={moneyline.draw.prob}
                    odd={moneyline.draw.odd}
                    isCorrect={hasResult ? results?.winner === "draw" : undefined}
                />
                <MarketRow
                    label={awayTeam}
                    prob={moneyline.awayWin.prob}
                    odd={moneyline.awayWin.odd}
                    isCorrect={hasResult ? results?.winner === "away" : undefined}
                />
            </MarketSection>

            {/* ===== DOBLE OPORTUNIDAD (si existe) ===== */}
            {doubleChance && (
                <MarketSection title="Doble oportunidad">
                    <MarketRow
                        label={`1X (${homeTeam} o Empate)`}
                        prob={doubleChance.homeOrDraw.prob}
                        odd={doubleChance.homeOrDraw.odd}
                        isCorrect={hasResult ? (results?.winner === "home" || results?.winner === "draw") : undefined}
                    />
                    <MarketRow
                        label={`X2 (${awayTeam} o Empate)`}
                        prob={doubleChance.drawOrAway.prob}
                        odd={doubleChance.drawOrAway.odd}
                        isCorrect={hasResult ? (results?.winner === "away" || results?.winner === "draw") : undefined}
                    />
                    <MarketRow
                        label={`12 (${homeTeam} o ${awayTeam})`}
                        prob={doubleChance.noDraw.prob}
                        odd={doubleChance.noDraw.odd}
                        isCorrect={hasResult ? (results?.winner === "home" || results?.winner === "away") : undefined}
                    />
                </MarketSection>
            )}

            {/* ===== DRAW NO BET (si existe) ===== */}
            {drawNoBet && (
                <MarketSection title="Draw No Bet">
                    <MarketRow
                        label={homeTeam}
                        prob={drawNoBet.home.prob}
                        odd={drawNoBet.home.odd}
                        isCorrect={hasResult ? results?.winner === "home" : undefined}
                    />
                    <MarketRow
                        label={awayTeam}
                        prob={drawNoBet.away.prob}
                        odd={drawNoBet.away.odd}
                        isCorrect={hasResult ? results?.winner === "away" : undefined}
                    />
                </MarketSection>
            )}

            {/* ===== TOTAL DE GOLES ===== */}
            <MarketSection title="Total de goles">
                {goalLines.map((gl) => (
                    <div key={gl.line} className="space-y-1 col-span-1">
                        <div className="text-xs text-neutral-400 font-medium text-center">Línea {gl.line}</div>
                        <MarketRow
                            label="Over"
                            prob={gl.overProb}
                            odd={gl.overOdd}
                            isCorrect={hasResult ? (totalGoals > gl.line) : undefined}
                        />
                        <MarketRow
                            label="Under"
                            prob={gl.underProb}
                            odd={gl.underOdd}
                            isCorrect={hasResult ? (totalGoals < gl.line) : undefined}
                        />
                    </div>
                ))}
            </MarketSection>

            {/* ===== BTTS ===== */}
            <MarketSection title="Ambos anotan">
                <MarketRow
                    label="Sí"
                    prob={btts.yes.prob}
                    odd={btts.yes.odd}
                    isCorrect={hasResult ? bttsReal : undefined}
                />
                <MarketRow
                    label="No"
                    prob={btts.no.prob}
                    odd={btts.no.odd}
                    isCorrect={hasResult ? !bttsReal : undefined}
                />
            </MarketSection>

            {/* ===== CÓRNERS ===== */}
            <MarketSection title="Córners">
                {corners.lines.map((cl) => (
                    <div key={cl.line} className="space-y-1 col-span-1">
                        <div className="text-xs text-neutral-400 font-medium text-center">Línea {cl.line}</div>
                        <MarketRow
                            label="Over"
                            prob={cl.overProb}
                            odd={cl.overOdd}
                            isCorrect={hasResult ? (results.homeCorners + results.awayCorners > cl.line) : undefined}
                        />
                        <MarketRow
                            label="Under"
                            prob={cl.underProb}
                            odd={cl.underOdd}
                            isCorrect={hasResult ? (results.homeCorners + results.awayCorners < cl.line) : undefined}
                        />
                    </div>
                ))}
            </MarketSection>

            {/* ===== VALOR ESPERADO (EV) ===== */}
            {/* <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                    Valor esperado (EV) de los mercados principales
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                        { label: `${homeTeam}`, prob: moneyline.homeWin.prob, odd: moneyline.homeWin.odd },
                        { label: `Empate`, prob: moneyline.draw.prob, odd: moneyline.draw.odd },
                        { label: `${awayTeam}`, prob: moneyline.awayWin.prob, odd: moneyline.awayWin.odd },
                        { label: `BTTS Sí`, prob: btts.yes.prob, odd: btts.yes.odd },
                        { label: `BTTS No`, prob: btts.no.prob, odd: btts.no.odd },
                        { label: `Over 2.5`, prob: goalLine25?.overProb || 0, odd: goalLine25?.overOdd || 0 },
                    ].map((item, idx) => {
                        const ev = calculateEV(item.prob, item.odd);
                        if (ev === null) return null;
                        return (
                            <div key={idx} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 rounded px-2 py-1">
                                <span className="text-neutral-600 dark:text-neutral-300 truncate">{item.label}</span>
                                <span className={`font-mono font-bold ${ev > 0 ? 'text-green-600 dark:text-green-400' : ev < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>
                                    {(ev * 100).toFixed(1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                    EV positivo (%) indica valor potencial. Ten en cuenta que las cuotas incluyen margen de la casa.
                </p>
            </div> */}

            {/* ===== NOTA LEGAL ===== */}
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-2">
                Cuotas calculadas con modelo de Poisson, sin margen de casa de apuestas. Es un modelo
                estadístico, no una garantía de resultado. Consulta las condiciones de cada casa de apuestas.
            </p>
        </div>
    );
}