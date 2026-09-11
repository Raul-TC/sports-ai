"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Target } from "lucide-react";
import { EnrichedPrediction } from "@/utils/enrichPredictions";

interface Props {
    predictions: EnrichedPrediction[];
}

type MarketKey = "btts" | "over25" | "winner";

interface RowData {
    matchUrl: string;
    matchName: string;
    competitionName: string;
    homeTeam: string;
    awayTeam: string;

    // Actual
    homeScore: number;
    awayScore: number;
    actualBTTS: boolean;
    actualOver25: boolean;
    actualWinner: "home" | "away" | "draw";

    // Predicciones
    predBTTS: boolean;
    predBTTSProb: number;
    predOver25: boolean;
    predOver25Prob: number;
    predWinner: "home" | "away" | "draw";
    predWinnerProb: number;

    // Aciertos
    hitBTTS: boolean;
    hitOver25: boolean;
    hitWinner: boolean;
}

const getWinner = (h: number, a: number): "home" | "away" | "draw" =>
    h > a ? "home" : a > h ? "away" : "draw";

const winnerLabel = (w: "home" | "away" | "draw", home: string, away: string) =>
    w === "home" ? home : w === "away" ? away : "Empate";

export default function PredictionsSummaryTable({ predictions }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [filter, setFilter] = useState<"all" | "hit" | "miss">("all");

    const rows = useMemo<RowData[]>(() => {
        return predictions
            .filter((p) => p.result && p.result.homeScore != null && p.result.awayScore != null)
            .map((p) => {
                const homeScore = p.result!.homeScore;
                const awayScore = p.result!.awayScore;

                const actualBTTS = homeScore > 0 && awayScore > 0;
                const actualOver25 = homeScore + awayScore > 2.5;
                const actualWinner = getWinner(homeScore, awayScore);

                // Predicciones
                const predBTTSProb = p.prediction.btts?.yes?.prob ?? 0;
                const predBTTS = predBTTSProb >= 50;

                // Buscar Over 2.5 en goalLines
                let predOver25 = false;
                let predOver25Prob = 0;
                const goalLines: any[] = (p.prediction as any).goalLines ?? [];
                const line25 = goalLines.find((g: any) => g.line === 2.5);
                if (line25) {
                    predOver25Prob = line25.overProb ?? 0;
                    predOver25 = predOver25Prob >= 50;
                }

                // Winner predicho
                const ml = p.prediction.moneyline;
                const winnerProbs = [
                    { key: "home" as const, prob: ml.homeWin?.prob ?? 0 },
                    { key: "draw" as const, prob: ml.draw?.prob ?? 0 },
                    { key: "away" as const, prob: ml.awayWin?.prob ?? 0 },
                ];
                const top = winnerProbs.reduce((a, b) => (a.prob > b.prob ? a : b));
                const predWinner = top.key;
                const predWinnerProb = top.prob;

                return {
                    matchUrl: p.matchUrl,
                    matchName: `${p.home.teamName} vs ${p.away.teamName}`,
                    competitionName: p.competitionName ?? "—",
                    homeTeam: p.home.teamName,
                    awayTeam: p.away.teamName,
                    homeScore,
                    awayScore,
                    actualBTTS,
                    actualOver25,
                    actualWinner,
                    predBTTS,
                    predBTTSProb,
                    predOver25,
                    predOver25Prob,
                    predWinner,
                    predWinnerProb,
                    hitBTTS: predBTTS === actualBTTS,
                    hitOver25: predOver25 === actualOver25,
                    hitWinner: predWinner === actualWinner,
                };
            });
    }, [predictions]);

    const stats = useMemo(() => {
        const total = rows.length;
        const hitBTTS = rows.filter((r) => r.hitBTTS).length;
        const hitOver25 = rows.filter((r) => r.hitOver25).length;
        const hitWinner = rows.filter((r) => r.hitWinner).length;
        return {
            total,
            hitBTTS,
            hitOver25,
            hitWinner,
            pctBTTS: total ? (hitBTTS / total) * 100 : 0,
            pctOver25: total ? (hitOver25 / total) * 100 : 0,
            pctWinner: total ? (hitWinner / total) * 100 : 0,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (filter === "hit") return rows.filter((r) => r.hitBTTS && r.hitOver25 && r.hitWinner);
        if (filter === "miss") return rows.filter((r) => !r.hitBTTS || !r.hitOver25 || !r.hitWinner);
        return rows;
    }, [rows, filter]);

    if (rows.length === 0) return null;

    return (
        <div className="mt-6 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition"
            >
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">
                        Resumen de aciertos
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                        {rows.length} partidos con resultado
                    </span>
                </div>
                <span className="ml-auto text-xs text-gray-400 dark:text-neutral-500">
                    {expanded ? "Ocultar" : "Ver detalle"}
                </span>
            </button>

            {/* Stats resumen (siempre visible) */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                <StatCard
                    label="Ambos Anotan"
                    hits={stats.hitBTTS}
                    total={stats.total}
                    pct={stats.pctBTTS}
                    color="indigo"
                />
                <StatCard
                    label="Over 2.5"
                    hits={stats.hitOver25}
                    total={stats.total}
                    pct={stats.pctOver25}
                    color="emerald"
                />
                <StatCard
                    label="Ganador"
                    hits={stats.hitWinner}
                    total={stats.total}
                    pct={stats.pctWinner}
                    color="amber"
                />
            </div>

            {/* Tabla detalle */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-neutral-800">
                    {/* Filtro */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Filtrar:</span>
                        {[
                            { key: "all", label: "Todos" },
                            { key: "hit", label: "✅ Todo acertado" },
                            { key: "miss", label: "❌ Con fallos" },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key as any)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition ${filter === f.key
                                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        <span className="ml-auto text-[10px] text-gray-400">
                            {filteredRows.length} filas
                        </span>
                    </div>

                    {/* Tabla scroll */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 dark:bg-neutral-800/60 sticky top-0">
                                <tr className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                                    <th className="text-left px-3 py-2 font-semibold">Partido</th>
                                    <th className="text-center px-3 py-2 font-semibold">Resultado</th>
                                    <th className="text-center px-3 py-2 font-semibold">
                                        <span className="inline-flex items-center gap-1">⚽ AA</span>
                                    </th>
                                    <th className="text-center px-3 py-2 font-semibold">
                                        <span className="inline-flex items-center gap-1">🔥 O2.5</span>
                                    </th>
                                    <th className="text-center px-3 py-2 font-semibold">
                                        <span className="inline-flex items-center gap-1">🏆 Ganador</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((r) => (
                                    <tr
                                        key={r.matchUrl}
                                        className="border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-50/60 dark:hover:bg-neutral-800/30"
                                    >
                                        <td className="px-3 py-2 min-w-[220px]">
                                            <div className="font-semibold text-gray-800 dark:text-neutral-100 truncate">
                                                {r.homeTeam} <span className="text-gray-400">vs</span> {r.awayTeam}
                                            </div>
                                            <div className="text-[9px] text-gray-400 dark:text-neutral-500 truncate">
                                                {r.competitionName}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="font-bold tabular-nums text-gray-800 dark:text-neutral-100">
                                                {r.homeScore} - {r.awayScore}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <CellPrediction
                                                predicted={r.predBTTS}
                                                actual={r.actualBTTS}
                                                hit={r.hitBTTS}
                                                prob={r.predBTTSProb}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <CellPrediction
                                                predicted={r.predOver25}
                                                actual={r.actualOver25}
                                                hit={r.hitOver25}
                                                prob={r.predOver25Prob}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <CellWinner
                                                predicted={r.predWinner}
                                                actual={r.actualWinner}
                                                hit={r.hitWinner}
                                                prob={r.predWinnerProb}
                                                home={r.homeTeam}
                                                away={r.awayTeam}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

function StatCard({
    label,
    hits,
    total,
    pct,
    color,
}: {
    label: string;
    hits: number;
    total: number;
    pct: number;
    color: "indigo" | "emerald" | "amber";
}) {
    const colorMap = {
        indigo: {
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            ring: "ring-indigo-200/60 dark:ring-indigo-800/50",
            text: "text-indigo-700 dark:text-indigo-300",
            bar: "bg-indigo-500",
        },
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            ring: "ring-emerald-200/60 dark:ring-emerald-800/50",
            text: "text-emerald-700 dark:text-emerald-300",
            bar: "bg-emerald-500",
        },
        amber: {
            bg: "bg-amber-50 dark:bg-amber-950/30",
            ring: "ring-amber-200/60 dark:ring-amber-800/50",
            text: "text-amber-700 dark:text-amber-300",
            bar: "bg-amber-500",
        },
    }[color];

    return (
        <div className={`rounded-xl p-3 ring-1 ${colorMap.bg} ${colorMap.ring}`}>
            <div className={`text-[10px] uppercase tracking-wider font-bold ${colorMap.text}`}>
                {label}
            </div>
            <div className="flex items-end gap-1 mt-1">
                <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                    {hits}
                </span>
                <span className="text-xs text-gray-400 dark:text-neutral-500 mb-0.5">/ {total}</span>
                <span className={`ml-auto text-sm font-bold tabular-nums ${colorMap.text}`}>
                    {pct.toFixed(0)}%
                </span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                <div
                    className={`h-full ${colorMap.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function CellPrediction({
    predicted,
    actual,
    hit,
    prob,
}: {
    predicted: boolean;
    actual: boolean;
    hit: boolean;
    prob: number;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-gray-400 dark:text-neutral-500">Pred.</span>
            <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${predicted
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                    }`}
            >
                {predicted ? "SÍ" : "NO"}
            </span>
            <span className="text-[9px] text-gray-400 dark:text-neutral-500 tabular-nums">
                {prob.toFixed(0)}%
            </span>
            <span className="text-[10px] font-bold">
                {hit ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                )}
            </span>
        </div>
    );
}

function CellWinner({
    predicted,
    actual,
    hit,
    prob,
    home,
    away,
}: {
    predicted: "home" | "away" | "draw";
    actual: "home" | "away" | "draw";
    hit: boolean;
    prob: number;
    home: string;
    away: string;
}) {
    const shortName = (n: string) => n.split(" ")[0];
    const label = predicted === "home" ? shortName(home) : predicted === "away" ? shortName(away) : "Empate";
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-gray-400 dark:text-neutral-500">Pred.</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 max-w-[80px] truncate">
                {label}
            </span>
            <span className="text-[9px] text-gray-400 dark:text-neutral-500 tabular-nums">
                {prob.toFixed(0)}%
            </span>
            <span className="text-[10px] font-bold">
                {hit ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                )}
            </span>
        </div>
    );
}