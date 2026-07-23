import { TrapResult, Pick, WarningsAndExclusions } from "@/types";
import { ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { getOddsCategory } from "@/utils/odds";

interface RiskSectionProps {
    trap: TrapResult;
    warnings: WarningsAndExclusions;
    bestPick: Pick | null;
    ratoneras: Pick[];
    medias: Pick[];
    altas: Pick[];
    plays: Pick[];
}

export function RiskSection({
    trap,
    warnings,
    bestPick,
    ratoneras,
    medias,
    altas,
    plays,
}: RiskSectionProps) {
    const trapLevelColor =
        trap.level === "high"
            ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
            : trap.level === "medium"
                ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                : trap.level === "low"
                    ? "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                    : "hidden";

    return (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Riesgo y Pick Recomendado
                        </span>
                        {trap.level === "high" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700">
                                ALTO
                            </span>
                        )}
                        {trap.level === "medium" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                                MEDIO
                            </span>
                        )}
                        {trap.level === "low" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700">
                                BAJO
                            </span>
                        )}
                        {trap.level === "none" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700">
                                BAJO
                            </span>
                        )}
                    </div>

                    {trap.isTrap && trap.details.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">⚠️ </span>
                            {trap.details.map(d => `${d.team}: ${d.reason}`).join(" · ")}
                        </div>
                    )}

                    {warnings.warnings.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                            {warnings.warnings.map((warning, idx) => (
                                <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                    <span>{warning}</span>
                                </div>
                            ))}
                            {warnings.excludedMarkets.length > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    🚫 Mercados excluidos: {warnings.excludedMarkets.join(", ")}
                                </div>
                            )}
                        </div>
                    )}

                    {bestPick && (
                        <div className="flex flex-wrap items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{bestPick.market}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{bestPick.selection}</span>
                            <span className="text-gray-500 dark:text-gray-400">Cuota {bestPick.odd} · EV {(bestPick.ev * 100).toFixed(1)}%</span>
                            <span className="text-gray-400 text-[10px]">{bestPick.reason}</span>
                            {getOddsCategory(bestPick) === "ratonera" && (
                                <span className="text-[10px] bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">Ratonera</span>
                            )}
                            {getOddsCategory(bestPick) === "media" && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Media</span>
                            )}
                        </div>
                    )}

                    {ratoneras.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔹 Ratoneras (≤1.30)</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {ratoneras.map((pick, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-full px-2 py-0.5">
                                        <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                        <span className="text-gray-400">Cuota {pick.odd}</span>
                                        <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {medias.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔸 Medias (1.30 - 1.8)</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {medias.map((pick, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                                        <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                        <span className="text-gray-400">Cuota {pick.odd}</span>
                                        <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {altas.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔶 Altas (1.8 - 2.5)</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {altas.map((pick, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                                        <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                        <span className="text-gray-400">Cuota {pick.odd}</span>
                                        <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {ratoneras.length === 0 && medias.length === 0 && altas.length === 0 && plays.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jugadas alternativas</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {plays.map((play, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-2 py-0.5">
                                        <span className="text-gray-600 dark:text-gray-300">{play.market}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{play.selection}</span>
                                        <span className="text-gray-400">Cuota {play.odd}</span>
                                        <span className="text-green-600 font-medium">EV {(play.ev * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!bestPick && ratoneras.length === 0 && medias.length === 0 && plays.length === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            No hay picks con cuota razonable y valor positivo.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}